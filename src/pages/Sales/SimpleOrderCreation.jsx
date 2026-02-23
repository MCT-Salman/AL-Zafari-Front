// src/pages/Sales/SimpleOrderCreation.jsx
import { useState, useEffect } from "react";
import { customerApi } from "../../api/customerApi";
import { orderApi } from "../../api/orderApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  User, 
  Package,
  Check,
  X,
  ArrowRight
} from "lucide-react";
import MessageAlert from "../../components/common/MessageAlert";
import LoadingState from "../../components/common/LoadingState";

export default function SimpleOrderCreation() {
  const [step, setStep] = useState(1); // 1: Customer, 2: Items, 3: Review, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Customer data
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    address: ""
  });

  // Order items
  const [orderItems, setOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    type: "كوي", // Default type
    width: "",
    length: "",
    quantity: "",
    notes: ""
  });

  // Order details
  const [orderNotes, setOrderNotes] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerApi.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      setError("فشل في تحميل العملاء");
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setStep(2);
  };

  // Handle new customer creation
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.city || !newCustomer.address) {
      setError("يرجى ملء جميع حقول العميل");
      return;
    }

    try {
      setLoading(true);
      const response = await customerApi.createCustomer({
        ...newCustomer,
        customer_type: "customer",
        is_active: true
      });
      
      const createdCustomer = response.data;
      setSelectedCustomer(createdCustomer);
      setCustomers([...customers, createdCustomer]);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: "", phone: "", city: "", address: "" });
      setStep(2);
      setSuccess("تم إنشاء العميل بنجاح");
    } catch (err) {
      setError("فشل في إنشاء العميل");
    } finally {
      setLoading(false);
    }
  };

  // Add item to order
  const handleAddItem = () => {
    if (!currentItem.width || !currentItem.length || !currentItem.quantity) {
      setError("يرجى ملء جميع حقول العنصر");
      return;
    }

    const item = {
      ...currentItem,
      id: Date.now(), // Temporary ID
      subtotal: parseFloat(currentItem.width) * parseFloat(currentItem.length) * parseFloat(currentItem.quantity)
    };

    setOrderItems([...orderItems, item]);
    setCurrentItem({
      type: "كوي",
      width: "",
      length: "",
      quantity: "",
      notes: ""
    });
    setError("");
  };

  // Remove item from order
  const handleRemoveItem = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0);
  };

  // Create order
  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      setError("يرجى إضافة عنصر واحد على الأقل");
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        customer_id: selectedCustomer.customer_id,
        status: "pending",
        notes: orderNotes,
        items: orderItems.map(item => ({
          type_item: item.type === "كوي" ? 7 : 8, // Map to API values
          ruler_id: 1, // Default ruler
          constant_width: parseFloat(item.width),
          length: parseFloat(item.length),
          constant_thickness: 0.6, // Default thickness
          batch_id: 1, // Default batch
          quantity: parseInt(item.quantity),
          notes: item.notes
        }))
      };

      const response = await orderApi.createOrder(orderData);
      setCreatedOrder(response.data);
      setStep(4);
      setSuccess("تم إنشاء الطلب بنجاح");
    } catch (err) {
      setError("فشل في إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStep(1);
    setSelectedCustomer(null);
    setOrderItems([]);
    setCurrentItem({
      type: "كوي",
      width: "",
      length: "",
      quantity: "",
      notes: ""
    });
    setOrderNotes("");
    setCreatedOrder(null);
    setError("");
    setSuccess("");
  };

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SYP"
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">إنشاء طلب جديد</h1>
          <p className="text-gray-600 mt-2">عملية سهلة ومبسطة لإنشاء طلبات المبيعات</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                }`}>
                  {stepNumber === 1 && <User className="w-5 h-5" />}
                  {stepNumber === 2 && <Package className="w-5 h-5" />}
                  {stepNumber === 3 && <Check className="w-5 h-5" />}
                  {stepNumber === 4 && <ShoppingCart className="w-5 h-5" />}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-full h-1 mx-2 ${
                    step > stepNumber ? "bg-blue-600" : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? "text-blue-600 font-medium" : "text-gray-600"}>اختيار العميل</span>
            <span className={step >= 2 ? "text-blue-600 font-medium" : "text-gray-600"}>إضافة العناصر</span>
            <span className={step >= 3 ? "text-blue-600 font-medium" : "text-gray-600"}>مراجعة الطلب</span>
            <span className={step >= 4 ? "text-blue-600 font-medium" : "text-gray-600"}>تم الإنشاء</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <MessageAlert
            type="error"
            message={error}
            onDismiss={() => setError("")}
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

        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">اختيار العميل</h2>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full p-3 pr-10 border rounded-lg"
                  placeholder="ابحث عن عميل بالاسم أو الهاتف أو المدينة"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      <div className="text-sm text-gray-600">{customer.city} - {customer.address}</div>
                    </div>
                    <Badge className={customer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {customer.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Customer Button */}
            {!showNewCustomerForm && (
              <Button
                onClick={() => setShowNewCustomerForm(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة عميل جديد
              </Button>
            )}

            {/* New Customer Form */}
            {showNewCustomerForm && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-4">إضافة عميل جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="p-2 border rounded"
                    placeholder="اسم العميل"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                  <input
                    type="tel"
                    className="p-2 border rounded"
                    placeholder="رقم الهاتف"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                  <input
                    type="text"
                    className="p-2 border rounded"
                    placeholder="المدينة"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                  />
                  <input
                    type="text"
                    className="p-2 border rounded"
                    placeholder="العنوان"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleCreateCustomer}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "جاري الإنشاء..." : "إنشاء العميل"}
                  </Button>
                  <Button
                    onClick={() => setShowNewCustomerForm(false)}
                    variant="outline"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Step 2: Add Items */}
        {step === 2 && (
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">إضافة العناصر</h2>
              <p className="text-gray-600">العميل: {selectedCustomer?.name}</p>
            </div>

            {/* Add Item Form */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-4">إضافة عنصر جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">النوع</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={currentItem.type}
                    onChange={(e) => setCurrentItem({...currentItem, type: e.target.value})}
                  >
                    <option value="كوي">كوي</option>
                    <option value="مكنة">مكنة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">العرض (سم)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    placeholder="22"
                    value={currentItem.width}
                    onChange={(e) => setCurrentItem({...currentItem, width: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الطول (سم)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    placeholder="100"
                    value={currentItem.length}
                    onChange={(e) => setCurrentItem({...currentItem, length: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الكمية</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    placeholder="50"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="ملاحظات العنصر"
                  value={currentItem.notes}
                  onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})}
                />
              </div>
              <Button
                onClick={handleAddItem}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة العنصر
              </Button>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.type}</div>
                      <div className="text-sm text-gray-600">
                        العرض: {item.width} سم | الطول: {item.length} سم | الكمية: {item.quantity}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-gray-600">ملاحظات: {item.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
              >
                السابق
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={orderItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                التالي
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">مراجعة الطلب</h2>
            
            {/* Customer Info */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>الاسم:</strong> {selectedCustomer?.name}</div>
                <div><strong>الهاتف:</strong> {selectedCustomer?.phone}</div>
                <div><strong>المدينة:</strong> {selectedCustomer?.city}</div>
                <div><strong>العنوان:</strong> {selectedCustomer?.address}</div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">عناصر الطلب</h3>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{item.type}</div>
                      <div className="text-sm text-gray-600">
                        {item.width} × {item.length} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ملاحظات الطلب (اختياري)</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="أي ملاحظات إضافية للطلب"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-medium">المبلغ الإجمالي:</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
              >
                السابق
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء الطلب"}
                <ShoppingCart className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="p-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">تم إنشاء الطلب بنجاح!</h2>
              <p className="text-gray-600">رقم الطلب: #{createdOrder?.order_id}</p>
            </div>

            <div className="border rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium mb-2">تفاصيل الطلب</h3>
              <div className="space-y-2 text-sm">
                <div><strong>العميل:</strong> {selectedCustomer?.name}</div>
                <div><strong>الحالة:</strong> قيد الانتظار</div>
                <div><strong>عدد العناصر:</strong> {orderItems.length}</div>
                <div><strong>المبلغ الإجمالي:</strong> {formatCurrency(calculateTotal())}</div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700"
              >
                إنشاء طلب جديد
              </Button>
              <Button
                onClick={() => window.location.href = "/sales/orders"}
                variant="outline"
              >
                عرض جميع الطلبات
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
