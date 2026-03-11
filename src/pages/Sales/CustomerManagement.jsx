// src/pages/Sales/CustomerManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { customerApi } from "../../api/customerApi";
import { useCrud } from "../../hooks/useCrud";
import { useExport } from "../../hooks/useExport";
import { CrudModal } from "../../components/common/CrudModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { Download, User, Phone, MapPin, Mail } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";

import SwitchActive from "../../components/common/SwitchActive";

import FilterSelect from "../../components/common/FilterSelect";

export default function CustomerManagement() {
  // Create adapter to map generic CRUD method names to customerApi method names
  const customerApiAdapter = useMemo(() => ({
    getItems: (...args) => customerApi.getCustomers(...args),
    getItemById: (...args) => customerApi.getCustomerById(...args),
    createItem: (...args) => customerApi.createCustomer(...args),
    updateItem: (...args) => customerApi.updateCustomer(...args),
    deleteItem: (...args) => customerApi.deleteCustomer(...args),
  }), []);

  // Use CRUD hook
  const {
    items: customers,
    loading,
    error,
    modalState,
    selectedItem,
    fetchItems,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    handleSave,
    handleDelete,
  } = useCrud(customerApiAdapter, {
    idField: 'customer_id',
    successMessages: {
      create: "تم إنشاء العميل بنجاح",
      update: "تم تحديث العميل بنجاح",
      delete: "تم حذف العميل بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ العميل",
      update: "فشل في حفظ العميل",
      delete: "فشل في حذف العميل",
      fetch: "فشل في تحميل العملاء",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Explicit handlers for modal opening
  const handleOpenCreate = () => {
    setFormError("");
    setFormData({
      name: "",
      phone: "",
      customer_type: "customer",
      city: "",
      address: "",
      country: "SY",
      is_active: true,
      notes: "",
    });
    openCreateModal();
  };

  const handleOpenEdit = (customer) => {
    setFormError("");
    // Aggressive phone stripping
    const strippedPhone = (customer.phone || "")
      .replace(/^(\+963|00963|963)/, "")
      .replace(/^0+/, "");

    setFormData({
      name: customer.name || "",
      phone: strippedPhone,
      customer_type: customer.customer_type || "customer",
      city: customer.city || "",
      address: customer.address || "",
      country: customer.country || "SY",
      is_active: customer.is_active !== undefined ? customer.is_active : true,
      notes: customer.notes || "",
    });
    openEditModal(customer);
  };

  // Success state for toggle operations
  const [success, setSuccess] = useState("");
  const [toggleError, setToggleError] = useState("");

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Load customers on mount
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "name", header: "اسم العميل" },
      { key: "phone", header: "رقم الهاتف" },
      { key: "balance", header: "الذمة" },
      { key: "customer_type", header: "نوع العميل" },
      { key: "city", header: "المدينة" },
      { key: "address", header: "العنوان" },
      { key: "country", header: "البلد" },
      { key: "is_active", header: "الحالة" },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 25 },  // اسم العميل
      { wch: 20 },  // رقم الهاتف
      { wch: 15 },  // الذمة
      { wch: 15 },  // نوع العميل
      { wch: 15 },  // المدينة
      { wch: 25 },  // العنوان
      { wch: 10 },  // البلد
      { wch: 10 },  // الحالة
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "العملاء",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredCustomers, "العملاء");
  };

  // Phone input handler: digits only, strip leading zero
  const handlePhoneChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '').replace(/^0+/, '');
    setFormData(prev => ({ ...prev, phone: digitsOnly }));
  };

  // Handle save with validation
  const handleSaveCustomer = async (data) => {
    setFormError("");

    // Validation
    const name = data?.name?.trim();
    const rawPhone = (data?.phone || formData.phone)?.replace(/\D/g, '').replace(/^0+/, '');
    const city = data?.city?.trim();
    const address = data?.address?.trim();

    if (!name || !rawPhone || !city || !address) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (rawPhone.length < 7) {
      setFormError("رقم الهاتف قصير جداً");
      return;
    }

    // Prepare data to send — prepend +963
    const dataToSend = {
      name: name,
      phone: `+963${rawPhone}`,
      customer_type: data.customer_type || "customer",
      city: city,
      address: address,
      is_active: data.is_active !== undefined ? data.is_active : true,
      notes: data.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Handle toggle customer status
  const handleToggleStatus = async (customerId) => {
    try {
      setToggleError("");
      // console.log('=== STARTING TOGGLE ===');
      // console.log('Toggling customer status for ID:', customerId);

      const customer = customers.find(c => c.customer_id === customerId);
      // console.log('Found customer:', customer);
      // console.log('Customer is_active before toggle:', customer?.is_active);
      if (!customer) {
        // console.error('Customer not found with ID:', customerId);
        throw new Error('Customer not found');
      }

      const newStatus = !customer.is_active;
      // console.log('Will send is_active:', newStatus, '(current:', customer.is_active, ')');

      // Call API
      // console.log('Calling API with:', { is_active: newStatus });
      const response = await customerApi.updateCustomer(customerId, { is_active: newStatus });
      // console.log('API response:', response);

      // Show success message
      const action = newStatus ? 'تفعيل' : 'تعطيل';
      // console.log('Success message:', `تم ${action} العميل بنجاح`);
      setSuccess(`تم ${action} العميل بنجاح`);
      setTimeout(() => setSuccess(""), 3000);

      // Refresh data
      // console.log('Refreshing data...');
      await fetchItems();
      // console.log('Data refreshed successfully');

      // console.log('=== TOGGLE COMPLETED ===');
    } catch (err) {
      // console.error('=== TOGGLE ERROR ===');
      // console.error('Toggle error:', err);
      // console.error('Error response:', err.response?.data);
      setToggleError(err.message || "فشل في تغيير حالة العميل");
    }
  };

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.is_active).length,
    inactive: customers.filter((c) => !c.is_active).length,
  };

  // Filter customers
  let filteredCustomers = customers.filter(
    (customer) => {
      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "" || customer.customer_type === typeFilter;
      const matchesStatus =
        statusFilter === "" ||
        (statusFilter === "active" && customer.is_active) ||
        (statusFilter === "inactive" && !customer.is_active);

      return matchesSearch && matchesType && matchesStatus;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredCustomers = [...filteredCustomers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // معالجة النصوص العربية
      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue, "ar")
          : bValue.localeCompare(aValue, "ar");
      }

      // معالجة الأرقام والقيم الأخرى
      return sortConfig.direction === "asc"
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي العملاء",
      value: stats.total,
      unit: "عميل",
      icon: User,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "العملاء النشطين",
      value: stats.active,
      unit: "عميل",
      icon: User,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "العملاء غير النشطين",
      value: stats.inactive,
      unit: "عميل",
      icon: User,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة العملاء"
          subtitle={`إجمالي العملاء: ${customers.length}`}
          actionLabel="إضافة عميل جديد"
          onAction={handleOpenCreate}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Customers Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة العملاء</h2>
          </div>

          {/* Messages */}
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => { }}
              dismissable={true}
            />
          )}
          {toggleError && (
            <MessageAlert
              type="error"
              message={toggleError}
              onDismiss={() => setToggleError("")}
              dismissable={true}
            />
          )}
          {success && (
            <MessageAlert
              type="success"
              message={success}
              onDismiss={() => setSuccess("")}
              dismissable={true}
            />
          )}

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن عميل (الاسم أو الهاتف أو المدينة أو العنوان)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterSelect
              label="نوع العميل"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "", label: "جميع الأنواع" },
                { value: "customer", label: "عميل" },
                { value: "supplier", label: "مورد" },
              ]}
            />

            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "جميع العملاء" },
                { value: "active", label: "نشط فقط" },
                { value: "inactive", label: "غير نشط فقط" },
              ]}
            />

            <ResultsCounter
              current={filteredCustomers.length}
              total={customers.length}
            />
          </div>

          <div className="flex justify-between">
            {/* Rows Per Page Selector */}
            <div className=" flex justify-start">
              <RowsPerPageSelector
                value={rowsPerPage}
                onChange={setRowsPerPage}
                options={[5, 10, 20, 50]}
              />
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exportLoading || filteredCustomers.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير Excel ({filteredCustomers.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Customers Table */}
          {loading ? (
            <LoadingState message="جاري تحميل العملاء..." />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState message="لا يوجد عملاء" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="name">اسم العميل</TableHead>
                      <TableHead sortable sortKey="phone">رقم الهاتف</TableHead>
                      <TableHead sortable sortKey="balance">الذمة</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span dir="ltr">{customer.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary-f">
                          {new Intl.NumberFormat("ar-SY").format(parseFloat(customer.balance || 0) || 0)} ل.س
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {customer.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {customer.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={customer.is_active ? "default" : "secondary"}
                            className={customer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {customer.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {customer.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SwitchActive
                              isActive={customer.is_active}
                              onToggle={() => handleToggleStatus(customer.customer_id)}
                              mode="playPause"
                              confirmBeforeToggle={true}
                            />
                            <CrudActions
                              onView={() => openViewModal(customer.customer_id)}
                              onEdit={() => handleOpenEdit(customer)}
                              onDelete={() => openDeleteModal(customer)}
                              size="md"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>
      </div>

      {/* Unified CRUD Modal */}
      <CrudModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={() => {
          closeModal();
          setFormError("");
        }}
        onSubmit={handleSaveCustomer}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة عميل جديد"
            : modalState.mode === "edit"
              ? "تعديل العميل"
              : modalState.mode === "view"
                ? "تفاصيل العميل"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "name", label: "اسم العميل" },
              { key: "phone", label: "رقم الهاتف", formatValue: (key, value) => <span dir="ltr">{value}</span> },
              { key: "customer_type", label: "نوع العميل" },
              { key: "city", label: "المدينة" },
              { key: "address", label: "العنوان" },
              { key: "country", label: "البلد" },
              { key: "is_active", label: "الحالة", formatValue: (key, value) => value ? "نشط" : "غير نشط" },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف العميل"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={customerApi.formatCustomerDisplay(selectedItem)}
      >
        {(modalState.mode === "create" || modalState.mode === "edit") && (
          <div className="space-y-4">
            {formError && (
              <MessageAlert
                type="error"
                message={formError}
                dismissable={false}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم العميل <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: محمد أحمد"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهاتف <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-1">
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="912345678"
                    className="rounded-r-none"
                  />
                  <span className="text-sm font-medium bg-secondary-s px-2 py-2 rounded-l-md border border-r-0 border-primary-f/20 text-primary-s" dir="ltr">+963</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع العميل</label>
                <FilterSelect
                  value={formData.customer_type}
                  onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                  options={[
                    { value: "customer", label: "عميل" },
                    { value: "supplier", label: "مورد" },
                  ]}
                  placeholder="اختر نوع العميل"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">البلد</label>
                <FilterSelect
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  options={[
                    { value: "SY", label: "سوريا" },
                    { value: "LB", label: "لبنان" },
                    { value: "JO", label: "الأردن" },
                    { value: "IQ", label: "العراق" },
                  ]}
                  placeholder="اختر البلد"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">المدينة <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="مثال: دمشق"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">العنوان <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: شارع العرض، حي الميدان"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <span>عميل نشط</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الملاحظات</label>
              <Textarea
                className="w-full"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}
