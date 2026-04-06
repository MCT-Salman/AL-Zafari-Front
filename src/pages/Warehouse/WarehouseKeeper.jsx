import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { warehouseApi } from "../../api/warehouseApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { constantApi } from "../../api/constantApi";
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
import { Package, ArrowRight, Calculator, Eye, Check, X, AlertCircle, Search, RefreshCw, Hash, Printer, ChevronUp, ChevronDown, Trash } from "lucide-react";
import { MovementDestination, ProductionStatus, ProductionType, TypeItem, UserRole } from "../../types/enums";

const FIXED_WIDTH = "66";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
const ROLE_LABELS = {
    [UserRole.admin]: "مدير النظام",
    [UserRole.accountant]: "محاسب",
    [UserRole.cashier]: "كاشير",
    [UserRole.sales]: "مبيعات",
    [UserRole.production_manager]: "مدير الإنتاج",
    [UserRole.Warehouse_Keeper]: "أمين المستودع",
    [UserRole.Warehouse_Products]: "أمين مستودع المنتجات",
    [UserRole.Dissection_Technician]: "فني التشريح",
    [UserRole.Cutting_Technician]: "فني القص",
    [UserRole.Gluing_Technician]: "فني التغرية"
};
const BASE_FORM = {
    material_id: "",
    ruler_id: "",
    color_id: "",
    batch_id: "",
    length: "",
    width: FIXED_WIDTH,
    thickness: "",
    destination: MovementDestination.slitting,
    carton_count: "",
    notes: ""
};

