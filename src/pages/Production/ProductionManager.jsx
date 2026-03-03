// src/pages/Production/ProductionManager.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { productionApi } from "../../api/productionApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
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
    EyeOff,
    Home,
    X,
    AlertCircle,
    Edit,
    Save,
    ChevronLeft,
    ChevronRight,
    Package,
    Settings,
    Wrench,
    Scissors,
    Droplet,
    Layers
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, ProductionType, ProductionStatus, MovementDestination, ProcessSource } from "../../types/enums";

export default function ProductionManager() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("create");
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const tableContainerRef = useRef(null);

    // Data
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [productionOrders, setProductionOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Production Types
    const PRODUCTION_TYPES = [
        { value: ProductionType.warehouse, label: "مستودع", icon: Package },
        { value: ProductionType.slitting, label: "تقطيع", icon: Scissors },
        { value: ProductionType.cutting, label: "قص", icon: Scissors },
        { value: ProductionType.gluing, label: "تغرية", icon: Droplet },
        { value: ProductionType.orderproduction, label: "إنتاج", icon: Settings }
    ];

    const TYPE_ITEM_OPTIONS = [
        { value: TypeItem.Machine, label: "مكنة" },
        { value: TypeItem.Presser, label: "كوي" }
    ];

    const STATUS_OPTIONS = [
        { value: ProductionStatus.pending, label: "قيد الانتظار" },
        { value: ProductionStatus.preparing, label: "قيد التحضير" },
        { value: ProductionStatus.completed, label: "مكتمل" },
        { value: ProductionStatus.canceled, label: "ملغي" }
    ];

    // Form State for Production Order
    const [formData, setFormData] = useState({
        color_id: "",
        batch_id: "",
        type_item: TypeItem.Machine,
        thickness: "0.6",
        notes: "",
        status: ProductionStatus.pending
    });

    // Production Items State
    const [productionItems, setProductionItems] = useState([]);

    // Current Item Form
    const [currentItem, setCurrentItem] = useState({
        width: "",
        length: "",
        production_types: [ProductionType.warehouse] // افتراضي
    });

    // Load initial data
    useEffect(() => {
        loadInitialData();
        if (viewMode === "history") loadProductionOrders();
    }, [viewMode]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [colorRes, batchRes, materialRes, rulerRes] = await Promise.all([
                colorApi.getColors(),
                batchApi.getBatches(),
                materialApi.getMaterials(),
                rulerApi.getRulers()
            ]);

            setColors(getApiData(colorRes, []) || []);
            setBatches(getApiData(batchRes, []) || []);
            setMaterials(getApiData(materialRes, []) || []);
            setRulers(getApiData(rulerRes, []) || []);

        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const loadProductionOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await productionApi.getProductionOrders();
            setProductionOrders(getApiData(response.data?.orders || response, []) || []);
        } catch (error) {
            console.error("Error loading production orders:", error);
            toast.error("فشل في تحميل طلبات الإنتاج");
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadOrderItems = async (orderId) => {
        try {
            const response = await productionApi.getProductionOrderItems(orderId);
            setSelectedOrderItems(getApiData(response.data || response, []) || []);
        } catch (error) {
            console.error("Error loading order items:", error);
            toast.error("فشل في تحميل عناصر الطلب");
        }
    };

    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        await loadOrderItems(order.production_order_id);
        setShowOrderDetails(true);
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemFieldChange = (field, value) => {
        setCurrentItem(prev => ({ ...prev, [field]: value }));
    };

    const handleProductionTypeToggle = (type) => {
        setCurrentItem(prev => {
            const types = prev.production_types || [];
            if (types.includes(type)) {
                return { ...prev, production_types: types.filter(t => t !== type) };
            } else {
                return { ...prev, production_types: [...types, type] };
            }
        });
    };

    const addProductionItem = () => {
        if (!currentItem.width || !currentItem.length) {
            toast.error("يرجى إدخال العرض والطول");
            return;
        }

        if (!currentItem.production_types || currentItem.production_types.length === 0) {
            toast.error("يرجى اختيار نوع إنتاج واحد على الأقل");
            return;
        }

        const newItem = {
            id: Date.now(),
            width: currentItem.width,
            length: currentItem.length,
            production_types: currentItem.production_types
        };

        if (editingItemId) {
            setProductionItems(prev => prev.map(item => 
                item.id === editingItemId ? { ...newItem, id: item.id } : item
            ));
            toast.success("تم تحديث العنصر بنجاح");
            setEditingItemId(null);
        } else {
            setProductionItems(prev => [...prev, newItem]);
            toast.success("تم إضافة العنصر بنجاح");
        }

        // Reset current item
        setCurrentItem({
            width: "",
            length: "",
            production_types: [ProductionType.warehouse]
        });
    };

    const handleEditItem = (item) => {
        setCurrentItem({
            width: item.width,
            length: item.length,
            production_types: item.production_types
        });
        setEditingItemId(item.id);
    };

    const removeItem = (id) => {
        if (editingItemId === id) {
            setEditingItemId(null);
            setCurrentItem({
                width: "",
                length: "",
                production_types: [ProductionType.warehouse]
            });
        }
        setProductionItems(prev => prev.filter(item => item.id !== id));
        toast.success("تم حذف العنصر");
    };

    const clearAllItems = () => {
        if (productionItems.length > 0) {
            setProductionItems([]);
            setEditingItemId(null);
            setCurrentItem({
                width: "",
                length: "",
                production_types: [ProductionType.warehouse]
            });
            toast.success("تم مسح جميع العناصر");
        }
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setCurrentItem({
            width: "",
            length: "",
            production_types: [ProductionType.warehouse]
        });
    };

    const saveProductionOrder = async () => {
        if (productionItems.length === 0) {
            toast.error("أضف عنصراً واحداً على الأقل");
            return;
        }

        if (!formData.color_id || !formData.batch_id) {
            toast.error("يرجى اختيار اللون ورقم الطبخة");
            return;
        }

        try {
            setLoading(true);

            // تحضير items حسب الصيغة المطلوبة
            const items = productionItems.map(item => ({
                production_types: item.production_types,
                width: Number(item.width),
                length: Number(item.length)
            }));

            const orderData = {
                color_id: Number(formData.color_id),
                batch_id: Number(formData.batch_id),
                type_item: formData.type_item,
                thickness: Number(formData.thickness),
                notes: formData.notes || "",
                status: formData.status || ProductionStatus.pending,
                items: items
            };

            console.log("Saving production order:", orderData);

            if (editingOrderId) {
                // تحديث طلب موجود
                await productionApi.updateProductionOrder(editingOrderId, orderData);
                toast.success("تم تحديث طلب الإنتاج بنجاح");
            } else {
                // إنشاء طلب جديد
                await productionApi.createProductionOrder(orderData);
                toast.success("تم إنشاء طلب الإنتاج بنجاح");
            }

            // إعادة تعيين النموذج
            setFormData({
                color_id: "",
                batch_id: "",
                type_item: TypeItem.Machine,
                thickness: "0.6",
                notes: "",
                status: ProductionStatus.pending
            });
            setProductionItems([]);
            setShowPreview(false);
            setEditingOrderId(null);
            
            // تحديث قائمة الطلبات إذا كنا في وضع السجل
            if (viewMode === "history") {
                loadProductionOrders();
            }

        } catch (error) {
            console.error("Error saving production order:", error);
            toast.error(error.response?.data?.message || "فشل في حفظ طلب الإنتاج");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

        try {
            setLoading(true);
            await productionApi.deleteProductionOrder(orderId);
            toast.success("تم حذف الطلب بنجاح");
            loadProductionOrders();
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("فشل في حذف الطلب");
        } finally {
            setLoading(false);
        }
    };

    const handleEditOrder = (order) => {
        setFormData({
            color_id: String(order.color_id),
            batch_id: String(order.batch_id),
            type_item: order.type_item,
            thickness: order.thickness,
            notes: order.notes || "",
            status: order.status
        });
        setEditingOrderId(order.production_order_id);
        setViewMode("create");
        // تمرير إلى أعلى الصفحة
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Color options for select
    const colorOptions = useMemo(() => {
        return colors.map(c => ({
            value: String(c.color_id),
            label: `${c.color_name} (${c.color_code})`
        }));
    }, [colors]);

    // Batch options for select
    const batchOptions = useMemo(() => {
        return batches.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || `دفعة ${b.batch_id}`
        }));
    }, [batches]);

    // Scroll table horizontally
    const scrollTable = (direction) => {
        if (tableContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = tableContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tableContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }
    };

    if (loading && viewMode === "create" && colors.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingState />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="relative flex-shrink-0">
                {isHeaderVisible && (
                    <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setViewMode("create")}
                                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${
                                    viewMode === "create"
                                        ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                        : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                            >
                                <ShoppingCart className="w-5 h-5 ml-2" />
                                طلب إنتاج جديد
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setViewMode("history")}
                                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${
                                    viewMode === "history"
                                        ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                        : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                            >
                                <History className="w-5 h-5 ml-2" />
                                سجل طلبات الإنتاج
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
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

            {/* Main Content */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                {viewMode === "create" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.2fr_1.6fr] gap-3 h-full min-h-0">
                        {/* العمود الأيمن - المعلومات الأساسية */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            {/* معلومات الطلب */}
                            <Card className="flex-shrink-0 p-4">
                                <Label className="font-bold text-base mb-3 block">معلومات الطلب</Label>
                                
                                <div className="space-y-3">
                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">اللون</Label>
                                        <FilterSelect
                                            value={formData.color_id}
                                            onChange={(e) => handleFieldChange("color_id", e.target.value)}
                                            options={colorOptions}
                                            placeholder="اختر اللون..."
                                            className="w-full text-sm"
                                        />
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">رقم الطبخة</Label>
                                        <FilterSelect
                                            value={formData.batch_id}
                                            onChange={(e) => handleFieldChange("batch_id", e.target.value)}
                                            options={batchOptions}
                                            placeholder="اختر الطبخة..."
                                            className="w-full text-sm"
                                        />
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">نوع الطلب</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TYPE_ITEM_OPTIONS.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleFieldChange("type_item", option.value)}
                                                    className={`
                                                        py-2 px-3 rounded-lg text-sm font-medium border-2
                                                        transition-all touch-manipulation active:scale-95
                                                        ${formData.type_item === option.value
                                                            ? "border-primary-f bg-primary-f text-white"
                                                            : "border-gray-300 bg-white hover:border-secondary-s"
                                                        }
                                                    `}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">السماكة (مم)</Label>
                                        <Input
                                            type="number"
                                            value={formData.thickness}
                                            onChange={(e) => handleFieldChange("thickness", e.target.value)}
                                            className="h-10 text-sm"
                                            step="0.1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">الحالة</Label>
                                        <FilterSelect
                                            value={formData.status}
                                            onChange={(e) => handleFieldChange("status", e.target.value)}
                                            options={STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                                            className="w-full text-sm"
                                        />
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">ملاحظات</Label>
                                        <Input
                                            value={formData.notes}
                                            onChange={(e) => handleFieldChange("notes", e.target.value)}
                                            placeholder="ملاحظات إضافية..."
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* العمود الأوسط - إضافة العناصر */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                            {/* شريط التقدم للتعديل */}
                            {editingItemId && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                    <span className="text-blue-700 text-sm font-medium">
                                        <Edit className="w-4 h-4 inline ml-1" />
                                        جاري تعديل العنصر
                                    </span>
                                    <button
                                        onClick={cancelEdit}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            )}

                            <Card className="p-4">
                                <Label className="font-bold text-base mb-3 block">إضافة عنصر إنتاج</Label>
                                
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="font-bold text-xs mb-1 block">العرض</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.width}
                                                onChange={(e) => handleItemFieldChange("width", e.target.value)}
                                                placeholder="مثال: 22"
                                                className="h-10 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="font-bold text-xs mb-1 block">الطول</Label>
                                            <Input
                                                type="number"
                                                value={currentItem.length}
                                                onChange={(e) => handleItemFieldChange("length", e.target.value)}
                                                placeholder="مثال: 100"
                                                className="h-10 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">أنواع الإنتاج</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PRODUCTION_TYPES.map(type => {
                                                const Icon = type.icon;
                                                const isSelected = currentItem.production_types?.includes(type.value);
                                                return (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => handleProductionTypeToggle(type.value)}
                                                        className={`
                                                            py-2 px-2 rounded-lg text-xs font-medium border-2
                                                            transition-all touch-manipulation active:scale-95
                                                            flex items-center justify-center gap-1
                                                            ${isSelected
                                                                ? "border-green-600 bg-green-50 text-green-700"
                                                                : "border-gray-300 bg-white hover:border-gray-400"
                                                            }
                                                        `}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                        {type.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={addProductionItem}
                                        className={`w-full h-10 text-sm font-bold ${
                                            editingItemId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
                                        } text-white`}
                                    >
                                        {editingItemId ? (
                                            <>
                                                <Save className="w-4 h-4 ml-1" />
                                                تحديث العنصر
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 ml-1" />
                                                إضافة عنصر
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* عرض العناصر المضافة */}
                            <Card className="flex-1 p-3 overflow-hidden">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">العناصر المضافة: {productionItems.length}</span>
                                    {productionItems.length > 0 && (
                                        <button
                                            onClick={clearAllItems}
                                            className="text-red-600 hover:bg-red-50 p-1 rounded-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-2 overflow-y-auto max-h-[300px]">
                                    {productionItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                                editingItemId === item.id ? 'bg-blue-50 border-blue-300' : ''
                                            }`}
                                            onClick={() => handleEditItem(item)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-sm font-bold">
                                                        عرض: {item.width} | طول: {item.length}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
                                                        {item.production_types.map(type => {
                                                            const typeInfo = PRODUCTION_TYPES.find(t => t.value === type);
                                                            return (
                                                                <span key={type} className="bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    {typeInfo?.label || type}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeItem(item.id);
                                                    }}
                                                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {productionItems.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            لا توجد عناصر مضافة
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* العمود الأيسر - معاينة وحفظ */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-1">ملخص الطلب</div>
                                        <div className="text-xs space-y-1">
                                            <div>اللون: {colors.find(c => String(c.color_id) === formData.color_id)?.color_name || '-'}</div>
                                            <div>الطبخة: {batches.find(b => String(b.batch_id) === formData.batch_id)?.batch_number || '-'}</div>
                                            <div>النوع: {formData.type_item === TypeItem.Machine ? 'مكنة' : 'كوي'}</div>
                                            <div>السماكة: {formData.thickness} مم</div>
                                            <div>عدد العناصر: {productionItems.length}</div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setShowPreview(true)}
                                        disabled={loading || productionItems.length === 0 || !formData.color_id || !formData.batch_id}
                                        className="w-full h-12 bg-secondary-s hover:brightness-110 text-white font-bold"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Eye className="w-5 h-5 ml-2" />
                                                معاينة الطلب
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    /* وضع السجل */
                    <Card className="flex flex-col h-full min-h-0 overflow-hidden p-3">
                        <div className="flex justify-between items-center mb-2 flex-shrink-0">
                            <h2 className="font-bold text-lg">سجل طلبات الإنتاج</h2>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={loadProductionOrders}
                                disabled={loadingOrders}
                                className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110 touch-manipulation active:scale-95 transition-transform"
                            >
                                <RotateCcw className="w-4 h-4 ml-1" />
                                تحديث
                            </Button>
                        </div>

                        {/* جدول السجل */}
                        <div className="flex-1 overflow-auto min-h-0 border rounded-lg bg-white">
                            <table className="min-w-[1400px] w-full table-fixed border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-20">
                                    <tr>
                                        <th className="p-2 text-right border-b w-20">#</th>
                                        <th className="p-2 text-right border-b w-32">التاريخ</th>
                                        <th className="p-2 text-right border-b w-32">المنشئ</th>
                                        <th className="p-2 text-right border-b w-32">اللون</th>
                                        <th className="p-2 text-center border-b w-24">النوع</th>
                                        <th className="p-2 text-center border-b w-24">السماكة</th>
                                        <th className="p-2 text-center border-b w-32">رقم الطبخة</th>
                                        <th className="p-2 text-center border-b w-24">الحالة</th>
                                        <th className="p-2 text-center border-b w-32">ملاحظات</th>
                                        <th className="p-2 text-center border-b w-32">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingOrders ? (
                                        <tr><td colSpan="10" className="p-6"><LoadingState /></td></tr>
                                    ) : productionOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد طلبات إنتاج
                                            </td>
                                        </tr>
                                    ) : (
                                        productionOrders.map(order => {
                                            const statusBadge = productionApi.getStatusBadge(order.status);
                                            return (
                                                <tr key={order.production_order_id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 font-medium text-sm">#{order.production_order_id}</td>
                                                    <td className="p-2 text-sm">{productionApi.getFormattedDate(order.created_at)}</td>
                                                    <td className="p-2 text-sm">{productionApi.formatIssuedBy(order.issued_by)}</td>
                                                    <td className="p-2 text-sm">{order.color_name} ({order.color_code})</td>
                                                    <td className="p-2 text-center text-sm">
                                                        {order.type_item === TypeItem.Machine ? 'مكنة' : 'كوي'}
                                                    </td>
                                                    <td className="p-2 text-center text-sm">{order.thickness} مم</td>
                                                    <td className="p-2 text-center text-sm">{order.batch_number || '-'}</td>
                                                    <td className="p-2 text-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs ${statusBadge.className}`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-center max-w-[150px] truncate text-sm" title={order.notes}>
                                                        {order.notes || '-'}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleViewOrder(order)}
                                                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"
                                                                title="عرض التفاصيل"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditOrder(order)}
                                                                className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"
                                                                title="تعديل"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOrder(order.production_order_id)}
                                                                className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* نافذة معاينة الطلب */}
            <StyledDialog
                isOpen={showPreview}
                onOpenChange={setShowPreview}
                title="معاينة طلب الإنتاج"
                onCancel={() => setShowPreview(false)}
                onConfirm={saveProductionOrder}
                confirmLabel={editingOrderId ? "تحديث الطلب" : "إنشاء الطلب"}
                cancelLabel="إلغاء"
                confirmVariant="default"
                isLoading={loading}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500">اللون</div>
                            <div className="font-bold text-sm">
                                {colors.find(c => String(c.color_id) === formData.color_id)?.color_name || '-'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500">رقم الطبخة</div>
                            <div className="font-bold text-sm">
                                {batches.find(b => String(b.batch_id) === formData.batch_id)?.batch_number || '-'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500">النوع</div>
                            <div className="font-bold text-sm">
                                {formData.type_item === TypeItem.Machine ? 'مكنة' : 'كوي'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500">السماكة</div>
                            <div className="font-bold text-sm">{formData.thickness} مم</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm mb-2">عناصر الإنتاج</h4>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-center">العرض</th>
                                        <th className="p-2 text-center">الطول</th>
                                        <th className="p-2 text-center">أنواع الإنتاج</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productionItems.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-2 text-center">{item.width}</td>
                                            <td className="p-2 text-center">{item.length}</td>
                                            <td className="p-2 text-center">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {item.production_types.map(type => {
                                                        const typeInfo = PRODUCTION_TYPES.find(t => t.value === type);
                                                        return (
                                                            <span key={type} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                                                {typeInfo?.label || type}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {formData.notes && (
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="text-xs text-gray-500">ملاحظات</div>
                            <div className="text-sm">{formData.notes}</div>
                        </div>
                    )}
                </div>
            </StyledDialog>

            {/* نافذة تفاصيل الطلب */}
            <StyledDialog
                isOpen={showOrderDetails}
                onOpenChange={setShowOrderDetails}
                title={`تفاصيل طلب الإنتاج #${selectedOrder?.production_order_id}`}
                onCancel={() => setShowOrderDetails(false)}
                cancelLabel="إغلاق"
                showFooter={false}
            >
                {selectedOrder && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
                                <div className="font-bold text-sm">
                                    {productionApi.getFormattedDate(selectedOrder.created_at)}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">المنشئ</div>
                                <div className="font-bold text-sm">
                                    {productionApi.formatIssuedBy(selectedOrder.issued_by)}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">اللون</div>
                                <div className="font-bold text-sm">
                                    {selectedOrder.color_name} ({selectedOrder.color_code})
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">رقم الطبخة</div>
                                <div className="font-bold text-sm">{selectedOrder.batch_number || '-'}</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">النوع</div>
                                <div className="font-bold text-sm">
                                    {selectedOrder.type_item === TypeItem.Machine ? 'مكنة' : 'كوي'}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">السماكة</div>
                                <div className="font-bold text-sm">{selectedOrder.thickness} مم</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg col-span-2">
                                <div className="text-xs text-gray-500">الحالة</div>
                                <div className="font-bold text-sm">
                                    <span className={`px-2 py-1 rounded-lg text-xs ${productionApi.getStatusBadge(selectedOrder.status).className}`}>
                                        {productionApi.getStatusBadge(selectedOrder.status).label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {selectedOrderItems.length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm mb-2">عناصر الإنتاج</h4>
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="min-w-[600px] w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-center">العرض</th>
                                                <th className="p-2 text-center">الطول</th>
                                                <th className="p-2 text-center">النوع</th>
                                                <th className="p-2 text-center">المصدر</th>
                                                <th className="p-2 text-center">الوجهة</th>
                                                <th className="p-2 text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrderItems.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2 text-center">{item.width}</td>
                                                    <td className="p-2 text-center">{item.length}</td>
                                                    <td className="p-2 text-center">
                                                        {productionApi.getProductionTypeLabel(item.type)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {productionApi.getProcessSourceLabel(item.source)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {productionApi.getMovementDestinationLabel(item.destination)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                            productionApi.getStatusBadge(item.status).className
                                                        }`}>
                                                            {productionApi.getStatusBadge(item.status).label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedOrder.notes && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">ملاحظات</div>
                                <div className="text-sm">{selectedOrder.notes}</div>
                            </div>
                        )}
                    </div>
                )}
            </StyledDialog>
        </div>
    );
}