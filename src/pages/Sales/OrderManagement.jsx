// src/pages/Sales/OrderManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { orderApi } from "../../api/orderApi";
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

  // Customers for dropdown
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Order items state
  const [currentItems, setCurrentItems] = useState([]);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Load orders and customers on mount
  useEffect(() => {
    fetchItems();
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load customers for dropdown
  const loadCustomers = async () => {
    try {
      const response = await customerApi.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  };

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

    // Prepare data to send
    const dataToSend = {
      customer_id: parseInt(customerId),
      status: status,
      notes: data.notes || "",
      items: currentItems,
    };

    await handleSave(dataToSend);
  };

  // Item management functions
  const addItem = () => {
    const newItem = {
      type_item: "",
      ruler_id: "",
      constant_width: "",
      length: "",
      constant_thickness: "",
      batch_id: "",
      quantity: "",
      notes: "",
    };
    setCurrentItems([...currentItems, newItem]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...currentItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
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
      const price = parseFloat(item.price_per_meter) || 0;
      const width = parseFloat(item.constant_width) || 0;
      const length = parseFloat(item.length) || 0;
      const subtotal = quantity * price * width * length / 10000; // Assuming price is per square meter
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
              onDismiss={() => {}}
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
                { key: "status", label: "الحالة", formatValue: (key, value) => {
                  const statusBadge = orderApi.getStatusBadge(value);
                  return statusBadge.label;
                }},
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
                    setFormData({...formData, customer_id: customerId});
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
                  onValueChange={(value) => setFormData({...formData, status: value})}
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
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">معلومات العميل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>الاسم:</strong> {selectedCustomer.name}</div>
                  <div><strong>الهاتف:</strong> {selectedCustomer.phone}</div>
                  <div><strong>المدينة:</strong> {selectedCustomer.city}</div>
                  <div><strong>العنوان:</strong> {selectedCustomer.address}</div>
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات الطلب</label>
              <Textarea
                className="w-full"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">عناصر الطلب</h3>
                <Button
                  onClick={addItem}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  إضافة عنصر
                </Button>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-sm font-medium">النوع</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">المسطرة</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">العرض</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">الطول</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">السماكة</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">الطبخة</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">الكمية</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">السعر/م</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">الإجمالي</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="w-full p-1"
                            value={item.type_item}
                            onChange={(e) => updateItem(index, "type_item", e.target.value)}
                            placeholder="النوع"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="w-full p-1"
                            value={item.ruler_id}
                            onChange={(e) => updateItem(index, "ruler_id", e.target.value)}
                            placeholder="المسطرة"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="w-full p-1"
                            value={item.constant_width}
                            onChange={(e) => updateItem(index, "constant_width", e.target.value)}
                            placeholder="العرض"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="w-full p-1"
                            value={item.length}
                            onChange={(e) => updateItem(index, "length", e.target.value)}
                            placeholder="الطول"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={item.constant_thickness}
                            onChange={(e) => updateItem(index, "constant_thickness", e.target.value)}
                            placeholder="السماكة"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="text"
                            className="w-full p-1"
                            value={item.batch_id}
                            onChange={(e) => updateItem(index, "batch_id", e.target.value)}
                            placeholder="الطبخة"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            className="w-full p-1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            placeholder="الكمية"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-full p-1"
                            value={item.price_per_meter}
                            onChange={(e) => updateItem(index, "price_per_meter", e.target.value)}
                            placeholder="السعر/م"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          {(() => {
                            const quantity = parseFloat(item.quantity) || 0;
                            const price = parseFloat(item.price_per_meter) || 0;
                            const width = parseFloat(item.constant_width) || 0;
                            const length = parseFloat(item.length) || 0;
                            const subtotal = quantity * price * width * length / 10000;
                            return orderApi.formatCurrency(subtotal);
                          })()}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            onClick={() => removeItem(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Total */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-medium">المبلغ الإجمالي:</div>
                <div className="text-xl font-bold text-green-600">
                  {orderApi.formatCurrency(calculateOrderTotal())}
                </div>
              </div>
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}