export default function WarehouseKeeper() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [entryTab, setEntryTab] = useState("production");
    const [ordersTab, setOrdersTab] = useState("production");
    const [salesOrdersTab, setSalesOrdersTab] = useState("current");
    const [orders, setOrders] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [lengthValues, setLengthValues] = useState([]);
    const [thicknessValues, setThicknessValues] = useState([]);
    const [qrInput, setQrInput] = useState("");
    // Separate forms for production and sales
    const [productionForm, setProductionForm] = useState(BASE_FORM);
    const [salesForm, setSalesForm] = useState(BASE_FORM);
    const [activeOrderItem, setActiveOrderItem] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showMovementDetails, setShowMovementDetails] = useState(false);
    const [pendingCompleteItem, setPendingCompleteItem] = useState(null);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [pendingOutput, setPendingOutput] = useState(null);
    const [showOutputConfirmDialog, setShowOutputConfirmDialog] = useState(false);
    const [pendingDeleteMovement, setPendingDeleteMovement] = useState(null);
    const [showDeleteMovementDialog, setShowDeleteMovementDialog] = useState(false);
    const [selectedMovements, setSelectedMovements] = useState(new Set());
    const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);
    const [productionEntryMode, setProductionEntryMode] = useState("manual");
    const skipValidationRef = useRef(false);
    const [showHeader, setShowHeader] = useState(true);
    const [currentInput, setCurrentInput] = useState("notes");
    const [showSalesOrderInfo, setShowSalesOrderInfo] = useState(true);
    const [selectSearch, setSelectSearch] = useState({
        ruler: "",
        color: "",
        batch: "",
        thickness: "",
        length: ""
    });

    // Use the appropriate form based on current entry tab
    const outputForm = entryTab === "sales" ? salesForm : productionForm;
    const setOutputForm = entryTab === "sales" ? setSalesForm : setProductionForm;

    useEffect(() => {
        if (!user || user.role !== UserRole.Warehouse_Keeper) {
            toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
            navigate("/dashboard");
        }
    }, [user, navigate]);

    const extractArray = (response, keys = []) => {
        const data = getApiData(response, response);
        if (Array.isArray(data)) return data;
        for (const key of keys) {
            if (Array.isArray(data?.[key])) return data[key];
            if (Array.isArray(response?.[key])) return response[key];
        }
        return [];
    };

    const pvcMaterial = useMemo(
        () => materials.find((m) => String(m?.material_name || "").toLowerCase().includes("pvc")) || null,
        [materials]
    );
    const availableRulers = useMemo(
        () => rulers.filter((r) => String(r.material_id) === String(outputForm.material_id)),
        [rulers, outputForm.material_id]
    );
    const availableColors = useMemo(
        () => colors.filter((c) => String(c.ruler_id) === String(outputForm.ruler_id)),
        [colors, outputForm.ruler_id]
    );
    const sortRecordsDesc = useCallback((list) => {
        return [...list].sort((a, b) => {
            const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
            if (aDate !== bDate) return bDate - aDate;
            const aId = Number(a?.production_order_id || a?.production_order_item_id || a?.movement_id || 0);
            const bId = Number(b?.production_order_id || b?.production_order_item_id || b?.movement_id || 0);
            return bId - aId;
        });
    }, []);
    const sortRecordsAsc = useCallback((list) => {
        return [...list].sort((a, b) => {
            const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
            if (aDate !== bDate) return aDate - bDate;
            const aId = Number(a?.production_order_item_id || a?.production_order_id || 0);
            const bId = Number(b?.production_order_item_id || b?.production_order_id || 0);
            return aId - bId;
        });
    }, []);
    const currentOrders = useMemo(
        () => sortRecordsAsc(orders.filter((o) => String(o.status || "").toLowerCase() !== ProductionStatus.completed)),
        [orders, sortRecordsAsc]
    );
    const completedOrders = useMemo(
        () => sortRecordsAsc(orders.filter((o) => String(o.status || "").toLowerCase() === ProductionStatus.completed)),
        [orders, sortRecordsAsc]
    );
    const pendingSalesOrders = useMemo(
        () => sortRecordsAsc(salesOrders.filter((o) => String(o.status || "").toLowerCase() === "pending")),
        [salesOrders, sortRecordsAsc]
    );
    const completedSalesOrders = useMemo(
        () => sortRecordsAsc(salesOrders.filter((o) => {
            const status = String(o.status || "").toLowerCase();
            return status === "completed" || status === "outofwarehouse";
        })),
        [salesOrders, sortRecordsAsc]
    );
    const sortedMovements = useMemo(() => {
        return [...movements].sort((a, b) => {
            const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
            if (aDate !== bDate) return bDate - aDate; // descending - newest first
            const aId = Number(a?.movement_id || 0);
            const bId = Number(b?.movement_id || 0);
            return bId - aId; // descending
        });
    }, [movements]);
    const colorOptions = useMemo(() => availableColors.map((c) => {
        const rawImage = c.imageUrl || c.image_url || c.color_image || null;
        const imageUrl = rawImage ? (rawImage.startsWith("http") ? rawImage : `${API_BASE_URL}${rawImage}`) : null;
        return { value: String(c.color_id), label: `${c.color_name} (${c.color_code})`, imageUrl };
    }), [availableColors]);
    const batchOptions = useMemo(
        () => batches
            .filter((b) => !outputForm.material_id || String(b.material_id) === String(outputForm.material_id))
            .map((b) => ({ value: String(b.batch_id), label: b.batch_number || `دفعة ${b.batch_id}` })),
        [batches, outputForm.material_id]
    );
    const lengthOptions = useMemo(
        () => lengthValues.map((v) => ({ value: String(v.value), label: v.label || `${v.value} ${v.unit || ""}`.trim() })),
        [lengthValues]
    );
    const thicknessOptions = useMemo(
        () => thicknessValues.map((v) => ({ value: String(v.value), label: v.label || `${v.value} ${v.unit || ""}`.trim() })),
        [thicknessValues]
    );

    const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
    }) : "-";
    const formatDestination = (value) => {
        if (!value) return "-";
        const destinationMap = {
            'slitting': "التشريح",
            'cutting': "القص",
            'production': "الإنتاج",
            'gluing': "التغرية"
        };
        return destinationMap[String(value)] || String(value) || "-";
    };

    const formatSource = (value) => ({
        warehouse: "المستودع",
        slitting: "التشريح",
        cutting: "القص",
        production: "الإنتاج",
        gluing: "التغرية"
    }[value] || value || "-");
    const formatTypeItem = (value) => value === TypeItem.Presser ? "كوي" : value === TypeItem.Machine ? "مكنة" : value || "-";
    const getStatusBadge = (status) => productionApi.getStatusBadge(String(status || "").toLowerCase());

    const getQrUrl = (data) => {
        const encoded = encodeURIComponent(data);
        return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
    };

    const printQr = (url, title = "QR", footer = "") => {
        if (!url) return;
        const win = window.open("", "_blank", "width=420,height=520");
        if (!win) return;
        win.document.write(`
          <html dir="rtl">
            <head><title>${title}</title></head>
            <body style="font-family: Tahoma, Arial, sans-serif; text-align:center; padding:16px;">
              <div style="margin-bottom:12px; font-size:12px; color:#444;">${footer}</div>
              <img src="${url}" style="width:240px;height:240px;border:1px solid #ddd;border-radius:8px;" />
            </body>
          </html>
        `);
        win.document.close();
        win.focus();
        win.print();
    };

    const buildMovementQrData = (movement) => {
        const materialName = movement?.color?.ruler?.material?.material_name || pvcMaterial?.material_name || "PVC";
        const rulerName = movement?.color?.ruler?.ruler_name || "";
        const colorCode = movement?.color?.color_code || "";
        const width = movement?.width || FIXED_WIDTH;
        const thickness = movement?.thickness || "";
        const length = movement?.length || "";
        const batchNumber = movement?.batch?.batch_number || "";
        return [materialName, rulerName, colorCode, width, thickness, length, batchNumber].join("|");
    };

    const buildMovementQrFooter = (movement) => {
        return [
            `${movement?.color?.color_code || "-"}|${movement?.type_item === "Presser" ? "كوي" : "مكنة"}|${movement?.batch?.batch_number || "-"}|${movement?.length || "-"}`
        ].join(" | ");
    };

    const loadSalesOrders = useCallback(async () => {
        try {
            setLoadingSalesOrders(true);
            const token = localStorage.getItem('accessToken');

            // Use the exact original URL format
            const url = `${API_BASE_URL}/order/`;
            console.log('[loadSalesOrders] Fetching from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[loadSalesOrders] HTTP error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.success) {
                const allOrders = data.data || [];
                console.log('[loadSalesOrders] Total orders from API:', allOrders.length);

                // Load details for each order to check items material
                const ordersWithDetails = await Promise.all(
                    allOrders.map(async (order) => {
                        try {
                            const detailsRes = await fetch(`${API_BASE_URL}/order/${order.order_id}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            const detailsData = await detailsRes.json();
                            if (detailsData.success && detailsData.data?.items) {
                                return { ...order, items: detailsData.data.items };
                            }
                            return order;
                        } catch (err) {
                            console.error(`[loadSalesOrders] Error loading details for order ${order.order_id}:`, err);
                            return order;
                        }
                    })
                );

                // Filter items within each order - remove PVC items but keep the order
                const filteredOrders = ordersWithDetails.map(order => {
                    if (!order.items || order.items.length === 0) return order;
                    const nonPvcItems = order.items.filter(item => {
                        const materialName = String(item.material_name || "").toLowerCase();
                        return !materialName.includes("pvc");
                    });
                    return { ...order, items: nonPvcItems };
                }).filter(order => {
                    if (!order.items || order.items.length === 0) return true;
                    return order.items.length > 0;
                });

                console.log('[loadSalesOrders] Setting sales orders:', filteredOrders.length);
                setSalesOrders(filteredOrders);
            } else {
                console.error('[loadSalesOrders] API error:', data.message);
                toast.error(data.message || 'فشل في تحميل طلبات المبيعات');
            }
        } catch (error) {
            console.error('[loadSalesOrders] Error:', error);
            toast.error('فشل في تحميل طلبات المبيعات: ' + error.message);
        } finally {
            setLoadingSalesOrders(false);
        }
    }, [API_BASE_URL]);

    // Create a ref to always have access to the latest loadSalesOrders function
    const loadSalesOrdersRef = useRef(loadSalesOrders);
    useEffect(() => {
        loadSalesOrdersRef.current = loadSalesOrders;
        console.log("[Ref] loadSalesOrders updated:", typeof loadSalesOrders);
    }, [loadSalesOrders]);

    // Debug: expose function to window for testing
    useEffect(() => {
        window.__debugLoadSalesOrders = () => {
            console.log("[Debug] Manually calling loadSalesOrders...");
            console.log("[Debug] Ref current:", loadSalesOrdersRef.current);
            console.log("[Debug] Type:", typeof loadSalesOrdersRef.current);
            if (typeof loadSalesOrdersRef.current === 'function') {
                loadSalesOrdersRef.current();
                return "Called successfully";
            }
            return "Ref is not a function: " + loadSalesOrdersRef.current;
        };
        window.__debugSalesOrdersState = () => {
            console.log("[Debug] Current salesOrders state:", salesOrders);
            return salesOrders;
        };
        return () => {
            delete window.__debugLoadSalesOrders;
            delete window.__debugSalesOrdersState;
        };
    }, [salesOrders]);

    const loadOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await warehouseApi.getWarehouseOrders({ type: ProductionType.warehouse });
            const data = getApiData(response, response?.data ?? response);
            setOrders(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
        } catch (error) {
            console.error(error);
            toast.error("فشل في تحميل الطلبات");
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadMovements = async () => {
        try {
            setLoadingMovements(true);
            const response = await warehouseApi.getWarehouseMovements();
            setMovements(response?.data?.movements || []);
        } catch (error) {
            console.error(error);
            toast.error("فشل في تحميل المخرجات");
        } finally {
            setLoadingMovements(false);
        }
    };

    const loadConstants = useCallback(async (materialId) => {
        if (!materialId) return;
        try {
            const [lengthRes, thicknessRes] = await Promise.all([
                constantApi.getConstantValuesByMaterial(materialId, "height"),
                constantApi.getConstantValuesByMaterial(materialId, "thickness")
            ]);
            const lengths = getApiData(lengthRes, []) || [];
            const thicknesses = getApiData(thicknessRes, []) || [];
            const defaultLength = lengths.find((v) => v.isDefault) || lengths[0];
            const defaultThickness = thicknesses.find((v) => v.isDefault) || thicknesses[0];
            setLengthValues(lengths);
            setThicknessValues(thicknesses);
            setOutputForm((prev) => ({
                ...prev,
                material_id: String(materialId),
                width: FIXED_WIDTH,
                destination: prev.destination || MovementDestination.slitting,
                length: prev.length || (defaultLength ? String(defaultLength.value) : ""),
                thickness: prev.thickness || (defaultThickness ? String(defaultThickness.value) : "")
            }));
        } catch (error) {
            console.error(error);
            toast.error("فشل في تحميل ثوابت الكمية أو السماكة");
        }
    }, []);

    useEffect(() => {
        const loadRefs = async () => {
            const results = await Promise.allSettled([
                colorApi.getColors(),
                batchApi.getBatches(),
                materialApi.getMaterials(),
                rulerApi.getRulers()
            ]);
            const [colorRes, batchRes, materialRes, rulerRes] = results.map((r) => r.status === "fulfilled" ? r.value : null);
            setColors(extractArray(colorRes, ["colors", "data"]));
            setBatches(extractArray(batchRes, ["batches", "data"]));
            setMaterials(extractArray(materialRes, ["materials", "data"]));
            setRulers(extractArray(rulerRes, ["rulers", "data"]));
        };
        loadRefs();
        loadOrders();
        loadSalesOrders();
        loadMovements();
    }, []);

    useEffect(() => {
        if (!pvcMaterial) return;
        const materialId = String(pvcMaterial.material_id);
        setOutputForm((prev) => ({ ...prev, material_id: materialId, width: FIXED_WIDTH, destination: MovementDestination.slitting }));
        loadConstants(materialId);
    }, [pvcMaterial, loadConstants]);

    useEffect(() => {
        if (skipValidationRef.current) return;
        if (outputForm.ruler_id && !availableRulers.some((r) => String(r.ruler_id) === String(outputForm.ruler_id))) {
            setOutputForm((prev) => ({ ...prev, ruler_id: "", color_id: "" }));
        }
    }, [availableRulers, outputForm.ruler_id]);

    useEffect(() => {
        if (skipValidationRef.current) return;
        if (outputForm.color_id && !availableColors.some((c) => String(c.color_id) === String(outputForm.color_id))) {
            setOutputForm((prev) => ({ ...prev, color_id: "" }));
        }
    }, [availableColors, outputForm.color_id]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const socket = connectSocket(token);
        let originalOnevent = null;

        // Debug socket connection
        console.log("[Socket] Initializing...", socket?.id);

        const refresh = (data) => {
            console.log("[Socket] Production event received:", data);
            loadOrders();
            loadMovements();
            loadSalesOrdersRef.current?.();
            if (data && (data.order_id || data.sales_order_id)) {
                const orderId = data.order_id || data.sales_order_id;
                toast.custom(
                    (t) => (
                        <div className={`pointer-events-auto flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-lg ${t.visible ? "animate-enter" : "animate-leave"}`}>
                            <div className="text-sm font-medium text-gray-800">طلب جديد #{orderId}</div>
                            <button type="button" className="ml-auto rounded-md border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50" onClick={() => toast.dismiss(t.id)}>إغلاق</button>
                        </div>
                    ),
                    { duration: Infinity, id: `warehouse-new-order-${orderId}` }
                );
            }
        };

        const refreshSalesOnly = (data) => {
            console.log("[Socket] Sales order event received:", data);
            console.log("[Socket] Calling loadSalesOrders...");
            // Directly call the function through ref
            if (typeof loadSalesOrdersRef.current === 'function') {
                loadSalesOrdersRef.current();
            } else {
                console.error("[Socket] loadSalesOrdersRef.current is not a function");
            }
            if (data && (data.order_id || data.sales_order_id)) {
                const orderId = data.order_id || data.sales_order_id;
                toast.success(`طلب مبيعات جديد #${orderId} - يرجى التحقق من الطلبات الواردة`);
            }
        };

        const handleNotification = (data) => {
            console.log("[Socket] Notification received:", data);
            const type = data?.type || "";
            const lowerType = String(type).toLowerCase();
            console.log("[Socket] Notification type:", type, "lower:", lowerType);
            
            // Handle sales orders - ORDER_NEW, sales_order, etc.
            if (lowerType.includes('sales') || lowerType.includes('order') || lowerType.includes('طلب')) {
                console.log("[Socket] ✓ Matched sales/order condition, reloading sales orders");
                const fn = loadSalesOrdersRef.current;
                if (typeof fn === 'function') {
                    console.log("[Socket] Calling loadSalesOrdersRef.current()...");
                    fn();
                } else {
                    console.error("[Socket] loadSalesOrdersRef.current is not a function:", fn);
                }
            }
            
            // Handle production/warehouse notifications
            if (lowerType.includes('production') || lowerType.includes('warehouse') || lowerType.includes('مستودع') || lowerType.includes('إنتاج')) {
                console.log("[Socket] ✓ Matched production/warehouse condition, reloading orders and movements");
                loadOrders();
                loadMovements();
            }
        };

        if (socket) {
            socket.on("connect", () => {
                console.log("[Socket] Connected:", socket.id);
                loadOrders();
                loadMovements();
                loadSalesOrdersRef.current?.();
            });

            // Production orders events
            ["ORDER_NEW", "warehouse:orders", "warehouse:order:new", "order:new", "order:updated"]
                .forEach((name) => socket.on(name, refresh));

            // Sales orders specific events - use inline function to avoid stale closure
            ["sales_order:new", "sales_order:created", "sales:order:new", "order:sales:new", "sales:new", "new:sales_order", "sales_order:updated"]
                .forEach((name) => socket.on(name, (data) => {
                    console.log(`[Socket] ${name} event received:`, data);
                    console.log("[Socket] Calling loadSalesOrders via ref...");
                    const fn = loadSalesOrdersRef.current;
                    if (typeof fn === 'function') {
                        fn();
                    } else {
                        console.error("[Socket] loadSalesOrdersRef.current is not a function:", fn);
                    }
                    if (data && (data.order_id || data.sales_order_id)) {
                        const orderId = data.order_id || data.sales_order_id;
                        toast.success(`طلب مبيعات جديد #${orderId} - يرجى التحقق من الطلبات الواردة`);
                    }
                }));

            // Notification events
            ["notification", "warehouse:notification", "order:notification", "sales:notification"]
                .forEach((name) => socket.on(name, handleNotification));

            // Debug: log ALL raw events
            if (socket.onevent) {
                originalOnevent = socket.onevent.bind(socket);
                socket.onevent = function(packet) {
                    console.log("[Socket] Raw event:", packet.data?.[0], packet.data?.[1]);
                    if (originalOnevent) originalOnevent.call(socket, packet);
                };
            }

            socket.on("disconnect", () => console.log("[Socket] Disconnected"));
            socket.on("connect_error", (error) => console.error("[Socket] Connection error:", error));

            // Check connection status
            setTimeout(() => {
                console.log("[Socket] Status:", socket.connected, "ID:", socket.id);
            }, 3000);
        }

        return () => {
            if (socket) {
                ["ORDER_NEW", "warehouse:orders", "warehouse:order:new", "order:new", "order:updated"].forEach((name) => socket.off(name, refresh));
                // Remove all listeners for sales order events
                ["sales_order:new", "sales_order:created", "sales:order:new", "order:sales:new", "sales:new", "new:sales_order", "sales_order:updated"]
                    .forEach((name) => socket.off(name));
                ["notification", "warehouse:notification", "order:notification", "sales:notification"].forEach((name) => socket.off(name, handleNotification));
                if (originalOnevent && socket.onevent) socket.onevent = originalOnevent;
            }
        };
    }, []);



    const parseQrData = (raw) => {
        const parts = String(raw || "").split("|").map((p) => String(p || "").trim());
        if (parts.length < 7) return null;
        const [material_name, ruler_name, color_code, , thickness, quantity, batch_number] = parts;
        return { material_name, ruler_name, color_code, thickness, quantity, batch_number };
    };

    const applyQrData = () => {
        const parsed = parseQrData(qrInput);
        if (!parsed) return toast.error("تنسيق QR غير صحيح");
        const normalize = (value) => String(value || "").trim().toLowerCase();
        const ruler = rulers.find((r) =>
            normalize(r.ruler_name) === normalize(parsed.ruler_name) &&
            String(r.material_id) === String(pvcMaterial?.material_id)
        );
        const color = colors.find((c) =>
            normalize(c.color_code) === normalize(parsed.color_code) &&
            (!ruler || String(c.ruler_id) === String(ruler.ruler_id))
        );
        const batch = batches.find((b) => normalize(b.batch_number) === normalize(parsed.batch_number));
        setOutputForm((prev) => ({
            ...prev,
            material_id: pvcMaterial ? String(pvcMaterial.material_id) : prev.material_id,
            ruler_id: ruler ? String(ruler.ruler_id) : "",
            color_id: color ? String(color.color_id) : "",
            batch_id: batch ? String(batch.batch_id) : "",
            length: lengthValues.find((v) => String(v.value) === String(parsed.quantity)) ? String(parsed.quantity) : prev.length,
            thickness: thicknessValues.find((v) => String(v.value) === String(parsed.thickness)) ? String(parsed.thickness) : prev.thickness,
            width: FIXED_WIDTH,
            destination: MovementDestination.slitting
        }));
        setEntryTab("manual");
        toast.success("تم تطبيق بيانات QR");
    };

    const updateSalesOrderStatus = async (orderId, status) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/order/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (data.success) {
                setSalesOrders(prev => prev.map(order =>
                    order.order_id === orderId ? { ...order, status } : order
                ));
                toast.success('تم تحديث حالة الطلب بنجاح');
            } else {
                toast.error(data.message || 'فشل في تحديث حالة الطلب');
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل في تحديث حالة الطلب');
        }
    };

    const loadSalesOrderDetails = async (orderId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/order/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log(`[loadSalesOrderDetails] Order ${orderId} response:`, data);
            if (data.success) {
                // Filter out PVC items from the order details
                if (data.data && data.data.items) {
                    const nonPvcItems = data.data.items.filter(item => {
                        const materialName = String(item.material_name || "").toLowerCase();
                        return !materialName.includes("pvc");
                    });
                    return { ...data.data, items: nonPvcItems };
                }
                return data.data;
            } else {
                toast.error(data.message || 'فشل في تحميل تفاصيل الطلب');
                return null;
            }
        } catch (error) {
            console.error('[loadSalesOrderDetails] Error:', error);
            toast.error('فشل في تحميل تفاصيل الطلب');
            return null;
        }
    };

    const handleSalesOrderSelect = async (order) => {
        setSelectedOrder(order);
        setShowSalesOrderInfo(false); // Hide info card in inputs - only show in dialog
        try {
            setLoadingOrderDetails(true);
            const details = await loadSalesOrderDetails(order.order_id);
            if (details && details.items) {
                // تحديث معلومات الطلب مع العناصر
                setSelectedOrder({
                    ...order,
                    items: details.items
                });
                // تلقائياً انتقل إلى مدخلات طلبات المبيعات
                setEntryTab("sales");
                // عرض تفاصيل الطلب في الديالوج فقط
                setShowOrderDetails(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("فشل في تحميل تفاصيل الطلب");
        } finally {
            setLoadingOrderDetails(false);
        }
    };

    const handleOrderSelect = async (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
        setEntryTab("production"); // Automatically switch to production inputs tab
        try {
            setLoadingOrderDetails(true);
            const response = await warehouseApi.getProductionOrderItems(order.production_order_id);
            const data = getApiData(response, response?.data ?? response);
            setOrderItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("فشل في تحميل تفاصيل الطلب");
            setOrderItems([]);
        } finally {
            setLoadingOrderDetails(false);
        }
    };

    const handleApplyOrderToInputs = (item) => {
        const color = item.color || colors.find((c) => String(c.color_id) === String(item.color_id));
        const rulerId = item.ruler_id || color?.ruler_id || color?.ruler?.ruler_id;
        // Fill production form and clear sales form
        setProductionForm({
            material_id: pvcMaterial ? String(pvcMaterial.material_id) : "",
            ruler_id: rulerId ? String(rulerId) : "",
            color_id: item.color_id ? String(item.color_id) : "",
            batch_id: item.batch_id ? String(item.batch_id) : "",
            length: "",
            width: FIXED_WIDTH,
            thickness: item.thickness ? String(item.thickness) : "",
            destination: item.destination || MovementDestination.slitting,
            carton_count: "",
            notes: item.notes || ""
        });
        // Clear sales form completely
        setSalesForm(BASE_FORM);
        setActiveOrderItem(item);
        setEntryTab("production");
        setProductionEntryMode("manual");
    };

    const updateLocalStatus = (itemId, status) => {
        setOrders((prev) => prev.map((o) => String(o.production_order_item_id) === String(itemId) ? { ...o, status } : o));
        setOrderItems((prev) => prev.map((o) => String(o.production_order_item_id) === String(itemId) ? { ...o, status } : o));
    };

    const handleCompleteOrderItem = async (item, showToast = true) => {
        if (!item?.production_order_item_id) return;
        try {
            await productionApi.updateProductionItemStatus(item.production_order_item_id, ProductionStatus.completed);
            updateLocalStatus(item.production_order_item_id, ProductionStatus.completed);
            if (activeOrderItem?.production_order_item_id === item.production_order_item_id) setActiveOrderItem(null);
            if (showToast) toast.success("تم إتمام الطلب ونقله إلى المكتمل");
            loadOrders();
        } catch (error) {
            console.error(error);
            toast.error(error?.message || "فشل تحديث حالة الطلب");
        }
    };

    const requestCompleteOrderItem = (item) => {
        if (!item?.production_order_item_id) return;
        setPendingCompleteItem(item);
        setShowCompleteDialog(true);
    };

    // Sales Orders Handlers
    const handleApplySalesOrderToInputs = (order) => {
        // Select the sales order and switch to sales inputs tab
        setSelectedOrder(order);
        setShowSalesOrderInfo(false); // Hide the info card when using input action
        setEntryTab("sales");

        // Always load order details to get items (list only has count_items, not the actual items)
        loadSalesOrderDetails(order.order_id).then(details => {
            if (details && details.items && details.items.length > 0) {
                const updatedOrder = { ...order, items: details.items };
                setSelectedOrder(updatedOrder);
                // Fill form with first item data
                fillSalesOrderForm(details.items[0]);
            } else {
                toast.error("لا يوجد عناصر في هذا الطلب");
            }
        });
    };

    const fillSalesOrderForm = (item) => {
        if (!item) {
            console.log("[fillSalesOrderForm] No item provided");
            return;
        }

        console.log("[fillSalesOrderForm] Item:", item);
        console.log("[fillSalesOrderForm] Available colors count:", colors.length);
        console.log("[fillSalesOrderForm] Available batches count:", batches.length);
        console.log("[fillSalesOrderForm] Looking for color_code:", item.color_code);
        console.log("[fillSalesOrderForm] Looking for batch_id:", item.batch_id, "or batch_number:", item.batch_number);

        // Find color by color_code (string comparison)
        const color = colors.find((c) => String(c.color_code).trim() === String(item.color_code).trim());
        console.log("[fillSalesOrderForm] Found color:", color);

        const rulerId = color?.ruler_id || color?.ruler?.ruler_id;
        console.log("[fillSalesOrderForm] rulerId from color:", rulerId);

        // Find the actual ruler from rulers array to get material_id
        const ruler = rulers.find((r) => String(r.ruler_id) === String(rulerId));
        console.log("[fillSalesOrderForm] Found ruler:", ruler);

        const materialId = ruler?.material_id ? String(ruler.material_id) : (pvcMaterial ? String(pvcMaterial.material_id) : "");
        console.log("[fillSalesOrderForm] materialId:", materialId);

        // Use batch_id directly if available, otherwise find by batch_number
        const batchId = item.batch_id
            ? String(item.batch_id)
            : batches.find((b) => String(b.batch_number).trim() === String(item.batch_number).trim())?.batch_id;
        console.log("[fillSalesOrderForm] batchId:", batchId);

        // Use quantity as length (quantity is the length value)
        const lengthValue = item.quantity || item.length;
        console.log("[fillSalesOrderForm] lengthValue:", lengthValue);

        // Fill sales form and clear production form
        setSalesForm({
            material_id: materialId,
            ruler_id: rulerId ? String(rulerId) : "",
            color_id: color ? String(color.color_id) : "",
            batch_id: batchId ? String(batchId) : "",
            length: lengthValue ? String(lengthValue) : "",
            width: item.width ? String(item.width) : FIXED_WIDTH,
            thickness: item.thickness ? String(item.thickness) : "",
            destination: MovementDestination.slitting,
            carton_count: "",
            notes: item.notes || ""
        });
        // Clear production form completely
        setProductionForm(BASE_FORM);

        // Reset flag after React processes the update
        setTimeout(() => {
            skipValidationRef.current = false;
        }, 100);
    };

    const handleCompleteSalesOrder = async (order) => {
        if (!order?.order_id) return;
        try {
            await updateSalesOrderStatus(order.order_id, "outofwarehouse");
            toast.success("تم إتمام طلب المبيعات بنجاح");
            loadSalesOrders();
        } catch (error) {
            console.error(error);
            toast.error("فشل في إتمام طلب المبيعات");
        }
    };

    const requestCompleteSalesOrder = (order) => {
        if (!order?.order_id) return;
        // Use StyledDialog like production orders
        setPendingCompleteItem(order);
        setShowCompleteDialog(true);
    };

    const handleCompleteSalesOrderConfirm = async () => {
        if (!pendingCompleteItem?.order_id) return;
        try {
            await updateSalesOrderStatus(pendingCompleteItem.order_id, "outofwarehouse");
            toast.success("تم إتمام طلب المبيعات بنجاح");
            loadSalesOrders();
        } catch (error) {
            console.error(error);
            toast.error("فشل في إتمام طلب المبيعات");
        } finally {
            setShowCompleteDialog(false);
            setPendingCompleteItem(null);
        }
    };

    const handleOutputSubmit = () => {
        const isSales = entryTab === "sales";
        if (!outputForm.ruler_id || !outputForm.color_id) {
            return toast.error("المسطرة واللون مطلوبة");
        }
        if (!isSales && (!outputForm.batch_id || !outputForm.length || !outputForm.thickness || !outputForm.destination)) {
            return toast.error("الطبخة والكمية والسماكة مطلوبة لطلبات الإنتاج");
        }
        if (isSales && !outputForm.width) {
            return toast.error("يرجى إدخال العرض");
        }
        // Set pending output data and show confirmation dialog
        setPendingOutput({ ...outputForm });
        setShowOutputConfirmDialog(true);
    };

    const confirmOutputSubmit = async () => {
        try {
            const num = (value) => Number(String(value).replace(",", "."));
            const cartonCount = num(pendingOutput.carton_count) || 1;
            const isSales = entryTab === "sales";

            // Create multiple records based on carton count
            const createPromises = [];
            const batchId = pendingOutput.batch_id ? num(pendingOutput.batch_id) : null;
            const lengthValue = pendingOutput.length ? num(pendingOutput.length) : null;
            const thicknessValue = pendingOutput.thickness ? num(pendingOutput.thickness) : null;
            for (let i = 0; i < cartonCount; i++) {
                const movementData = {
                    color_id: num(pendingOutput.color_id),
                    batch_id: batchId,
                    length: lengthValue,
                    width: num(pendingOutput.width || FIXED_WIDTH),
                    thickness: thicknessValue,
                    notes: pendingOutput.notes ? (cartonCount > 1 ? `${pendingOutput.notes} (كرتون ${i + 1}/${cartonCount})` : pendingOutput.notes) : (cartonCount > 1 ? `كرتون ${i + 1}/${cartonCount}` : "")
                };
                if (!isSales) {
                    movementData.destination = pendingOutput.destination;
                }
                createPromises.push(warehouseApi.createWarehouseMovement(movementData));
            }

            const responses = await Promise.all(createPromises);
            const newMovements = responses.map(response => response?.data?.movement || response?.data || response?.movement).filter(Boolean);

            if (newMovements.length > 0) {
                setMovements((prev) => [...newMovements, ...prev]);
            }

            // If this was a sales order input, complete the order
            if (selectedOrder?.order_id && entryTab === "sales") {
                await updateSalesOrderStatus(selectedOrder.order_id, "outofwarehouse");
                // Clear selected order
                setSelectedOrder(null);
                setOrderItems([]);
            }

            // If this was a production order input, complete the item
            if (activeOrderItem?.production_order_item_id && entryTab === "manual") {
                await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
                updateLocalStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
                setActiveOrderItem(null);
            }

            // Clear both forms completely after saving
            setProductionForm(BASE_FORM);
            setSalesForm(BASE_FORM);

            const completionMessage = selectedOrder?.order_id && entryTab === "sales"
                ? " وإتمام طلب المبيعات"
                : activeOrderItem?.production_order_item_id && entryTab === "manual"
                    ? " وإتمام طلب الإنتاج"
                    : "";
            toast.success(`تم حفظ ${newMovements.length} مخرج بنجاح${completionMessage}`);
            loadMovements();
            setShowOutputConfirmDialog(false);
            setPendingOutput(null);
        } catch (error) {
            console.error(error);
            toast.error("فشل في حفظ المخرجات");
        }
    };

    const requestDeleteMovement = (movement) => {
        setPendingDeleteMovement(movement);
        setShowDeleteMovementDialog(true);
    };

    const confirmDeleteMovement = async () => {
        if (!pendingDeleteMovement?.movement_id) return;
        try {
            await warehouseApi.deleteWarehouseMovement(pendingDeleteMovement.movement_id);
            setMovements((prev) => prev.filter((m) => m.movement_id !== pendingDeleteMovement.movement_id));
            toast.success("تم حذف المخرج بنجاح");
            setShowDeleteMovementDialog(false);
            setPendingDeleteMovement(null);
        } catch (error) {
            console.error(error);
            toast.error("فشل في حذف المخرج");
        }
    };

    const toggleMovementSelection = (movementId) => {
        setSelectedMovements(prev => {
            const newSet = new Set(prev);
            if (newSet.has(movementId)) {
                newSet.delete(movementId);
            } else {
                newSet.add(movementId);
            }
            return newSet;
        });
    };

    const toggleAllMovementsSelection = () => {
        if (selectedMovements.size === movements.length) {
            setSelectedMovements(new Set());
        } else {
            setSelectedMovements(new Set(movements.map(m => m.movement_id)));
        }
    };

    const requestMultiDeleteMovements = () => {
        if (selectedMovements.size === 0) {
            toast.error("يرجى تحديد مخرج واحد على الأقل");
            return;
        }
        setShowMultiDeleteDialog(true);
    };

    const confirmMultiDeleteMovements = async () => {
        try {
            const ids = Array.from(selectedMovements);
            await warehouseApi.deleteWarehouseMovements(ids);
            setMovements((prev) => prev.filter((m) => !selectedMovements.has(m.movement_id)));
            toast.success(`تم حذف ${ids.length} مخرج بنجاح`);
            setSelectedMovements(new Set());
            setShowMultiDeleteDialog(false);
        } catch (error) {
            console.error(error);
            toast.error("فشل في حذف المخرجات");
        }
    };

    const appendToActiveInput = (value) => {
        if (currentInput === "notes") {
            setOutputForm((prev) => ({ ...prev, notes: `${prev.notes || ""}${value}` }));
            return;
        }
        if (currentInput === "carton_count") {
            setOutputForm((prev) => ({ ...prev, carton_count: `${prev.carton_count || ""}${value}` }));
            return;
        }
        if (currentInput === "width") {
            setOutputForm((prev) => ({ ...prev, width: `${prev.width || ""}${value}` }));
            return;
        }
        if (currentInput === "length") {
            setOutputForm((prev) => ({ ...prev, length: `${prev.length || ""}${value}` }));
            return;
        }
        if (currentInput === "qr") {
            setQrInput((prev) => `${prev || ""}${value}`);
            return;
        }
        if (currentInput.startsWith("select:")) {
            const key = currentInput.replace("select:", "");
            setSelectSearch((prev) => ({ ...prev, [key]: `${prev[key] || ""}${value}` }));
        }
    };

    const trimActiveInput = () => {
        if (currentInput === "notes") {
            setOutputForm((prev) => ({ ...prev, notes: String(prev.notes || "").slice(0, -1) }));
            return;
        }
        if (currentInput === "carton_count") {
            setOutputForm((prev) => ({ ...prev, carton_count: String(prev.carton_count || "").slice(0, -1) }));
            return;
        }
        if (currentInput === "width") {
            setOutputForm((prev) => ({ ...prev, width: String(prev.width || "").slice(0, -1) }));
            return;
        }
        if (currentInput === "length") {
            setOutputForm((prev) => ({ ...prev, length: String(prev.length || "").slice(0, -1) }));
            return;
        }
        if (currentInput === "qr") {
            setQrInput((prev) => String(prev || "").slice(0, -1));
            return;
        }
        if (currentInput.startsWith("select:")) {
            const key = currentInput.replace("select:", "");
            setSelectSearch((prev) => ({ ...prev, [key]: String(prev[key] || "").slice(0, -1) }));
        }
    };

    const clearActiveInput = () => {
        if (currentInput === "notes") {
            setOutputForm((prev) => ({ ...prev, notes: "" }));
            return;
        }
        if (currentInput === "carton_count") {
            setOutputForm((prev) => ({ ...prev, carton_count: "" }));
            return;
        }
        if (currentInput === "width") {
            setOutputForm((prev) => ({ ...prev, width: "" }));
            return;
        }
        if (currentInput === "length") {
            setOutputForm((prev) => ({ ...prev, length: "" }));
            return;
        }
        if (currentInput === "qr") {
            setQrInput("");
            return;
        }
        if (currentInput.startsWith("select:")) {
            const key = currentInput.replace("select:", "");
            setSelectSearch((prev) => ({ ...prev, [key]: "" }));
        }
    };

    const handleNumberClick = (num) => appendToActiveInput(num);
    const handleBackspace = () => trimActiveInput();
    const handleClear = () => clearActiveInput();

    const renderSalesOrdersTable = (list) => {
        const statusMap = {
            pending: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" },
            completed: { label: "مكتمل", className: "bg-green-100 text-green-800" },
            outofwarehouse: { label: "اخراج من المستودع", className: "bg-purple-100 text-purple-800" },
            preparing: { label: "قيد التحضير", className: "bg-blue-100 text-blue-800" },
            canceled: { label: "ملغي", className: "bg-red-100 text-red-800" }
        };

        const rows = (list || []).flatMap((order) => {
            const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [null];
            return items.map((item) => ({
                order,
                item
            }));
        });

        return (
            <div className="h-full overflow-auto border rounded-lg bg-white">
                <table className="w-full border-collapse min-w-[1000px]">
                    <thead className="bg-gray-100 sticky top-0 z-50">
                        <tr>
                            {["#", "المادة", "اللون", "العرض", "الكمية", "الطبخة", "الحالة", "التوقيت", "الملاحظات", "الإجراءات"].map((h) => (
                                <th key={h} className="px-1 py-2 text-center border-b text-sm whitespace-nowrap min-w-[70px] bg-gray-100">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loadingSalesOrders ? (
                            <tr><td colSpan="10" className="p-6"><LoadingState /></td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan="10" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد طلبات مبيعات</td></tr>
                        ) : rows.map(({ order, item }, index) => {
                            const statusBadge = statusMap[order.status] || { label: order.status, className: "bg-gray-100 text-gray-800" };
                            const colorName = item?.color_name || item?.color?.color_name || "-";
                            const colorCode = item?.color_code || item?.color?.color_code || "";
                            const materialName = item?.material_name || item?.material?.material_name || "-";
                            const width = item?.width ?? "-";
                            const quantity = item?.quantity ?? "-";
                            const batchNumber = item?.batch_number || item?.batch?.batch_number || "-";
                            return (
                                <tr key={`${order.order_id}-${item?.order_item_id || item?.id || index}`} className="h-14 border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">#{order.order_id}</td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]">{materialName}</td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[100px]">
                                        <span className="text-xs">{colorName}{colorCode ? ` (${colorCode})` : ""}</span>
                                    </td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">{width}</td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">{quantity}</td>
                                    <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]">{batchNumber}</td>
                                    <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]">
                                        <span className={`px-2 py-1 rounded-lg text-xs ${statusBadge.className}`}>
                                            {statusBadge.label}
                                        </span>
                                    </td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[120px]">{formatDate(order.created_at)}</td>
                                    <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[150px] max-w-[150px] truncate" title={item?.notes || order.notes}>{item?.notes || order.notes || "-"}</td>
                                    <td className="px-1 py-2 align-middle text-center whitespace-nowrap min-w-[120px]">
                                        <div className="flex h-8 items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleSalesOrderSelect(order)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                                                title="عرض التفاصيل"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {salesOrdersTab === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleApplySalesOrderToInputs(order)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                                        title="إدخال"
                                                    >
                                                        <Hash className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => requestCompleteSalesOrder(order)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50"
                                                        title="إتمام"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderOrdersTable = (list) => (
        <div className="h-full overflow-auto border rounded-lg bg-white">
            <table className="w-full border-collapse min-w-[1000px]">
                <thead className="bg-gray-100 sticky top-0 z-50">
                    <tr>
                        {["#", "المادة", "اللون", "العرض", "الكمية", "الطبخة", "الحالة", "التوقيت", "الملاحظات", "الإجراءات"].map((h) => (
                            <th key={h} className="px-1 py-2 text-center border-b text-sm whitespace-nowrap min-w-[70px] bg-gray-100">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loadingOrders ? (
                        <tr><td colSpan="10" className="p-6"><LoadingState /></td></tr>
                    ) : list.length === 0 ? (
                        <tr><td colSpan="10" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد طلبات</td></tr>
                    ) : list.map((order, index) => {
                        const batch = order.batch || batches.find((b) => String(b.batch_id) === String(order.batch_id));
                        const status = getStatusBadge(order.status);
                        const color = order.color || colors.find((c) => String(c.color_id) === String(order.color_id));
                        return (
                            <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">#{order.production_order_id}</td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]">{pvcMaterial?.material_name || "-"}</td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[100px]">
                                    {color ? (
                                        <div className="flex items-center justify-center gap-1">
                                            {color.imageUrl && (
                                                <img
                                                    src={color.imageUrl.startsWith("http") ? color.imageUrl : `${API_BASE_URL}${color.imageUrl}`}
                                                    alt={color.color_name}
                                                    className="w-4 h-4 rounded border border-gray-300"
                                                />
                                            )}
                                            <span className="text-xs">{color.color_name} ({color.color_code})</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">{order.width || FIXED_WIDTH}</td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[60px]">{order.length || "-"}</td>
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]">{order.batch_number || batch?.batch_number || "-"}</td>
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[80px]"><span className={`px-2 py-1 rounded-lg text-xs ${status.className}`}>{status.label}</span></td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[120px]">{formatDate(order.created_at)}</td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap min-w-[150px] max-w-[150px] truncate" title={order.notes}>{order.notes || "-"}</td>
                                <td className="px-1 py-2 align-middle text-center whitespace-nowrap min-w-[120px]">
                                    <div className="flex h-8 items-center justify-center gap-1">
                                        <button onClick={() => handleOrderSelect(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="عرض"><Eye className="w-4 h-4" /></button>
                                        {salesOrdersTab === "current" && (
                                            <>
                                                <button onClick={() => handleApplyOrderToInputs(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="إدخال"><Hash className="w-4 h-4" /></button>
                                                <button onClick={() => requestCompleteOrderItem(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50" title="إتمام"><Check className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden flex flex-col bg-gray-50 relative" dir="rtl">
            <div className={`absolute left-0 left-[49%] z-40 transition-all duration-300 ${showHeader ? "top-[8.5%]" : "top-[2%]"}`}>
                <Button
                    type="button"
                    onClick={() => setShowHeader((prev) => !prev)}
                    className="h-10 w-10 rounded-full border-2 border-t-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105 active:scale-95"
                    title={showHeader ? "إخفاء الهيدر" : "إظهار الهيدر"}
                >
                    {showHeader ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </Button>
            </div>

            {showHeader && (
                <div className="flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
                        <div className="flex items-center gap-1">
                            <Package className="w-7 h-7" />
                            <div><h1 className="text-2xl font-bold">إدارة المستودع الخام</h1><p className="text-sm opacity-90">لوحة حركات المستودع الخام</p></div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
                                {/* <div className="text-xs opacity-80">اسم المستخدم</div> */}
                                <div className="text-base font-bold">{user?.full_name || user?.username || "-"}</div>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
                                {/* <div className="text-xs opacity-80">الدور</div> */}
                                <div className="text-base font-bold">{ROLE_LABELS[user?.role] || user?.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationsBell />
                            <Button size="lg" variant="outline" onClick={() => setShowLogoutDialog(true)} className="px-5 py-3 text-base min-w-[120px] border-2 bg-white/10 text-white border-white/30 hover:bg-white/20">
                                <ArrowRight className="w-4 h-4 ml-2 rotate-180" />تسجيل الخروج
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!showHeader && (
                <div className="flex-shrink-0 text-stone-50">
                    <div className="flex items-center justify-between gap-1 border-secondary-f border-b-2 bg-primary-f px-4 py-0 shadow-sm backdrop-blur">
                        <div className="min-w-0">
                            {/* <div className="text-[11px]">اسم المستخدم</div> */}
                            <div className="truncate text-sm font-bold text-secondary-s">{user?.full_name || user?.username || "-"}</div>
                        </div>
                        <div className="h-10 w-px" />
                        <div className="min-w-0 text-right">
                            {/* <div className="text-[11px] ">الدور</div> */}
                            <div className="truncate text-sm font-bold text-secondary-s">{ROLE_LABELS[user?.role] || user?.role}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col gap-1 px-4 mt-1 overflow-hidden">
                <div className={`grid shrink-0 gap-1 ${showHeader ? "grid-cols-3 h-[60%]" : "grid-cols-5 h-[55%]"}`}>
                    <Card className={`p-4 pt-0 flex flex-col gap-4 min-h-0 ${showHeader ? "col-span-1" : "col-span-2"}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div />
                        </div>

                        {/* تابين رئيسية للطلبات */}
                        <div className="flex gap-1 border-b items-center justify-between">
                            <button
                                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${ordersTab === "production"
                                        ? "bg-blue-50 border border-b-2 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => {
                                    setOrdersTab("production");
                                    setEntryTab("production");
                                    setSalesOrdersTab("current");
                                }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    طلبات الإنتاج
                                    {currentOrders.length > 0 && (
                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                                            {currentOrders.length}
                                        </span>
                                    )}
                                </span>
                            </button>
                            <button
                                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${ordersTab === "sales"
                                        ? "bg-blue-50 border border-b-2 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => {
                                    setOrdersTab("sales");
                                    setEntryTab("sales");
                                    setSalesOrdersTab("pending");
                                }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    طلبات المبيعات
                                    {pendingSalesOrders.length > 0 && (
                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                                            {pendingSalesOrders.length}
                                        </span>
                                    )}
                                </span>
                            </button>
                            <div className="mr-auto inline-flex items-center gap-2 pb-1">
                                <span className="text-xs text-gray-500">الإجمالي</span>
                                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
                                    {currentOrders.length + pendingSalesOrders.length}
                                </span>
                            </div>
                        </div>

                        {/* محتوى التابين */}
                        {ordersTab === "production" ? (
                            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="outline" size="sm" className={salesOrdersTab === "current" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setSalesOrdersTab("current")}>قيد الانتظار</Button>
                                    <Button variant="outline" size="sm" className={salesOrdersTab === "completed" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setSalesOrdersTab("completed")}>المكتملة</Button>
                                    <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders}><RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? "animate-spin" : ""}`} />تحديث</Button>
                                </div>
                                <div className="flex-1 min-h-0 relative">
                                    {renderOrdersTable(salesOrdersTab === "current" ? currentOrders : completedOrders)}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="outline" size="sm" className={salesOrdersTab === "pending" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setSalesOrdersTab("pending")}>قيد الانتظار</Button>
                                    <Button variant="outline" size="sm" className={salesOrdersTab === "completed" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setSalesOrdersTab("completed")}>المكتملة</Button>
                                    <Button variant="outline" size="sm" onClick={loadSalesOrders} disabled={loadingSalesOrders}><RefreshCw className={`w-4 h-4 ml-2 ${loadingSalesOrders ? "animate-spin" : ""}`} />تحديث</Button>
                                </div>
                                <div className="flex-1 min-h-0 relative">
                                    {renderSalesOrdersTable(salesOrdersTab === "pending" ? pendingSalesOrders : completedSalesOrders)}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className={`p-4 flex flex-col ${showHeader ? "col-span-2" : "col-span-3"}`}>
                        {/* <h2 className="text-lg font-bold  flex items-center gap-2"><ArrowRight className="w-5 h-5 text-blue-600" />المدخلات</h2> */}

                        {/* تابين رئيسية للمدخلات */}
                        <div className="flex gap-1 border-b">
                            <button
                                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${entryTab === "production"
                                        ? "bg-blue-50 border border-b-2 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => setEntryTab("production")}
                            >
                                مدخلات طلبات الإنتاج
                            </button>
                            <button
                                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${entryTab === "sales"
                                        ? "bg-blue-50 border border-b-2 border-blue-500 text-blue-700"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                                onClick={() => setEntryTab("sales")}
                            >
                                مدخلات طلبات المبيعات
                            </button>
                        </div>

                        {/* محتوى التابين */}
                        <div className="flex-1 overflow-auto pr-1 space-y-2 min-h-0">
                            {entryTab === "production" ? (
                                <>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button variant="outline" className={`flex-1 h-13 ${productionEntryMode === "qr" ? "bg-blue-50 border-blue-300 text-primary-f" : ""}`} onClick={() => setProductionEntryMode("qr")}><Search className="w-4 h-4 ml-2" />QR</Button>
                                        <Button variant="outline" className={`flex-1 h-13 ${productionEntryMode === "manual" ? "bg-blue-50 border-blue-300 text-primary-f" : ""}`} onClick={() => setProductionEntryMode("manual")}><Hash className="w-4 h-4 ml-2" />يدوي</Button>
                                    </div>
                                    {productionEntryMode === "qr" ? (
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-600">الصيغة: `material|ruler|color_code|width|thickness|quantity|batch`</div>
                                            <Input value={qrInput} className={`h-13`} onChange={(e) => setQrInput(e.target.value)} onFocus={() => setCurrentInput("qr")} placeholder="material|ruler|color_code|width|thickness|quantity|batch" />
                                            <Button onClick={applyQrData} className="w-full h-13 bg-primary-f hover:bg-blue-700" disabled={!qrInput.trim()}><Check className="w-5 h-5 ml-2" />تطبيق البيانات</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-5 gap-1">
                                                <div><Label className={'mb-1'}>المسطرة</Label><FilterSelect value={outputForm.ruler_id} onChange={(e) => setOutputForm((p) => ({ ...p, ruler_id: e.target.value, color_id: "" }))} searchValue={selectSearch.ruler} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, ruler: value }))} onInputFocus={() => setCurrentInput("select:ruler")} options={availableRulers.map((r) => ({ value: String(r.ruler_id), label: r.ruler_name }))} placeholder="اختر المسطرة" disabled={!outputForm.material_id} /></div>
                                                <div><Label className={'mb-1'}>اللون</Label><FilterSelect value={outputForm.color_id} onChange={(e) => setOutputForm((p) => ({ ...p, color_id: e.target.value }))} searchValue={selectSearch.color} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, color: value }))} onInputFocus={() => setCurrentInput("select:color")} options={colorOptions} placeholder={!outputForm.ruler_id ? "اختر المسطرة أولاً" : "اختر اللون"} disabled={!outputForm.ruler_id} /></div>
                                                <div><Label className={'mb-1'}>الطبخة</Label><FilterSelect value={outputForm.batch_id} onChange={(e) => setOutputForm((p) => ({ ...p, batch_id: e.target.value }))} searchValue={selectSearch.batch} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, batch: value }))} onInputFocus={() => setCurrentInput("select:batch")} options={batchOptions} placeholder="اختر الطبخة" disabled={!outputForm.material_id} /></div>
                                                <div><Label className={'mb-1'}>العرض</Label><button type="button" className="w-full rounded-lg border-2 border-secondary-s bg-secondary-s text-white p-3 font-bold shadow-lg">{FIXED_WIDTH}</button></div>
                                                <div><Label className={'mb-1'}>السماكة</Label>{thicknessValues.length > 1 ? <FilterSelect value={outputForm.thickness} onChange={(e) => setOutputForm((p) => ({ ...p, thickness: e.target.value }))} searchValue={selectSearch.thickness} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, thickness: value }))} onInputFocus={() => setCurrentInput("select:thickness")} options={thicknessOptions} placeholder="اختر السماكة" /> : <div className="h-13 px-3 flex items-center rounded-md border bg-gray-100 font-bold">{thicknessValues[0]?.label || outputForm.thickness || "-"}</div>}</div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1">
                                                <div><Label className={'mb-1'}>الكمية</Label><Input type="text" className={`h-13`} value={outputForm.length} onChange={(e) => setOutputForm((p) => ({ ...p, length: e.target.value }))} onFocus={() => setCurrentInput("length")} placeholder="الكمية" /></div>
                                                <div><Label className={'mb-1'}>عدد الكراتين</Label><Input type="number" min="1" className={`h-13`} value={outputForm.carton_count} onChange={(e) => setOutputForm((p) => ({ ...p, carton_count: e.target.value }))} onFocus={() => setCurrentInput("carton_count")} placeholder="عدد الكراتين" /></div>
                                                <div className="col-span-1"><Label className={'mb-1'}>ملاحظات</Label><Input className={`h-13`} value={outputForm.notes} onChange={(e) => setOutputForm((p) => ({ ...p, notes: e.target.value }))} onFocus={() => setCurrentInput("notes")} placeholder="ملاحظات اختيارية" /></div>
                                            </div>
                                            <Button onClick={handleOutputSubmit} className="w-full h-13 bg-green-600 hover:bg-green-700"><Check className="w-5 h-5 ml-2" />حفظ المخرج</Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 overflow-auto pr-1 space-y-2">
                                    {/* عرض معلومات طلب المبيعات المحدد */}
                                    {selectedOrder?.order_id && entryTab === "sales" && showSalesOrderInfo && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-blue-700">طلب المبيعات #{selectedOrder.order_id}</h4>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOrder(null);
                                                        setOrderItems([]);
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-gray-600">الزبون:</span> <span className="font-medium">{selectedOrder.customer?.name || "-"}</span></div>
                                                <div><span className="text-gray-600">المبلغ:</span> <span className="font-medium">{Number(selectedOrder.total_amount || 0).toLocaleString()}</span></div>
                                                <div><span className="text-gray-600">العناصر:</span> <span className="font-medium">{selectedOrder.items?.length || 0}</span></div>
                                                <div><span className="text-gray-600">الحالة:</span> <span className="font-medium">{{
                                                    pending: "قيد الانتظار",
                                                    completed: "مكتمل",
                                                    preparing: "قيد التحضير",
                                                    canceled: "ملغي"
                                                }[selectedOrder.status] || selectedOrder.status}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* عرض عناصر طلب المبيعات */}
                                    {showSalesOrderInfo && selectedOrder?.items && selectedOrder.items.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 px-3 py-2 border-b">
                                                <h4 className="font-medium text-sm">عناصر الطلب</h4>
                                            </div>
                                            <div className="max-h-60 overflow-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                        <tr>
                                                            {["#", "المادة", "اللون", "العرض", "الطول", "السماكة", "النوع", "الكمية"].map((h) => (
                                                                <th key={h} className="p-1 text-center border-b text-xs">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedOrder.items.map((item, index) => (
                                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                                <td className="p-1 text-center">#{index + 1}</td>
                                                                <td className="p-1 text-center">{item.material_name || "-"}</td>
                                                                <td className="p-1 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <div className="w-2 h-2 rounded border border-gray-300" style={{ backgroundColor: item.color_code }} />
                                                                        <span className="text-xs">{item.color_name || "-"}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-1 text-center">{item.width || "-"}</td>
                                                                <td className="p-1 text-center">{item.length || "-"}</td>
                                                                <td className="p-1 text-center">{item.thickness || "-"}</td>
                                                                <td className="p-1 text-center">{item.type_item === "Presser" ? "كوي" : item.type_item === "Machine" ? "مكنة" : item.type_item || "-"}</td>
                                                                <td className="p-1 text-center">{item.quantity || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* رسالة توجيهية - تظهر فقط عند عدم اختيار طلب */}
                                    {/* {!selectedOrder?.order_id && (
                                        <div className="flex items-center justify-center p-8 text-gray-500">
                                            <div className="text-center">
                                                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-sm">مدخلات طلبات المبيعات</p>
                                                <p className="text-xs mt-2">اختر طلباً من جدول طلبات المبيعات لعرض العناصر</p>
                                            </div>
                                        </div>
                                    )} */}

                                    {/* نموذج إدخال مخرج المبيعات */}
                                    <div className="">
                                        {/* <h4 className="font-medium text-sm mb-3 text-gray-700">إدخال مخرج جديد</h4> */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-5 gap-1">
                                                <div><Label className={'mb-1'}>المسطرة</Label><FilterSelect value={outputForm.ruler_id} onChange={(e) => setOutputForm((p) => ({ ...p, ruler_id: e.target.value, color_id: "" }))} searchValue={selectSearch.ruler} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, ruler: value }))} onInputFocus={() => setCurrentInput("select:ruler")} options={availableRulers.map((r) => ({ value: String(r.ruler_id), label: r.ruler_name }))} placeholder="اختر المسطرة" disabled={!outputForm.material_id} /></div>
                                                <div><Label className={'mb-1'}>اللون</Label><FilterSelect value={outputForm.color_id} onChange={(e) => setOutputForm((p) => ({ ...p, color_id: e.target.value }))} searchValue={selectSearch.color} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, color: value }))} onInputFocus={() => setCurrentInput("select:color")} options={colorOptions} placeholder={!outputForm.ruler_id ? "اختر المسطرة أولاً" : "اختر اللون"} disabled={!outputForm.ruler_id} /></div>
                                                <div><Label className={'mb-1'}>الطبخة</Label><FilterSelect value={outputForm.batch_id} onChange={(e) => setOutputForm((p) => ({ ...p, batch_id: e.target.value }))} searchValue={selectSearch.batch} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, batch: value }))} onInputFocus={() => setCurrentInput("select:batch")} options={batchOptions} placeholder="اختر الطبخة" disabled={!outputForm.material_id} /></div>
                                                <div><Label className={'mb-1'}>العرض</Label><Input type="text" className={`h-13`} value={outputForm.width} onChange={(e) => setOutputForm((p) => ({ ...p, width: e.target.value }))} onFocus={() => setCurrentInput("width")} placeholder="العرض" /></div>
                                                <div><Label className={'mb-1'}>السماكة</Label>{thicknessValues.length > 1 ? <FilterSelect value={outputForm.thickness} onChange={(e) => setOutputForm((p) => ({ ...p, thickness: e.target.value }))} searchValue={selectSearch.thickness} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, thickness: value }))} onInputFocus={() => setCurrentInput("select:thickness")} options={thicknessOptions} placeholder="اختر السماكة" /> : <div className="h-13 px-3 flex items-center rounded-md border bg-gray-100 font-bold">{thicknessValues[0]?.label || outputForm.thickness || "-"}</div>}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                <div><Label className={'mb-1'}>الكمية</Label><Input type="text" className={`h-13`} value={outputForm.length} onChange={(e) => setOutputForm((p) => ({ ...p, length: e.target.value }))} onFocus={() => setCurrentInput("length")} placeholder="الكمية" /></div>
                                                <div className="col-span-1"><Label className={'mb-1'}>ملاحظات</Label><Input className={`h-13`} value={outputForm.notes} onChange={(e) => setOutputForm((p) => ({ ...p, notes: e.target.value }))} onFocus={() => setCurrentInput("notes")} placeholder="ملاحظات اختيارية" /></div>
                                            </div>
                                            <Button onClick={handleOutputSubmit} className="w-full h-13 bg-green-600 hover:bg-green-700"><Check className="w-5 h-5 ml-2" />حفظ مخرج المبيعات</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="flex gap-1 flex-1 min-h-0 flex-row-reverse">
                    <Card className="p-4 pb-0 flex flex-col flex-1 min-h-0">
                        <div className="flex-1 min-h-0 border rounded-lg bg-white overflow-hidden flex flex-col">
                            {/* Multi-select controls */}
                            <div className="p-2 bg-gray-100 border-b flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedMovements.size === movements.length && movements.length > 0}
                                        onChange={toggleAllMovementsSelection}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-600">
                                        تحديد الكل ({selectedMovements.size}/{movements.length})
                                    </span>
                                </div>
                                {selectedMovements.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={requestMultiDeleteMovements}
                                        className="text-xs"
                                    >
                                        <Trash className="w-3 h-3 ml-1" />
                                        حذف المحدد ({selectedMovements.size})
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1 min-h-0 overflow-auto">
                                <table className="min-w-[1100px] w-full table-fixed border-collapse">
                                    <thead className="bg-gray-100 sticky top-0 z-50">
                                        <tr>
                                            {["", "الرقم", "المادة", "اللون", "العرض", "الكمية", "السماكة", "الطبخة", "الوجهة", "المستخدم", "التوقيت", "الملاحظات", "الإجراءات"].map((h) => (
                                                <th key={h} className="p-2 text-center border-b text-sm bg-gray-100">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingMovements ? (
                                            <tr><td colSpan="13" className="p-6"><LoadingState /></td></tr>
                                        ) : sortedMovements.length === 0 ? (
                                            <tr><td colSpan="13" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد مخرجات
                                            </td></tr>
                                        ) : sortedMovements.map((m) => (
                                            <tr key={m.movement_id} className={`border-b hover:bg-gray-50 ${selectedMovements.has(m.movement_id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMovements.has(m.movement_id)}
                                                        onChange={() => toggleMovementSelection(m.movement_id)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="p-2 text-center text-sm">#{m.movement_id}</td>
                                                <td className="p-2 text-center text-sm">{m.color?.ruler?.material?.material_name || pvcMaterial?.material_name || "PVC"}</td>
                                                <td className="p-2 text-center text-sm">{m.color?.color_name || "-"} ({m.color?.color_code || "-"})</td>
                                                <td className="p-2 text-center text-sm">{m.width || FIXED_WIDTH}</td>
                                                <td className="p-2 text-center text-sm">{m.length || "-"}</td>
                                                <td className="p-2 text-center text-sm">{m.thickness || "-"}</td>
                                                <td className="p-2 text-center text-sm">{m.batch?.batch_number || "-"}</td>
                                                <td className="p-2 text-center text-sm">{m.destination ? formatDestination(m.destination) : ""}</td>
                                                <td className="p-2 text-center text-sm">{m.user?.full_name || m.user?.username || "-"}</td>
                                                <td className="p-2 text-center text-sm">{formatDate(m.created_at)}</td>
                                                <td className="p-2 text-center text-sm max-w-[140px] truncate" title={m.notes || "-"}>{m.notes || "-"}</td>
                                                <td className="p-2 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const qrData = buildMovementQrData(m);
                                                                const qrFooter = buildMovementQrFooter(m);
                                                                printQr(getQrUrl(qrData), `QR - مخرج #${m.movement_id}`, qrFooter);
                                                            }}
                                                            className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg"
                                                            title="طباعة QR"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => { setSelectedMovement(m); setShowMovementDetails(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => requestDeleteMovement(m)}
                                                            className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"
                                                            title="حذف المخرج"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 pb-0 w-[260px] flex-shrink-0 self-stretch flex flex-col">
                        {/* <h3 className="text-lg font-bold flex items-center gap-2"><Calculator className="w-5 text-green-600" />لوحة الأرقام</h3> */}
                        <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">
                            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => <Button key={n} variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(n)}>{n}</Button>)}
                            <Button variant="outline" className="h-12 text-lg" onClick={handleClear}><X className="w-4 h-4" /></Button>
                            <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(0)}>0</Button>
                            <Button variant="outline" className="h-12 text-lg" onClick={handleBackspace}><ArrowRight className="w-4 h-4" /></Button>
                        </div>
                    </Card>
                </div>
            </div>

            <StyledDialog isOpen={showOrderDetails} onOpenChange={setShowOrderDetails} title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : selectedOrder?.order_id ? `#${selectedOrder.order_id}` : ""}`} contentClassName="max-w-7xl w-full" onCancel={() => setShowOrderDetails(false)} onConfirm={() => setShowOrderDetails(false)} confirmLabel="إغلاق" showCancel={false}>
                {selectedOrder && (
                    <div className="space-y-4 w-full">
                        {/* معلومات أساسية للطلب */}
                        {/* {selectedOrder.order_id && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h3 className="font-bold text-blue-700 mb-3">معلومات طلب المبيعات</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-gray-500">رقم الطلب:</span> <span className="font-bold">#{selectedOrder.order_id}</span></div>
                                    <div><span className="text-gray-500">الزبون:</span> <span className="font-bold">{selectedOrder.customer?.name || "-"}</span></div>
                                    <div><span className="text-gray-500">الهاتف:</span> <span className="font-bold">{selectedOrder.customer?.phone || "-"}</span></div>
                                    <div><span className="text-gray-500">المدينة:</span> <span className="font-bold">{selectedOrder.customer?.city || "-"}</span></div>
                                    <div><span className="text-gray-500">المبلغ:</span> <span className="font-bold">{Number(selectedOrder.total_amount || 0).toLocaleString()}</span></div>
                                    <div><span className="text-gray-500">الحالة:</span> <span className="font-bold">{{
                                        pending: "قيد الانتظار",
                                        completed: "مكتمل",
                                        preparing: "قيد التحضير",
                                        canceled: "ملغي"
                                    }[selectedOrder.status] || selectedOrder.status}</span></div>
                                    <div><span className="text-gray-500">المبيعات:</span> <span className="font-bold">{selectedOrder.sales?.full_name || selectedOrder.sales?.username || "-"}</span></div>
                                    <div><span className="text-gray-500">التاريخ:</span> <span className="font-bold">{formatDate(selectedOrder.created_at)}</span></div>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <span className="text-gray-500">الملاحظات:</span> <span className="font-bold">{selectedOrder.notes}</span>
                                    </div>
                                )}
                            </div>
                        )} */}

                        {/* جدول العناصر */}
                        {loadingOrderDetails ? <LoadingState /> : (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full table-auto text-sm [&_td]:break-words [&_th]:break-words">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            {selectedOrder.items ?
                                                ["#", "المادة", "اللون", "العرض", "الكمية", "النوع", "السماكة", "الطبخة", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => <th key={h} className="p-2 text-center">{h}</th>) :
                                                ["#", "المادة", "اللون", "العرض", "الكمية", "النوع", "السماكة", "الطبخة", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => <th key={h} className="p-2 text-center">{h}</th>)
                                            }
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items ? (
                                            selectedOrder.items.length === 0 ? (
                                                <tr><td colSpan="12" className="p-6 text-center text-gray-400">لا توجد عناصر لهذا الطلب</td></tr>
                                            ) : selectedOrder.items.map((item, index) => (
                                                <tr key={item.order_id || index} className="border-t">
                                                    <td className="p-2 text-center">#{index + 1}</td>
                                                    <td className="p-2 text-center">{item.material_name || "-"}</td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className="text-xs">{item.color_name || "-"} ({item.color_code || "-"})</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center">{item.width || "-"}</td>
                                                    <td className="p-2 text-center">{item.quantity || item.length || "-"}</td>
                                                    <td className="p-2 text-center">{item.type_item === "Presser" ? "كوي" : item.type_item === "Machine" ? "مكنة" : item.type_item || "-"}</td>
                                                    <td className="p-2 text-center">{item.thickness || "-"}</td>
                                                    <td className="p-2 text-center">{item.batch_number || "-"}</td>
                                                    <td className="p-2 text-center">{item.destination ? formatDestination(item.destination) : "-"}</td>
                                                    <td className="p-2 text-center">{
                                                        (() => {
                                                            const orderStatus = selectedOrder?.status;
                                                            const statusMap = {
                                                                pending: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" },
                                                                completed: { label: "مكتمل", className: "bg-green-100 text-green-800" },
                                                                outofwarehouse: { label: "اخراج من المستودع", className: "bg-purple-100 text-purple-800" },
                                                                preparing: { label: "قيد التحضير", className: "bg-blue-100 text-blue-800" },
                                                                canceled: { label: "ملغي", className: "bg-red-100 text-red-800" }
                                                            };
                                                            const status = statusMap[orderStatus] || { label: orderStatus || "-", className: "bg-gray-100 text-gray-800" };
                                                            return <span className={`px-2 py-1 rounded-lg text-xs ${status.className}`}>{status.label}</span>;
                                                        })()
                                                    }</td>
                                                    <td className="p-2 text-center max-w-[150px] truncate" title={item.notes}>{item.notes || "-"}</td>
                                                    <td className="p-2 text-center">-</td>
                                                </tr>
                                            ))
                                        ) : (
                                            orderItems.length === 0 ? (
                                                <tr><td colSpan="12" className="p-6 text-center text-gray-400">لا توجد عناصر لهذا الطلب</td></tr>
                                            ) : orderItems.map((item, index) => (
                                                <tr key={item.production_order_item_id || index} className="border-t">
                                                    <td className="p-2 text-center">#{item.production_order_item_id || index + 1}</td>
                                                    <td className="p-2 text-center">{pvcMaterial?.material_name || "-"}</td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {(() => {
                                                                const color = item.color || colors.find((c) => String(c.color_id) === String(item.color_id));
                                                                return color ? (
                                                                    <>
                                                                        {color.imageUrl && <img src={color.imageUrl.startsWith("http") ? color.imageUrl : `${API_BASE_URL}${color.imageUrl}`} alt={color.color_name} className="w-3 h-3 rounded border border-gray-300" />}
                                                                        <span className="text-xs">{color.color_name} ({color.color_code})</span>
                                                                    </>
                                                                ) : "-";
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center">{item.width || FIXED_WIDTH}</td>
                                                    <td className="p-2 text-center">{item.length || "-"}</td>
                                                    <td className="p-2 text-center">{item.type_item === "Presser" ? "كوي" : item.type_item === "Machine" ? "مكنة" : item.type_item || "-"}</td>
                                                    <td className="p-2 text-center">{item.thickness || "-"}</td>
                                                    <td className="p-2 text-center">{item.batch_number || item.batch?.batch_number || "-"}</td>
                                                    <td className="p-2 text-center">{formatDestination(item.destination)}</td>
                                                    <td className="p-2 text-center"><span className={`px-2 py-1 rounded-lg text-xs ${getStatusBadge(item.status).className}`}>{getStatusBadge(item.status).label}</span></td>
                                                    <td className="p-2 text-center">{item.notes || "-"}</td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleApplyOrderToInputs(item)}>إدخال</Button>
                                                            <Button variant="outline" size="sm" disabled={String(item.status || "").toLowerCase() === ProductionStatus.completed} onClick={() => requestCompleteOrderItem(item)}>إتمام</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </StyledDialog>

            <StyledDialog isOpen={showMovementDetails} onOpenChange={(open) => { setShowMovementDetails(open); if (!open) setSelectedMovement(null); }} title={`تفاصيل الحركة ${selectedMovement?.movement_id ? `#${selectedMovement.movement_id}` : ""}`} contentClassName="max-w-3xl w-full" onCancel={() => setShowMovementDetails(false)} onConfirm={() => setShowMovementDetails(false)} confirmLabel="إغلاق" showCancel={false}>
                {selectedMovement && <div className="space-y-3 text-sm"><div><span className="text-gray-500">اللون:</span> <span className="font-medium">{selectedMovement.color?.color_name || "-"}</span></div><div><span className="text-gray-500">المسطرة:</span> <span className="font-medium">{selectedMovement.color?.ruler?.ruler_name || "-"}</span></div><div><span className="text-gray-500">المادة:</span> <span className="font-medium">{selectedMovement.color?.ruler?.material?.material_name || pvcMaterial?.material_name || "PVC"}</span></div><div><span className="text-gray-500">الطبخة:</span> <span className="font-medium">{selectedMovement.batch?.batch_number || "-"}</span></div><div><span className="text-gray-500">الأبعاد:</span> <span className="font-medium">{selectedMovement.length || "-"} × {selectedMovement.width || FIXED_WIDTH} × {selectedMovement.thickness || "-"}</span></div><div><span className="text-gray-500">الوجهة:</span> <span className="font-medium">{formatDestination(selectedMovement.destination)}</span></div><div><span className="text-gray-500">الملاحظات:</span> <span className="font-medium">{selectedMovement.notes || "-"}</span></div></div>}
            </StyledDialog>

            <StyledDialog
                isOpen={showCompleteDialog}
                onOpenChange={(open) => {
                    setShowCompleteDialog(open);
                    if (!open) setPendingCompleteItem(null);
                }}
                title="تأكيد إتمام العملية"
                contentClassName="max-w-md w-full"
                onCancel={() => {
                    setShowCompleteDialog(false);
                    setPendingCompleteItem(null);
                }}
                onConfirm={async () => {
                    if (pendingCompleteItem?.order_id) {
                        // Sales order completion
                        await handleCompleteSalesOrderConfirm();
                    } else if (pendingCompleteItem?.production_order_item_id) {
                        // Production order completion
                        await handleCompleteOrderItem(pendingCompleteItem);
                        setShowCompleteDialog(false);
                        setPendingCompleteItem(null);
                    }
                }}
                confirmLabel="تأكيد"
                cancelLabel="إلغاء"
            >
                <div className="text-sm text-gray-700">
                    {pendingCompleteItem?.order_id ? (
                        // Sales order completion
                        <>
                            هل تريد إتمام طلب المبيعات
                            {" "}
                            <span className="font-bold">
                                #{pendingCompleteItem?.order_id}
                            </span>
                            {" "}
                            ونقله إلى المكتمل؟
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><span className="font-medium">الزبون:</span> {pendingCompleteItem?.customer?.name || "-"}</div>
                                    <div><span className="font-medium" >الهاتف:</span> <span dir="ltr">{pendingCompleteItem?.customer?.phone || "-"}</span></div>
                                    <div><span className="font-medium">المدينة:</span> {pendingCompleteItem?.customer?.city || "-"}</div>
                                    <div><span className="font-medium">المبلغ:</span> {Number(pendingCompleteItem?.total_amount || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Production order completion
                        <>
                            هل تريد إتمام الطلب
                            {" "}
                            <span className="font-bold">
                                #{pendingCompleteItem?.production_order_id || pendingCompleteItem?.production_order_item_id || ""}
                            </span>
                            {" "}
                            ونقله إلى المكتمل؟
                        </>
                    )}
                </div>
            </StyledDialog>

            <StyledDialog
                isOpen={showOutputConfirmDialog}
                onOpenChange={(open) => {
                    setShowOutputConfirmDialog(open);
                    if (!open) setPendingOutput(null);
                }}
                title="تأكيد حفظ المخرج"
                contentClassName="max-w-2xl w-full"
                onCancel={() => {
                    setShowOutputConfirmDialog(false);
                    setPendingOutput(null);
                }}
                onConfirm={confirmOutputSubmit}
                confirmLabel="تأكيد الحفظ"
                cancelLabel="إلغاء"
            >
                <div className="text-sm text-gray-700">
                    هل تريد حفظ هذا المخرج؟
                    {pendingOutput?.carton_count && Number(pendingOutput.carton_count) > 1 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-blue-700 font-medium">
                                سيتم إنشاء {pendingOutput.carton_count} سجل بنفس المواصفات
                            </span>
                        </div>
                    )}
                    <div className="mt-4">
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">اللون</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">العرض</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الكمية</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">السماكة</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطبخة</th>
                                    {entryTab !== "sales" && (
                                        <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">المسطرة</th>
                                    )}
                                    {entryTab !== "sales" && (
                                        <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">عدد الكراتين</th>
                                    )}
                                    {entryTab !== "sales" && (
                                        <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الوجهة</th>
                                    )}
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">المستخدم</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        {(() => {
                                            const color = colors.find(c => String(c.color_id) === String(pendingOutput?.color_id));
                                            return color ? `${color.color_name} (${color.color_code})` : "-";
                                        })()}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{FIXED_WIDTH}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.length || "-"}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.thickness || "-"}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        {(() => {
                                            const batch = batches.find(b => String(b.batch_id) === String(pendingOutput?.batch_id));
                                            return batch ? batch.batch_number : "-";
                                        })()}
                                    </td>
                                    {entryTab !== "sales" && (
                                        <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                            {(() => {
                                                const ruler = rulers.find(r => String(r.ruler_id) === String(pendingOutput?.ruler_id));
                                                return ruler ? ruler.ruler_name : "-";
                                            })()}
                                        </td>
                                    )}
                                    {entryTab !== "sales" && (
                                        <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.carton_count || "1"}</td>
                                    )}
                                    {entryTab !== "sales" && (
                                        <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                                {formatDestination(pendingOutput?.destination)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{user?.full_name || user?.username || "-"}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.notes || "-"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </StyledDialog>

            <StyledDialog
                isOpen={showDeleteMovementDialog}
                onOpenChange={(open) => {
                    setShowDeleteMovementDialog(open);
                    if (!open) setPendingDeleteMovement(null);
                }}
                title="تأكيد حذف المخرج"
                contentClassName="max-w-md w-full"
                onCancel={() => {
                    setShowDeleteMovementDialog(false);
                    setPendingDeleteMovement(null);
                }}
                onConfirm={confirmDeleteMovement}
                confirmLabel="حذف"
                cancelLabel="إلغاء"
                confirmVariant="destructive"
            >
                <div className="text-sm text-gray-700">
                    هل تريد حذف المخرج
                    <span className="font-bold"> #{pendingDeleteMovement?.movement_id || ""}</span>؟
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="font-medium">اللون:</span> {(() => {
                                const color = pendingDeleteMovement?.color;
                                return color ? `${color.color_name} (${color.color_code})` : "-";
                            })()}</div>
                            <div><span className="font-medium">الطبخة:</span> {pendingDeleteMovement?.batch?.batch_number || "-"}</div>
                            <div><span className="font-medium">الكمية:</span> {pendingDeleteMovement?.length || "-"}</div>
                            <div><span className="font-medium">الوجهة:</span> {formatDestination(pendingDeleteMovement?.destination)}</div>
                        </div>
                    </div>
                    <div className="mt-3 text-red-600 text-xs font-medium">
                        ⚠️ هذا الإجراء لا يمكن التراجع عنه
                    </div>
                </div>
            </StyledDialog>

            <StyledDialog
                isOpen={showMultiDeleteDialog}
                onOpenChange={(open) => {
                    setShowMultiDeleteDialog(open);
                    if (!open) setSelectedMovements(new Set());
                }}
                title="تأكيد حذف المخرجات"
                contentClassName="max-w-md w-full"
                onCancel={() => {
                    setShowMultiDeleteDialog(false);
                    setSelectedMovements(new Set());
                }}
                onConfirm={confirmMultiDeleteMovements}
                confirmLabel="حذف الكل"
                cancelLabel="إلغاء"
                confirmVariant="destructive"
            >
                <div className="text-sm text-gray-700">
                    هل تريد حذف
                    <span className="font-bold"> {selectedMovements.size} </span>
                    مخرج؟
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-xs text-red-600 font-medium">
                            ⚠️ سيتم حذف جميع المخرجات المحددة دفعة واحدة
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                            العناصر التي سيتم حذفها: #{Array.from(selectedMovements).join(', #')}
                        </div>
                    </div>
                    <div className="mt-3 text-red-600 text-xs font-medium">
                        ⚠️ هذا الإجراء لا يمكن التراجع عنه
                    </div>
                </div>
            </StyledDialog>

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
