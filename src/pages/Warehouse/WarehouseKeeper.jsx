// src\pages\Warehouse\WarehouseKeeper.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { warehouseApi } from "../../api/warehouseApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { productionApi } from "../../api/productionApi";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import LoadingState from "../../components/common/LoadingState";
import NotificationsBell from "../../components/common/NotificationsBell";
import { getApiData } from "../../utils/api";
import { connectSocket, disconnectSocket } from "../../lib/socket";
import { toast } from "react-hot-toast";
import {
    Package,
    ArrowRight,
    Calculator,
    Eye,
    Check,
    X,
    AlertCircle,
    Search,
    RefreshCw,
    Plus,
    Minus,
    Hash,
    Trash2
} from "lucide-react";
import { UserRole, MovementDestination, ProductionStatus, ProductionType } from "../../types/enums";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function WarehouseKeeper() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Check if user has warehouse keeper role
    useEffect(() => {
        if (!user || user.role !== UserRole.Warehouse_Keeper) {
            toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
            navigate('/dashboard');
            return;
        }
    }, [user, navigate]);

    // State management
    const [activeTab, setActiveTab] = useState("manual"); // manual | qr
    const [orders, setOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showMovementDetails, setShowMovementDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeOrderItem, setActiveOrderItem] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colorSearchCode, setColorSearchCode] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [qrInput, setQrInput] = useState("");

    // Number pad and output form
    const [outputForm, setOutputForm] = useState({
        material_id: "",
        ruler_id: "",
        color_id: "",
        batch_id: "",
        length: "",
        width: "",
        thickness: "0.6",
        destination: "",
        notes: ""
    });
    const [currentInput, setCurrentInput] = useState("length");

    // Derived options (reuse ProductionManager style)
    const availableRulers = useMemo(() => {
        if (!outputForm.material_id) return rulers;
        return rulers.filter(r => String(r.material_id) === String(outputForm.material_id));
    }, [rulers, outputForm.material_id]);

    const availableColors = useMemo(() => {
        if (!outputForm.ruler_id) return colors;
        return colors.filter(c => String(c.ruler_id) === String(outputForm.ruler_id));
    }, [colors, outputForm.ruler_id]);

    const filteredColorsBySearch = useMemo(() => {
        if (!colorSearchCode) return availableColors;
        const term = String(colorSearchCode).toLowerCase();
        return availableColors.filter(c =>
            String(c.color_code || "").toLowerCase().includes(term) ||
            String(c.color_name || "").toLowerCase().includes(term)
        );
    }, [colorSearchCode, availableColors]);

    const colorOptions = useMemo(() => {
        return filteredColorsBySearch.map(c => {
            const rawImage = c.imageUrl || c.image_url || c.color_image || null;
            const resolvedImage = rawImage
                ? (rawImage.startsWith("http") ? rawImage : `${API_BASE_URL}${rawImage}`)
                : null;
            return {
                value: String(c.color_id),
                label: `${c.color_name} (${c.color_code})`,
                imageUrl: resolvedImage
            };
        });
    }, [filteredColorsBySearch]);

    const filteredBatchOptions = useMemo(() => {
        const term = String(batchSearchTerm || "").trim().toLowerCase();
        const allBatches = Array.isArray(batches) ? batches : [];

        // ربط الطبخات بالمادة المختارة كما في صفحة الإنتاج
        const visibleBatches = outputForm.material_id
            ? allBatches.filter(b => String(b.material_id) === String(outputForm.material_id))
            : allBatches;

        const base = visibleBatches.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || `دفعة ${b.batch_id}`
        }));

        if (!term) return base;
        return base.filter(opt =>
            String(opt.label || "").toLowerCase().includes(term) ||
            String(opt.value || "").toLowerCase().includes(term)
        );
    }, [batches, batchSearchTerm, colors, outputForm.color_id]);

    // Load data
    const loadOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await warehouseApi.getWarehouseOrders({
                type: ProductionType.warehouse
            });
            const data = getApiData(response, response?.data ?? response);
            const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
            setOrders(list);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error("فشل في تحميل الطلبات");
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadMovements = async () => {
        try {
            setLoadingMovements(true);
            const response = await warehouseApi.getWarehouseMovements();
            if (response.success) {
                setMovements(response.data.movements || []);
            }
        } catch (error) {
            console.error('Error loading movements:', error);
            toast.error("فشل في تحميل حركات المستودع");
        } finally {
            setLoadingMovements(false);
        }
    };

    const extractArray = (response, possibleKeys = []) => {
        const data = getApiData(response, response);
        if (Array.isArray(data)) return data;
        for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) return data[key];
            if (Array.isArray(response?.[key])) return response[key];
        }
        return [];
    };

    const loadInitialData = async () => {
        const results = await Promise.allSettled([
            colorApi.getColors(),
            batchApi.getBatches(),
            materialApi.getMaterials(),
            rulerApi.getRulers()
        ]);

        const [colorRes, batchRes, materialRes, rulerRes] = results.map(r => (r.status === "fulfilled" ? r.value : null));

        setColors(extractArray(colorRes, ["colors", "data"]) || []);
        setBatches(extractArray(batchRes, ["batches", "data"]) || []);
        setMaterials(extractArray(materialRes, ["materials", "data"]) || []);
        setRulers(extractArray(rulerRes, ["rulers", "data"]) || []);

        if (results.some(r => r.status === "rejected")) {
            console.error("Error loading colors/batches/materials/rulers for warehouse:", results);
            toast.error("فشل في تحميل بيانات الصفحة (الألوان/الطبخات/المواد/المساطر)");
        }
    };

    const parseQrData = (raw) => {
        const parts = String(raw || "").split("|").map(p => String(p ?? "").trim());
        if (parts.length < 6) return null;

        const [
            material_name,
            ruler_name,
            color_code,
            width,
            thickness,
            quantity,
            batch_number,
            type_label,
            employee_id
        ] = parts;

        return {
            material_name,
            ruler_name,
            color_code,
            width,
            thickness,
            quantity,
            batch_number,
            type_label,
            employee_id
        };
    };

    const applyQrData = () => {
        const parsed = parseQrData(qrInput);
        if (!parsed) {
            toast.error("تنسيق QR غير صحيح");
            return;
        }

        const normalize = (v) => String(v || "").trim().toLowerCase();

        const materialMatch = materials.find(m => normalize(m.material_name) === normalize(parsed.material_name));
        const rulerMatch = rulers.find(r => {
            const sameName = normalize(r.ruler_name) === normalize(parsed.ruler_name);
            if (!sameName) return false;
            if (!materialMatch) return true;
            return String(r.material_id) === String(materialMatch.material_id);
        });
        const colorMatch = colors.find(c => {
            const sameCode = normalize(c.color_code) === normalize(parsed.color_code);
            if (!sameCode) return false;
            if (!rulerMatch) return true;
            return String(c.ruler_id) === String(rulerMatch.ruler_id);
        });
        const batchMatch = batches.find(b => normalize(b.batch_number) === normalize(parsed.batch_number));

        setOutputForm(prev => ({
            ...prev,
            material_id: materialMatch ? String(materialMatch.material_id) : "",
            ruler_id: rulerMatch ? String(rulerMatch.ruler_id) : "",
            color_id: colorMatch ? String(colorMatch.color_id) : "",
            batch_id: batchMatch ? String(batchMatch.batch_id) : "",
            length: parsed.quantity || prev.length,
            width: parsed.width || prev.width,
            thickness: parsed.thickness || prev.thickness
        }));

        if (!materialMatch || !rulerMatch || !colorMatch) {
            toast.error("تعذر مطابقة بيانات QR مع البيانات المتاحة");
        } else {
            toast.success("تم تطبيق بيانات QR");
        }

        setActiveTab("manual");
    };

    useEffect(() => {
        loadOrders();
        loadMovements();
        loadInitialData();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const socket = connectSocket(token);

        const handleOrderNew = (payload) => {
            console.log("📦 ORDER_NEW received:", payload);
            loadOrders();
        };

        const handleOrdersPayload = (payload) => {
            console.log("📦 WAREHOUSE ORDERS payload:", payload);
            loadOrders();
        };

        const handleNotification = (payload) => {
            console.log("🔔 NOTIFICATION received:", payload);
            const data = payload?.data ?? payload;
            
            // Handle notifications and orders
            if (data) {
                // Handle warehouse notifications
                if (payload.type === "PRODUCTION_ORDER_WAREHOUSE" && data.productionOrderId) {
                    // Reload orders to get updated data
                    loadOrders();
                    
                    // You can add more specific handling here
                    console.log("📦 Warehouse notification:", {
                        orderId: data.productionOrderId,
                        itemsCount: data.itemsCount,
                        items: data.items
                    });
                }
                // If notification contains order data, update orders
                else if (data.production_order_id || data.id) {
                    loadOrders();
                }
                
            }
        };

        socket.on("ORDER_NEW", handleOrderNew);
        socket.on("warehouse:orders", handleOrdersPayload);
        socket.on("warehouse:order:new", handleOrdersPayload);
        socket.on("order:new", handleOrdersPayload);
        socket.on("order:updated", handleOrdersPayload);
        socket.on("notification", handleNotification);

        return () => {
            socket.off("ORDER_NEW", handleOrderNew);
            socket.off("warehouse:orders", handleOrdersPayload);
            socket.off("warehouse:order:new", handleOrdersPayload);
            socket.off("order:new", handleOrdersPayload);
            socket.off("order:updated", handleOrdersPayload);
            socket.off("notification", handleNotification);
            disconnectSocket();
        };
    }, []);

    // Handle order selection
    const handleOrderSelect = async (order) => {
        setSelectedOrder(order);
        try {
            setLoadingOrderDetails(true);
            const response = await warehouseApi.getProductionOrderItems(order.production_order_id);
            if (response.success) {
                setOrderItems(response.data || []);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
            toast.error("فشل في تحميل تفاصيل الطلب");
        } finally {
            setLoadingOrderDetails(false);
        }
        setShowOrderDetails(true);
    };

    // Number pad functions
    const handleNumberClick = (num) => {
        const currentValue = outputForm[currentInput] || "";
        if (currentValue.length < 10) { // Limit input length
            setOutputForm(prev => ({
                ...prev,
                [currentInput]: currentValue + num.toString()
            }));
        }
    };

    const handleDecimalClick = () => {
        const currentValue = String(outputForm[currentInput] || "");
        if (currentValue.includes(".") || currentValue.includes(",")) return;
        setOutputForm(prev => ({
            ...prev,
            [currentInput]: currentValue ? `${currentValue}.` : "0."
        }));
    };

    const handleBackspace = () => {
        setOutputForm(prev => ({
            ...prev,
            [currentInput]: prev[currentInput].slice(0, -1)
        }));
    };

    const handleClear = () => {
        setOutputForm(prev => ({
            ...prev,
            [currentInput]: ""
        }));
    };

    // Handle output submission
    const handleOutputSubmit = async () => {
        try {
            // Validate required fields (batch_id is optional)
            if (!outputForm.material_id || !outputForm.ruler_id || !outputForm.color_id || !outputForm.length ||
                !outputForm.width || !outputForm.thickness || !outputForm.destination) {
                toast.error("يرجى اختيار المادة والمسطرة واللون وإدخال جميع الحقول المطلوبة");
                return;
            }

            const toNumber = (value) => {
                if (value === null || value === undefined || value === "") return null;
                const normalized = String(value).replace(",", ".");
                const num = Number(normalized);
                return Number.isNaN(num) ? null : num;
            };

            // Build payload without sending batch_id when not selected or equals "0"
            const payload = {
                color_id: toNumber(outputForm.color_id),
                length: toNumber(outputForm.length),
                width: toNumber(outputForm.width),
                thickness: toNumber(outputForm.thickness),
                destination: outputForm.destination,
                notes: outputForm.notes,
            };

            if (outputForm.batch_id && outputForm.batch_id !== "0") {
                payload.batch_id = toNumber(outputForm.batch_id);
            }

            const response = await warehouseApi.createWarehouseMovement(payload);
            if (response.success) {
                toast.success("تم إنشاء حركة المستودع بنجاح");
                setOutputForm({
                    color_id: "",
                    batch_id: "",
                    length: "",
                    width: "",
                    thickness: "0.6",
                    destination: "",
                    notes: ""
                });
                if (activeOrderItem?.production_order_item_id) {
                    await handleCompleteOrderItem(activeOrderItem, { showToast: false });
                    setActiveOrderItem(null);
                }
                loadMovements(); // Reload movements
            }
        } catch (error) {
            console.error('Error creating warehouse movement:', error);
            toast.error("فشل في إنشاء حركة المستودع");
        }
    };

    const handleApplyOrderToInputs = (orderItem) => {
        if (!orderItem) return;
        const colorInfo = orderItem.color || colors.find(c => String(c.color_id) === String(orderItem.color_id));
        const rulerId = orderItem.ruler_id || colorInfo?.ruler_id || colorInfo?.ruler?.ruler_id;
        const materialId =
            orderItem.material_id ||
            colorInfo?.ruler?.material_id ||
            colorInfo?.ruler?.material?.material_id ||
            rulers.find(r => String(r.ruler_id) === String(rulerId))?.material_id;

        setOutputForm(prev => ({
            ...prev,
            material_id: materialId ? String(materialId) : prev.material_id,
            ruler_id: rulerId ? String(rulerId) : prev.ruler_id,
            color_id: orderItem.color_id ? String(orderItem.color_id) : prev.color_id,
            batch_id: orderItem.batch_id ? String(orderItem.batch_id) : "",
            length: orderItem.length ? String(orderItem.length) : "",
            width: orderItem.width ? String(orderItem.width) : "",
            thickness: orderItem.thickness ? String(orderItem.thickness) : "",
            destination: orderItem.destination || "",
            notes: orderItem.notes || ""
        }));
        setActiveOrderItem(orderItem);
        setActiveTab("manual");
        setCurrentInput("length");
    };

    const handleCompleteOrderItem = async (orderItem, options = {}) => {
        if (!orderItem?.production_order_item_id) return;
        try {
            const result = await productionApi.updateProductionItemStatus(
                orderItem.production_order_item_id,
                ProductionStatus.completed
            );
            if (result?.success === false || result?.error) {
                throw new Error(result?.message || result?.error || "فشل تحديث حالة الطلب");
            }
            if (options.showToast !== false) {
                toast.success("تم تحديث حالة الطلب إلى مكتمل");
            }
            setOrders(prev => (Array.isArray(prev) ? prev.filter(i => String(i.production_order_item_id) !== String(orderItem.production_order_item_id)) : prev));
            setOrderItems(prev => (Array.isArray(prev) ? prev.filter(i => String(i.production_order_item_id) !== String(orderItem.production_order_item_id)) : prev));
        } catch (error) {
            console.error("Error updating order item status:", error);
            toast.error(error?.message || "فشل تحديث حالة الطلب");
        }
    };

    // Format destination label
    const formatDestination = (destination) => {
        const labels = {
            [MovementDestination.slitting]: "التشريح",
            [MovementDestination.cutting]: "القص",
            [MovementDestination.production]: "الإنتاج"
        };
        return labels[destination] || destination;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const orderStatusConfig = {
        [ProductionStatus.pending]: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" },
        [ProductionStatus.preparing]: { label: "قيد التحضير", className: "bg-blue-100 text-blue-800" },
        [ProductionStatus.completed]: { label: "مكتمل", className: "bg-green-100 text-green-800" },
        [ProductionStatus.canceled]: { label: "ملغي", className: "bg-red-100 text-red-800" }
    };

    const getOrderStatusBadge = (status) => {
        return orderStatusConfig[status] || { label: status || "غير محدد", className: "bg-gray-100 text-gray-700" };
    };

    const groupedOrders = useMemo(() => {
        const list = Array.isArray(orders) ? [...orders] : [];
        list.sort((a, b) => {
            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
        });
        const groups = {
            [ProductionStatus.pending]: [],
            [ProductionStatus.preparing]: [],
            [ProductionStatus.completed]: [],
            [ProductionStatus.canceled]: [],
            unknown: []
        };

        list.forEach(item => {
            const key = String(item?.status || "").toLowerCase();
            if (key === ProductionStatus.completed) return;
            if (groups[key]) groups[key].push(item);
            else groups.unknown.push(item);
        });

        return groups;
    }, [orders]);

    const orderSections = [
        { key: ProductionStatus.pending, label: orderStatusConfig[ProductionStatus.pending].label },
        { key: ProductionStatus.preparing, label: orderStatusConfig[ProductionStatus.preparing].label },
        { key: ProductionStatus.completed, label: orderStatusConfig[ProductionStatus.completed].label },
        { key: ProductionStatus.canceled, label: orderStatusConfig[ProductionStatus.canceled].label },
        { key: "unknown", label: "غير محدد" }
    ];

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-gray-50" dir="rtl">
            {/* Header - نفس ستايل صفحة الإنتاج */}
            <div className="flex-shrink-0">
                <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Package className="w-7 h-7" />
                            <div>
                                <h1 className="text-2xl font-bold">إدارة المستودع</h1>
                                <p className="text-sm opacity-90">لوحة حركات المستودع للمستودع فقط</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationsBell />
                        <span className="text-sm">
                            مرحباً، {user?.full_name}
                        </span>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            className="px-5 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                        >
                            <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                            تسجيل الخروج
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-hidden">
                {/* Top Area - Inputs + Orders */}
                <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                    {/* Current / Completed Orders */}
                    <Card className="p-4 flex flex-col space-y-4 min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-orange-600" />
                                طلبات حسب الحالة
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadOrders}
                                disabled={loadingOrders}
                            >
                                <RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? 'animate-spin' : ''}`} />
                                تحديث
                            </Button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
                            {loadingOrders ? (
                                <div className="flex items-center justify-center h-32">
                                    <LoadingState />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <div className="text-lg font-medium">لا توجد طلبات</div>
                                    <div className="text-sm">لا توجد طلبات جاهزة للمستودع</div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {orderSections.map(section => {
                                        const items = groupedOrders[section.key] || [];
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={section.key}>
                                                <div className="px-3 py-2 bg-gray-50 text-sm font-bold flex items-center justify-between">
                                                    <span>{section.label}</span>
                                                    <span className="text-xs text-gray-500">{items.length}</span>
                                                </div>
                                                {items.map(order => {
                                                    const colorInfo = order.color || colors.find(c => String(c.color_id) === String(order.color_id));
                                                    const batchInfo = order.batch || batches.find(b => String(b.batch_id) === String(order.batch_id));
                                                    const colorName = order.color_name || colorInfo?.color_name || "-";
                                                    const colorCode = order.color_code || colorInfo?.color_code || "-";
                                                    const batchNumber = order.batch_number || order.batch?.batch_number || batchInfo?.batch_number || "-";
                                                    const statusBadge = getOrderStatusBadge(order.status);
                                                    const isCompleted = String(order.status || "").toLowerCase() === ProductionStatus.completed;
                                                    return (
                                                        <div
                                                            key={order.production_order_item_id ?? order.production_order_id}
                                                            className="p-3 hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => {
                                                                if (order.production_order_id) {
                                                                    handleOrderSelect({
                                                                        production_order_id: order.production_order_id,
                                                                        color_name: colorName,
                                                                        color_code: colorCode,
                                                                        width: order.width,
                                                                        thickness: order.thickness,
                                                                        batch_number: batchNumber,
                                                                        created_at: order.created_at,
                                                                        status: order.status
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="font-medium">طلب #{order.production_order_id}</div>
                                                                    <div className="text-sm text-gray-600">
                                                                        {colorName} ({colorCode})
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {formatDate(order.created_at)}
                                                                    </div>
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="text-sm font-medium">
                                                                        {order.width} مم × {order.thickness} مم
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {batchNumber}
                                                                    </div>
                                                                    <div className="mt-1">
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge.className}`}>
                                                                            {statusBadge.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2 flex gap-2 justify-end">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleApplyOrderToInputs(order);
                                                                            }}
                                                                        >
                                                                            إدخال
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            disabled={isCompleted}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleCompleteOrderItem(order);
                                                                            }}
                                                                        >
                                                                            إتمام
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Inputs */}
                    <Card className="p-4 flex flex-col min-h-0">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ArrowRight className="w-5 h-5 text-blue-600" />
                            المدخلات
                        </h2>
                        <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">
                            {activeOrderItem && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                    <div className="text-sm">
                                        <div className="font-bold">تم ربط الإدخال بطلب #{activeOrderItem.production_order_id}</div>
                                        <div className="text-xs text-gray-600">عنصر #{activeOrderItem.production_order_item_id}</div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveOrderItem(null)}
                                    >
                                        إلغاء الربط
                                    </Button>
                                </div>
                            )}
                            <div>
                                {/* Input form for manual entry or QR */}
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className={`flex-1 ${activeTab === "qr" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                                            onClick={() => setActiveTab("qr")}
                                        >
                                            <Search className="w-4 h-4 ml-2" />
                                            QR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className={`flex-1 ${activeTab === "manual" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                                            onClick={() => setActiveTab("manual")}
                                        >
                                            <Hash className="w-4 h-4 ml-2" />
                                            يدوي
                                        </Button>
                                    </div>

                                    {activeTab === "qr" && (
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-600">
                                                قم بلصق بيانات QR ثم اضغط "تطبيق البيانات"
                                            </div>
                                            <Input
                                                value={qrInput}
                                                onChange={(e) => setQrInput(e.target.value)}
                                                placeholder="material|ruler|color_code|width|thickness|quantity|batch|type|employee"
                                            />
                                            <Button
                                                onClick={applyQrData}
                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                disabled={!qrInput.trim()}
                                            >
                                                <Check className="w-5 h-5 ml-2" />
                                                تطبيق البيانات
                                            </Button>
                                        </div>
                                    )}

                                    {activeTab === "manual" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>المادة</Label>
                                                    <FilterSelect
                                                        value={outputForm.material_id}
                                                        onChange={(e) => setOutputForm(prev => ({
                                                            ...prev,
                                                            material_id: e.target.value,
                                                            ruler_id: "",
                                                            color_id: "",
                                                            batch_id: ""
                                                        }))}
                                                        options={materials.map(m => ({
                                                            value: String(m.material_id),
                                                            label: m.material_name
                                                        }))}
                                                        placeholder="اختر المادة"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>المسطرة</Label>
                                                    <FilterSelect
                                                        value={outputForm.ruler_id}
                                                        onChange={(e) => setOutputForm(prev => ({
                                                            ...prev,
                                                            ruler_id: e.target.value,
                                                            color_id: "",
                                                            batch_id: ""
                                                        }))}
                                                        options={availableRulers.map(r => ({
                                                            value: String(r.ruler_id),
                                                            label: r.ruler_name
                                                        }))}
                                                        placeholder={!outputForm.material_id ? "اختر المادة أولاً" : "اختر المسطرة"}
                                                        disabled={!outputForm.material_id}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>اللون</Label>
                                                    <FilterSelect
                                                        value={outputForm.color_id}
                                                        onChange={(e) => setOutputForm(prev => ({ ...prev, color_id: e.target.value, batch_id: "" }))}
                                                        options={colorOptions}
                                                        placeholder={
                                                            !outputForm.ruler_id
                                                                ? "اختر المسطرة أولاً"
                                                                : colorOptions.length === 0
                                                                    ? "لا توجد ألوان لهذه المسطرة"
                                                                    : "اختر اللون"
                                                        }
                                                        disabled={!outputForm.ruler_id}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>الطبخة (اختياري)</Label>
                                                    <FilterSelect
                                                        value={outputForm.batch_id}
                                                        onChange={(e) => setOutputForm(prev => ({ ...prev, batch_id: e.target.value }))}
                                                        options={filteredBatchOptions}
                                                        placeholder={!outputForm.material_id ? "اختر المادة أولاً" : "اختر الطبخة أو اتركها فارغة"}
                                                        disabled={!outputForm.material_id}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <Label>الطول</Label>
                                                    <Input
                                                        value={outputForm.length}
                                                        onFocus={() => setCurrentInput("length")}
                                                        readOnly
                                                        className={`text-center ${currentInput === "length" ? "ring-2 ring-blue-500" : ""}`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>العرض</Label>
                                                    <Input
                                                        value={outputForm.width}
                                                        onFocus={() => setCurrentInput("width")}
                                                        readOnly
                                                        className={`text-center ${currentInput === "width" ? "ring-2 ring-blue-500" : ""}`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>السماكة</Label>
                                                    <Input
                                                        value={outputForm.thickness}
                                                        onFocus={() => setCurrentInput("thickness")}
                                                        readOnly
                                                        className={`text-center ${currentInput === "thickness" ? "ring-2 ring-blue-500" : ""}`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>الوجهة</Label>
                                                <FilterSelect
                                                    value={outputForm.destination}
                                                    onChange={(e) => setOutputForm(prev => ({ ...prev, destination: e.target.value }))}
                                                    options={[
                                                        { value: MovementDestination.slitting, label: "التشريح" },
                                                        { value: MovementDestination.cutting, label: "القص" },
                                                        { value: MovementDestination.production, label: "الإنتاج" }
                                                    ]}
                                                    placeholder="اختر الوجهة"
                                                />
                                            </div>
                                            <div>
                                                <Label>ملاحظات</Label>
                                                <Input
                                                    value={outputForm.notes}
                                                    onChange={(e) => setOutputForm(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="ملاحظات اختيارية"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleOutputSubmit}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                disabled={!outputForm.color_id || !outputForm.length || !outputForm.width || !outputForm.thickness || !outputForm.destination}
                                            >
                                                <Check className="w-5 h-5 ml-2" />
                                                حفظ
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Bottom Area - Outputs (full width) + Number Pad on the right */}
                <div className="flex gap-4 flex-1 min-h-0 flex-row-reverse">
                    {/* Number Pad - fixed width on the left */}
                    <Card className="p-4 w-[260px] flex-shrink-0 self-stretch flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-green-600" />
                            لوحة الأرقام
                        </h3>
                        <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">
                            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-12 text-lg font-bold"
                                    onClick={() => handleNumberClick(num)}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-12 text-lg"
                                onClick={handleClear}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-lg font-bold"
                                onClick={() => handleNumberClick(0)}
                            >
                                0
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-lg"
                                onClick={handleDecimalClick}
                            >
                                ,
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-lg"
                                onClick={handleBackspace}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                    {/* Outputs Table - takes remaining width */}
                    <Card className="p-4 flex flex-col flex-1 space-y-4 min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-600" />
                                جدول المخرجات
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMovements}
                                disabled={loadingMovements}
                            >
                                <RefreshCw className={`w-4 h-4 ml-2 ${loadingMovements ? 'animate-spin' : ''}`} />
                                تحديث
                            </Button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
                            {loadingMovements ? (
                                <div className="flex items-center justify-center h-32">
                                    <LoadingState />
                                </div>
                            ) : movements.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <div className="text-lg font-medium">لا توجد مخرجات</div>
                                    <div className="text-sm">لم يتم تسجيل أي حركات مستودع بعد</div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {movements.map(movement => (
                                        <div key={movement.movement_id} className="p-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        حركة #{movement.movement_id}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedMovement(movement);
                                                                setShowMovementDetails(true);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 ml-2" />
                                                            تفاصيل
                                                        </Button>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {movement.color?.color_name} ({movement.color?.color_code})
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(movement.created_at)}
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium">
                                                        {movement.length} م × {movement.width} مم × {movement.thickness} مم
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDestination(movement.destination)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                </div>
            </div>

            {/* Order Details Dialog */}
            <StyledDialog
                isOpen={showOrderDetails}
                onOpenChange={setShowOrderDetails}
                title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ''}`}
                contentClassName="max-w-4xl w-full"
                onCancel={() => setShowOrderDetails(false)}
                onConfirm={() => setShowOrderDetails(false)}
                confirmLabel="إغلاق"
                showCancel={false}
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        {/* Order Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-bold text-blue-700 mb-3">معلومات الطلب</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">رقم الطلب</Label>
                                    <div className="font-bold">#{selectedOrder.production_order_id}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">اللون</Label>
                                    <div className="font-bold">{selectedOrder.color_name} ({selectedOrder.color_code})</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الأبعاد</Label>
                                    <div className="font-bold">{selectedOrder.width} × {selectedOrder.thickness} مم</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الطبخة</Label>
                                    <div className="font-bold">{selectedOrder.batch_number}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">التاريخ</Label>
                                    <div className="font-bold">{formatDate(selectedOrder.created_at)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الحالة</Label>
                                    <div className="font-bold">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getOrderStatusBadge(selectedOrder.status).className}`}>
                                            {getOrderStatusBadge(selectedOrder.status).label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        {loadingOrderDetails ? (
                            <div className="flex justify-center py-8">
                                <LoadingState />
                            </div>
                        ) : orderItems.length > 0 ? (
                            <div>
                                <h4 className="font-bold mb-3">عناصر الطلب</h4>
                                <div className="border rounded-lg">
                                    <table className="w-full text-sm table-fixed">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-center">العرض</th>
                                                <th className="p-2 text-center">الكمية</th>
                                                <th className="p-2 text-center">النوع</th>
                                                <th className="p-2 text-center">المصدر</th>
                                                <th className="p-2 text-center">الوجهة</th>
                                                <th className="p-2 text-center">الحالة</th>
                                                <th className="p-2 text-center">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2 text-center">{item.width}</td>
                                                    <td className="p-2 text-center">{item.length}</td>
                                                    <td className="p-2 text-center">{item.type}</td>
                                                    <td className="p-2 text-center">{item.source}</td>
                                                    <td className="p-2 text-center">{item.destination}</td>
                                                    <td className="p-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getOrderStatusBadge(item.status).className}`}>
                                                            {getOrderStatusBadge(item.status).label}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleApplyOrderToInputs(item)}
                                                            >
                                                                إدخال
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={String(item.status || "").toLowerCase() === ProductionStatus.completed}
                                                                onClick={() => handleCompleteOrderItem(item)}
                                                            >
                                                                إتمام
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <div>لا توجد عناصر لهذا الطلب</div>
                            </div>
                        )}
                    </div>
                )}
            </StyledDialog>

            {/* Movement Details Dialog */}
            <StyledDialog
                isOpen={showMovementDetails}
                onOpenChange={(open) => {
                    setShowMovementDetails(open);
                    if (!open) setSelectedMovement(null);
                }}
                title={`تفاصيل الحركة ${selectedMovement?.movement_id ? `#${selectedMovement.movement_id}` : ""}`}
                contentClassName="max-w-3xl w-full"
                onCancel={() => setShowMovementDetails(false)}
                onConfirm={() => setShowMovementDetails(false)}
                confirmLabel="إغلاق"
                showCancel={false}
            >
                {selectedMovement && (
                    <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h3 className="font-bold text-purple-700 mb-3">معلومات الحركة</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">رقم الحركة</Label>
                                    <div className="font-bold">#{selectedMovement.movement_id}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الوجهة</Label>
                                    <div className="font-bold">{formatDestination(selectedMovement.destination)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">التاريخ</Label>
                                    <div className="font-bold">{formatDate(selectedMovement.created_at)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الأبعاد</Label>
                                    <div className="font-bold">
                                        {selectedMovement.length ?? "-"} م × {selectedMovement.width ?? "-"} مم × {selectedMovement.thickness ?? "-"} مم
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-xs text-gray-500">ملاحظات</Label>
                                    <div className="font-bold break-words">{selectedMovement.notes || "-"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4 bg-white">
                                <h4 className="font-bold mb-3">اللون</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-gray-500">الاسم:</span> <span className="font-medium">{selectedMovement.color?.color_name || "-"}</span></div>
                                    <div><span className="text-gray-500">الكود:</span> <span className="font-medium">{selectedMovement.color?.color_code || "-"}</span></div>
                                    <div><span className="text-gray-500">المسطرة:</span> <span className="font-medium">{selectedMovement.color?.ruler?.ruler_name || "-"}</span></div>
                                    <div><span className="text-gray-500">المادة:</span> <span className="font-medium">{selectedMovement.color?.ruler?.material?.material_name || "-"}</span></div>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-white">
                                <h4 className="font-bold mb-3">الطبخة والمستخدم</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-gray-500">رقم الطبخة:</span> <span className="font-medium">{selectedMovement.batch?.batch_number || "-"}</span></div>
                                    <div><span className="text-gray-500">ملاحظات الطبخة:</span> <span className="font-medium">{selectedMovement.batch?.notes || "-"}</span></div>
                                    <div><span className="text-gray-500">المستخدم:</span> <span className="font-medium">{selectedMovement.user?.full_name || selectedMovement.user?.username || "-"}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </StyledDialog>
        </div>
    );
}
