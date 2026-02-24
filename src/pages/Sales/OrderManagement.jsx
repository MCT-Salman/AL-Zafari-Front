// src/pages/Sales/OrderManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { priceColorApi } from "../../api/priceColorApi";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Download, ShoppingCart, User, Plus, Edit, Trash2, Eye } from "lucide-react";
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

export default function OrderManagement() {
  // Create adapter to map generic CRUD method names to orderApi method names
  const orderApiAdapter = useMemo(() => ({
    getItems: (...args) => orderApi.getOrders(...args),
    getItemById: (...args) => orderApi.getOrderById(...args),
    createItem: (...args) => orderApi.createOrder(...args),
    updateItem: (...args) => orderApi.updateOrder(...args),
    deleteItem: (...args) => orderApi.deleteOrderItem(...args), // Using deleteOrderItem for orders
  }), []);

  // Use CRUD hook
  const {
    items: orders,
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
  } = useCrud(orderApiAdapter, {
    successMessages: {
      create: "تم إنشاء الطلب بنجاح",
      update: "تم تحديث الطلب بنجاح",
      delete: "تم حذف الطلب بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ الطلب",
      update: "فشل في حفظ الطلب",
      delete: "فشل في حذف الطلب",
      fetch: "فشل في تحميل الطلبات",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    status: "pending",
    notes: "",
    items: [],
  });
  const [formError, setFormError] = useState("");

  // Customers, Colors, Batches for dropdowns
  const [customers, setCustomers] = useState([]);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [priceColors, setPriceColors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Order items state
  const [currentItems, setCurrentItems] = useState([]);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Load necessary data on mount
  useEffect(() => {
    fetchItems();
    loadLookupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load lookup data for dropdowns
  const loadLookupData = async () => {
    try {
      const [custRes, colorRes, batchRes, priceRes] = await Promise.all([
        customerApi.getCustomers(),
        colorApi.getColors(),
        batchApi.getBatches(),
        priceColorApi.getPriceColors(),
      ]);
      setCustomers(custRes.data || custRes || []);
      setColors(colorRes.data || colorRes || []);
      setBatches(batchRes.data || batchRes || []);
      setPriceColors(priceRes.data || priceRes || []);
    } catch (error) {
      console.error("Failed to load lookup data:", error);
    }
  };

  // Sync modal state with form data
  useEffect(() => {
    if (modalState.isOpen && (modalState.mode === "edit" || modalState.mode === "view") && selectedItem) {
      setFormData({
        customer_id: String(selectedItem.customer_id || selectedItem.customer?.customer_id || ""),
        status: selectedItem.status || "pending",
        notes: selectedItem.notes || "",
        items: selectedItem.items || [],
      });

      // If editing, map items to internal state
      if (selectedItem.items) {
        setCurrentItems(selectedItem.items.map(item => ({
          type_item: item.type_item,
          color_id: String(item.color_id || ""),
          width: item.width || "",
          length: item.length || "",
          thickness: item.thickness || "",
          batch_id: String(item.batch_id || ""),
          quantity: item.quantity || "",
          notes: item.notes || "",
          // Helper display fields
          material_name: item.material_name,
          color_name: item.color_name,
          batch_number: item.batch_number,
          price_per_meter: item.price_per_meter,
          subtotal: item.subtotal
        })));
      }

      // Find and set selected customer for display
      const customerId = selectedItem.customer_id || selectedItem.customer?.customer_id;
      if (customerId) {
        const customer = customers.find(c => c.customer_id == customerId);
        setSelectedCustomer(customer);
      }
    } else if (modalState.isOpen && modalState.mode === "create") {
      // Reset for create mode
      setFormData({
        customer_id: "",
        status: "pending",
        notes: "",
        items: [],
      });
      setCurrentItems([]);
      setSelectedCustomer(null);
    }
  }, [modalState.isOpen, modalState.mode, selectedItem, customers]);

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "order_id", header: "رقم الطلب" },
      { key: "customer_name", header: "اسم العميل", format: (item) => orderApi.getCustomerName(item) },
      { key: "customer_phone", header: "رقم الهاتف", format: (item) => orderApi.getCustomerPhone(item) },
      { key: "status", header: "الحالة" },
      { key: "count_items", header: "عدد العناصر" },
      { key: "total_amount", header: "المبلغ الإجمالي" },
      { key: "created_at", header: "تاريخ الإنشاء", format: (item) => orderApi.getFormattedDate(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 15 },  // رقم الطلب
      { wch: 20 },  // اسم العميل
      { wch: 20 },  // رقم الهاتف
      { wch: 15 },  // الحالة
      { wch: 12 },  // عدد العناصر
      { wch: 15 },  // المبلغ الإجمالي
      { wch: 20 },  // تاريخ الإنشاء
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "الطلبات",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredOrders, "الطلبات");
  };

  // Handle save with validation
  const handleSaveOrder = async (data) => {
    setFormError("");

    // Validation
    const customerId = data?.customer_id;
    const status = data?.status?.trim();

    if (!customerId || !status) {
      setFormError("يرجى اختيار العميل والحالة");
      return;
    }

    if (currentItems.length === 0) {
      setFormError("يرجى إضافة عنصر واحد على الأقل للطلب");
      return;
    }

    // Item validation
    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];
      if (!item.color_id || !item.batch_id || !item.quantity || parseFloat(item.quantity) <= 0) {
        setFormError(`يرجى إكمال بيانات العنصر رقم ${i + 1} (اللون، الطبخة، والكمية مطلوبة)`);
        return;
      }

      if (!item.width || !item.length || !item.thickness) {
        setFormError(`يرجى إكمال الأبعاد (العرض، الطول، والسمك) للعنصر رقم ${i + 1}`);
        return;
      }
    }

    // Prepare data to send
    const dataToSend = {
      customer_id: parseInt(customerId),
      status: status,
      notes: data.notes || "",
      items: currentItems.map(item => ({
        type_item: item.type_item,
        price_color_By: item.price_color_By,
        color_id: parseInt(item.color_id),
        width: parseFloat(item.width) || 0,
        length: parseFloat(item.length) || 0,
        thickness: parseFloat(item.thickness) || 0,
        batch_id: parseInt(item.batch_id),
        quantity: parseInt(item.quantity) || 0,
        notes: item.notes || ""
      })),
    };

    await handleSave(dataToSend);
  };

  // Item management functions
  const addItem = () => {
    setFormError("");
    const newItem = {
      type_item: "Machine", // Default to Machine (مكنة)
      price_color_By: "isByMeter22",
      color_id: "",
      width: "",
      length: "",
      thickness: "",
      batch_id: "",
      quantity: 1,
      notes: "",
    };
    setCurrentItems([...currentItems, newItem]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...currentItems];
    const updatedItem = { ...updatedItems[index], [field]: value };

    // Auto-select pricing option if color or type changes
    if (field === "color_id" || field === "type_item") {
      const availablePricing = priceColors.filter(pc =>
        String(pc.color_id) === String(updatedItem.color_id) &&
        pc.type_item === updatedItem.type_item
      );

      if (availablePricing.length > 0) {
        // Check if current pricing is still valid
        const isValid = availablePricing.some(p => p.price_color_By === updatedItem.price_color_By);
        if (!isValid) {
          // Auto-select the first available valid pricing
          updatedItem.price_color_By = availablePricing[0].price_color_By;
        }
      }
    }

    updatedItems[index] = updatedItem;
    setCurrentItems(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = currentItems.filter((_, i) => i !== index);
    setCurrentItems(updatedItems);
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    return currentItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const width = parseFloat(item.width) || 0;
      const length = parseFloat(item.length) || 0;

      // Find price per meter for this item
      const priceRecord = priceColors.find(pc =>
        String(pc.color_id) === String(item.color_id) &&
        pc.type_item === item.type_item &&
        pc.price_color_By === item.price_color_By
      );

      const price = priceRecord ? parseFloat(priceRecord.price_per_meter) : 0;

      let subtotal = 0;
      if (item.price_color_By === "blanck") {
        // Price per piece/blank
        subtotal = quantity * price;
      } else {
        // Price per linear meter (Length is in cm, price is per meter)
        subtotal = quantity * price * (length / 100);
      }

      return total + subtotal;
    }, 0);
  };

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    canceled: orders.filter((o) => o.status === "canceled").length,
  };

  // Filter orders
  let filteredOrders = orders.filter(
    (order) => {
      const matchesSearch =
        order.order_id?.toString().includes(searchTerm.toLowerCase()) ||
        orderApi.getCustomerName(order)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderApi.getCustomerPhone(order)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderApi.getFormattedDate(order)?.includes(searchTerm);

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredOrders = [...filteredOrders].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for date sorting
      if (sortConfig.key === "created_at") {
        const aDate = new Date(a.created_at);
        const bDate = new Date(b.created_at);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      // Special handling for numeric sorting
      if (sortConfig.key === "order_id" || sortConfig.key === "total_amount" || sortConfig.key === "count_items") {
        return sortConfig.direction === "asc"
          ? parseFloat(aValue) - parseFloat(bValue)
          : parseFloat(bValue) - parseFloat(aValue);
      }

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
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي الطلبات",
      value: stats.total,
      unit: "طلب",
      icon: ShoppingCart,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "طلبات قيد الانتظار",
      value: stats.pending,
      unit: "طلب",
      icon: ShoppingCart,
      iconColor: "text-yellow-600",
      bgColor: "bg-primary-s",
      borderColor: "border-yellow-600"
    },
    {
      id: 3,
      title: "طلبات مكتملة",
      value: stats.completed,
      unit: "طلب",
      icon: ShoppingCart,
      iconColor: "text-green-600",
      bgColor: "bg-primary-s",
      borderColor: "border-green-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة المبيعات"
          subtitle={`إجمالي الطلبات: ${orders.length}`}
          actionLabel="إنشاء طلب جديد"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Orders Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة الطلبات</h2>
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

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن طلب (رقم الطلب أو اسم العميل أو الحالة)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredOrders.length}
              total={orders.length}
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
              disabled={exportLoading || filteredOrders.length === 0}
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
                  <span>تصدير Excel ({filteredOrders.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Orders Table */}
          {loading ? (
            <LoadingState message="جاري تحميل الطلبات..." />
          ) : filteredOrders.length === 0 ? (
            <EmptyState message="لا توجد طلبات" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="order_id">رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead sortable sortKey="status">الحالة</TableHead>
                      <TableHead sortable sortKey="count_items">العناصر</TableHead>
                      <TableHead sortable sortKey="total_amount">المبلغ الإجمالي</TableHead>
                      <TableHead sortable sortKey="created_at">التاريخ</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => {
                      const statusBadge = orderApi.getStatusBadge(order.status);
                      return (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="bg-blue-50">
                              #{order.order_id}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{orderApi.getCustomerName(order)}</div>
                              <div className="text-xs text-gray-500">{orderApi.getCustomerPhone(order)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-50">
                              {orderApi.getItemCount(order)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {orderApi.formatCurrency(orderApi.getTotalAmount(order))}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {orderApi.getFormattedDate(order)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {order.notes || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CrudActions
                                onView={() => openViewModal(order.order_id)}
                                onEdit={() => openEditModal(order)}
                                onDelete={() => openDeleteModal(order)}
                                size="md"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
          setFormData({
            customer_id: "",
            status: "pending",
            notes: "",
            items: [],
          });
          setCurrentItems([]);
          setSelectedCustomer(null);
        }}
        onSubmit={handleSaveOrder}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إنشاء طلب جديد"
            : modalState.mode === "edit"
              ? "تعديل الطلب"
              : modalState.mode === "view"
                ? "تفاصيل الطلب"
                : ""
        }
        loading={modalState.loading}
        size="xl"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "customer_name", label: "العميل", formatValue: (key, value) => orderApi.formatCustomerInfo(selectedItem) },
              {
                key: "status", label: "الحالة", formatValue: (key, value) => {
                  const statusBadge = orderApi.getStatusBadge(value);
                  return statusBadge.label;
                }
              },
              { key: "count_items", label: "عدد العناصر" },
              { key: "total_amount", label: "المبلغ الإجمالي", formatValue: (key, value) => orderApi.formatCurrency(value) },
              { key: "created_at", label: "تاريخ الإنشاء", formatValue: (key, value) => orderApi.getFormattedDate(selectedItem) },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف الطلب"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={orderApi.formatOrderInfo(selectedItem)}
      >
        {(modalState.mode === "create" || modalState.mode === "edit") && (
          <div className="space-y-6">
            {formError && (
              <MessageAlert
                type="error"
                message={formError}
                dismissable={false}
              />
            )}

            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">العميل <span className="text-red-500">*</span></label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => {
                    const customerId = value;
                    const customer = customers.find(c => c.customer_id == customerId);
                    setSelectedCustomer(customer);
                    setFormData({ ...formData, customer_id: customerId });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.customer_id} value={String(customer.customer_id)}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">حالة الطلب <span className="text-red-500">*</span></label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر حالة الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="preparing">قيد التحضير</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="canceled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Info Display */}
            {selectedCustomer && (
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> معلومات العميل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-blue-800">
                  <div><span className="opacity-70">الاسم:</span> <span className="font-bold">{selectedCustomer.name}</span></div>
                  <div><span className="opacity-70">الهاتف:</span> <span className="font-bold">{selectedCustomer.phone}</span></div>
                  <div><span className="opacity-70">المدينة:</span> <span className="font-bold">{selectedCustomer.city}</span></div>
                  <div><span className="opacity-70">العنوان:</span> <span className="font-bold">{selectedCustomer.address}</span></div>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات الطلب</label>
              <Textarea
                className="w-full resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="ملاحظات إضافية بخصوص الطلب..."
              />
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> عناصر الطلب
                </h3>
                <Button
                  onClick={addItem}
                  className="h-8 text-xs gap-1"
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-3 h-3" />
                  إضافة عنصر
                </Button>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">النوع</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">اللون</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">التسعير</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-20">العرض</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-20">الطول</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-16">سمك</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">الطبخة</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-16">الكمية</th>
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-600">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="px-2 py-2">
                          <Select
                            value={item.type_item}
                            onValueChange={(val) => updateItem(index, "type_item", val)}
                          >
                            <SelectTrigger className="w-full h-8 text-xs border-none shadow-none focus:ring-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Machine">مكنة</SelectItem>
                              <SelectItem value="Presser">كوي</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={String(item.color_id || "")}
                            onValueChange={(val) => updateItem(index, "color_id", val)}
                          >
                            <SelectTrigger className="w-full h-8 text-xs border-none shadow-none focus:ring-1">
                              <SelectValue placeholder="اللون" />
                            </SelectTrigger>
                            <SelectContent>
                              {colors.map(c => (
                                <SelectItem key={c.color_id} value={String(c.color_id)}>
                                  {c.color_name} ({c.color_code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={item.price_color_By}
                            onValueChange={(val) => updateItem(index, "price_color_By", val)}
                            disabled={!item.color_id}
                          >
                            <SelectTrigger className="w-full h-8 text-xs border-none shadow-none focus:ring-1">
                              <SelectValue placeholder="التسعير" />
                            </SelectTrigger>
                            <SelectContent>
                              {priceColors
                                .filter(pc =>
                                  String(pc.color_id) === String(item.color_id) &&
                                  pc.type_item === item.type_item
                                )
                                .map(pc => (
                                  <SelectItem key={pc.id} value={pc.price_color_By}>
                                    {pc.price_color_By === "isByMeter22" ? "22 متر" :
                                      pc.price_color_By === "isByMeter44" ? "44 متر" :
                                        pc.price_color_By === "isByMeter66" ? "66 متر" :
                                          pc.price_color_By === "blanck" ? "لوح" : pc.price_color_By}
                                  </SelectItem>
                                ))}
                              {item.color_id && priceColors.filter(pc =>
                                String(pc.color_id) === String(item.color_id) &&
                                pc.type_item === item.type_item
                              ).length === 0 && (
                                  <SelectItem disabled value="none">لا يوجد تسعير متاح</SelectItem>
                                )}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-full h-8 p-1 text-xs border-none shadow-none focus:ring-1"
                            value={item.width}
                            onChange={(e) => updateItem(index, "width", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-full h-8 p-1 text-xs border-none shadow-none focus:ring-1"
                            value={item.length}
                            onChange={(e) => updateItem(index, "length", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            className="w-full h-8 p-1 text-xs border-none shadow-none focus:ring-1"
                            value={item.thickness}
                            onChange={(e) => updateItem(index, "thickness", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={String(item.batch_id || "")}
                            onValueChange={(val) => updateItem(index, "batch_id", val)}
                          >
                            <SelectTrigger className="w-full h-8 text-xs border-none shadow-none focus:ring-1">
                              <SelectValue placeholder="الطبخة" />
                            </SelectTrigger>
                            <SelectContent>
                              {batches.map(b => (
                                <SelectItem key={b.batch_id} value={String(b.batch_id)}>
                                  {b.batch_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            className="w-full h-8 p-1 text-xs border-none shadow-none focus:ring-1 text-center font-bold"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Button
                            onClick={() => removeItem(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500 italic">
                          لم يتم إضافة أي عناصر بعد. اضغط على "إضافة عنصر" للبدء.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Total */}
              <div className="flex justify-between items-center p-4 bg-primary-s/30 rounded-xl border border-secondary-f/10">
                <div className="text-sm font-bold text-gray-700 italic">إجمالي تقديري:</div>
                <div className="text-xl font-black text-secondary-f">
                  {orderApi.formatCurrency(calculateOrderTotal())}
                </div>
              </div>
            </div>
          </div>
        )}

        {modalState.mode === "view" && selectedItem && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">العميل</span>
                  <div className="text-lg font-black text-primary-f flex items-center gap-2">
                    <User className="w-5 h-5" /> {orderApi.getCustomerName(selectedItem)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{orderApi.getCustomerPhone(selectedItem)}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{orderApi.getCustomerCity(selectedItem)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-bold text-sm bg-white shadow-sm">
                    {orderApi.getFormattedDate(selectedItem)}
                  </Badge>
                  {orderApi.getStatusBadge(selectedItem.status).element}
                </div>
              </div>

              {selectedItem.notes && (
                <div className="pt-3 border-t text-sm text-gray-700 italic">
                  <span className="font-bold block mb-1 text-xs opacity-50 not-italic">ملاحظات:</span>
                  {selectedItem.notes}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <ShoppingCart className="w-4 h-4" /> تفاصيل العناصر ({selectedItem.items?.length || 0})
              </h3>
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b">
                    <tr>
                      <th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">النوع</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">المادة / اللون</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">الطبخة</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">الأبعاد (سم)</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-400 text-xs">الكمية</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-400 text-xs">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedItem.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {item.type_item === 'Presser' ? 'كوي' : 'مكنة'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-gray-900">{item.material_name}</div>
                          <div className="text-[10px] text-gray-500 font-medium">{item.color_name} ({item.color_code})</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant="outline" className="font-mono text-[10px] bg-blue-50/50 border-blue-100 text-blue-700">
                            {item.batch_number}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap text-xs font-medium">
                          {item.width} × {item.length} × {item.thickness}
                        </td>
                        <td className="px-4 py-3 align-top font-black text-primary-f">{item.quantity}</td>
                        <td className="px-4 py-3 align-top text-left font-bold text-green-700">
                          {orderApi.formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary-s rounded-xl border border-secondary-f/20 shadow-sm">
                <div className="text-sm font-bold text-secondary-f opacity-80 italic">المبلغ الإجمالي النهائي:</div>
                <div className="text-2xl font-black text-secondary-f">
                  {orderApi.formatCurrency(selectedItem.total_amount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}
