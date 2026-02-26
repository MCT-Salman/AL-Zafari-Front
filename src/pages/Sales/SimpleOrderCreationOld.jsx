// src/pages/Sales/SimpleOrderCreation.jsx
import { useState, useEffect, useMemo } from "react";
import { customerApi } from "../../api/customerApi";
import { orderApi } from "../../api/orderApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { colorApi } from "../../api/colorApi";
import { priceColorApi } from "../../api/priceColorApi";
import { batchApi } from "../../api/batchApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FilterSelect from "../../components/common/FilterSelect";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  ShoppingCart,
  Plus,
  Search,
  User,
  Package,
  Check,
  X,
  ArrowRight,
  History,
  Trash2,
  Eye,
  RotateCcw
} from "lucide-react";
import MessageAlert from "../../components/common/MessageAlert";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";

export default function SimpleOrderCreation() {
  const [viewMode, setViewMode] = useState("create"); // create | history
  const [step, setStep] = useState(1); // 1: Customer, 2: Items, 3: Review, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Order reference data
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [priceColors, setPriceColors] = useState([]);

  // Selection and form state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    address: ""
  });

  const [orderItems, setOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    type_item: "Machine",
    material_id: "",
    ruler_id: "",
    color_id: "",
    price_color_By: "",
    batch_id: "",
    width: "",
    length: "",
    thickness: "",
    quantity: 1,
    notes: ""
  });

  const [orderNotes, setOrderNotes] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [activeField, setActiveField] = useState("length");
  const [itemsPage, setItemsPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const itemsPerPage = 4;
  const customersPerPage = 6;
  const historyPageSize = 6;
  const activeFieldLabel =
    activeField === "width"
      ? "العرض"
      : activeField === "length"
        ? "الطول"
        : activeField === "thickness"
          ? "السماكة"
          : "الكمية";
  const PRICE_BY_TO_WIDTH = {
    isByMeter22: 22,
    isByMeter44: 44,
    isByMeter66: 66,
  };

  const parseFiniteNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const getWidthFromPriceBy = (priceBy) => PRICE_BY_TO_WIDTH[priceBy] ?? null;

  const getMaterialDefaultLength = (materialId) => {
    const material = materials.find((m) => String(m.material_id) === String(materialId));
    if (!material) return null;

    const candidates = [
      material.constant_height,
      material.height,
      material.length,
      material.constant_height_value,
      material.constant_height?.value,
      material.constant_height?.constant_value?.value,
      material.constantHeight?.value,
    ];

    for (const candidate of candidates) {
      const parsed = parseFiniteNumber(candidate);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  const getRulerDefaults = (rulerId) => {
    const ruler = rulers.find((r) => String(r.ruler_id) === String(rulerId));
    if (!ruler) return { width: null, thickness: null };

    return {
      width: parseFiniteNumber(ruler.constant_width),
      thickness: parseFiniteNumber(ruler.constant_thickness),
    };
  };

  const pricedColorIdsByType = useMemo(() => {
    const map = {};
    for (const pc of priceColors) {
      const type = pc?.type_item;
      const colorId = pc?.color_id;
      if (!type || colorId === undefined || colorId === null) continue;
      if (!map[type]) map[type] = new Set();
      map[type].add(String(colorId));
    }
    return map;
  }, [priceColors]);

  const pricedRulerIdsByType = useMemo(() => {
    const map = {};
    for (const [type, colorIds] of Object.entries(pricedColorIdsByType)) {
      const rulerIds = new Set();
      for (const color of colors) {
        if (colorIds.has(String(color.color_id)) && color.ruler_id !== undefined && color.ruler_id !== null) {
          rulerIds.add(String(color.ruler_id));
        }
      }
      map[type] = rulerIds;
    }
    return map;
  }, [pricedColorIdsByType, colors]);

  const pricedMaterialIdsByType = useMemo(() => {
    const map = {};
    for (const [type, rulerIds] of Object.entries(pricedRulerIdsByType)) {
      const materialIds = new Set();
      for (const ruler of rulers) {
        if (rulerIds.has(String(ruler.ruler_id)) && ruler.material_id !== undefined && ruler.material_id !== null) {
          materialIds.add(String(ruler.material_id));
        }
      }
      map[type] = materialIds;
    }
    return map;
  }, [pricedRulerIdsByType, rulers]);

  const currentPricedMaterialIds = pricedMaterialIdsByType[currentItem.type_item] || new Set();
  const currentPricedRulerIds = pricedRulerIdsByType[currentItem.type_item] || new Set();
  const currentPricedColorIds = pricedColorIdsByType[currentItem.type_item] || new Set();

  const availablePricingOptions = useMemo(() => {
    if (!currentItem.color_id || !currentItem.type_item) return [];

    const seen = new Set();
    return priceColors.filter((pc) => {
      if (
        String(pc.color_id) !== String(currentItem.color_id) ||
        pc.type_item !== currentItem.type_item
      ) {
        return false;
      }

      const key = pc.price_color_By;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [priceColors, currentItem.color_id, currentItem.type_item]);

  const widthLockedByPricing = getWidthFromPriceBy(currentItem.price_color_By) !== null;

  const getActiveValue = () => {
    const value = currentItem[activeField];
    return value === undefined || value === null ? "" : String(value);
  };

  const setActiveValue = (value) => {
    setCurrentItem((prev) => ({ ...prev, [activeField]: value }));
  };

  const handleNumpadPress = (val) => {
    if (!activeField) return;
    let next = getActiveValue();

    if (val === "clear") {
      next = "";
    } else if (val === "back") {
      next = next.slice(0, -1);
    } else if (val === ".") {
      if (next.includes(".")) return;
      next = next ? `${next}.` : "0.";
    } else {
      next = `${next}${val}`;
    }

    setActiveValue(next);
  };

  // Load lookup data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (viewMode === "history") {
      loadOrders();
      setHistoryPage(1);
      setSelectedOrder(null);
    }
  }, [viewMode]);

  useEffect(() => {
    setCustomerPage(1);
  }, [searchTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, matRes, rulerRes, colorRes, batchRes, priceRes] = await Promise.all([
        customerApi.getCustomers(),
        materialApi.getMaterials(),
        rulerApi.getRulers(),
        colorApi.getColors(),
        batchApi.getBatches(),
        priceColorApi.getPriceColors(),
      ]);
      setCustomers(getApiData(custRes, []) || []);
      setMaterials(getApiData(matRes, []) || []);
      setRulers(getApiData(rulerRes, []) || []);
      setColors(getApiData(colorRes, []) || []);
      setBatches(getApiData(batchRes, []) || []);
      setPriceColors(getApiData(priceRes, []) || []);
    } catch {
      setError("فشل في تحميل البيانات الأولية");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      const response = await orderApi.getOrders();
      setOrders(getApiData(response, []) || []);
      setHistoryPage(1);
    } catch (err) {
      setOrdersError(err.message || "فشل في تحميل الطلبات");
    } finally {
      setOrdersLoading(false);
    }
  };

  const openOrderDetails = async (orderId) => {
    try {
      setSelectedOrderLoading(true);
      const response = await orderApi.getOrderById(orderId);
      setSelectedOrder(getApiData(response, null));
    } catch (err) {
      setOrdersError(err.message || "فشل في تحميل تفاصيل الطلب");
    } finally {
      setSelectedOrderLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("هل تريد حذف هذا الطلب؟");
    if (!confirmed) return;
    try {
      setOrdersError("");
      await orderApi.deleteOrder(orderId);
      await loadOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      setOrdersError(err.message || "فشل في حذف الطلب");
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
  const visibleCustomers = filteredCustomers.slice(
    (customerPage - 1) * customersPerPage,
    customerPage * customersPerPage
  );

  const totalItemsPages = Math.max(1, Math.ceil(orderItems.length / itemsPerPage));
  const visibleItems = orderItems.slice(
    (itemsPage - 1) * itemsPerPage,
    itemsPage * itemsPerPage
  );

  const totalHistoryPages = Math.max(1, Math.ceil(orders.length / historyPageSize));
  const visibleOrders = orders.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize
  );

  const getOrderCustomerName = (order) =>
    order?.customer?.name || order?.customer_name || order?.customer?.customer_name || `#${order?.customer_id || "-"}`;

  const getOrderId = (order) => order?.order_id || order?.id;

  const getOrderTotal = (order) => {
    if (!order) return 0;
    if (order.total_amount !== undefined) return order.total_amount;
    if (order.total !== undefined) return order.total;
    if (Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
    }
    return 0;
  };

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

      const createdCustomer = getApiData(response, null);
      setSelectedCustomer(createdCustomer);
      setCustomers([...customers, createdCustomer]);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: "", phone: "", city: "", address: "" });
      setStep(2);
      setSuccess("تم إنشاء العميل بنجاح");
    } catch {
      setError("فشل في إنشاء العميل");
    } finally {
      setLoading(false);
    }
  };

  // Handle item field change with cascading reset
  const handleItemFieldChange = (field, value) => {
    const updatedItem = { ...currentItem, [field]: value };

    if (field === "material_id") {
      updatedItem.ruler_id = "";
      updatedItem.color_id = "";
      updatedItem.price_color_By = "";
      updatedItem.width = "";
      updatedItem.length = "";
      updatedItem.thickness = "";
    } else if (field === "ruler_id") {
      updatedItem.color_id = "";
      updatedItem.price_color_By = "";
      updatedItem.width = "";
      updatedItem.length = "";
      updatedItem.thickness = "";

      const rulerDefaults = getRulerDefaults(value);
      if (rulerDefaults.width !== null) {
        updatedItem.width = rulerDefaults.width;
      }
      if (rulerDefaults.thickness !== null) {
        updatedItem.thickness = rulerDefaults.thickness;
      }
      const materialLength = getMaterialDefaultLength(updatedItem.material_id);
      if (materialLength !== null) {
        updatedItem.length = materialLength;
      }
    } else if (field === "type_item") {
      const pricedMaterials = pricedMaterialIdsByType[value] || new Set();
      const pricedRulers = pricedRulerIdsByType[value] || new Set();
      const pricedColors = pricedColorIdsByType[value] || new Set();

      if (updatedItem.material_id && !pricedMaterials.has(String(updatedItem.material_id))) {
        updatedItem.material_id = "";
        updatedItem.ruler_id = "";
        updatedItem.color_id = "";
        updatedItem.price_color_By = "";
        updatedItem.width = "";
        updatedItem.length = "";
        updatedItem.thickness = "";
      } else {
        if (updatedItem.ruler_id && !pricedRulers.has(String(updatedItem.ruler_id))) {
          updatedItem.ruler_id = "";
          updatedItem.color_id = "";
          updatedItem.price_color_By = "";
          updatedItem.width = "";
          updatedItem.length = "";
          updatedItem.thickness = "";
        }

        if (updatedItem.color_id && !pricedColors.has(String(updatedItem.color_id))) {
          updatedItem.color_id = "";
          updatedItem.price_color_By = "";
          updatedItem.width = "";
          updatedItem.length = "";
          updatedItem.thickness = "";
        }
      }
    }

    if (field === "color_id" || field === "type_item") {
      const availablePricing = priceColors.filter((pc) =>
        String(pc.color_id) === String(updatedItem.color_id) &&
        pc.type_item === updatedItem.type_item
      );

      if (availablePricing.length > 0) {
        updatedItem.price_color_By = availablePricing[0].price_color_By || "";
        const widthFromPriceBy = getWidthFromPriceBy(updatedItem.price_color_By);
        const rulerDefaults = getRulerDefaults(updatedItem.ruler_id);
        const materialLength = getMaterialDefaultLength(updatedItem.material_id);

        updatedItem.width = widthFromPriceBy ?? rulerDefaults.width ?? "";
        updatedItem.thickness = rulerDefaults.thickness ?? "";
        if (!updatedItem.length && materialLength !== null) {
          updatedItem.length = materialLength;
        }
      } else {
        updatedItem.price_color_By = "";
        updatedItem.width = "";
        updatedItem.length = "";
        updatedItem.thickness = "";
      }
    } else if (field === "price_color_By") {
      const widthFromPriceBy = getWidthFromPriceBy(value);
      const rulerDefaults = getRulerDefaults(updatedItem.ruler_id);
      const materialLength = getMaterialDefaultLength(updatedItem.material_id);

      updatedItem.width = widthFromPriceBy ?? rulerDefaults.width ?? updatedItem.width;
      updatedItem.thickness = rulerDefaults.thickness ?? updatedItem.thickness;
      if (!updatedItem.length && materialLength !== null) {
        updatedItem.length = materialLength;
      }
    }

    setCurrentItem(updatedItem);
  };

  // Add item to order
  const handleAddItem = () => {
    const thicknessNum = Number(currentItem.thickness);
    if (
      !currentItem.color_id ||
      !currentItem.batch_id ||
      !currentItem.price_color_By ||
      !currentItem.width ||
      !currentItem.quantity ||
      !currentItem.length ||
      !Number.isFinite(thicknessNum) ||
      thicknessNum <= 0
    ) {
      setError("يرجى إكمال بيانات العنصر (اللون، طريقة التسعير، الطبخة، العرض، الطول، السماكة الثابتة والكمية مطلوبة)");
      return;
    }

    // Find names for display
    const material = materials.find(m => String(m.material_id) === String(currentItem.material_id));
    const ruler = rulers.find(r => String(r.ruler_id) === String(currentItem.ruler_id));
    const color = colors.find(c => String(c.color_id) === String(currentItem.color_id));
    const batch = batches.find(b => String(b.batch_id) === String(currentItem.batch_id));
    const pc = priceColors.find(pc =>
      String(pc.color_id) === String(currentItem.color_id) &&
      pc.type_item === currentItem.type_item &&
      pc.price_color_By === currentItem.price_color_By
    );

    const price = pc ? parseFloat(pc.price_per_meter) : 0;
    const quantity = parseFloat(currentItem.quantity) || 0;
    const length = parseFloat(currentItem.length) || 0;

    let subtotal = 0;
    if (currentItem.price_color_By === "blanck" || currentItem.price_color_By === "isByBlanck") {
      subtotal = quantity * price;
    } else {
      subtotal = quantity * price * (length / 100);
    }

    const itemToAdd = {
      ...currentItem,
      id: Date.now(),
      material_name: material?.material_name,
      ruler_name: ruler?.ruler_name,
      color_name: color?.color_name,
      batch_number: batch?.batch_number,
      subtotal: subtotal
    };

    const nextItems = [...orderItems, itemToAdd];
    setOrderItems(nextItems);
    setItemsPage(Math.ceil(nextItems.length / itemsPerPage));
    setCurrentItem({
      ...currentItem,
      color_id: "",
      price_color_By: "",
      batch_id: "",
      quantity: 1,
      notes: ""
    });
    setError("");
  };

  // Remove item from order
  const handleRemoveItem = (itemId) => {
    const nextItems = orderItems.filter(item => item.id !== itemId);
    setOrderItems(nextItems);
    setItemsPage(Math.max(1, Math.min(itemsPage, Math.ceil(nextItems.length / itemsPerPage))));
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
      const parseFiniteNumber = (value, fallback = null) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
      };

      const normalizedItems = orderItems.map((item) => {
        const matchedRuler = rulers.find((r) => String(r.ruler_id) === String(item.ruler_id));
        const fallbackThickness = parseFiniteNumber(matchedRuler?.constant_thickness, null);

        return {
          type_item: item.type_item,
          color_id: parseFiniteNumber(item.color_id),
          width: parseFiniteNumber(item.width),
          length: parseFiniteNumber(item.length),
          thickness: parseFiniteNumber(item.thickness, fallbackThickness),
          batch_id: parseFiniteNumber(item.batch_id),
          quantity: parseFiniteNumber(item.quantity),
          notes: item.notes?.trim() || "",
        };
      });

      const invalidItemIndex = normalizedItems.findIndex(
        (item) =>
          !item.type_item ||
          !Number.isFinite(item.color_id) ||
          !Number.isFinite(item.batch_id) ||
          !Number.isFinite(item.width) ||
          !Number.isFinite(item.length) ||
          !Number.isFinite(item.thickness) ||
          item.thickness <= 0 ||
          !Number.isFinite(item.quantity)
      );

      if (invalidItemIndex !== -1) {
        setError(`يوجد بيانات ناقصة في العنصر رقم ${invalidItemIndex + 1}. يرجى مراجعة العرض/الطول/السماكة الثابتة/الكمية.`);
        setLoading(false);
        return;
      }

      const orderData = {
        customer_id: parseInt(selectedCustomer.customer_id),
        status: "pending",
        notes: orderNotes,
        items: normalizedItems,
      };

      const response = await orderApi.createOrder(orderData);
      setCreatedOrder(getApiData(response, null));
      setStep(4);
      setSuccess("تم إنشاء الطلب بنجاح");
    } catch {
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
    setItemsPage(1);
    setCustomerPage(1);
    setCurrentItem({
      type_item: "Machine",
      material_id: "",
      ruler_id: "",
      color_id: "",
      price_color_By: "",
      batch_id: "",
      width: "",
      length: "",
      thickness: "",
      quantity: 1,
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
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
    return `${formatted} ل.س`;
  };

  return (
    <div className="h-full bg-gray-50 p-4 overflow-hidden">
      <div className="max-w-[1700px] mx-auto h-full min-h-0 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-gray-600 mt-1">أنشئ طلبًا جديدًا أو راجع سجل الطلبات</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === "create" ? "default" : "outline"}
              className="h-11 px-4"
              onClick={() => setViewMode("create")}
            >
              <ShoppingCart className="w-4 h-4 ml-2" />
              طلب جديد
            </Button>
            <Button
              type="button"
              variant={viewMode === "history" ? "default" : "outline"}
              className="h-11 px-4"
              onClick={() => setViewMode("history")}
            >
              <History className="w-4 h-4 ml-2" />
              سجل الطلبات
            </Button>
          </div>
        </div>


        {/* Progress Steps */}
        {viewMode === "create" && (
          <div className="mb-1 rounded-2xl border bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center gap-2 flex-1">
                  <div
                    className={"w-9 h-9 shrink-0 rounded-full flex items-center justify-center " + (step >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600")}
                  >
                    {stepNumber === 1 && <User className="w-5 h-5" />}
                    {stepNumber === 2 && <Package className="w-5 h-5" />}
                    {stepNumber === 3 && <Check className="w-5 h-5" />}
                    {stepNumber === 4 && <ShoppingCart className="w-5 h-5" />}
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={"h-1 flex-1 rounded-full " + (step > stepNumber ? "bg-blue-600" : "bg-gray-300")}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 mt-2 text-sm">
              <span className={step >= 1 ? "text-blue-600 font-medium" : "text-gray-600"}>اختيار العميل</span>
              <span className={step >= 2 ? "text-blue-600 font-medium" : "text-gray-600"}>إضافة العناصر</span>
              <span className={step >= 3 ? "text-blue-600 font-medium" : "text-gray-600"}>مراجعة الطلب</span>
              <span className={step >= 4 ? "text-blue-600 font-medium" : "text-gray-600"}>تم الإنشاء</span>
            </div>
          </div>
        )}

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
        {viewMode === "create" && step === 1 && (
          <Card className="p-6 flex-1 min-h-0 overflow-hidden flex flex-col">
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
            <div className="space-y-2 mb-4 flex-1 min-h-0 overflow-y-auto pr-1">
              {visibleCustomers.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">{customer.name}</div>
                      <div className="text-sm text-gray-600 font-bold" dir="ltr">{customer.phone}</div>
                      <div className="text-sm text-gray-600">{customer.city} - {customer.address}</div>
                    </div>
                    <Badge className={customer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {customer.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
                disabled={customerPage === 1}
              >
                السابق
              </Button>
              <div className="text-sm text-gray-500">
                صفحة {customerPage} من {totalCustomerPages}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => setCustomerPage((prev) => Math.min(totalCustomerPages, prev + 1))}
                disabled={customerPage >= totalCustomerPages}
              >
                التالي
              </Button>
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
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    className="p-2 border rounded"
                    placeholder="رقم الهاتف"
                    value={newCustomer.phone}
                    dir="ltr"
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                  <input
                    type="text"
                    className="p-2 border rounded"
                    placeholder="المدينة"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  />
                  <input
                    type="text"
                    className="p-2 border rounded"
                    placeholder="العنوان"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
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
        {viewMode === "create" && step === 2 && (
          <Card className="p-3 flex-1 min-h-0 overflow-hidden flex flex-col gap-2">
            <div className="shrink-0">
              <h2 className="text-lg font-bold">إضافة العناصر</h2>
              <p className="text-gray-600">العميل: {selectedCustomer?.name}</p>
            </div>

            <div className="flex-1 min-h-0">
              <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-2 h-full min-h-0">
                <div className="order-2 xl:order-2 rounded-2xl border bg-white p-2.5 min-h-0 overflow-hidden flex flex-col">
                  <h3 className="mb-2 text-sm font-bold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" /> بيانات عنصر جديد
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1.5">
                    <div className="space-y-1">
                      <Label>نوع التشغيل</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={currentItem.type_item} onChange={(e) => handleItemFieldChange("type_item", e.target.value)} options={[{ value: "Machine", label: "مكنة" }, { value: "Presser", label: "كوي" }]} placeholder="اختر نوع التشغيل" />
                    </div>

                    <div className="space-y-1">
                      <Label>المادة</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={String(currentItem.material_id || "")} onChange={(e) => handleItemFieldChange("material_id", e.target.value)} options={materials.map((m) => ({ value: String(m.material_id), label: m.material_name, disabled: !currentPricedMaterialIds.has(String(m.material_id)) }))} placeholder="اختر المادة" />
                    </div>

                    <div className="space-y-1">
                      <Label>المسطرة</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={String(currentItem.ruler_id || "")} onChange={(e) => handleItemFieldChange("ruler_id", e.target.value)} disabled={!currentItem.material_id} options={rulers.filter((r) => String(r.material_id) === String(currentItem.material_id)).map((r) => ({ value: String(r.ruler_id), label: r.ruler_name, disabled: !currentPricedRulerIds.has(String(r.ruler_id)) }))} placeholder="اختر المسطرة" />
                    </div>

                    <div className="space-y-1">
                      <Label>اللون</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={String(currentItem.color_id || "")} onChange={(e) => handleItemFieldChange("color_id", e.target.value)} disabled={!currentItem.ruler_id} options={colors.filter((c) => String(c.ruler_id) === String(currentItem.ruler_id)).map((c) => ({ value: String(c.color_id), label: c.color_name + " (" + c.color_code + ")", disabled: !currentPricedColorIds.has(String(c.color_id)) }))} placeholder="اختر اللون" />
                    </div>

                    <div className="space-y-1">
                      <Label>طريقة التسعير</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={currentItem.price_color_By} onChange={(e) => handleItemFieldChange("price_color_By", e.target.value)} disabled={!currentItem.color_id} options={availablePricingOptions.map((pc) => ({ value: pc.price_color_By, label: pc.price_color_By === "isByMeter22" ? "22 متر" : pc.price_color_By === "isByMeter44" ? "44 متر" : pc.price_color_By === "isByMeter66" ? "66 متر" : pc.price_color_By === "blanck" || pc.price_color_By === "isByBlanck" ? "لوح" : pc.price_color_By }))} placeholder="اختر طريقة التسعير" />
                    </div>

                    <div className="space-y-1">
                      <Label>الطبخة</Label>
                      <FilterSelect className="[&_input]:h-10 [&_input]:text-xs" value={String(currentItem.batch_id || "")} onChange={(e) => handleItemFieldChange("batch_id", e.target.value)} options={batches.map((b) => ({ value: String(b.batch_id), label: b.batch_number }))} placeholder="اختر الطبخة" />
                    </div>

                    <div className="space-y-1">
                      <Label>العرض (سم)</Label>
                      <Input type="number" value={currentItem.width} onFocus={() => setActiveField("width")} onChange={(e) => handleItemFieldChange("width", e.target.value)} className="h-10 font-bold text-sm" readOnly={widthLockedByPricing} placeholder="مثال: 120" />
                    </div>

                    <div className="space-y-1">
                      <Label>الطول (سم) <span className="text-red-500">*</span></Label>
                      <Input type="number" value={currentItem.length} onFocus={() => setActiveField("length")} onChange={(e) => handleItemFieldChange("length", e.target.value)} className="h-10 text-sm" placeholder="مثال: 100" />
                    </div>

                    <div className="space-y-1">
                      <Label>الكمية <span className="text-red-500">*</span></Label>
                      <Input type="number" value={currentItem.quantity} onFocus={() => setActiveField("quantity")} onChange={(e) => handleItemFieldChange("quantity", e.target.value)} className="h-10 font-bold text-sm" />
                    </div>

                    <div className="space-y-1">
                      <Label>السماكة (مم) <span className="text-red-500">*</span></Label>
                      <Input type="number" value={currentItem.thickness} onFocus={() => setActiveField("thickness")} onChange={(e) => handleItemFieldChange("thickness", e.target.value)} className="h-10 font-bold text-sm" placeholder="مثال: 0.6" />
                    </div>
                  </div>

                  <div className="mt-1.5 grid grid-cols-1 xl:grid-cols-[1fr_180px] items-end gap-1.5">
                    <div className="space-y-1">
                      <Label>ملاحظات العنصر (اختياري)</Label>
                      <Input placeholder="أي ملاحظات خاصة بهذا العنصر..." value={currentItem.notes} onChange={(e) => handleItemFieldChange("notes", e.target.value)} className="h-10 text-sm" />
                    </div>

                    <Button onClick={handleAddItem} className="h-10 px-4 text-sm bg-blue-600 hover:bg-blue-700 rounded-xl">
                      <Plus className="w-5 h-5 ml-2" /> إضافة العنصر
                    </Button>
                  </div>

                  <div className="mt-2 rounded-xl border bg-gray-50 p-2 min-h-0 overflow-hidden flex flex-col">
                    <div className="mb-1 text-sm font-bold">العناصر المضافة</div>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-1.5">
                      {visibleItems.length === 0 && <div className="rounded-lg border border-dashed p-3 text-xs text-gray-500 text-center">لا يوجد عناصر مضافة بعد</div>}

                      {visibleItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-2 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-primary-f truncate">{item.type_item === "Machine" ? "مكنة" : "كوي"} | {item.material_name}</div>
                              <div className="text-xs text-gray-600 truncate">المسطرة: {item.ruler_name} | اللون: {item.color_name}</div>
                              <div className="text-xs text-gray-600 truncate">العرض × الطول: {item.width} × {item.length} | الكمية: {item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="font-bold text-xs">{formatCurrency(item.subtotal)}</div>
                              <Button onClick={() => handleRemoveItem(item.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setItemsPage((prev) => Math.max(1, prev - 1))} disabled={itemsPage === 1}>السابق</Button>
                        <div className="text-xs text-gray-600">صفحة {itemsPage} من {totalItemsPages}</div>
                        <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setItemsPage((prev) => Math.min(totalItemsPages, prev + 1))} disabled={itemsPage >= totalItemsPages}>التالي</Button>
                      </div>

                      <div className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700">
                        إجمالي الطلب: {formatCurrency(calculateTotal())}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button onClick={() => setStep(1)} variant="outline" className="h-9 text-xs">رجوع</Button>
                        <Button onClick={() => setStep(3)} disabled={orderItems.length === 0} className="h-9 text-xs bg-blue-600 hover:bg-blue-700">
                          متابعة
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 xl:order-1 rounded-2xl border bg-white p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">لوحة الأرقام</div>
                    <div className="text-xs text-gray-500">الحقل النشط: {activeFieldLabel}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={activeField === "width" ? "default" : "outline"} className="h-9 text-xs px-2" onClick={() => setActiveField("width")}>العرض (سم)</Button>
                    <Button type="button" variant={activeField === "length" ? "default" : "outline"} className="h-9 text-xs px-2" onClick={() => setActiveField("length")}>الطول (سم)</Button>
                    <Button type="button" variant={activeField === "quantity" ? "default" : "outline"} className="h-9 text-xs px-2" onClick={() => setActiveField("quantity")}>الكمية</Button>
                    <Button type="button" variant={activeField === "thickness" ? "default" : "outline"} className="h-9 text-xs px-2" onClick={() => setActiveField("thickness")}>السماكة (مم)</Button>
                  </div>

                  <Numpad onPress={handleNumpadPress} />

                  <div className="rounded-xl border bg-gray-50 p-2 text-center">
                    <div className="text-xs text-gray-500 mb-1">القيمة الحالية</div>
                    <div className="text-xl font-black text-secondary-f">{getActiveValue() || "0"}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {viewMode === "create" && step === 3 && (
          <Card className="p-6 flex-1 min-h-0 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">مراجعة الطلب</h2>

            {/* Customer Info */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>الاسم:</strong> {selectedCustomer?.name}</div>
                <div><strong>الهاتف:</strong> <span dir="ltr">{selectedCustomer?.phone}</span></div>
                <div><strong>المدينة:</strong> {selectedCustomer?.city}</div>
                <div><strong>العنوان:</strong> {selectedCustomer?.address}</div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">عناصر الطلب</h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-bold">{item.type_item === "Machine" ? "مكنة" : "كوي"} | {item.material_name}</div>
                      <div className="text-xs text-gray-500">
                        {item.color_name} | {item.width} × {item.length} × {item.quantity}
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
        {viewMode === "create" && step === 4 && (
          <Card className="p-6 text-center flex-1 min-h-0 overflow-y-auto">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">تم إنشاء الطلب بنجاح!</h2>
              <p className="text-gray-600">رقم الطلب: #{createdOrder?.order_id}</p>
            </div>

            <div className="border rounded-lg p-4 mb-6 text-right">
              <h3 className="font-medium mb-2 border-b pb-2">تفاصيل الطلب</h3>
              <div className="space-y-2 text-sm">
                <div><strong>العميل:</strong> {selectedCustomer?.name}</div>
                <div><strong>الحالة:</strong> <Badge className="bg-yellow-100 text-yellow-800">قيد الانتظار</Badge></div>
                <div><strong>عدد العناصر:</strong> {orderItems.length}</div>
                <div className="text-lg font-bold text-green-600 border-t pt-2 mt-2">
                  <strong>المبلغ الإجمالي:</strong> {formatCurrency(calculateTotal())}
                </div>
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
        {viewMode === "history" && (
          <div className="flex-1 overflow-hidden">
            <Card className="p-4 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-4 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold">الطلبات السابقة</h2>
                      <p className="text-xs text-gray-500">اختر طلباً لعرض التفاصيل</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={loadOrders}
                      disabled={ordersLoading}
                    >
                      <RotateCcw className="w-4 h-4 ml-2" />
                      تحديث
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {ordersLoading && <LoadingState message="جاري تحميل الطلبات..." />}
                    {!ordersLoading && visibleOrders.length === 0 && (
                      <div className="border rounded-lg p-4 text-center text-sm text-gray-500">
                        لا توجد طلبات سابقة
                      </div>
                    )}
                    {!ordersLoading && visibleOrders.map((order) => {
                      const orderId = getOrderId(order);
                      return (
                        <div
                          key={orderId}
                          className={`border rounded-lg p-3 flex items-center justify-between ${getOrderId(selectedOrder) === orderId ? "border-blue-400 bg-blue-50" : "hover:bg-gray-50"}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">طلب #{orderId}</span>
                            <span className="text-xs text-gray-600">{getOrderCustomerName(order)}</span>
                            <span className="text-xs text-gray-500">{order.created_at || order.date || ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3"
                              onClick={() => openOrderDetails(orderId)}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              عرض
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 px-3 text-red-600 border-red-200 hover:text-red-700"
                              onClick={() => handleDeleteOrder(orderId)}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                    >
                      السابق
                    </Button>
                    <div className="text-sm text-gray-500">
                      صفحة {historyPage} من {totalHistoryPages}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
                      disabled={historyPage >= totalHistoryPages}
                    >
                      التالي
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="mb-3">
                    <h2 className="text-lg font-bold">تفاصيل الطلب</h2>
                    <p className="text-xs text-gray-500">عرض سريع بدون تمرير</p>
                  </div>
                  <div className="flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto">
                    {selectedOrderLoading && <LoadingState message="جاري تحميل التفاصيل..." />}
                    {!selectedOrderLoading && !selectedOrder && (
                      <div className="text-center text-sm text-gray-500">اختر طلباً من القائمة</div>
                    )}
                    {!selectedOrderLoading && selectedOrder && (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-4 gap-2">
                          <span className="font-bold">طلب #{getOrderId(selectedOrder)}</span>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {selectedOrder.status || "قيد الانتظار"}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">العميل</div>
                          <div className="font-medium">{getOrderCustomerName(selectedOrder)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">المبلغ الإجمالي</div>
                          <div className="text-lg font-bold text-green-600">{formatCurrency(getOrderTotal(selectedOrder))}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">العناصر</div>
                          <div className="space-y-2">
                            {(selectedOrder.items || []).slice(0, 4).map((item, idx) => (
                              <div key={`${item.id || idx}`} className="border rounded-md p-2 bg-white">
                                <div className="text-xs text-gray-600">
                                  {item.type_item === "Machine" ? "مكـنة" : "كوي"} | {item.color_name || item.color?.color_name || "-"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.width || "-"} × {item.length || "-"} | الكمية: {item.quantity || "-"}
                                </div>
                              </div>
                            ))}
                            {(selectedOrder.items || []).length > 4 && (
                              <div className="text-xs text-gray-500">... عناصر إضافية</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {ordersError && (
                    <div className="mt-3">
                      <MessageAlert
                        type="error"
                        message={ordersError}
                        onDismiss={() => setOrdersError("")}
                        dismissable={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Numpad({ onPress }) {
  const keys = [
    "7", "8", "9",
    "4", "5", "6",
    "1", "2", "3",
    ".", "0", "back",
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onPress(key)}
          className="h-11 rounded-xl border bg-white text-base font-bold active:scale-95 transition"
        >
          {key === "back" ? "حذف" : key}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPress("clear")}
        className="col-span-3 h-9 rounded-xl bg-red-100 text-red-700 text-sm font-bold"
      >
        مسح
      </button>
    </div>
  );
}



