

// src/pages/Sales/OrderManagementNew.jsx
import { useState, useEffect, useMemo } from "react";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { priceColorApi } from "../../api/priceColorApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { constantApi } from "../../api/constantApi";
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
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Download, ShoppingCart, Plus, Edit, Trash2, Eye, Search } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";
// import NumberPad from "../../components/common/NumberPad";

export default function OrderManagementNew() {
  // State for view management
  const [currentView, setCurrentView] = useState("home"); // home, newOrder, ordersList
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data states
  const [materials, setMaterials] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [priceColors, setPriceColors] = useState([]);
  const [constants, setConstants] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form state for new order
  const [orderForm, setOrderForm] = useState({
    selectedMaterial: "",
    orderType: "Machine",
    thickness: "",
    pricingMethod: "",
    selectedColor: "",
    quantity: "",
    notes: "",
    batchId: ""
  });

  // Order items state
  const [orderItems, setOrderItems] = useState([]);

  // Filter and pagination for orders list
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [matRes, rulerRes, colorRes, batchRes, priceRes, constRes, ordersRes] = await Promise.all([
        materialApi.getMaterials(),
        rulerApi.getRulers(),
        colorApi.getColors(),
        batchApi.getBatches(),
        priceColorApi.getPriceColors(),
        constantApi.getConstants(),
        orderApi.getOrders()
      ]);

      setMaterials(matRes.data || matRes || []);
      setRulers(rulerRes.data || rulerRes || []);
      setColors(colorRes.data || colorRes || []);
      setBatches(batchRes.data || batchRes || []);
      setPriceColors(priceRes.data || priceRes || []);
      setConstants(constRes.data || constRes || []);
      setOrders(ordersRes.data || ordersRes || []);

      // Set default thickness from constants
      const thicknessConstant = (constRes.data || constRes || []).find(c => c.constant_name === "thickness");
      if (thicknessConstant) {
        setOrderForm(prev => ({ ...prev, thickness: thicknessConstant.constant_value }));
      }
    } catch (error) {
      // console.error("Failed to load data:", error);
      setError("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Handle material selection
  const handleMaterialChange = (materialId) => {
    setOrderForm({
      ...orderForm,
      selectedMaterial: materialId,
      selectedColor: "",
      pricingMethod: ""
    });
  };

  // Handle color selection
  const handleColorChange = (colorId) => {
    setOrderForm({
      ...orderForm,
      selectedColor: colorId,
      pricingMethod: ""
    });
  };

  // Add item to order
  const addOrderItem = () => {
    if (!orderForm.selectedMaterial || !orderForm.selectedColor || !orderForm.quantity || !orderForm.pricingMethod) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const material = materials.find(m => String(m.material_id) === orderForm.selectedMaterial);
    const color = colors.find(c => String(c.color_id) === orderForm.selectedColor);
    const batch = batches.find(b => String(b.batch_id) === orderForm.batchId);

    const newItem = {
      id: Date.now(),
      material_name: material?.material_name || "",
      color_name: color?.color_name || "",
      color_code: color?.color_code || "",
      batch_number: batch?.batch_number || "",
      order_type: orderForm.orderType,
      thickness: orderForm.thickness,
      pricing_method: orderForm.pricingMethod,
      quantity: orderForm.quantity,
      notes: orderForm.notes,
      color_image: color?.color_image || ""
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset form
    setOrderForm({
      ...orderForm,
      selectedColor: "",
      quantity: "",
      notes: "",
      pricingMethod: ""
    });
    setError("");
  };

  // Remove item from order
  const removeOrderItem = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Get available colors for selected material
  const getAvailableColors = () => {
    if (!orderForm.selectedMaterial) return [];
    
    const materialRulers = rulers.filter(r => String(r.material_id) === orderForm.selectedMaterial);
    const rulerIds = materialRulers.map(r => String(r.ruler_id));
    
    return colors.filter(c => rulerIds.includes(String(c.ruler_id)));
  };

  // Get available pricing methods for selected color
  const getAvailablePricingMethods = () => {
    if (!orderForm.selectedColor) return [];
    
    return priceColors.filter(pc => 
      String(pc.color_id) === orderForm.selectedColor && 
      pc.type_item === orderForm.orderType
    );
  };

  // Filter orders
  const filteredOrders = orders.filter(order =>
    order.order_id?.toString().includes(searchTerm.toLowerCase()) ||
    orderApi.getCustomerName(order)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    completed: orders.filter(o => o.status === "completed").length,
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
      <div className="mx-auto">
        {/* Header */}
        <PageHeader
          title="إدارة المبيعات"
          subtitle={`إجمالي الطلبات: ${orders.length}`}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setCurrentView("newOrder")}
            className="flex items-center gap-2 bg-primary-f hover:bg-primary-f/90 text-white"
          >
            <Plus className="w-4 h-4" />
            طلب جديد
          </Button>
          <Button
            onClick={() => setCurrentView("ordersList")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            سجل الطلبات
          </Button>
        </div>

        {/* Home View */}
        {currentView === "home" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {mainStats.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>
        )}

        {/* New Order View */}
        {currentView === "newOrder" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">إنشاء طلب جديد</h2>
            
            {error && (
              <MessageAlert
                type="error"
                message={error}
                onDismiss={() => setError("")}
                dismissable={true}
              />
            )}

            {/* Materials Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">المادة</Label>
              <RadioGroup
                value={orderForm.selectedMaterial}
                onValueChange={handleMaterialChange}
                className="flex flex-wrap gap-4"
              >
                {materials.map((material) => (
                  <div key={material.material_id} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(material.material_id)} id={`material-${material.material_id}`} />
                    <Label htmlFor={`material-${material.material_id}`}>{material.material_name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Order Type and Thickness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">نوع الطلب</Label>
                <RadioGroup
                  value={orderForm.orderType}
                  onValueChange={(value) => setOrderForm({ ...orderForm, orderType: value, pricingMethod: "" })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Machine" id="machine" />
                    <Label htmlFor="machine">مكنة</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Presser" id="presser" />
                    <Label htmlFor="presser">كوي</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">السماكة</Label>
                <Input
                  value={orderForm.thickness}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Pricing Methods */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">طرق التسعير</Label>
              <RadioGroup
                value={orderForm.pricingMethod}
                onValueChange={(value) => setOrderForm({ ...orderForm, pricingMethod: value })}
                className="flex flex-wrap gap-4"
              >
                {getAvailablePricingMethods().map((pricing) => (
                  <div key={pricing.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={pricing.price_color_By} id={`pricing-${pricing.id}`} />
                    <Label htmlFor={`pricing-${pricing.id}`}>
                      {pricing.price_color_By === "isByMeter22" ? "22 متر" :
                       pricing.price_color_By === "isByMeter44" ? "44 متر" :
                       pricing.price_color_By === "isByMeter66" ? "66 متر" :
                       pricing.price_color_By === "blanck" || pricing.price_color_By === "isByBlanck" ? "لوح" : pricing.price_color_By}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Color Selection with Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">اللون</Label>
                <Select
                  value={orderForm.selectedColor}
                  onValueChange={handleColorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اللون" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableColors().map((color) => (
                      <SelectItem key={color.color_id} value={String(color.color_id)}>
                        {color.color_name} ({color.color_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">صورة اللون</Label>
                <div className="w-full h-20 border rounded-lg bg-gray-100 flex items-center justify-center">
                  {orderForm.selectedColor && (() => {
                    const color = colors.find(c => String(c.color_id) === orderForm.selectedColor);
                    return color?.color_image ? (
                      <img src={color.color_image} alt={color.color_name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-sm">لا توجد صورة</span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* NumberPad for Quantity and Color Code Search */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                {/* <NumberPad
                  onQuantityChange={(value) => setOrderForm({ ...orderForm, quantity: value })}
                  onColorCodeSearch={(code) => {
                    // Search for color by code
                    const color = colors.find(c => 
                      c.color_code?.toLowerCase().includes(code.toLowerCase()) ||
                      c.color_name?.toLowerCase().includes(code.toLowerCase())
                    );
                    if (color) {
                      setOrderForm({ 
                        ...orderForm, 
                        selectedColor: String(color.color_id),
                        pricingMethod: "" // Reset pricing method
                      });
                    } else {
                      setError("لم يتم العثور على لون بهذا الكود");
                      setTimeout(() => setError(""), 3000);
                    }
                  }}
                  initialQuantity={orderForm.quantity}
                  placeholder="الكمية بالمتر"
                /> */}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">الملاحظات</Label>
                  <Textarea
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                    rows={4}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div className="mb-8">
              <Button
                onClick={addOrderItem}
                className="w-full md:w-auto"
                disabled={!orderForm.selectedMaterial || !orderForm.selectedColor || !orderForm.quantity || !orderForm.pricingMethod}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة عنصر
              </Button>
            </div>

            {/* Order Items Table */}
            {orderItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">العناصر المضافة</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المادة</TableHead>
                        <TableHead>اللون</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>السماكة</TableHead>
                        <TableHead>التسعير</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>ملاحظات</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.material_name}</TableCell>
                          <TableCell>{item.color_name} ({item.color_code})</TableCell>
                          <TableCell>{item.order_type === 'Presser' ? 'كوي' : 'مكنة'}</TableCell>
                          <TableCell>{item.thickness}</TableCell>
                          <TableCell>
                            {item.pricing_method === "isByMeter22" ? "22 متر" :
                             item.pricing_method === "isByMeter44" ? "44 متر" :
                             item.pricing_method === "isByMeter66" ? "66 متر" :
                             item.pricing_method === "blanck" || item.pricing_method === "isByBlanck" ? "لوح" : item.pricing_method}
                          </TableCell>
                          <TableCell>{item.quantity} متر</TableCell>
                          <TableCell>{item.notes || "-"}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => removeOrderItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Orders List View */}
        {currentView === "ordersList" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">سجل الطلبات</h2>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن طلب (رقم الطلب أو اسم العميل أو الحالة)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Results Counter */}
            <div className="mb-4">
              <ResultsCounter
                current={filteredOrders.length}
                total={orders.length}
              />
            </div>

            {/* Orders Table */}
            {loading ? (
              <LoadingState message="جاري تحميل الطلبات..." />
            ) : filteredOrders.length === 0 ? (
              <EmptyState message="لا توجد طلبات" />
            ) : (
              <>
                <div className="border rounded-lg overflow-x-auto mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>عدد العناصر</TableHead>
                        <TableHead>المبلغ الإجمالي</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => {
                        const statusBadge = orderApi.getStatusBadge(order.status);
                        return (
                          <TableRow key={order.order_id}>
                            <TableCell>
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
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CrudActions
                                  onView={() => {/* Handle view */}}
                                  onEdit={() => {/* Handle edit */}}
                                  onDelete={() => {/* Handle delete */}}
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
        )}
      </div>
    </div>
  );
}
