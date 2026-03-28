// src\pages\Production\ProductionManager.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productionApi } from "../../api/productionApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { constantApi } from "../../api/constantApi";
import { useExport } from "../../hooks/useExport";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import PaginationControls from "../../components/common/PaginationControls";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import NotificationsBell from "../../components/common/NotificationsBell";
import { connectSocket, disconnectSocket } from "../../lib/socket";
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
    LogOut,
    Users,
    X,
    AlertCircle,
    Edit,
    Save,
    ChevronLeft,
    ChevronRight,
    Download,
    Printer,
    RefreshCw,
    Package,
    Settings,
    Wrench,
    Scissors,
    Droplet,
    Layers,
    Search
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, ProductionType, ProductionStatus, MovementDestination, ProcessSource } from "../../types/enums";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function ProductionManager() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [viewMode, setViewMode] = useState("create");
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [widthFilter, setWidthFilter] = useState(""); // فلتر العرض
    const [widthTab, setWidthTab] = useState("all"); // تبويب حسب العرض: all, 22, 44, 66, 88, 110
    const [showPreview, setShowPreview] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingOrder, setDeletingOrder] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const tableContainerRef = useRef(null);
    const notificationDedupRef = useRef(new Map());
    const [activeTextTarget, setActiveTextTarget] = useState(null); // color_search | batch_search
    const [colorSearchCode, setColorSearchCode] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [statusNotification, setStatusNotification] = useState(null);
    const viewModeRef = useRef(viewMode);

    // Pagination states for production orders table
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Data
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [widthValues, setWidthValues] = useState([]);
    const [loadingWidths, setLoadingWidths] = useState(false);
    const [productionOrders, setProductionOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const { exportToExcel: exportProductionToExcel, loading: exportingProduction } = useExport({
        sheetName: "طلبات_الإنتاج",
        columns: [
            { key: "production_order_id", header: "#" },
            { key: "date", header: "التاريخ" },
            { key: "issued_by", header: "المنشئ" },
            { key: "color", header: "اللون" },
            { key: "type_item", header: "النوع" },
            { key: "thickness", header: "السماكة" },
            { key: "batch", header: "رقم الطبخة" },
            { key: "status", header: "الحالة" },
            { key: "notes", header: "ملاحظات" },
        ],
        columnWidths: [
            { wch: 8 },
            { wch: 20 },
            { wch: 22 },
            { wch: 24 },
            { wch: 14 },
            { wch: 12 },
            { wch: 18 },
            { wch: 14 },
            { wch: 28 },
        ],
    });

    // Production Types
    const PRODUCTION_TYPES = [
        { value: ProductionType.warehouse, label: "مستودع", icon: Package },
        { value: ProductionType.slitting, label: "تقطيع", icon: Scissors },
        { value: ProductionType.cutting, label: "قص", icon: Scissors },
        { value: ProductionType.gluing, label: "لصق", icon: Droplet },
    ];

    const TYPE_ITEM_OPTIONS = [
        { value: TypeItem.Machine, label: "مكنة" },
        { value: TypeItem.Presser, label: "كوي" }
    ];
    const formatTypeItem = (value) => {
        if (value === TypeItem.Machine) return "مكنة";
        if (value === TypeItem.Presser) return "كوي";
        return "-";
    };

    const STATUS_OPTIONS = [
        { value: ProductionStatus.pending, label: "قيد الانتظار" },
        { value: ProductionStatus.preparing, label: "قيد التحضير" },
        { value: ProductionStatus.completed, label: "مكتمل" },
        { value: ProductionStatus.canceled, label: "ملغي" }
    ];

    const DESTINATION_OPTIONS = [
        { value: "slitting", label: "التشريح" },
        { value: "production", label: "الإنتاج" }
    ];

    const SOURCE_OPTIONS = [
        { value: "production", label: "إنتاج" },
        { value: "warehouse", label: "مستودع" }
    ];

    // Form State for Production Order
    const [formData, setFormData] = useState({
        material_id: "",
        ruler_id: "",
        color_id: "",
        batch_id: "",
        type_item: "",
        thickness: "0.6",
        notes: "",
        source: "production", // للمستودع والأنواع الأخرى
        destination: "slitting" // للمستودع فقط
    });

    // Production Items State
    const [productionItems, setProductionItems] = useState([]);

    // Current Item Form
    const [currentItem, setCurrentItem] = useState({
        width: "",
        length: "", // هذه تمثل الكمية (height في الـ API)
        production_types: [], // افتراضي فارغ
        source: "production", // للمستودع والأنواع الأخرى
        destination: "slitting", // للمستودع فقط
        color_id: "",
        notes: ""
    });
    const [activeField, setActiveField] = useState("length");

    // Auto-select width 66 when warehouse is selected
    useEffect(() => {
        if (currentItem && currentItem.production_types?.includes(ProductionType.warehouse)) {
            setCurrentItem(prev => ({
                ...prev,
                width: "66"
            }));
        }
    }, [currentItem?.production_types]);

    // Helper function to check if warehouse is selected
    const isWarehouseSelected = currentItem.production_types?.includes(ProductionType.warehouse);

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
            const allMaterials = getApiData(materialRes, []) || [];
            const filteredMaterials = allMaterials.filter(m =>
                String(m?.material_name || "").toLowerCase().includes("pvc")
            );
            setMaterials(filteredMaterials);
            setRulers(getApiData(rulerRes, []) || []);

            // تحديد أول مادة مفلترة تلقائياً
            if (filteredMaterials.length > 0) {
                const firstMaterial = filteredMaterials[0];
                setFormData(prev => ({
                    ...prev,
                    material_id: String(firstMaterial.material_id)
                }));
            }

        } catch (error) {
            // console.error("Error loading data:", error);
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const loadWidthValues = async (materialId) => {
        try {
            setLoadingWidths(true);
            if (!materialId) {
                setWidthValues([]);
                return;
            }
            const response = await constantApi.getConstantValuesByMaterial(materialId, 'width');
            setWidthValues(getApiData(response, []) || []);
        } catch (error) {
            toast.error("فشل في تحميل قيم العرض");
            setWidthValues([]);
        } finally {
            setLoadingWidths(false);
        }
    };

    useEffect(() => {
        if (formData.material_id) {
            loadWidthValues(formData.material_id);
        } else {
            loadWidthValues(null);
        }
    }, [formData.material_id]);

    const selectedMaterial = useMemo(() => {
        if (!formData.material_id) return null;
        return materials.find(m => String(m.material_id) === String(formData.material_id)) || null;
    }, [formData.material_id, materials]);

    const materialBorderClass = useMemo(() => {
        const name = String(selectedMaterial?.material_name || "").toLowerCase();
        if (!name) return "border-gray-200";
        if (name.includes("pvc")) return "border-blue-500";
        if (name.includes("فوم")) return "border-green-400";
        if (name.includes("ديكور")) return "border-purple-600";
        return "border-orange-500";
    }, [selectedMaterial?.material_name]);
    const isSelectedMaterialPvc = useMemo(() => {
        if (!formData.material_id) return false;
        const materialName = selectedMaterial?.material_name?.toLowerCase() || "";
        return materialName.includes("pvc");
    }, [formData.material_id, materials, selectedMaterial]);

    // Auto-select default width for PVC when available
    useEffect(() => {
        if (!isSelectedMaterialPvc) return;
        if (!formData.material_id) return;
        if (!widthValues || widthValues.length === 0) return;

        const def = widthValues.find(w => w?.isDefault) || null;
        if (!def || def.value === undefined || def.value === null || String(def.value).trim() === "") return;

        setCurrentItem(prev => {
            if (String(prev.width || "") === String(def.value)) return prev;
            return { ...prev, width: String(def.value) };
        });
    }, [isSelectedMaterialPvc, formData.material_id, widthValues]);
    const getMaterialConstantLabel = useCallback((material, type) => {
        const values = material?.constant_values || [];
        const candidates = values.filter(v => v.type === type);
        const pick = candidates.find(v => v.isDefault) || candidates[0];
        if (!pick) return "-";
        return pick.label || `${pick.value ?? ""} ${pick.unit || ""}`.trim();
    }, []);

    const filteredWidthValues = useMemo(() => {
        if (currentItem.production_types?.includes(ProductionType.warehouse)) {
            // عند اختيار مستودع من أنواع الإنتاج، عرض فقط قيمة 66
            return widthValues.filter(w => String(w.value) === "66");
        }
        return widthValues;
    }, [widthValues, currentItem.production_types]);

    const loadProductionOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await productionApi.getProductionOrders();
            // تعديل هنا: الوصول إلى orders داخل data حسب هيكل الـ API
            const ordersData = response.data?.orders || response.data || response;
            const orders = Array.isArray(ordersData) ? ordersData : [];

            // جلب تفاصيل كل طلب بشكل منفصل
            const ordersWithDetails = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const itemsResponse = await productionApi.getProductionOrderItems(order.production_order_id);
                        const items = getApiData(itemsResponse.data || itemsResponse, []) || [];

                        // إذا كانت هناك عناصر، نأخذ أول عنصر لعرض بياناته في الجدول الرئيسي
                        if (items.length > 0) {
                            const firstItem = items[0];
                            return {
                                ...order,
                                color_name: firstItem.color?.color_name || '-',
                                color_code: firstItem.color?.color_code || '-',
                                type_item: firstItem.type_item || '-',
                                thickness: firstItem.thickness || '-',
                                width: firstItem.width || '-',
                                batch_number: firstItem.batch?.batch_number || firstItem.batch_number || firstItem.batch_id || '-',
                                material_name: firstItem.color?.ruler?.material?.material_name || '-',
                                ruler_type: firstItem.color?.ruler?.ruler_name || '-'
                            };
                        }
                        return order;
                    } catch (error) {
                        console.error(`Error loading items for order ${order.production_order_id}:`, error);
                        return order;
                    }
                })
            );

            setProductionOrders(ordersWithDetails);
        } catch (error) {
            // console.error("Error loading production orders:", error);
            toast.error("فشل في تحميل طلبات الإنتاج");
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadOrderItems = async (orderId) => {
        try {
            const response = await productionApi.getProductionOrderItems(orderId);
            // تعديل هنا: الوصول إلى data مباشرة حسب هيكل الـ API
            setSelectedOrderItems(getApiData(response.data || response, []) || []);
        } catch (error) {
            // console.error("Error loading order items:", error);
            toast.error("فشل في تحميل عناصر الطلب");
        }
    };

    const shouldNotify = (key, windowMs = 8000) => {
        const now = Date.now();
        const lastSeen = notificationDedupRef.current.get(key);
        if (lastSeen && now - lastSeen < windowMs) return false;
        notificationDedupRef.current.set(key, now);
        return true;
    };

    useEffect(() => {
        viewModeRef.current = viewMode;
    }, [viewMode]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const socket = connectSocket(token);
        const extractCompletion = (payload) => {
            const data = payload?.data ?? payload;
            const text = `${payload?.title || ""} ${payload?.body || ""} ${data?.message || ""}`.toLowerCase();
            const orderIdFromLink = payload?.link?.match?.(/production-orders\/(\d+)/)?.[1];
            const status =
                data?.status ||
                data?.item?.status ||
                data?.productionOrder?.status ||
                data?.production_order_status ||
                "";
            const orderId =
                data?.productionOrderId ||
                data?.production_order_id ||
                data?.productionOrder?.production_order_id ||
                data?.orderId ||
                orderIdFromLink ||
                "";
            const itemsCount = data?.itemsCount || data?.items?.length || "";
            const type = data?.type || data?.productionOrder?.type || data?.production_type;
            const isWarehouse =
                type === ProductionType.warehouse ||
                data?.source === "warehouse" ||
                data?.destination === "warehouse" ||
                payload?.type === "PRODUCTION_ORDER_WAREHOUSE" ||
                text.includes("مستودع") ||
                text.includes("warehouse");
            const isCompleted = String(status).toLowerCase() === ProductionStatus.completed;
            const isWarehouseNotification = payload?.type === "PRODUCTION_ORDER_WAREHOUSE";

            return { orderId, itemsCount, isWarehouse, isCompleted, isWarehouseNotification };
        };

        const handleWarehouseCompletion = (payload) => {
            const { orderId, itemsCount, isWarehouse, isCompleted, isWarehouseNotification } = extractCompletion(payload);
            if (!orderId) return;
            if (!isCompleted && !isWarehouseNotification) return;
            if (!isWarehouse && !isWarehouseNotification) return;

            const title = "تم إخراج الطلب من قسم المستودع";
            const body = `طلب #${orderId}${itemsCount ? ` • العناصر: ${itemsCount}` : ""}`;
            const key = `warehouse-complete:${orderId}:${itemsCount || 0}`;

            if (shouldNotify(key, 8000)) {
                toast.success(`${title}: ${body}`);
                setStatusNotification({
                    title,
                    body,
                    created_at: new Date().toISOString()
                });
                if (viewModeRef.current === "history") {
                    loadProductionOrders();
                }
            }
        };

        socket.on("notification", handleWarehouseCompletion);
        socket.on("order:updated", handleWarehouseCompletion);
        socket.on("warehouse:order:new", handleWarehouseCompletion);
        socket.on("warehouse:orders", handleWarehouseCompletion);
        socket.on("order:new", handleWarehouseCompletion);
        socket.on("ORDER_NEW", handleWarehouseCompletion);
        return () => {
            socket.off("notification", handleWarehouseCompletion);
            socket.off("order:updated", handleWarehouseCompletion);
            socket.off("warehouse:order:new", handleWarehouseCompletion);
            socket.off("warehouse:orders", handleWarehouseCompletion);
            socket.off("order:new", handleWarehouseCompletion);
            socket.off("ORDER_NEW", handleWarehouseCompletion);
        };
    }, []);

    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        await loadOrderItems(order.production_order_id);
        setShowOrderDetails(true);
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === "material_id") {
                newData.ruler_id = "";
                newData.color_id = "";
                newData.batch_id = "";
            } else if (field === "ruler_id") {
                newData.color_id = "";
                newData.batch_id = "";
            } else if (field === "color_id") {
                newData.batch_id = "";
            } else if (field === "source") {
                // عند تغيير المصدر، إعادة تعيين العرض إذا كان warehouse
                if (value === "warehouse") {
                    setCurrentItem(prev => ({ ...prev, width: "66" }));
                }
            } else if (field === "destination") {
                // عند تغيير الوجهة، إعادة تعيين العرض إذا كان slitting
                if (value === "slitting") {
                    setCurrentItem(prev => ({ ...prev, width: "66" }));
                }
            }

            return newData;
        });
    };

    const handleItemFieldChange = (field, value) => {
        setCurrentItem(prev => ({ ...prev, [field]: value }));
    };

    const handleNumpadPress = useCallback((val) => {
        if (activeTextTarget) {
            const apply = (prev) => {
                let next = String(prev || "");
                if (val === "clear") next = "";
                else if (val === "back") next = next.slice(0, -1);
                else next = next + val;
                return next;
            };

            if (activeTextTarget === "color_search") {
                setColorSearchCode((prev) => apply(prev));
            } else if (activeTextTarget === "batch_search") {
                setBatchSearchTerm((prev) => apply(prev));
            }
        } else {
            // Handle numpad input for currentItem fields
            const apply = (prev) => {
                let next = String(prev || "");
                if (val === "clear") next = "";
                else if (val === "back") next = next.slice(0, -1);
                else next = next + val;
                return next;
            };

            if (activeField === "width" || activeField === "length") {
                setCurrentItem(prev => ({
                    ...prev,
                    [activeField]: apply(prev[activeField])
                }));
            }
        }
    }, [activeTextTarget, activeField]);

    const filteredProductionOrders = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return productionOrders.filter(order => {
            // Search filter
            const matchesSearch = !term || (
                String(order.production_order_id).includes(term) ||
                order.issued_by?.username?.toLowerCase().includes(term) ||
                order.color_name?.toLowerCase().includes(term) ||
                order.color_code?.toLowerCase().includes(term) ||
                order.batch?.batch_number?.toLowerCase().includes(term) ||
                order.batch_number?.toLowerCase().includes(term) ||
                order.batch_id?.toString().toLowerCase().includes(term) ||
                order.status?.toLowerCase().includes(term) ||
                order.material_name?.toLowerCase().includes(term) ||
                order.ruler_type?.toLowerCase().includes(term) ||
                order.notes?.toLowerCase().includes(term) ||
                order.type_item?.toLowerCase().includes(term)
            );

            // Status filter
            const matchesStatus = !statusFilter || String(order.status || "").toLowerCase() === String(statusFilter).toLowerCase();

            // Type filter
            const matchesType = !typeFilter || String(order.type_item || "").toLowerCase() === String(typeFilter).toLowerCase();

            // Width filter
            const matchesWidth = !widthFilter || String(order.width || "").toLowerCase().includes(widthFilter.toLowerCase());

            // Width tab filter
            const matchesWidthTab = widthTab === "all" || String(order.width || "") === widthTab;

            return matchesSearch && matchesStatus && matchesType && matchesWidth && matchesWidthTab;
        });
    }, [productionOrders, searchTerm, statusFilter, typeFilter, widthFilter, widthTab]);

    // Pagination logic for production orders table
    const totalPages = Math.ceil(filteredProductionOrders.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedProductionOrders = filteredProductionOrders.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter, widthFilter, widthTab]);

    const filteredBatchOptions = useMemo(() => {
        const term = String(batchSearchTerm || "").trim().toLowerCase();
        const visibleBatches = formData.material_id
            ? batches.filter(b => String(b.material_id) === String(formData.material_id))
            : batches;
        const base = visibleBatches.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || `دفعة ${b.batch_id}`
        }));
        if (!term) return base;
        return base.filter(opt =>
            String(opt.label || "").toLowerCase().includes(term) ||
            String(opt.value || "").toLowerCase().includes(term)
        );
    }, [batches, batchSearchTerm, formData.material_id]);

    const handleExportProduction = () => {
        if (!filteredProductionOrders || filteredProductionOrders.length === 0) {
            toast.error("لا توجد طلبات للتصدير");
            return;
        }
        const exportRows = filteredProductionOrders.map(order => {
            const statusBadge = productionApi.getStatusBadge(order.status);
            return {
                production_order_id: `#${order.production_order_id}`,
                date: productionApi.getFormattedDate(order.created_at),
                issued_by: productionApi.formatIssuedBy(order.issued_by),
                color: `${order.color_name || "-"} (${order.color_code || "-"})`,
                type_item: formatTypeItem(order.type_item),
                thickness: order.thickness ?? "-",
                batch: order.batch_number || order.batch?.batch_number || order.batch_id || "-",
                status: statusBadge?.label || "-",
                notes: order.notes || "",
            };
        });
        exportProductionToExcel(exportRows, "طلبات_الإنتاج");
    };

    const handleProductionTypeToggle = (type) => {
        setCurrentItem(prev => {
            const types = prev.production_types || [];
            if (types.includes(type)) {
                // إزالة النوع إذا كان موجوداً
                return { ...prev, production_types: types.filter(t => t !== type) };
            } else {
                // إضافة النوع
                if (type === ProductionType.warehouse) {
                    // إذا اخترت المستودع، اجعله وحده وحدد النوع مكنة
                    const updatedState = { 
                        ...prev, 
                        production_types: [type],
                        type_item: "Machine" // تعيين النوع مكنة كقيمة افتراضية
                    };
                    // أيضاً حدد formData.type_item
                    setFormData(prev => ({ ...prev, type_item: "Machine" }));
                    return updatedState;
                } else {
                    // إذا كان المستودع مختار، لا تضيف
                    if (types.includes(ProductionType.warehouse)) {
                        return prev;
                    }
                    // إلا، أضف إلى الثلاثة
                    return { ...prev, production_types: [...types, type] };
                }
            }
        });
    };

    const addProductionItem = () => {
        if (!currentItem.width || !currentItem.length) {
            toast.error("يرجى إدخال العرض والكمية");
            return;
        }

        if (!currentItem.production_types || currentItem.production_types.length === 0) {
            toast.error("يرجى اختيار نوع إنتاج واحد على الأقل");
            return;
        }

        const newItem = {
            id: Date.now(),
            width: currentItem.width,
            length: currentItem.length, // هذه تمثل الكمية (height)
            production_types: currentItem.production_types,
            source: currentItem.source,
            destination: currentItem.destination,
            color_id: currentItem.color_id,
            notes: currentItem.notes
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
        // Don't show preview after adding item
        // setShowPreview(true);

        setCurrentItem({
            width: "",
            length: "",
            production_types: [],
            color_id: "",
            notes: ""
        });
    };

    const handleEditItem = (item) => {
        setCurrentItem({
            width: item.width,
            length: item.length,
            production_types: item.production_types,
            source: item.source || "production",
            destination: item.destination || "slitting",
            color_id: item.color_id || "",
            notes: item.notes || ""
        });
        setEditingItemId(item.id);
        // Show preview when editing
        setShowPreview(false);
    };

    const removeItem = (id) => {
        if (editingItemId === id) {
            setEditingItemId(null);
            setCurrentItem({
                width: "",
                length: "",
                production_types: [],
                color_id: "",
                notes: ""
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
                production_types: [],
                color_id: "",
                notes: ""
            });
            toast.success("تم مسح جميع العناصر");
        }
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setCurrentItem({
            width: "",
            length: "",
            production_types: [],
            color_id: "",
            notes: ""
        });
    };

    const saveProductionOrder = async () => {
        if (productionItems.length === 0) {
            toast.error("أضف عنصراً واحداً على الأقل");
            return;
        }

        if (!formData.material_id || !formData.ruler_id) {
            toast.error("يرجى اختيار المادة والمسطرة");
            return;
        }

        // Check if all items have colors
        const itemsWithoutColor = productionItems.filter(item => !item.color_id);
        if (itemsWithoutColor.length > 0) {
            toast.error("يرجى اختيار اللون لجميع العناصر");
            return;
        }
        if (isSelectedMaterialPvc && !formData.type_item) {
            toast.error("يرجى اختيار النوع");
            return;
        }

        try {
            setLoading(true);

            // تحضير items حسب الصيغة المطلوبة من الـ API
            // length في الواجهة تمثل الكمية (height) في الـ API
            const items = productionItems.map(item => {
                const payload = {
                    color_id: Number(item.color_id || formData.color_id),
                    type_item: formData.type_item,
                    thickness: Number(formData.thickness),
                    production_types: item.production_types,
                    width: Number(item.width),
                    length: Number(item.length) // length هنا تمثل الكمية (height)
                };

                // لا ترسل batch_id إذا لم يتم اختيارها أو كانت 0/قيمة فارغة
                const rawBatchId = formData.batch_id;
                if (rawBatchId && rawBatchId !== "0") {
                    payload.batch_id = Number(rawBatchId);
                }

                // إضافة source إذا كانت هناك قيمة
                if (item.source && item.source !== "") {
                    payload.source = item.source;
                }

                // إضافة destination إذا كانت هناك قيمة
                if (item.destination && item.destination !== "") {
                    payload.destination = item.destination;
                }

                return payload;
            });

            const orderData = {
                notes: formData.notes || "",
                status: ProductionStatus.pending, // الحفاظ على الحالة كما هي
                items: items
            };

            // console.log("Saving production order:", orderData);

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
            setFormData(prev => ({
                ...prev,
                ruler_id: "",
                color_id: "",
                batch_id: "",
                type_item: "",
                thickness: "0.6",
                notes: "",
                status: ProductionStatus.pending
            }));
            setProductionItems([]);
            setShowPreview(false);
            setEditingOrderId(null);

            // تحديث قائمة الطلبات إذا كنا في وضع السجل
            if (viewMode === "history") {
                loadProductionOrders();
            }

        } catch (error) {
            // console.error("Error saving production order:", error);
            toast.error(error.response?.data?.message || "فشل في حفظ طلب الإنتاج");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = (order) => {
        setOrderToDelete(order);
        setShowDeleteDialog(true);
    };

    const handleConfirmDeleteOrder = async () => {
        if (!orderToDelete) return;

        try {
            setDeletingOrder(true);
            await productionApi.deleteProductionOrder(orderToDelete.production_order_id);
            toast.success("تم حذف الطلب بنجاح");
            loadProductionOrders();
        } catch (error) {
            toast.error("فشل في حذف الطلب");
        } finally {
            setDeletingOrder(false);
            setShowDeleteDialog(false);
            setOrderToDelete(null);
        }
    };

    const handleEditOrder = (order) => {
        setFormData({
            material_id: "",
            ruler_id: "",
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

    const availableRulers = useMemo(() => {
        if (!formData.material_id) return rulers;
        return rulers.filter(r => String(r.material_id) === String(formData.material_id));
    }, [rulers, formData.material_id]);

    const availableColors = useMemo(() => {
        if (!formData.ruler_id) return colors;
        return colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));
    }, [colors, formData.ruler_id]);

    const filteredColorsBySearch = useMemo(() => {
        if (!colorSearchCode) return availableColors;
        const term = String(colorSearchCode).toLowerCase();
        return availableColors.filter(c =>
            String(c.color_code || "").toLowerCase().includes(term)
        );
    }, [colorSearchCode, availableColors]);

    // Color options for select
    const colorOptions = useMemo(() => {
        return filteredColorsBySearch.map(c => ({
            value: String(c.color_id),
            label: `${c.color_name} (${c.color_code})`,
            imageUrl: (() => {
                const raw = c.imageUrl || c.image_url || c.color_image || null;
                return raw ? (raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`) : null;
            })()
        }));
    }, [filteredColorsBySearch]);

    // Batch options for select
    const batchOptions = useMemo(() => {
        return filteredBatchOptions;
    }, [filteredBatchOptions]);

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
            {isHeaderVisible && (
                <div className="relative flex-shrink-0">
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
                                طلب إنتاج جديد
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
                                سجل  الإنتاج
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/production-records")}
                                className="px-6 py-3 text-base min-w-[140px] touch-manipulation border-2 bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                            >
                                <Layers className="w-5 h-5 ml-2" />
                                سجل الإنتاج بالأقسام
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <NotificationsBell />
                            {/* <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/dashboard")}
                                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <Home className="w-5 h-5 ml-2" />
                                الرئيسية
                            </Button> */}
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setShowLogoutDialog(true)}
                                className="px-5 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <LogOut className="w-5 h-5 ml-2" />
                                تسجيل الخروج
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

            {/* Main Content */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                {statusNotification && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                            <div>
                                <div className="font-bold text-green-700">{statusNotification.title}</div>
                                <div className="text-sm text-green-700">{statusNotification.body}</div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatusNotification(null)}
                            >
                                إخفاء
                            </Button>
                        </div>
                    </div>
                )}
                {viewMode === "create" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.2fr_1.6fr] gap-3 h-full min-h-0">
                        {/* العمود الأيمن - اختيار المادة ولوحة الأرقام */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                            <Card className="p-4">
                                <Label className="font-bold text-base mb-3 block">المادة</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr">
                                    {materials.map(m => (
                                        <button
                                            key={m.material_id}
                                            onClick={() => {
                                                handleFieldChange("material_id", String(m.material_id));
                                                setCurrentItem(prev => ({ ...prev, width: "" }));
                                                setActiveField("length");
                                                setActiveTextTarget(null);
                                            }}
                                            className={`
                                                aspect-square rounded-xl border-3 text-sm font-bold
                                                transition-all touch-manipulation hover:scale-105 active:scale-95
                                                flex items-center justify-center p-2
                                                ${String(formData.material_id) === String(m.material_id)
                                                    ? "border-primary-f bg-secondary-f text-white shadow-lg"
                                                    : "border-gray-300 bg-white hover:border-secondary-s"
                                                }
                                            `}
                                            title={m.material_name}
                                        >
                                            <span className="line-clamp-2 text-center">{m.material_name}</span>
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            <Card className="flex-[3] flex flex-col p-3 min-h-0 overflow-hidden">
                                <div className="flex-shrink-0 mb-2">
                                    <div className="bg-gray-100 rounded-lg py-2 px-3">
                                        <div className="text-xs text-gray-500 mb-0.5">
                                            {activeField === "width" ? "العرض" : "الكمية"}
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-gray-800 text-center truncate leading-tight">
                                            {currentItem[activeField] || "0"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-rows-4 gap-1 min-h-0">
                                    <div className="grid grid-cols-3 gap-1">
                                        {["7", "8", "9"].map(key => (
                                            <button
                                                key={key}
                                                onClick={() => handleNumpadPress(key)}
                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {["4", "5", "6"].map(key => (
                                            <button
                                                key={key}
                                                onClick={() => handleNumpadPress(key)}
                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {["1", "2", "3"].map(key => (
                                            <button
                                                key={key}
                                                onClick={() => handleNumpadPress(key)}
                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        <button
                                            onClick={() => handleNumpadPress(".")}
                                            className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                        >
                                            .
                                        </button>
                                        <button
                                            onClick={() => handleNumpadPress("0")}
                                            className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                        >
                                            0
                                        </button>
                                        <button
                                            onClick={() => handleNumpadPress("back")}
                                            className="bg-orange-100 text-orange-700 border-2 border-orange-200 rounded-lg text-lg font-bold hover:bg-orange-200 active:bg-orange-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                        >
                                            ← حذف
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNumpadPress("clear")}
                                    className="mt-2 w-full bg-red-100 text-red-700 border-2 border-red-200 rounded-lg py-2 font-bold hover:bg-red-200 active:bg-red-300 transition-all touch-manipulation active:scale-95"
                                >
                                    مسح الكل
                                </button>
                            </Card>
                        </div>

                        {/* العمود الأوسط - باقي المحتوى */}
                        <div className={`flex flex-col gap-3 h-full min-h-0 overflow-y-auto border-4 rounded-xl p-2 ${materialBorderClass}`}>
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


                            {isSelectedMaterialPvc && !currentItem.production_types?.includes(ProductionType.warehouse) && (
                                <div className="flex-shrink-0 p-3 border-b-2 border-dashed border-gray-300">
                                    <div className="grid grid-cols-2 gap-3">
                                        {TYPE_ITEM_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFieldChange("type_item", option.value)}
                                                className={`
                                                    rounded-xl border-3 text-base font-medium
                                                    transition-all touch-manipulation hover:scale-105 active:scale-95
                                                    flex items-center justify-center p-2
                                                    ${formData.type_item === option.value
                                                        ? "border-primary-f bg-primary-f text-white shadow-lg"
                                                        : "border-gray-300 bg-white hover:border-secondary-s"
                                                    }
                                                `}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 border-b-2 border-dashed border-gray-300">
                                <Label className="font-bold text-sm mb-2 block">
                                    العرض
                                    {loadingWidths && <span className="mr-2 text-gray-500 text-xs">جاري التحميل...</span>}
                                </Label>
                                {filteredWidthValues.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {filteredWidthValues.map(w => (
                                            <button
                                                key={w.id ?? w.value}
                                                onClick={() => {
                                                    handleItemFieldChange("width", w.value);
                                                    setActiveField("length");
                                                    setActiveTextTarget(null);
                                                }}
                                                className={`
                                                    rounded-xl border-3 text-base font-medium
                                                    transition-all touch-manipulation hover:scale-105 active:scale-95
                                                    flex items-center justify-center p-2
                                                    ${String(currentItem.width) === String(w.value)
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
                                        <div className="text-center p-3 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-xl">
                                            لا توجد قيم عرض
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                                <div className="p-3 border-b-2 border-dashed border-gray-300">
                                    <Label className="font-bold text-sm mb-2 block">المسطرة</Label>
                                    <FilterSelect
                                        value={formData.ruler_id}
                                        onChange={(e) => handleFieldChange("ruler_id", e.target.value)}
                                        options={availableRulers.map(r => ({ value: String(r.ruler_id), label: r.ruler_name }))}
                                        placeholder={!formData.material_id ? "اختر المادة أولاً" : "اختر المسطرة..."}
                                        className="w-full text-sm"
                                        disabled={!formData.material_id}
                                    />
                                </div>

                                <div className="p-3 border-b-2 border-dashed border-gray-300">
                                    <Label className="font-bold text-sm mb-2 block">اللون</Label>
                                    <FilterSelect
                                        value={currentItem.color_id}
                                        onChange={(e) => {
                                            setCurrentItem(prev => ({ ...prev, color_id: e.target.value }));
                                            setActiveTextTarget(null);
                                        }}
                                        searchValue={colorSearchCode}
                                        onSearchValueChange={(v) => setColorSearchCode(v)}
                                        onInputFocus={() => setActiveTextTarget("color_search")}
                                        keepOpen={activeTextTarget === "color_search"}
                                        showSelectedImage={true}
                                        options={colorOptions}
                                        placeholder={
                                            !formData.ruler_id
                                                ? "اختر المسطرة أولاً"
                                                : !currentItem.width
                                                    ? "اختر العرض أولاً"
                                                    : colorOptions.length === 0
                                                        ? "لا توجد ألوان مسعرة"
                                                        : "اختر اللون..."
                                        }
                                        className="w-full text-sm"
                                        disabled={!formData.ruler_id || !currentItem.width}
                                    />
                                </div>

                            </div>
                            <Card className="flex-shrink-0 p-4">
                                <Label className="font-bold text-base mb-3 block">معلومات الطلب</Label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-2">

                                    <div>
                                        <Label className="font-bold text-xs mb-1 block">الكمية</Label>
                                        <Input
                                            type="number"
                                            value={currentItem.length}
                                            onChange={(e) => handleItemFieldChange("length", e.target.value)}
                                            onFocus={() => {
                                                setActiveField("length");
                                                setActiveTextTarget(null);
                                            }}
                                            placeholder="مثال: 100"
                                            className="h-10 text-sm"
                                        />
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
                                        <Label className="font-bold text-sm mb-1 block">رقم الطبخة</Label>
                                        <FilterSelect
                                            value={formData.batch_id}
                                            onChange={(e) => {
                                                handleFieldChange("batch_id", e.target.value);
                                                setActiveTextTarget(null);
                                            }}
                                            options={batchOptions}
                                            searchValue={batchSearchTerm}
                                            onSearchValueChange={(v) => setBatchSearchTerm(v)}
                                            onInputFocus={() => setActiveTextTarget("batch_search")}
                                            keepOpen={activeTextTarget === "batch_search"}
                                            placeholder="اختر الطبخة..."
                                            className="w-full text-sm"
                                        />
                                    </div>



                                    <div>
                                        {isWarehouseSelected ? (
                                            <>
                                                <Label className="font-bold text-sm mb-1 block">الوجهة</Label>
                                                <FilterSelect
                                                    value={currentItem.destination}
                                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, destination: e.target.value }))}
                                                    options={DESTINATION_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                                                    className="w-full text-sm"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Label className="font-bold text-sm mb-1 block">المصدر</Label>
                                                <FilterSelect
                                                    value={currentItem.source}
                                                    onChange={(e) => setCurrentItem(prev => ({ ...prev, source: e.target.value }))}
                                                    options={SOURCE_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                                                    className="w-full text-sm"
                                                />
                                            </>
                                        )}
                                    </div>


                                </div>
                                <div>
                                    <Label className="font-bold text-sm mb-1 block">ملاحظات</Label>
                                    <Input
                                        value={currentItem.notes}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="ملاحظات إضافية..."
                                        className="h-10 text-sm"
                                    />
                                </div>
                            </Card>

                            <div className="mt-auto">
                                <div className="flex gap-2">
                                    {editingItemId && (
                                        <button
                                            onClick={cancelEdit}
                                            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors h-14"
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                    <Button
                                        onClick={addProductionItem}
                                        className={`${editingItemId ? 'flex-1' : 'w-full'} h-14 text-lg font-bold ${editingItemId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
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
                            </div>
                            {/* <Card className="p-4">
                                <Label className="font-bold text-base mb-3 block">إضافة عنصر إنتاج</Label>
                                <div className="space-y-3">
                                    

                                </div>
                            </Card> */}
                            {/* 
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-1">ملخص الطلب</div>
                                        <div className="text-xs space-y-1">
                                            <div>اللون: {colors.find(c => String(c.color_id) === formData.color_id)?.color_name || '-'}</div>
                                            <div>الطبخة: {batches.find(b => String(b.batch_id) === formData.batch_id)?.batch_number || '-'}</div>
                                            <div>النوع: {formatTypeItem(formData.type_item)}</div>
                                            <div>السماكة: {formData.thickness} مم</div>
                                            <div>عدد العناصر: {productionItems.length}</div>
                                        </div>
                                    </div>

                                </div>
                            </Card> */}
                        </div>

                        {/* العمود الأيسر - أنواع الإنتاج وجدول العناصر */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            <Card className="flex-shrink-0 p-4">
                                <Label className="font-bold text-base block">أنواع الإنتاج</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRODUCTION_TYPES.map(type => {
                                        const Icon = type.icon;
                                        const isSelected = currentItem.production_types?.includes(type.value);
                                        const isDisabled = type.value === ProductionType.warehouse && currentItem.production_types?.some(t => t !== ProductionType.warehouse) ||
                                            type.value !== ProductionType.warehouse && currentItem.production_types?.includes(ProductionType.warehouse);
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => !isDisabled && handleProductionTypeToggle(type.value)}
                                                disabled={isDisabled}
                                                className={`
                                                    py-3 px-3 rounded-xl text-sm font-bold border-2
                                                    transition-all touch-manipulation active:scale-95 min-h-[48px]
                                                    flex items-center justify-center gap-2
                                                    ${isSelected
                                                        ? "border-green-600 bg-green-50 text-green-700"
                                                        : isDisabled
                                                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "border-gray-300 bg-white hover:border-gray-400"
                                                    }
                                                `}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {type.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center px-2 border-b bg-gray-50 flex-shrink-0">
                                    <span className="font-bold text-sm">العناصر المضافة: {productionItems.length}</span>
                                    {productionItems.length > 0 && (
                                        <button
                                            onClick={clearAllItems}
                                            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg touch-manipulation active:scale-95 transition-transform flex items-center gap-1"
                                            title="مسح جميع العناصر"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-xs font-medium">مسح العناصر</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-auto min-h-0">
                                    <table className="min-w-[520px] w-full table-fixed border-collapse">
                                        <thead className="bg-gray-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-1 text-center border-b w-20">العرض</th>
                                                <th className="p-1 text-center border-b w-20">الكمية</th>
                                                <th className="p-1 text-center border-b w-20">أنواع الإنتاج</th>
                                                <th className="p-1 text-center border-b w-20">اللون</th>
                                                <th className="p-1 text-center border-b w-20">المصدر</th>
                                                <th className="p-1 text-center border-b w-20">الوجهة</th>
                                                <th className="p-1 text-center border-b w-20">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productionItems.map(item => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleEditItem(item)}
                                                >
                                                    <td className="p-1 text-center text-sm">{item.width}</td>
                                                    <td className="p-1 text-center text-sm">{item.length}</td>
                                                    <td className="p-1 text-center text-xs">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {item.production_types.map(type => {
                                                                const typeInfo = PRODUCTION_TYPES.find(t => t.value === type);
                                                                return (
                                                                    <span key={type} className="bg-gray-100 px-2 py-0.5 rounded-full">
                                                                        {typeInfo?.label || type}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-1 text-center text-sm font-mono">{colors.find(c => String(c.color_id) === String(item.color_id || formData.color_id))?.color_code || '-'}</td>
                                                    <td className="p-1 text-center text-sm">
                                                        {(() => {
                                                            const isItemWarehouse = item.production_types?.includes(ProductionType.warehouse);
                                                            if (isItemWarehouse) {
                                                                return '-';
                                                            } else {
                                                                const sourceOption = SOURCE_OPTIONS.find(s => s.value === (item.source || formData.source));
                                                                return sourceOption?.label || '-';
                                                            }
                                                        })()}
                                                    </td>
                                                    <td className="p-1 text-center text-sm">
                                                        {(() => {
                                                            const isItemWarehouse = item.production_types?.includes(ProductionType.warehouse);
                                                            if (isItemWarehouse) {
                                                                const destinationOption = DESTINATION_OPTIONS.find(s => s.value === (item.destination || formData.destination));
                                                                return destinationOption?.label || '-';
                                                            } else {
                                                                return '-';
                                                            }
                                                        })()}
                                                    </td>
                                                    <td className="p-1 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeItem(item.id);
                                                            }}
                                                            className="text-secondary-s hover:bg-red-50 p-1.5 rounded-lg"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {productionItems.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        لا توجد عناصر مضافة
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-2 pt-1 flex justify-end">
                                    <Button
                                        onClick={() => setShowPreview(true)}
                                        disabled={loading || productionItems.length === 0 || productionItems.some(item => !item.color_id)}
                                        className="h-12 text-base px-6 bg-secondary-s hover:brightness-110 text-white font-bold"
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
                        <div className="flex justify-between items-center mb-2 flex-shrink-0 w-full">
                            <h2 className="font-bold text-lg">سجل طلبات الإنتاج</h2>
                        </div>

                        {/* First row - Search and filters */}
                        <div className="flex  gap-2 mb-2">
                            <Input
                                type="text"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 p-6 flex-1 max-w-[400px] text-sm"
                            />
                            <FilterSelect
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={[
                                    { value: "", label: "كل الحالات" },
                                    { value: "pending", label: "معلق" },
                                    { value: "preparing", label: "قيد التحضير" },
                                    { value: "in_progress", label: "قيد التنفيذ" },
                                    { value: "completed", label: "مكتمل" },
                                    { value: "cancelled", label: "ملغي" },
                                ]}
                                className="h-8 text-sm max-w-[250px]"
                            />
                            <FilterSelect
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                options={[
                                    { value: "", label: "كل الأنواع" },
                                    { value: "machine", label: "مكنة" },
                                    { value: "presser", label: "كوي" },
                                ]}
                                className="h-8 text-sm max-w-[250px]"
                            />

                        </div>

                        {/* Second row - Action buttons */}
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                onClick={loadProductionOrders}
                                className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white"
                                disabled={loadingOrders}
                            >
                                {loadingOrders ? (
                                    <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4 ml-1" />
                                )}
                                تحديث
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="px-4 py-2 text-sm"
                                onClick={() => {
                                    handleExportProduction();
                                }}
                                disabled={exportingProduction || filteredProductionOrders.length === 0}
                            >
                                <Download className="w-4 h-4 ml-1" />
                                {exportingProduction ? "جارٍ التصدير..." : "تصدير Excel"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="px-4 py-2 text-sm"
                                onClick={() => {
                                    // طباعة
                                    window.print();
                                }}
                            >
                                <Printer className="w-4 h-4 ml-1" />
                                طباعة
                            </Button>
                        </div>

                        {/* Width Tabs */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                            {[
                                { value: "all", label: "الكل" },
                                { value: "22", label: "22" },
                                { value: "44", label: "44" },
                                { value: "66", label: "66" },
                            ].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => setWidthTab(tab.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${widthTab === tab.value
                                            ? "bg-primary-f text-white"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    عرض {tab.label}
                                </button>
                            ))}
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
                                        <th className="p-2 text-center border-b w-24">العرض</th>
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
                                        <tr><td colSpan="11" className="p-6"><LoadingState /></td></tr>
                                    ) : filteredProductionOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد طلبات إنتاج
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProductionOrders.map((order, index) => {
                                            const statusBadge = productionApi.getStatusBadge(order.status);
                                            return (
                                                <tr key={order.production_order_id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 font-medium text-sm">#{startIndex + index + 1}</td>
                                                    <td className="p-2 text-sm">{productionApi.getFormattedDate(order.created_at)}</td>
                                                    <td className="p-2 text-sm">{productionApi.formatIssuedBy(order.issued_by)}</td>
                                                    <td className="p-2 text-sm">{order.color_name} ({order.color_code})</td>
                                                    <td className="p-2 text-center text-sm">{order.width}</td>
                                                    <td className="p-2 text-center text-sm">
                                                        {formatTypeItem(order.type_item)}
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
                                                                onClick={() => handleDeleteOrder(order)}
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

                        {/* Pagination Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border-t">
                            <ResultsCounter
                                currentPage={currentPage}
                                totalPages={totalPages}
                                rowsPerPage={rowsPerPage}
                                totalResults={filteredProductionOrders.length}
                            />
                            <div className="flex items-center gap-2">
                                <RowsPerPageSelector
                                    value={rowsPerPage}
                                    onChange={setRowsPerPage}
                                />
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
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
                contentClassName="w-screen max-w-[100vw] max-h-screen max-h-screen p-4"
            >
                <div className="space-y-4">


                    {/* عناصر الإنتاج مع تفاصيل موسعة */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <h3 className="font-bold text-green-700 mb-2 text-sm flex items-center">
                            <Package className="w-4 h-4 ml-1" />
                            عناصر الإنتاج ({productionItems.length})
                        </h3>
                        <div className="border rounded-lg bg-white">
                            <table className="w-full text-sm table-fixed">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-center border-b">#</th>
                                        <th className="p-2 text-center border-b">العرض</th>
                                        <th className="p-2 text-center border-b">الكمية</th>
                                        <th className="p-2 text-center border-b">أنواع الإنتاج</th>
                                        <th className="p-2 text-center border-b">المصدر</th>
                                        <th className="p-2 text-center border-b">الوجهة</th>
                                        <th className="p-2 text-center border-b">المرحلة التالية</th>
                                        <th className="p-2 text-center border-b">حالة العنصر</th>
                                        <th className="p-2 text-center border-b">اللون</th>
                                        <th className="p-2 text-center border-b">الطبخة</th>
                                        <th className="p-2 text-center border-b">الملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productionItems.map((item, index) => {
                                        const productionTypes = item.production_types || [];
                                        // تحديد المصدر (أول نوع إنتاج)
                                        const source = productionTypes.length > 0 ? productionTypes[0] : null;
                                        // تحديد الوجهة (آخر نوع إنتاج)
                                        const destination = productionTypes.length > 0 ? productionTypes[productionTypes.length - 1] : null;

                                        // تحديد ما إذا كان سيتم إنشاء عدة عناصر (حسب أنواع الإنتاج)
                                        const willCreateMultipleItems = productionTypes.length > 1;

                                        return (
                                            <tr key={index} className="border-t hover:bg-gray-50">
                                                <td className="p-2 text-center font-medium">{index + 1}</td>
                                                <td className="p-2 text-center font-mono">{item.width}</td>
                                                <td className="p-2 text-center font-mono">{item.length}</td>
                                                <td className="p-2 text-center">
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {productionTypes.map((type, idx) => {
                                                            const typeInfo = PRODUCTION_TYPES.find(t => t.value === type);
                                                            return (
                                                                <span
                                                                    key={type}
                                                                    className={`
                                                            px-2 py-0.5 rounded-full text-xs font-medium
                                                            ${type === ProductionType.warehouse ? 'bg-blue-100 text-blue-700' : ''}
                                                            ${type === ProductionType.slitting ? 'bg-purple-100 text-purple-700' : ''}
                                                            ${type === ProductionType.cutting ? 'bg-orange-100 text-orange-700' : ''}
                                                            ${type === ProductionType.gluing ? 'bg-green-100 text-green-700' : ''}
                                                        `}
                                                                    title={idx === 0 ? 'المصدر' : idx === productionTypes.length - 1 ? 'الوجهة' : 'مرحلة وسيطة'}
                                                                >
                                                                    {typeInfo?.label || type}
                                                                    {idx === 0 && ' →'}
                                                                    {idx === productionTypes.length - 1 && idx !== 0 && ' ✓'}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center">
                                                    {(() => {
                                                        const isItemWarehouse = item.production_types?.includes(ProductionType.warehouse);
                                                        if (isItemWarehouse) {
                                                            return '-';
                                                        } else {
                                                            const sourceOption = SOURCE_OPTIONS.find(s => s.value === (item.source || formData.source));
                                                            return sourceOption ? (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                    {sourceOption.label}
                                                                </span>
                                                            ) : '-';
                                                        }
                                                    })()}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {(() => {
                                                        const isItemWarehouse = item.production_types?.includes(ProductionType.warehouse);
                                                        if (isItemWarehouse) {
                                                            const destinationOption = DESTINATION_OPTIONS.find(s => s.value === (item.destination || formData.destination));
                                                            return destinationOption ? (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                    {destinationOption.label}
                                                                </span>
                                                            ) : '-';
                                                        } else {
                                                            return '-';
                                                        }
                                                    })()}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {destination ? (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            {(() => {
                                                                if (destination === ProductionType.slitting) return "تقطيع";
                                                                if (destination === ProductionType.cutting) return "قص";
                                                                if (destination === ProductionType.gluing) return "لصق";
                                                                if (destination === ProductionType.warehouse) return "مستودع";
                                                                return "إنتاج";
                                                            })()}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {willCreateMultipleItems ? (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium" title="سيتم إنشاء عنصر منفصل لكل نوع إنتاج">
                                                            متعدد ({productionTypes.length})
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                            مفرد
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {(() => {
                                                        const colorOption = colorOptions.find(c => String(c.value) === String(item.color_id));
                                                        return colorOption ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                {colorOption.imageUrl && (
                                                                    <img
                                                                        src={colorOption.imageUrl}
                                                                        alt={colorOption.label}
                                                                        className="w-4 h-4 rounded border border-gray-300"
                                                                    />
                                                                )}
                                                                <span className="text-xs">{colorOption.label}</span>
                                                            </div>
                                                        ) : '-';
                                                    })()}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {(() => {
                                                        const batchOption = batchOptions.find(b => String(b.value) === String(formData.batch_id));
                                                        return batchOption ? batchOption.label : '-';
                                                    })()}
                                                </td>
                                                <td className="p-2 text-center text-xs max-w-[100px] truncate" title={item.notes}>
                                                    {item.notes || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {productionItems.length === 0 && (
                                        <tr>
                                            <td colSpan="11" className="p-8 text-center text-gray-400">
                                                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد عناصر مضافة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                
                    </div>
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
                                <div className="font-bold text-sm">{selectedOrder.batch?.batch_number || selectedOrder.batch_number || '-'}</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">النوع</div>
                                <div className="font-bold text-sm">
                                    {formatTypeItem(selectedOrder.type_item)}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <div className="text-xs text-gray-500">السماكة</div>
                                <div className="font-bold text-sm">{selectedOrder.thickness} مم</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg col-span-2">
                                <div className="text-xs text-gray-500">الحالة</div>
                                <div className="font-bold text-sm mt-3">
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
                                    <table className="min-w-[700px] w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-center">العرض</th>
                                                <th className="p-2 text-center">الكمية</th>
                                                <th className="p-2 text-center">رقم الطبخة</th>
                                                <th className="p-2 text-center">النوع</th>
                                                <th className="p-2 text-center">المصدر</th>
                                                <th className="p-2 text-center">الوجهة</th>
                                                <th className="p-2 text-center">المرحلة التالية</th>
                                                <th className="p-2 text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrderItems.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2 text-center">{item.width}</td>
                                                    <td className="p-2 text-center">{item.length}</td>
                                                    <td className="p-2 text-center">{item.batch?.batch_number || item.batch_number || item.batch_id || '-'}</td>
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
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${productionApi.getStatusBadge(item.status).className
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

            {showDeleteDialog && orderToDelete && (
                <StyledDialog
                    isOpen={showDeleteDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            setShowDeleteDialog(false);
                            setOrderToDelete(null);
                        }
                    }}
                    title="حذف طلب الإنتاج"
                    onCancel={() => {
                        setShowDeleteDialog(false);
                        setOrderToDelete(null);
                    }}
                    onConfirm={handleConfirmDeleteOrder}
                    confirmLabel="حذف"
                    cancelLabel="إلغاء"
                    confirmVariant="destructive"
                    isLoading={deletingOrder}
                >
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            هل أنت متأكد من حذف طلب الإنتاج؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="text-xs text-gray-500">
                            رقم الطلب: #{orderToDelete.production_order_id}
                        </div>
                    </div>
                </StyledDialog>
            )}

            {/* Logout confirmation dialog */}
            <StyledDialog
                isOpen={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="تسجيل الخروج"
                onCancel={() => setShowLogoutDialog(false)}
                onConfirm={() => {
                    logout();
                    navigate("/login");
                }}
                confirmLabel="تسجيل الخروج"
                cancelLabel="إلغاء"
                confirmVariant="destructive"
            />
        </div>
    );
}
