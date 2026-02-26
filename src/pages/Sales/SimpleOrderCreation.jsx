// src/pages/Sales/SimpleOrderCreation.jsx
import { useState, useEffect, useMemo } from "react";
import { orderApi } from "../../api/orderApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { constantApi } from "../../api/constantApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import FilterSelect from "../../components/common/FilterSelect";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  ShoppingCart,
  Plus,
  History,
  Trash2,
  Eye,
  RotateCcw,
  Check
} from "lucide-react";
import MessageAlert from "../../components/common/MessageAlert";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";

export default function SimpleOrderCreation() {
  const [viewMode, setViewMode] = useState("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data
  const [materials, setMaterials] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [widthValues, setWidthValues] = useState([]); // قيم العرض حسب المادة
  const [loadingWidths, setLoadingWidths] = useState(false); // حالة تحميل قيم العرض

  // Form State
  const [formData, setFormData] = useState({
    material_id: "",
    type_item: "Machine",
    ruler_id: "",
    color_id: "",
    batch_id: "",
    width: "",
    quantity: "",
    notes: ""
  });

  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Numpad
  const [numpadMode, setNumpadMode] = useState("quantity");
  const [colorSearchCode, setColorSearchCode] = useState("");
  const [activeField, setActiveField] = useState("quantity");

  const TYPE_OPTIONS = [
    { value: "Machine", label: "مكنة" },
    { value: "Presser", label: "كوي" }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (viewMode === "history") loadOrders();
  }, [viewMode]);

  // Load width values when material changes
  useEffect(() => {
    if (formData.material_id) {
      loadWidthValues(formData.material_id);
    } else {
      setWidthValues([]);
    }
  }, [formData.material_id]);

  const loadInitialData = async () => {
    try {
      const [matRes, rulerRes, colorRes, batchRes] = await Promise.all([
        materialApi.getMaterials(),
        rulerApi.getRulers(),
        colorApi.getColors(),
        batchApi.getBatches(),
      ]);
      
      setMaterials(getApiData(matRes, []) || []);
      setRulers(getApiData(rulerRes, []) || []);
      setColors(getApiData(colorRes, []) || []);
      setBatches(getApiData(batchRes, []) || []);
      
    } catch (error) {
      setError("فشل في تحميل البيانات");
    }
  };

  // جلب قيم العرض حسب المادة
  const loadWidthValues = async (materialId) => {
    try {
      setLoadingWidths(true);
      const response = await constantApi.getConstantValuesByMaterial(materialId, 'width');
      const widthData = getApiData(response, []);
      setWidthValues(widthData);
      
      // إعادة تعيين العرض المحدد عند تغيير المادة
      setFormData(prev => ({ ...prev, width: "" }));
    } catch (error) {
      setError("فشل في تحميل قيم العرض");
      setWidthValues([]);
    } finally {
      setLoadingWidths(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await orderApi.getOrders();
      setOrders(getApiData(response, []) || []);
    } catch {
      setError("فشل في تحميل الطلبات");
    } finally {
      setOrdersLoading(false);
    }
  };

  // التحقق مما إذا كانت المادة المحددة تحتوي على كلمة "لوح"
  const isSelectedMaterialBoard = useMemo(() => {
    if (!formData.material_id) return false;
    const selectedMaterial = materials.find(m => String(m.material_id) === String(formData.material_id));
    return selectedMaterial?.material_name?.includes("لوح") || false;
  }, [formData.material_id, materials]);

  // Filters
  const availableRulers = useMemo(() => {
    if (!formData.material_id) return [];
    return rulers.filter(r => String(r.material_id) === String(formData.material_id));
  }, [formData.material_id, rulers]);

  const availableColors = useMemo(() => {
    if (!formData.ruler_id) return [];
    return colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));
  }, [formData.ruler_id, colors]);

  const filteredColorsBySearch = useMemo(() => {
    if (!colorSearchCode || numpadMode !== "colorSearch") return availableColors;
    return availableColors.filter(c => 
      c.color_code?.toLowerCase().includes(colorSearchCode.toLowerCase())
    );
  }, [colorSearchCode, availableColors, numpadMode]);

  const selectedColorImage = useMemo(() => {
    const color = colors.find(c => String(c.color_id) === String(formData.color_id));
    return color?.image_url || color?.color_image || null;
  }, [formData.color_id, colors]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === "material_id") {
        newData.ruler_id = "";
        newData.color_id = "";
        newData.width = "";
      } else if (field === "ruler_id") {
        newData.color_id = "";
        newData.width = "";
      } else if (field === "color_id") {
        newData.width = "";
      }
      
      return newData;
    });
  };

  const handleNumpadPress = (val) => {
    if (numpadMode === "colorSearch") {
      let search = colorSearchCode;
      if (val === "clear") search = "";
      else if (val === "back") search = search.slice(0, -1);
      else search = search + val;
      
      setColorSearchCode(search);
      
      const matched = availableColors.find(c => c.color_code === search);
      if (matched) {
        handleFieldChange("color_id", matched.color_id);
        setNumpadMode("quantity");
        setColorSearchCode("");
      }
    } else {
      let current = String(formData[activeField] || "");
      if (val === "clear") current = "";
      else if (val === "back") current = current.slice(0, -1);
      else if (val === ".") {
        if (!current.includes(".")) current = current ? current + "." : "0.";
      } else {
        current = current + val;
      }
      handleFieldChange(activeField, current);
    }
  };

  const addItem = () => {
    if (!formData.material_id || !formData.ruler_id || !formData.color_id || !formData.quantity) {
      setError("يرجى اكمال جميع البيانات");
      return;
    }

    // إذا كانت المادة ليست "لوح" يجب تحديد العرض
    if (!isSelectedMaterialBoard && !formData.width) {
      setError("يرجى اختيار العرض");
      return;
    }

    const material = materials.find(m => String(m.material_id) === String(formData.material_id));
    const ruler = rulers.find(r => String(r.ruler_id) === String(formData.ruler_id));
    const color = colors.find(c => String(c.color_id) === String(formData.color_id));
    const batch = batches.find(b => String(b.batch_id) === String(formData.batch_id));

    const newItem = {
      id: Date.now(),
      ...formData,
      material_name: material?.material_name,
      ruler_name: ruler?.ruler_name,
      color_name: color?.color_name,
      batch_number: batch?.batch_number,
    };

    setOrderItems(prev => [...prev, newItem]);
    
    // Reset form keeping material
    setFormData(prev => ({
      material_id: prev.material_id,
      type_item: "Machine",
      ruler_id: "",
      color_id: "",
      batch_id: "",
      width: "",
      quantity: "",
      notes: ""
    }));
    setColorSearchCode("");
    setError("");
  };

  const removeItem = (id) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      setError("أضف عنصراً واحداً على الأقل");
      return;
    }

    try {
      setLoading(true);
      const items = orderItems.map(item => ({
        type_item: item.type_item,
        color_id: Number(item.color_id),
        width: Number(item.width) || 0,
        batch_id: Number(item.batch_id) || null,
        quantity: Number(item.quantity),
        notes: item.notes
      }));

      await orderApi.createOrder({ status: "pending", items, notes: "" });
      setSuccess("تم حفظ الطلب بنجاح");
      setOrderItems([]);
    } catch {
      setError("فشل في حفظ الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-3 border-b shrink-0">
        <h1 className="text-xl font-bold text-gray-800">نظام الطلبات</h1>
        <div className="flex gap-3">
          <Button 
            size="lg"
            variant={viewMode === "create" ? "default" : "outline"} 
            onClick={() => setViewMode("create")}
            className="px-6 py-3 text-base"
          >
            <ShoppingCart className="w-5 h-5 ml-2" />
            طلب جديد
          </Button>
          <Button 
            size="lg"
            variant={viewMode === "history" ? "default" : "outline"}
            onClick={() => setViewMode("history")}
            className="px-6 py-3 text-base"
          >
            <History className="w-5 h-5 ml-2" />
            سجل الطلبات
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && <MessageAlert type="error" message={error} onDismiss={() => setError("")} dismissable />}
      {success && <MessageAlert type="success" message={success} onDismiss={() => setSuccess("")} dismissable />}

      {viewMode === "create" ? (
        <div className="flex-1 grid grid-cols-[1fr_320px] gap-3 p-3 min-h-0 overflow-hidden">
          
          {/* Left Side - Form - مع سكرول */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
            
            {/* المواد - أزرار كبيرة مناسبة للمس */}
            <Card className="p-4 shrink-0">
              <Label className="font-bold text-base mb-3 block">المادة</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {materials.map(m => (
                  <button
                    key={m.material_id}
                    onClick={() => handleFieldChange("material_id", m.material_id)}
                    className={`p-4 rounded-xl border-2 text-base font-medium transition-all touch-manipulation ${
                      String(formData.material_id) === String(m.material_id)
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                        : "border-gray-300 bg-white hover:border-blue-400 active:bg-gray-100"
                    }`}
                  >
                    {m.material_name}
                  </button>
                ))}
              </div>
            </Card>

            {/* نوع الطلب - يختفي إذا كانت المادة "لوح" */}
            {!isSelectedMaterialBoard && (
              <Card className="p-4 shrink-0">
                <Label className="font-bold text-base mb-3 block">نوع الطلب</Label>
                <div className="flex gap-3">
                  {TYPE_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => handleFieldChange("type_item", t.value)}
                      className={`flex-1 p-4 rounded-xl border-2 text-base font-medium transition-all touch-manipulation ${
                        formData.type_item === t.value
                          ? "border-green-600 bg-green-600 text-white shadow-lg"
                          : "border-gray-300 bg-white hover:border-green-400 active:bg-gray-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* المسطرة */}
            <Card className="p-4 shrink-0">
              <Label className="font-bold text-base mb-3 block">المسطرة</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableRulers.length === 0 ? (
                  <span className="text-gray-400 text-base col-span-3 text-center p-4">اختر المادة أولاً</span>
                ) : (
                  availableRulers.map(r => (
                    <button
                      key={r.ruler_id}
                      onClick={() => handleFieldChange("ruler_id", r.ruler_id)}
                      className={`p-4 rounded-xl border-2 text-base font-medium transition-all touch-manipulation ${
                        String(formData.ruler_id) === String(r.ruler_id)
                          ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                          : "border-gray-300 bg-white hover:border-purple-400 active:bg-gray-100"
                      }`}
                    >
                      {r.ruler_name}
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* اللون والصورة */}
            <Card className="p-4 shrink-0">
              <div className="grid grid-cols-[1fr_120px] gap-4 items-end">
                <div>
                  <Label className="font-bold text-base mb-3 block">
                    اللون
                    {numpadMode === "colorSearch" && colorSearchCode && (
                      <span className="mr-3 text-blue-600 text-sm">(بحث: {colorSearchCode})</span>
                    )}
                  </Label>
                  <FilterSelect
                    value={formData.color_id}
                    onChange={(e) => handleFieldChange("color_id", e.target.value)}
                    disabled={!formData.ruler_id}
                    options={filteredColorsBySearch.map(c => ({
                      value: c.color_id,
                      label: `${c.color_name} (${c.color_code})`
                    }))}
                    placeholder={formData.ruler_id ? "اختر اللون" : "اختر المسطرة أولاً"}
                    className="w-full text-base p-3"
                  />
                </div>
                <div>
                  <Label className="font-bold text-base mb-3 block">الصورة</Label>
                  <div className="h-20 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                    {selectedColorImage ? (
                      <img src={selectedColorImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">لا توجد</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* العرض - حسب المادة المحددة */}
            {formData.material_id && !isSelectedMaterialBoard && (
              <Card className="p-4 shrink-0">
                <Label className="font-bold text-base mb-3 block">
                  العرض (سم)
                  {loadingWidths && <span className="mr-2 text-gray-500 text-sm">جاري التحميل...</span>}
                </Label>
                {widthValues.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {widthValues.map(w => (
                      <button
                        key={w.id}
                        onClick={() => handleFieldChange("width", w.value)}
                        className={`p-4 rounded-xl border-2 text-base font-medium transition-all touch-manipulation ${
                          formData.width === w.value
                            ? "border-teal-600 bg-teal-600 text-white shadow-lg"
                            : "border-gray-300 bg-white hover:border-teal-400 active:bg-gray-100"
                        }`}
                      >
                        {w.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  !loadingWidths && (
                    <div className="text-center p-4 text-gray-400 text-base border-2 border-dashed border-gray-300 rounded-xl">
                      لا توجد قيم عرض لهذه المادة
                    </div>
                  )
                )}
              </Card>
            )}

            {/* الكمية والملاحظات */}
            <Card className="p-4 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                {/* الكمية مع وحدة قياس */}
                <div>
                  <Label className="font-bold text-base mb-3 block">الكمية</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      value={formData.quantity}
                      onChange={(e) => handleFieldChange("quantity", e.target.value)}
                      onClick={() => {
                        setActiveField("quantity");
                        setNumpadMode("quantity");
                      }}
                      className={`h-14 text-lg text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""}`}
                      placeholder="0"
                    />
                    <span className="text-lg font-bold text-gray-600 w-16">متر</span>
                  </div>
                </div>

                {/* الملاحظات */}
                <div>
                  <Label className="font-bold text-base mb-3 block">الملاحظات</Label>
                  <Input 
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    className="h-14 text-base"
                  />
                </div>
              </div>
            </Card>

            {/* زر الإضافة - كبير ومناسب للمس */}
            <Button 
              onClick={addItem}
              size="lg"
              className="h-14 bg-blue-600 hover:bg-blue-700 shrink-0 text-lg font-bold"
              disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}
            >
              <Plus className="w-6 h-6 ml-2" />
              إضافة للطلب
            </Button>

            {/* جدول العناصر المضافة */}
            <div className="flex-1 min-h-[200px] flex flex-col bg-white rounded-lg border overflow-hidden">
              <div className="flex justify-between items-center p-3 border-b bg-gray-50 shrink-0">
                <span className="font-bold text-base">العناصر المضافة: {orderItems.length}</span>
                <Button 
                  size="lg"
                  onClick={saveOrder}
                  disabled={loading || orderItems.length === 0}
                  className="h-12 bg-green-600 hover:bg-green-700 text-base px-6"
                >
                  <Check className="w-5 h-5 ml-2" />
                  حفظ الطلب
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-base">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-right border-b">المادة</th>
                      <th className="p-3 text-right border-b">المسطرة</th>
                      <th className="p-3 text-right border-b">اللون</th>
                      <th className="p-3 text-center border-b">النوع</th>
                      <th className="p-3 text-center border-b">العرض</th>
                      <th className="p-3 text-center border-b">الكمية</th>
                      <th className="p-3 text-center border-b">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{item.material_name}</td>
                        <td className="p-3">{item.ruler_name}</td>
                        <td className="p-3">{item.color_name}</td>
                        <td className="p-3 text-center">{item.type_item === "Machine" ? "مكنة" : "كوي"}</td>
                        <td className="p-3 text-center">{item.width || "-"}</td>
                        <td className="p-3 text-center font-bold">{item.quantity} م</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="text-red-600 hover:bg-red-50 p-3 rounded-lg touch-manipulation"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orderItems.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-gray-400 text-base">لا توجد عناصر مضافة</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side - لوحة الأرقام */}
          <Card className="p-4 flex flex-col h-full overflow-hidden">
            <div className="text-center mb-4 shrink-0">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setNumpadMode("colorSearch");
                    setColorSearchCode("");
                  }}
                  className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold border-2 touch-manipulation ${
                    numpadMode === "colorSearch" ? "bg-purple-600 text-white border-purple-600" : "bg-white border-gray-300"
                  }`}
                >
                  بحث بالكود
                </button>
                <button
                  onClick={() => {
                    setNumpadMode("quantity");
                    setActiveField("quantity");
                  }}
                  className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold border-2 touch-manipulation ${
                    numpadMode === "quantity" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
                  }`}
                >
                  كتابة الكمية
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-xl p-5 mb-4">
                <div className="text-base text-gray-500 mb-2">
                  {numpadMode === "colorSearch" ? "كود اللون" : 
                   activeField === "quantity" ? "الكمية" : 
                   activeField === "width" ? "العرض" : "القيمة"}
                </div>
                <div className="text-4xl font-mono font-bold text-gray-800">
                  {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-1">
              {["7","8","9","4","5","6","1","2","3",".","0","back"].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumpadPress(key)}
                  className="bg-white border-2 border-gray-300 rounded-xl text-3xl font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center h-20 touch-manipulation"
                >
                  {key === "back" ? "⌫" : key}
                </button>
              ))}
              <button
                onClick={() => handleNumpadPress("clear")}
                className="col-span-3 h-16 bg-red-100 text-red-700 rounded-xl text-xl font-bold hover:bg-red-200 transition-colors touch-manipulation"
              >
                مسح الكل
              </button>
            </div>

            {numpadMode === "quantity" && (
              <div className="mt-4 grid grid-cols-2 gap-3 shrink-0">
                <button 
                  onClick={() => setActiveField("width")}
                  className={`py-4 rounded-xl border-2 text-lg font-bold touch-manipulation ${
                    activeField === "width" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
                  }`}
                >
                  العرض
                </button>
                <button 
                  onClick={() => setActiveField("quantity")}
                  className={`py-4 rounded-xl border-2 text-lg font-bold touch-manipulation ${
                    activeField === "quantity" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
                  }`}
                >
                  الكمية
                </button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* History - سجل الطلبات */
        <Card className="flex-1 m-3 p-4 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <h2 className="font-bold text-xl">سجل الطلبات</h2>
            <Button size="lg" variant="outline" onClick={loadOrders} disabled={ordersLoading} className="px-6 py-3 text-base">
              <RotateCcw className="w-5 h-5 ml-2" />
              تحديث
            </Button>
          </div>
          
          <div className="flex-1 border rounded-lg overflow-auto bg-white">
            <table className="w-full text-base">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-right border-b">#</th>
                  <th className="p-3 text-right border-b">التاريخ</th>
                  <th className="p-3 text-center border-b">العناصر</th>
                  <th className="p-3 text-center border-b">حالة</th>
                  <th className="p-3 text-center border-b">عرض</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr><td colSpan="5" className="p-6"><LoadingState /></td></tr>
                ) : orders.map(order => (
                  <tr key={order.order_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{order.order_id}</td>
                    <td className="p-3">{order.created_at?.split('T')[0]}</td>
                    <td className="p-3 text-center">{order.items?.length || 0}</td>
                    <td className="p-3 text-center">
                      <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">{order.status || "معلق"}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Button size="lg" variant="outline" className="h-12 px-4" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-base">طلب #{selectedOrder.order_id}</span>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 p-2 text-xl">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-base">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="bg-white p-2 rounded-lg border">
                    {item.type_item === "Machine" ? "مكنة" : "كوي"} | 
                    {item.width || "-"} | 
                    {item.quantity} م
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}