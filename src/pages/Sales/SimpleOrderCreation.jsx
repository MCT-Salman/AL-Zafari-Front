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
    Check,
    Divide
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
        return selectedMaterial?.material_name?.includes("لوح", "ألواح") || false;
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
        <div className="h-screen">
            {/* Header */}
            <div className="flex justify-center items-center border-b-2 border-secondary-f gap-3  h-17">
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


            <div className="flex-col relative h-[calc(100%-4.25rem)]">
                <div className="grid grid-cols-4 text-center">
                    <div className="right grid grid-rows-6 absolute right-0 top-0 bottom-0 w-[20%]">
                        <div className="r-top  border-b-2 row-span-1 justify-center border-secondary-f">
                            {/* المواد - أزرار كبيرة مناسبة للمس */}
                            <div className="p-4 shrink-0">
                                {/* <Label className="font-bold text-base mb-3 block">المادة</Label> */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {materials.map(m => (
                                        <button
                                            key={m.material_id}
                                            onClick={() => handleFieldChange("material_id", m.material_id)}
                                            className={`p-4 rounded-xl border-4 border-secondary-f w-30 h-30 text-2xl font-bold transition-all touch-manipulation ${String(formData.material_id) === String(m.material_id)
                                                ? "border-primary-f bg-secondary-f text-white shadow-lg"
                                                : "border-gray-300 bg-white hover:border-blue-400 active:bg-gray-100"
                                                }`}
                                        >
                                            {m.material_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="r-bottom row-span-5">r-bottom</div>
                    </div>
                    <div className="center border-l-2 border-r-2 border-secondary-f absolute left-[30%] right-[20%] top-0 bottom-0 ">
                        {/* نوع الطلب - يختفي إذا كانت المادة "لوح" */}
                        {!isSelectedMaterialBoard && (
                            <div className="p-4 shrink-0">
                                <div className="flex gap-3">
                                    {TYPE_OPTIONS.map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => handleFieldChange("type_item", t.value)}
                                            className={`flex-1 p-4 rounded-xl border-2 w-30 h-30 text-3xl font-medium transition-all touch-manipulation ${formData.type_item === t.value
                                                ? "border-primary-f bg-primary-f text-white shadow-lg"
                                                : "border-gray-300 bg-white hover:border-green-400 active:bg-gray-100"
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="min-w-[90%] min-h-0.6 !m-auto rounded-2xl bg-gray-300 shadow-2xl" ></div>
                    </div>
                    <div className="left grid grid-rows-2 w-[30%] absolute left-0 top-0 bottom-0">
                        <div className="l-top border-b-2 border-secondary-f">l-top</div>
                        <div className="l-bottom ">l-bottom</div>
                    </div>
                </div>
            </div>
        </div>
    );
}