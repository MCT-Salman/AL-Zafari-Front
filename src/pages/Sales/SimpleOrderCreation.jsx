// src/pages/Sales/SimpleOrderCreation.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../api/orderApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { priceColorApi } from "../../api/priceColorApi";
import { constantApi } from "../../api/constantApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  ShoppingCart,
  Plus,
  History,
  Trash2,
  Eye,
  RotateCcw,
  Check,
  User,
  Users,
  LogIn,
  EyeOff,
  Home
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";

export default function SimpleOrderCreation() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("create");
  const [loading, setLoading] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Data
  const [materials, setMaterials] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [priceColors, setPriceColors] = useState([]);
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
    thickness: "0.6",
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
  const PRICE_BY_TO_WIDTH = {
    isByMeter22: 22,
    isByMeter44: 44,
    isByMeter66: 66,
  };
  const getWidthFromPriceBy = (priceBy) => PRICE_BY_TO_WIDTH[priceBy] ?? null;
  const totalPreviewQuantity = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [orderItems]);
  const getStatusLabel = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "pending") return "معلق";
    if (key === "completed") return "مكتمل";
    if (key === "cancelled" || key === "canceled") return "ملغي";
    if (key === "processing") return "قيد المعالجة";
    if (key === "draft") return "مسودة";
    return status || "-";
  };


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
      const [matRes, rulerRes, colorRes, batchRes, priceRes] = await Promise.all([
        materialApi.getMaterials(),
        rulerApi.getRulers(),
        colorApi.getColors(),
        batchApi.getBatches(),
        priceColorApi.getPriceColors(),
      ]);

      setMaterials(getApiData(matRes, []) || []);
      setRulers(getApiData(rulerRes, []) || []);
      setColors(getApiData(colorRes, []) || []);
      setBatches(getApiData(batchRes, []) || []);
      setPriceColors(getApiData(priceRes, []) || []);

    } catch (error) {
      toast.error("فشل في تحميل البيانات");
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
      toast.error("فشل في تحميل قيم العرض");
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
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setOrdersLoading(false);
    }
  };

  // التحقق مما إذا كانت المادة المحددة تحتوي على كلمة "لوح" أو مشتقاتها
  const isSelectedMaterialBoard = useMemo(() => {
    if (!formData.material_id) return false;
    const selectedMaterial = materials.find(m => String(m.material_id) === String(formData.material_id));
    const materialName = selectedMaterial?.material_name?.toLowerCase() || "";

    // التحقق من الكلمات المختلفة للواح
    const boardKeywords = ["لوح", "ألواح", "board", "boards", "لوحة", "الواح"];
    return boardKeywords.some(keyword => materialName.includes(keyword));
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

  // فلترة الألوان المتاحة مع استبعاد غير المسعرة
  const availablePricedColors = useMemo(() => {
    if (!formData.ruler_id) return [];

    const filteredColors = colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));

    if (!priceColors || priceColors.length === 0) {
      return filteredColors;
    }

    console.log("=== DEBUG PRICING ===");
    console.log("formData:", formData);
    console.log("filteredColors:", filteredColors);
    console.log("priceColors:", priceColors);

    if (isSelectedMaterialBoard) {
      // للمواد اللوحية: تحقق من المسطرة والنوع فقط
      return filteredColors.filter(color =>
        priceColors.some(pc =>
          String(pc.color_id) === String(color.color_id) &&
          pc.type_item === formData.type_item
        )
      );
    }

    if (!formData.width) return [];
    const targetWidth = Number(formData.width);

    const result = filteredColors.filter(color => {
      const hasPricing = priceColors.some(pc =>
        String(pc.color_id) === String(color.color_id) &&
        pc.type_item === formData.type_item &&
        (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
      );

      console.log(`Color ${color.color_name} (${color.color_id}):`, {
        hasPricing,
        colorId: color.color_id,
        typeItem: formData.type_item,
        width: targetWidth,
        matchingPrices: priceColors.filter(pc =>
          String(pc.color_id) === String(color.color_id) &&
          pc.type_item === formData.type_item
        )
      });

      return hasPricing;
    });

    console.log("Final result:", result);
    console.log("=== END DEBUG ===");
    return result;
  }, [formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, colors, priceColors]);

  const filteredColorsBySearch = useMemo(() => {
    if (!colorSearchCode || numpadMode !== "colorSearch") return availablePricedColors;
    return availablePricedColors.filter(c =>
      c.color_code?.toLowerCase().includes(colorSearchCode.toLowerCase())
    );
  }, [colorSearchCode, availablePricedColors, numpadMode]);

  const selectedColorImage = useMemo(() => {
    const color = colors.find(c => String(c.color_id) === String(formData.color_id));
    return color?.imageUrl || color?.image_url || color?.color_image || null;
  }, [formData.color_id, colors]);

  // التحقق مما إذا كان اللون مسعرًا للمسطرة والعرض المحددين
  const isColorPriced = useMemo(() => {
    if (!formData.color_id || !formData.ruler_id) return false;

    if (!priceColors || priceColors.length === 0) {
      return true;
    }

    if (isSelectedMaterialBoard) {
      // للمواد اللوحية: تحقق من المسطرة والنوع فقط
      return priceColors.some(pc =>
        String(pc.color_id) === String(formData.color_id) &&
        pc.type_item === formData.type_item
      );
    }

    if (!formData.width) return false;
    const targetWidth = Number(formData.width);

    return priceColors.some(pc =>
      String(pc.color_id) === String(formData.color_id) &&
      pc.type_item === formData.type_item &&
      (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
    );
  }, [formData.color_id, formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, priceColors]);

  const getColorPricingStatus = (colorId) => {
    if (!priceColors || priceColors.length === 0) return { priced: true, label: "" };

    if (isSelectedMaterialBoard) {
      const isPriced = priceColors.some(pc =>
        String(pc.color_id) === String(colorId) &&
        pc.type_item === formData.type_item
      );
      return { priced: isPriced, label: "" };
    }

    if (!formData.width) return { priced: false, label: " (اختر العرض)" };

    const targetWidth = Number(formData.width);
    const isPriced = priceColors.some(pc =>
      String(pc.color_id) === String(colorId) &&
      pc.type_item === formData.type_item &&
      (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
    );
    return { priced: isPriced, label: "" };
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

    if (field === "material_id") {
      newData.ruler_id = "";
      newData.color_id = "";
      newData.width = "";
    } else if (field === "ruler_id") {
      newData.color_id = "";
    } else if (field === "width") {
      newData.color_id = "";
    } else if (field === "type_item") {
      newData.color_id = "";
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

      const matched = availablePricedColors.find(c => c.color_code === search);
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
      toast.error("يرجى اكمال جميع البيانات");
      return;
    }

    // إذا كانت المادة ليست "لوح" يجب تحديد العرض
    if (!isSelectedMaterialBoard && !formData.width) {
      toast.error("يرجى اختيار العرض");
      return;
    }

    // التحقق من أن اللون مسعر
    if (!isColorPriced) {
      toast.error("اللون المحدد غير مسعر لهذه المواصفات");
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

    // Reset form keeping material and thickness
    setFormData(prev => ({
      material_id: prev.material_id,
      thickness: "0.6",
      type_item: "Machine",
      ruler_id: "",
      color_id: "",
      batch_id: "",
      width: "",
      quantity: "",
      notes: ""
    }));
    setColorSearchCode("");
  };

  const removeItem = (id) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("أضف عنصراً واحداً على الأقل");
      return;
    }

    try {
      setLoading(true);
      const items = orderItems.map(item => ({
        type_item: item.type_item,
        color_id: Number(item.color_id),
        width: Number(item.width) || 0,
        thickness: 0.6,
        batch_id: Number(item.batch_id) || null,
        quantity: Number(item.quantity),
        notes: item.notes
      }));

      await orderApi.createOrder({ status: "pending", items, notes: "" });
      toast.success("تم حفظ الطلب بنجاح");
      setOrderItems([]);
    } catch {
      toast.error("فشل في حفظ الطلب");
    } finally {
      setLoading(false);
    }
  };
  const handleConfirmSave = async () => {
    await saveOrder();
    setShowPreview(false);
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header - ثابت في الأعلى */}
      <div className="relative flex-shrink-0">
        {isHeaderVisible && (
          <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setViewMode("create")}
                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "create"
                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                  : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                  }`}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                طلب جديد
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setViewMode("history")}
                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "history"
                  ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                  : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                  }`}
              >
                <History className="w-5 h-5 ml-2" />
                سجل الطلبات
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/profile")}
                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <User className="w-5 h-5 ml-2" />
                البروفايل
              </Button> */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/customers")}
                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <Users className="w-5 h-5 ml-2" />
                الزبائن
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <Home className="w-5 h-5 ml-2" />
                الرئيسية
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsHeaderVisible(false)}
                className="px-4 py-3 text-base min-w-[60px] touch-manipulation border-2 bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110"
              >
                <EyeOff className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
        {!isHeaderVisible && (
          <div className="absolute top-2 right-2 z-20">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsHeaderVisible(true)}
              className="px-4 py-2 text-base bg-secondary-f text-white border-secondary-f hover:bg-secondary-f shadow-lg touch-manipulation"
            >
              <Eye className="w-5 h-5 ml-2" />
              إظهار الهيدر
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - يأخذ المساحة المتبقية */}
      <div className="flex-1 min-h-0 p-3 overflow-hidden">
        {viewMode === "create" ? (
          /* 
            توزيع الأعمدة بشكل ديناميكي:
            - العمود الأول: 1.2fr (المواد والأرقام)
            - العمود الثاني: 2fr (العناصر الوسطى)
            - العمود الثالث: 1.8fr (الجدول)
          */
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2fr_1.8fr] gap-3 h-full min-h-0">

            {/* العمود الأيمن - أزرار المواد والأرقام */}
            <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
              {/* أزرار المواد - تستخدم Grid ديناميكي */}
              <Card className="flex-shrink-0 p-4">
                <Label className="font-bold text-base mb-3 block">المادة</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr">
                  {materials.map(m => (
                    <button
                      key={m.material_id}
                      onClick={() => handleFieldChange("material_id", m.material_id)}
                      className={`
                                            aspect-square rounded-2xl border-4 text-xl sm:text-2xl font-bold 
                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                            flex items-center justify-center p-2
                                            ${String(formData.material_id) === String(m.material_id)
                          ? "border-primary-f bg-secondary-f text-white shadow-lg"
                          : "border-gray-300 bg-white hover:border-secondary-s"
                        }
                                        `}
                    >
                      {m.material_name}
                    </button>
                  ))}
                </div>
              </Card>

              {/* الأرقام - تأخذ المساحة المتبقية */}
              <Card className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                {/* شاشة العرض الرقمية - مدمجة أكثر */}
                <div className="flex-shrink-0 mb-2">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => {
                        setNumpadMode("colorSearch");
                        setColorSearchCode("");
                      }}
                      className={`
                    flex-1 py-3 px-2 rounded-lg text-sm font-bold border-2 
                    touch-manipulation transition-all active:scale-95
                    ${numpadMode === "colorSearch"
                          ? "bg-secondary-s text-white border-secondary-s"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                        }
                `}
                    >
                      بحث بالكود
                    </button>
                    <button
                      onClick={() => {
                        setNumpadMode("quantity");
                        setActiveField("quantity");
                      }}
                      className={`
                    flex-1 py-3 px-2 rounded-lg text-sm font-bold border-2 
                    touch-manipulation transition-all active:scale-95
                    ${numpadMode === "quantity"
                          ? "bg-primary-f text-white border-primary-f"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                        }
                `}
                    >
                      كتابة الكمية
                    </button>
                  </div>

                  <div className="bg-gray-100 rounded-lg py-2 px-3">
                    <div className="text-xs text-gray-500 mb-0.5">
                      {numpadMode === "colorSearch" ? "كود اللون" :
                        activeField === "quantity" ? "الكمية" :
                          activeField === "width" ? "العرض" : "القيمة"}
                    </div>
                    <div className="text-3xl font-mono font-bold text-gray-800 text-center truncate leading-tight">
                      {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}
                    </div>
                  </div>
                </div>

                {/* أزرار الأرقام - 4 صفوف فقط (بدون مساحة إضافية) */}
                <div className="flex-1 grid grid-rows-4 gap-1.5 min-h-0">
                  {/* الصف 1: 7 8 9 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {["7", "8", "9"].map(key => (
                      <button
                        key={key}
                        onClick={() => handleNumpadPress(key)}
                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* الصف 2: 4 5 6 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {["4", "5", "6"].map(key => (
                      <button
                        key={key}
                        onClick={() => handleNumpadPress(key)}
                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* الصف 3: 1 2 3 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {["1", "2", "3"].map(key => (
                      <button
                        key={key}
                        onClick={() => handleNumpadPress(key)}
                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* الصف 4: . 0 ⌫ مع مسح الكل */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleNumpadPress(".")}
                      className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                    >
                      .
                    </button>
                    <button
                      onClick={() => handleNumpadPress("0")}
                      className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                    >
                      0
                    </button>
                    <button
                      onClick={() => handleNumpadPress("clear")}
                      className="bg-red-100 text-red-700 border-2 border-red-200 rounded-lg text-xl font-bold hover:bg-red-200 active:bg-red-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 w-full h-full"
                    >
                      مسح
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* العمود الأوسط - العناصر الإضافية */}
            <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
              {!isSelectedMaterialBoard && (
                <Card className="flex-shrink-0 p-4 ">
                  {/* <Label className="font-bold text-base mb-3 block">نوع الطلب</Label> */}
                  <div className="grid grid-cols-2  mx-auto gap-4">
                    {TYPE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => handleFieldChange("type_item", t.value)}
                        className={`
                                                w-35 h-35 rounded-2xl border-2 text-2xl sm:text-3xl font-medium
                                                transition-all touch-manipulation
                                                flex items-center justify-center p-2
                                                ${formData.type_item === t.value
                            ? "border-primary-f bg-primary-f text-white shadow-lg"
                            : "border-gray-300 bg-white hover:border-secondary-s"
                          }
                                            `}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {formData.material_id && !isSelectedMaterialBoard && (
                <Card className="flex-shrink-0 p-4">
                  <Label className="font-bold text-base mb-3 block">
                    العرض
                    {loadingWidths && <span className="mr-2 text-gray-500 text-sm">جاري التحميل...</span>}
                  </Label>
                  {widthValues.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
                      {widthValues.map(w => (
                        <button
                          key={w.id}
                          onClick={() => handleFieldChange("width", w.value)}
                          className={`
                                                    aspect-square rounded-2xl border-4 text-xl sm:text-2xl font-medium
                                                    transition-all touch-manipulation hover:scale-105 active:scale-95
                                                    flex items-center justify-center p-2
                                                    ${formData.width === w.value
                              ? "border-secondary-s bg-secondary-s text-white shadow-lg"
                              : "border-gray-300 bg-white hover:border-secondary-s"
                            }
                                                `}
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

              <Card className="flex-shrink-0 p-4">
                <Label className="font-bold text-base mb-3 block">المسطرة</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
                  {availableRulers.length === 0 ? (
                    <span className="text-gray-400 text-base col-span-4 text-center p-4">اختر المادة أولاً</span>
                  ) : (
                    availableRulers.map(r => (
                      <button
                        key={r.ruler_id}
                        onClick={() => handleFieldChange("ruler_id", r.ruler_id)}
                        className={`
                                                aspect-square rounded-2xl border-4 text-xl sm:text-2xl font-medium
                                                transition-all touch-manipulation hover:scale-105 active:scale-95
                                                flex items-center justify-center p-2
                                                ${String(formData.ruler_id) === String(r.ruler_id)
                          ? "border-secondary-s bg-secondary-s text-white shadow-lg"
                          : "border-gray-300 bg-white hover:border-secondary-s"
                          }
                                            `}
                      >
                        {r.ruler_name}
                      </button>
                    ))
                  )}
                </div>
              </Card>

              <Card className="flex-shrink-0 p-4">
                <div className="grid grid-cols-[1fr_140px] gap-4 items-end">
                  <div>
                    <Label className="font-bold text-base mb-3 block">
                      اللون
                      {numpadMode === "colorSearch" && colorSearchCode && (
                        <span className="mr-3 text-secondary-s text-sm">(بحث: {colorSearchCode})</span>
                      )}
                    </Label>
                    <FilterSelect
                      value={formData.color_id}
                      onChange={(e) => handleFieldChange("color_id", e.target.value)}
                      disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}
                      options={filteredColorsBySearch.map(c => {
                        const pricingStatus = getColorPricingStatus(c.color_id);
                        return {
                          value: c.color_id,
                          label: `${c.color_name} (${c.color_code})${pricingStatus.label}`
                        };
                      })}
                      placeholder={
                        !formData.ruler_id
                          ? "اختر المسطرة أولاً"
                          : (!isSelectedMaterialBoard && !formData.width)
                            ? "اختر العرض أولاً"
                            : filteredColorsBySearch.length === 0
                              ? "لا توجد ألوان مسعرة"
                              : "اختر اللون"
                      }
                      className="w-full text-base p-3 min-h-[50px]"
                    />
                  </div>
                  <div>
                    <Label className="font-bold text-base mb-3 block">الصورة</Label>
                    <div className="h-24 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      {selectedColorImage ? (
                        <img src={selectedColorImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-sm">لا توجد</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="flex-shrink-0 p-4">
                <Label className="font-bold text-base mb-3 block">رقم الطبخة</Label>
                <FilterSelect
                  value={formData.batch_id}
                  onChange={(e) => handleFieldChange("batch_id", e.target.value)}
                  disabled={!isSelectedMaterialBoard && !formData.width}
                  options={batches.map(b => ({
                    value: b.batch_id,
                    label: b.batch_number
                  }))}
                  placeholder={
                    (!isSelectedMaterialBoard && !formData.width)
                      ? "اختر العرض أولاً"
                      : "اختر الطبخة"
                  }
                  className="w-full text-base p-3 min-h-[50px]"
                />
              </Card>

              <Card className="flex-shrink-0 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        className={`h-14 text-xl text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""}`}
                        placeholder="0"
                      />
                      <span className="text-lg font-bold text-gray-600 whitespace-nowrap">متر</span>
                    </div>
                  </div>
                  <div>
                    <Label className="font-bold text-base mb-3 block">السماكة</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={formData.thickness}
                        className="h-14 text-lg text-center font-bold flex-1 bg-gray-100"
                        placeholder="0.6"
                        step="0.1"
                        readOnly
                      />
                      <span className="text-lg font-bold text-gray-600 whitespace-nowrap">مم</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="flex-shrink-0 p-4">
                <Label className="font-bold text-base mb-3 block">الملاحظات</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="ملاحظات إضافية..."
                  className="h-14 text-base"
                />
              </Card>

              <Button
                onClick={addItem}
                size="lg"
                className="h-14 bg-primary-f hover:bg-secondary-f flex-shrink-0 text-lg font-bold text-white touch-manipulation active:scale-95 transition-transform"
                disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}
              >
                <Plus className="w-6 h-6 ml-2" />
                إضافة للطلب
              </Button>
            </div>

            {/* العمود الأيسر - الجدول */}
            <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
              {showPreview && orderItems.length > 0 && (
                <StyledDialog
                  isOpen={showPreview}
                  onOpenChange={setShowPreview}
                  title="تفاصيل الطلب قبل الحفظ"
                  onCancel={() => setShowPreview(false)}
                  onConfirm={handleConfirmSave}
                  confirmLabel="تأكيد الحفظ"
                  cancelLabel="إلغاء"
                  confirmVariant="default"
                  isLoading={loading}
                >
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">عدد العناصر: <span className="font-bold">{orderItems.length}</span></div>
                    <div className="bg-gray-50 rounded-lg p-2">إجمالي الكمية: <span className="font-bold">{totalPreviewQuantity}</span></div>
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-right border-b break-words">المادة</th>
                          <th className="p-2 text-right border-b break-words">المسطرة</th>
                          <th className="p-2 text-right border-b break-words">اللون</th>
                          <th className="p-2 text-center border-b break-words">الأبعاد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map(item => (
                          <tr key={item.id} className="border-b">
                            <td className="p-2 break-words">{item.material_name}</td>
                            <td className="p-2 break-words">{item.ruler_name}</td>
                            <td className="p-2 break-words">{item.color_name}</td>
                            <td className="p-2 text-center break-words">
                              {(item.width || "-")}x{(item.thickness || "0.6")}x{(item.quantity || "-")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </StyledDialog>
              )}
              <Card className="flex flex-col h-full min-h-0 overflow-hidden">
                {/* رأس الجدول - ثابت */}
                <div className="flex justify-between items-center p-3 border-b bg-gray-50 flex-shrink-0">
                  <span className="font-bold text-base">العناصر المضافة: {orderItems.length}</span>
                  <Button
                    size="lg"
                    onClick={() => setShowPreview(true)}
                    disabled={loading || orderItems.length === 0}
                    className="h-12 bg-secondary-s hover:brightness-110 text-base px-6 text-white touch-manipulation active:scale-95 transition-transform"
                  >
                    <Check className="w-5 h-5 ml-2" />
                    حفظ الطلب
                  </Button>
                </div>

                {/* الجدول مع التمرير العمودي فقط */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                  <table className="w-full table-fixed border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-1 text-sm text-right border-b break-words">المادة</th>
                        <th className="p-1 text-sm text-right border-b break-words">المسطرة</th>
                        <th className="p-1 text-sm text-right border-b break-words">اللون</th>
                        <th className="p-1 text-sm text-right border-b break-words">النوع</th>
                        <th className="p-1 text-sm text-right border-b break-words">العرض</th>
                        <th className="p-1 text-sm text-right border-b break-words">السماكة</th>
                        <th className="p-1 text-sm text-right border-b break-words">الكمية</th>
                        <th className="p-1 text-sm text-right border-b break-words">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 break-words">{item.material_name}</td>
                          <td className="p-3 break-words">{item.ruler_name}</td>
                          <td className="p-3 break-words">{item.color_name}</td>
                          <td className="p-3 text-center break-words">
                            {item.type_item === "Machine" ? "مكنة" : "كوي"}
                          </td>
                          <td className="p-3 text-center break-words">{item.width || "-"}</td>
                          <td className="p-3 text-center break-words">{item.thickness || "0.6"}</td>
                          <td className="p-3 text-center font-bold break-words">{item.quantity} م</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg touch-manipulation active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orderItems.length === 0 && (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-gray-400 text-base">
                            لا توجد عناصر مضافة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* وضع السجل */
          <Card className="flex flex-col h-full min-h-0 overflow-hidden p-4">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 className="font-bold text-xl">سجل الطلبات</h2>
              <Button
                size="lg"
                variant="outline"
                onClick={loadOrders}
                disabled={ordersLoading}
                className="px-6 py-3 text-base bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110 touch-manipulation active:scale-95 transition-transform"
              >
                <RotateCcw className="w-5 h-5 ml-2" />
                تحديث
              </Button>
            </div>

            {/* جدول السجل مع التمرير العمودي فقط */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 border rounded-lg bg-white">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-right border-b break-words">#</th>
                    <th className="p-3 text-right border-b break-words">التاريخ</th>
                    <th className="p-3 text-center border-b break-words">عدد العناصر</th>
                    <th className="p-3 text-center border-b break-words">الإجمالي</th>
                    <th className="p-3 text-center border-b break-words">المبيعات</th>
                    <th className="p-3 text-center border-b break-words">الزبون</th>
                    <th className="p-3 text-center border-b break-words">ملاحظات</th>
                    <th className="p-3 text-center border-b break-words">الحالة</th>
                    <th className="p-3 text-center border-b break-words">عرض</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr><td colSpan="9" className="p-6"><LoadingState /></td></tr>
                  ) : orders.map(order => (
                    <tr key={order.order_id} className="border-b hover:bg-gray-50">
                      <td className="p-3 break-words">{order.order_id}</td>
                      <td className="p-3 break-words">{order.created_at?.split("T")[0]}</td>
                      <td className="p-3 text-center break-words">{order.count_items ?? order.items?.length ?? 0}</td>
                      <td className="p-3 text-center break-words">{order.total_amount ?? "-"}</td>
                      <td className="p-3 text-center break-words">{order.sales?.full_name || order.sales?.username || "-"}</td>
                      <td className="p-3 text-center break-words">{order.customer?.name || "-"}</td>
                      <td className="p-3 text-center break-words">{order.notes || "-"}</td>
                      <td className="p-3 text-center break-words">
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-10 px-3 touch-manipulation active:scale-95 transition-transform"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder && (
              <StyledDialog
                isOpen={Boolean(selectedOrder)}
                onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}
                title={`تفاصيل الطلب #${selectedOrder.order_id}`}
                onCancel={() => setSelectedOrder(null)}
                cancelLabel="إغلاق"
                showFooter={false}
              >
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div className="bg-white p-2 rounded-lg border">الحالة: {getStatusLabel(selectedOrder.status)}</div>
                  <div className="bg-white p-2 rounded-lg border">الإجمالي: {selectedOrder.total_amount || "-"}</div>
                  <div className="bg-white p-2 rounded-lg border">عدد العناصر: {selectedOrder.count_items ?? selectedOrder.items?.length ?? 0}</div>
                  <div className="bg-white p-2 rounded-lg border">المبيعات: {selectedOrder.sales?.full_name || selectedOrder.sales?.username || "-"}</div>
                  <div className="bg-white p-2 rounded-lg border">الزبون: {selectedOrder.customer?.name || "-"}</div>
                  <div className="bg-white p-2 rounded-lg border">ملاحظات: {selectedOrder.notes || "-"}</div>
                </div>
                {selectedOrder.items?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-base">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="bg-white p-2 rounded-lg border whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.type_item === "Machine" ? "مكنة" : "كوي"} | {item.width || "-"} | {item.quantity} م
                      </div>
                    ))}
                  </div>
                )}
              </StyledDialog>
            )}
          </Card>
        )}
      </div>
    </div>
  );

  // return (
  //     <div className="h-screen flex flex-col">
  //         <div className="relative">
  //             {isHeaderVisible && (
  //                 <div className="flex flex-wrap items-center justify-between border-b-2 border-secondary-f gap-3 px-3 py-2">
  //                     <div className="flex flex-wrap gap-3">
  //                         <Button
  //                             size="lg"
  //                             variant={viewMode === "create" ? "default" : "outline"}
  //                             onClick={() => setViewMode("create")}
  //                             className="px-6 py-3 text-base"
  //                         >
  //                             <ShoppingCart className="w-5 h-5 ml-2" />
  //                             طلب جديد
  //                         </Button>
  //                         <Button
  //                             size="lg"
  //                             variant={viewMode === "history" ? "default" : "outline"}
  //                             onClick={() => setViewMode("history")}
  //                             className="px-6 py-3 text-base"
  //                         >
  //                             <History className="w-5 h-5 ml-2" />
  //                             سجل الطلبات
  //                         </Button>
  //                     </div>
  //                     <div className="flex flex-wrap gap-2">
  //                         <Button
  //                             size="lg"
  //                             variant="outline"
  //                             onClick={() => navigate("/profile")}
  //                             className="px-5 py-3 text-base"
  //                         >
  //                             <User className="w-5 h-5 ml-2" />
  //                             البروفايل
  //                         </Button>
  //                         <Button
  //                             size="lg"
  //                             variant="outline"
  //                             onClick={() => navigate("/customers")}
  //                             className="px-5 py-3 text-base"
  //                         >
  //                             <Users className="w-5 h-5 ml-2" />
  //                             الزبائن
  //                         </Button>
  //                         <Button
  //                             size="lg"
  //                             variant="outline"
  //                             onClick={() => navigate("/login")}
  //                             className="px-5 py-3 text-base"
  //                         >
  //                             <LogIn className="w-5 h-5 ml-2" />
  //                             تسجيل الدخول
  //                         </Button>
  //                         <Button
  //                             size="lg"
  //                             variant="outline"
  //                             onClick={() => setIsHeaderVisible(false)}
  //                             className="px-4 py-3 text-base"
  //                         >
  //                             <EyeOff className="w-5 h-5 ml-2" />

  //                         </Button>
  //                     </div>
  //                 </div>
  //             )}
  //             {!isHeaderVisible && (
  //                 <div className="absolute top-2 right-2 z-20">
  //                     <Button
  //                         size="lg"
  //                         variant="outline"
  //                         onClick={() => setIsHeaderVisible(true)}
  //                         className="px-4 py-2 text-base bg-white"
  //                     >
  //                         <Eye className="w-5 h-5 ml-2" />

  //                     </Button>
  //                 </div>
  //             )}
  //         </div>

  //         <div className="flex-1 min-h-0 p-3">
  //             {error && <MessageAlert type="error" message={error} onDismiss={() => toast.error("")} dismissable />}
  //             {success && <MessageAlert type="success" message={success} onDismiss={() => toast.success("")} dismissable />}

  //             {viewMode === "create" ? (
  //                 <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_2fr_1.5fr] gap-3 h-full min-h-0">

  //                     <div className="right flex flex-col gap-3 min-h-0">
  //                         <Card className="r-top p-4 shrink-0">
  //                             <Label className="font-bold text-base mb-3 block">المادة</Label>
  //                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
  //                                 {materials.map(m => (
  //                                     <button
  //                                         key={m.material_id}
  //                                         onClick={() => handleFieldChange("material_id", m.material_id)}
  //                                         className={`w-24 h-24 sm:w-28 sm:h-28 xl:w-30 xl:h-30 rounded-2xl border-4 text-xl sm:text-2xl font-bold transition-all touch-manipulation ${String(formData.material_id) === String(m.material_id)
  //                                             ? "border-primary-f bg-secondary-f text-white shadow-lg"
  //                                             : "border-gray-300 bg-white hover:border-blue-400 active:bg-gray-100"
  //                                             }`}
  //                                     >
  //                                         {m.material_name}
  //                                     </button>
  //                                 ))}
  //                             </div>
  //                         </Card>

  //                         <Card className="r-bottom h-full flex flex-col p-4 overflow-hidden">
  //                             <div className="text-center mb-4 shrink-0">
  //                                 <div className="flex gap-3 mb-4">
  //                                     <button
  //                                         onClick={() => {
  //                                             setNumpadMode("colorSearch");
  //                                             setColorSearchCode("");
  //                                         }}
  //                                         className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold border-2 touch-manipulation ${numpadMode === "colorSearch" ? "bg-purple-600 text-white border-purple-600" : "bg-white border-gray-300"
  //                                             }`}
  //                                     >
  //                                         بحث بالكود
  //                                     </button>
  //                                     <button
  //                                         onClick={() => {
  //                                             setNumpadMode("quantity");
  //                                             setActiveField("quantity");
  //                                         }}
  //                                         className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold border-2 touch-manipulation ${numpadMode === "quantity" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
  //                                             }`}
  //                                     >
  //                                         كتابة الكمية
  //                                     </button>
  //                                 </div>

  //                                 <div className="bg-gray-100 rounded-xl flex justify-center items-center ">
  //                                     <div className="text-base text-gray-500 mb-2">
  //                                         {numpadMode === "colorSearch" ? "كود اللون" :
  //                                             activeField === "quantity" ? "الكمية" :
  //                                                 activeField === "width" ? "العرض" : "القيمة"}
  //                                     </div>
  //                                     <div className="text-4xl font-mono font-bold text-gray-800">
  //                                         {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}
  //                                     </div>
  //                                 </div>
  //                             </div>

  //                             <div className="grid grid-cols-3 gap-3  flex-1 overflow-hidden mx-auto  w-full -mt-8">
  //                                 {["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "back"].map(key => (
  //                                     <button
  //                                         key={key}
  //                                         onClick={() => handleNumpadPress(key)}
  //                                         className="bg-white border-2 border-gray-300 min-w-[80%]  min-h-[80%] m-5 rounded-xl text-3xl font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center aspect-square touch-manipulation"
  //                                     >
  //                                         {key === "back" ? "مسح" : key}
  //                                     </button>
  //                                 ))}
  //                                 <button
  //                                     onClick={() => handleNumpadPress("clear")}
  //                                     className="col-span-3 h-16 bg-red-100 text-red-700 rounded-xl mt-5 text-xl font-bold hover:bg-red-200 transition-colors touch-manipulation"
  //                                 >
  //                                     مسح الكل
  //                                 </button>
  //                             </div>

  //                             {/* {numpadMode === "quantity" && (
  //                                 <div className="mt-4 grid grid-cols-2 gap-3 shrink-0">
  //                                     <button
  //                                         onClick={() => setActiveField("width")}
  //                                         className={`py-4 rounded-xl border-2 text-lg font-bold touch-manipulation ${activeField === "width" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
  //                                             }`}
  //                                     >
  //                                         العرض
  //                                     </button>
  //                                     <button
  //                                         onClick={() => setActiveField("quantity")}
  //                                         className={`py-4 rounded-xl border-2 text-lg font-bold touch-manipulation ${activeField === "quantity" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"
  //                                             }`}
  //                                     >
  //                                         الكمية
  //                                     </button>
  //                                 </div>
  //                             )} */}
  //                         </Card>
  //                     </div>

  //                     <div className="center flex flex-col gap-3 min-h-0 overflow-y-auto">
  //                         {!isSelectedMaterialBoard && (
  //                             <Card className="p-4 shrink-0">
  //                                 <Label className="font-bold text-base mb-3 block">نوع الطلب</Label>
  //                                 <div className="grid grid-cols-2 gap-3 justify-items-center">
  //                                     {TYPE_OPTIONS.map(t => (
  //                                         <button
  //                                             key={t.value}
  //                                             onClick={() => handleFieldChange("type_item", t.value)}
  //                                             className={`w-24 h-24 sm:w-28 sm:h-28 xl:w-30 xl:h-30 rounded-2xl border-2 text-2xl sm:text-3xl font-medium transition-all touch-manipulation ${formData.type_item === t.value
  //                                                 ? "border-primary-f bg-primary-f text-white shadow-lg"
  //                                                 : "border-gray-300 bg-white hover:border-green-400 active:bg-gray-100"
  //                                                 }`}
  //                                         >
  //                                             {t.label}
  //                                         </button>
  //                                     ))}
  //                                 </div>
  //                             </Card>
  //                         )}

  //                         {formData.material_id && !isSelectedMaterialBoard && (
  //                             <Card className="p-4 shrink-0">
  //                                 <Label className="font-bold text-base mb-3 block">
  //                                     العرض (سم)
  //                                     {loadingWidths && <span className="mr-2 text-gray-500 text-sm">جاري التحميل...</span>}
  //                                 </Label>
  //                                 {widthValues.length > 0 ? (
  //                                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center">
  //                                         {widthValues.map(w => (
  //                                             <button
  //                                                 key={w.id}
  //                                                 onClick={() => handleFieldChange("width", w.value)}
  //                                                 className={`w-24 h-24 sm:w-28 sm:h-28 xl:w-30 xl:h-30 rounded-2xl border-2 text-xl sm:text-2xl font-medium transition-all touch-manipulation ${formData.width === w.value
  //                                                     ? "border-teal-600 bg-teal-600 text-white shadow-lg"
  //                                                     : "border-gray-300 bg-white hover:border-teal-400 active:bg-gray-100"
  //                                                     }`}
  //                                             >
  //                                                 {w.value}
  //                                             </button>
  //                                         ))}
  //                                     </div>
  //                                 ) : (
  //                                     !loadingWidths && (
  //                                         <div className="text-center p-4 text-gray-400 text-base border-2 border-dashed border-gray-300 rounded-xl">
  //                                             لا توجد قيم عرض لهذه المادة
  //                                         </div>
  //                                     )
  //                                 )}
  //                             </Card>
  //                         )}

  //                         <Card className="p-4 shrink-0">
  //                             <Label className="font-bold text-base mb-3 block">المسطرة</Label>
  //                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center">
  //                                 {availableRulers.length === 0 ? (
  //                                     <span className="text-gray-400 text-base col-span-3 text-center p-4">اختر المادة أولاً</span>
  //                                 ) : (
  //                                     availableRulers.map(r => (
  //                                         <button
  //                                             key={r.ruler_id}
  //                                             onClick={() => handleFieldChange("ruler_id", r.ruler_id)}
  //                                             className={`w-24 h-24 sm:w-28 sm:h-28 xl:w-30 xl:h-30 rounded-2xl border-2 text-xl sm:text-2xl font-medium transition-all touch-manipulation ${String(formData.ruler_id) === String(r.ruler_id)
  //                                                 ? "border-purple-600 bg-purple-600 text-white shadow-lg"
  //                                                 : "border-gray-300 bg-white hover:border-purple-400 active:bg-gray-100"
  //                                                 }`}
  //                                         >
  //                                             {r.ruler_name}
  //                                         </button>
  //                                     ))
  //                                 )}
  //                             </div>
  //                         </Card>

  //                         <Card className="p-4 shrink-0">
  //                             <div className="grid grid-cols-[1fr_140px] gap-4 items-end">
  //                                 <div>
  //                                     <Label className="font-bold text-base mb-3 block">
  //                                         اللون
  //                                         {numpadMode === "colorSearch" && colorSearchCode && (
  //                                             <span className="mr-3 text-blue-600 text-sm">(بحث: {colorSearchCode})</span>
  //                                         )}
  //                                     </Label>
  //                                     <FilterSelect
  //                                         value={formData.color_id}
  //                                         onChange={(e) => handleFieldChange("color_id", e.target.value)}
  //                                         disabled={!formData.ruler_id}
  //                                         options={filteredColorsBySearch.map(c => ({
  //                                             value: c.color_id,
  //                                             label: `${c.color_name} (${c.color_code})`
  //                                         }))}
  //                                         placeholder={formData.ruler_id ? "اختر اللون" : "اختر المسطرة أولاً"}
  //                                         className="w-full text-base p-3"
  //                                     />
  //                                 </div>
  //                                 <div>
  //                                     <Label className="font-bold text-base mb-3 block">الصورة</Label>
  //                                     <div className="h-24 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
  //                                         {selectedColorImage ? (
  //                                             <img src={selectedColorImage} alt="" className="h-full w-full object-cover" />
  //                                         ) : (
  //                                             <span className="text-gray-400 text-sm">لا توجد</span>
  //                                         )}
  //                                     </div>
  //                                 </div>
  //                             </div>
  //                         </Card>

  //                         <Card className="p-4 shrink-0">
  //                             <Label className="font-bold text-base mb-3 block">رقم الطبخة</Label>
  //                             <FilterSelect
  //                                 value={formData.batch_id}
  //                                 onChange={(e) => handleFieldChange("batch_id", e.target.value)}
  //                                 options={batches.map(b => ({
  //                                     value: b.batch_id,
  //                                     label: b.batch_number
  //                                 }))}
  //                                 placeholder="اختر الطبخة"
  //                                 className="w-full text-base p-3"
  //                             />
  //                         </Card>

  //                         <Card className="p-4 shrink-0">
  //                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  //                                 <div>
  //                                     <Label className="font-bold text-base mb-3 block">الكمية</Label>
  //                                     <div className="flex items-center gap-3">
  //                                         <Input
  //                                             type="number"
  //                                             value={formData.quantity}
  //                                             onChange={(e) => handleFieldChange("quantity", e.target.value)}
  //                                             onClick={() => {
  //                                                 setActiveField("quantity");
  //                                                 setNumpadMode("quantity");
  //                                             }}
  //                                             className={`h-16 text-xl text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""}`}
  //                                             placeholder="0"
  //                                         />
  //                                         <span className="text-lg font-bold text-gray-600 w-16">قطعة/متر</span>
  //                                     </div>
  //                                 </div>
  //                                 <div>
  //                                     <Label className="font-bold text-base mb-3 block">الملاحظات</Label>
  //                                     <Input
  //                                         value={formData.notes}
  //                                         onChange={(e) => handleFieldChange("notes", e.target.value)}
  //                                         placeholder="أي ملاحظات إضافية..."
  //                                         className="h-16 text-base"
  //                                     />
  //                                 </div>
  //                             </div>
  //                         </Card>

  //                         <Button
  //                             onClick={addItem}
  //                             size="lg"
  //                             className="h-16 bg-blue-600 hover:bg-blue-700 shrink-0 text-lg font-bold"
  //                             disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}
  //                         >
  //                             <Plus className="w-6 h-6 ml-2" />
  //                             إضافة للطلب
  //                         </Button>
  //                     </div>



  //                     <div className="left flex flex-col gap-3 min-h-0">
  //                         <Card className="l-top flex flex-col min-h-0 overflow-hidden">
  //                             <div className="flex justify-between items-center p-3 border-b bg-gray-50 shrink-0">
  //                                 <span className="font-bold text-base">العناصر المضافة: {orderItems.length}</span>
  //                                 <Button
  //                                     size="lg"
  //                                     onClick={saveOrder}
  //                                     disabled={loading || orderItems.length === 0}
  //                                     className="h-12 bg-green-600 hover:bg-green-700 text-base px-6"
  //                                 >
  //                                     <Check className="w-5 h-5 ml-2" />
  //                                     حفظ الطلب
  //                                 </Button>
  //                             </div>

  //                             <div className="flex-1 overflow-auto">
  //                                 <table className="w-full text-base">
  //                                     <thead className="bg-gray-100 sticky top-0 z-10">
  //                                         <tr>
  //                                             <th className="p-3 text-right border-b">المادة</th>
  //                                             <th className="p-3 text-right border-b">المسطرة</th>
  //                                             <th className="p-3 text-right border-b">اللون</th>
  //                                             <th className="p-3 text-center border-b">النوع</th>
  //                                             <th className="p-3 text-center border-b">العرض</th>
  //                                             <th className="p-3 text-center border-b">الكمية</th>
  //                                             <th className="p-3 text-center border-b">حذف</th>
  //                                         </tr>
  //                                     </thead>
  //                                     <tbody>
  //                                         {orderItems.map(item => (
  //                                             <tr key={item.id} className="border-b hover:bg-gray-50">
  //                                                 <td className="p-3">{item.material_name}</td>
  //                                                 <td className="p-3">{item.ruler_name}</td>
  //                                                 <td className="p-3">{item.color_name}</td>
  //                                                 <td className="p-3 text-center">{item.type_item === "Machine" ? "مكنة" : "كوي"}</td>
  //                                                 <td className="p-3 text-center">{item.width || "-"}</td>
  //                                                 <td className="p-3 text-center font-bold">{item.quantity} م</td>
  //                                                 <td className="p-3 text-center">
  //                                                     <button
  //                                                         onClick={() => removeItem(item.id)}
  //                                                         className="text-red-600 hover:bg-red-50 p-3 rounded-lg touch-manipulation"
  //                                                     >
  //                                                         <Trash2 className="w-5 h-5" />
  //                                                     </button>
  //                                                 </td>
  //                                             </tr>
  //                                         ))}
  //                                         {orderItems.length === 0 && (
  //                                             <tr>
  //                                                 <td colSpan="7" className="p-6 text-center text-gray-400 text-base">لا توجد عناصر مضافة</td>
  //                                             </tr>
  //                                         )}
  //                                     </tbody>
  //                                 </table>
  //                             </div>
  //                         </Card>

  //                         <Card className="l-bottom p-4">
  //                             <div className="text-gray-500 text-sm">مساحة إضافية</div>
  //                         </Card>
  //                     </div>
  //                 </div>
  //             ) : (
  //                 <Card className="flex-1 p-4 overflow-hidden flex flex-col">
  //                     <div className="flex justify-between items-center mb-3 shrink-0">
  //                         <h2 className="font-bold text-xl">سجل الطلبات</h2>
  //                         <Button size="lg" variant="outline" onClick={loadOrders} disabled={ordersLoading} className="px-6 py-3 text-base">
  //                             <RotateCcw className="w-5 h-5 ml-2" />
  //                             تحديث
  //                         </Button>
  //                     </div>

  //                     <div className="flex-1 border rounded-lg overflow-auto bg-white">
  //                         <table className="w-full text-base">
  //                             <thead className="bg-gray-100 sticky top-0">
  //                                 <tr>
  //                                     <th className="p-3 text-right border-b">#</th>
  //                                     <th className="p-3 text-right border-b">التاريخ</th>
  //                                     <th className="p-3 text-center border-b">العناصر</th>
  //                                     <th className="p-3 text-center border-b">حالة</th>
  //                                     <th className="p-3 text-center border-b">عرض</th>
  //                                 </tr>
  //                             </thead>
  //                             <tbody>
  //                                 {ordersLoading ? (
  //                                     <tr><td colSpan="5" className="p-6"><LoadingState /></td></tr>
  //                                 ) : orders.map(order => (
  //                                     <tr key={order.order_id} className="border-b hover:bg-gray-50">
  //                                         <td className="p-3">{order.order_id}</td>
  //                                         <td className="p-3">{order.created_at?.split("T")[0]}</td>
  //                                         <td className="p-3 text-center">{order.items?.length || 0}</td>
  //                                         <td className="p-3 text-center">
  //                                             <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">{order.status || "معلق"}</span>
  //                                         </td>
  //                                         <td className="p-3 text-center">
  //                                             <Button size="lg" variant="outline" className="h-12 px-4" onClick={() => setSelectedOrder(order)}>
  //                                                 <Eye className="w-5 h-5" />
  //                                             </Button>
  //                                         </td>
  //                                     </tr>
  //                                 ))}
  //                             </tbody>
  //                         </table>
  //                     </div>

  //                     {selectedOrder && (
  //                         <div className="mt-3 p-3 bg-gray-50 rounded-lg border shrink-0">
  //                             <div className="flex justify-between items-center mb-2">
  //                                 <span className="font-bold text-base">طلب #{selectedOrder.order_id}</span>
  //                                 <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700 p-2 text-xl">x</button>
  //                             </div>
  //                             <div className="grid grid-cols-2 gap-2 text-base">
  //                                 {selectedOrder.items?.map((item, i) => (
  //                                     <div key={i} className="bg-white p-2 rounded-lg border">
  //                                         {item.type_item === "Machine" ? "مكنة" : "كوي"} |
  //                                         {item.width || "-"} |
  //                                         {item.quantity} م
  //                                     </div>
  //                                 ))}
  //                             </div>
  //                         </div>
  //                     )}
  //                 </Card>
  //             )}
  //         </div>
  //     </div>
  // );
}
