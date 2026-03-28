import { useCallback, useEffect, useMemo, useState } from "react";
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
    [UserRole.Gluing_Technician]: "فني اللصق"
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
    notes: ""
};

export default function WarehouseKeeper() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [entryTab, setEntryTab] = useState("manual");
    const [ordersTab, setOrdersTab] = useState("current");
    const [orders, setOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [lengthValues, setLengthValues] = useState([]);
    const [thicknessValues, setThicknessValues] = useState([]);
    const [qrInput, setQrInput] = useState("");
    const [outputForm, setOutputForm] = useState(BASE_FORM);
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
    const [showHeader, setShowHeader] = useState(true);
    const [currentInput, setCurrentInput] = useState("notes");
    const [selectSearch, setSelectSearch] = useState({
        ruler: "",
        color: "",
        batch: "",
        thickness: "",
        length: ""
    });

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
    const currentOrders = useMemo(
        () => sortRecordsDesc(orders.filter((o) => String(o.status || "").toLowerCase() !== ProductionStatus.completed)),
        [orders, sortRecordsDesc]
    );
    const completedOrders = useMemo(
        () => sortRecordsDesc(orders.filter((o) => String(o.status || "").toLowerCase() === ProductionStatus.completed)),
        [orders, sortRecordsDesc]
    );
    const sortedMovements = useMemo(() => sortRecordsDesc(movements), [movements, sortRecordsDesc]);
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
            'gluing': "اللصق"
        };
        return destinationMap[String(value)] || String(value) || "-";
    };

    const formatSource = (value) => ({
        warehouse: "المستودع",
        slitting: "التشريح",
        cutting: "القص",
        production: "الإنتاج",
        gluing: "اللصق"
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
              <h3>${title}</h3>
              <img src="${url}" style="width:240px;height:240px;border:1px solid #ddd;border-radius:8px;" />
              <div style="margin-top:12px; font-size:12px; color:#444;">${footer}</div>
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
            `اللون: ${movement?.color?.color_name || "-"}`,
            `الكود: ${movement?.color?.color_code || "-"}`,
            `العرض: ${movement?.width || FIXED_WIDTH}`,
            `السماكة: ${movement?.thickness || "-"}`,
            `الطول: ${movement?.length || "-"}`,
            `الطبخة: ${movement?.batch?.batch_number || "-"}`
        ].join(" | ");
    };

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
            toast.error("فشل في تحميل ثوابت الطول أو السماكة");
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
        loadMovements();
    }, []);

    useEffect(() => {
        if (!pvcMaterial) return;
        const materialId = String(pvcMaterial.material_id);
        setOutputForm((prev) => ({ ...prev, material_id: materialId, width: FIXED_WIDTH, destination: MovementDestination.slitting }));
        loadConstants(materialId);
    }, [pvcMaterial, loadConstants]);

    useEffect(() => {
        if (outputForm.ruler_id && !availableRulers.some((r) => String(r.ruler_id) === String(outputForm.ruler_id))) {
            setOutputForm((prev) => ({ ...prev, ruler_id: "", color_id: "" }));
        }
    }, [availableRulers, outputForm.ruler_id]);

    useEffect(() => {
        if (outputForm.color_id && !availableColors.some((c) => String(c.color_id) === String(outputForm.color_id))) {
            setOutputForm((prev) => ({ ...prev, color_id: "" }));
        }
    }, [availableColors, outputForm.color_id]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const socket = connectSocket(token);
        const refresh = () => {
            loadOrders();
            loadMovements();
        };
        ["ORDER_NEW", "warehouse:orders", "warehouse:order:new", "order:new", "order:updated", "notification"]
            .forEach((name) => socket.on(name, refresh));
        return () => {
            ["ORDER_NEW", "warehouse:orders", "warehouse:order:new", "order:new", "order:updated", "notification"]
                .forEach((name) => socket.off(name, refresh));
            disconnectSocket();
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

    const handleOrderSelect = async (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
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
        setOutputForm((prev) => ({
            ...prev,
            material_id: pvcMaterial ? String(pvcMaterial.material_id) : prev.material_id,
            ruler_id: rulerId ? String(rulerId) : "",
            color_id: item.color_id ? String(item.color_id) : "",
            batch_id: item.batch_id ? String(item.batch_id) : "",
            length: "",
            width: FIXED_WIDTH,
            thickness: item.thickness ? String(item.thickness) : prev.thickness,
            destination: item.destination || MovementDestination.slitting,
            notes: item.notes || ""
        }));
        setActiveOrderItem(item);
        setEntryTab("manual");
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

    const handleOutputSubmit = () => {
        if (!outputForm.ruler_id || !outputForm.color_id || !outputForm.batch_id || !outputForm.length || !outputForm.thickness || !outputForm.destination) {
            return toast.error("الطبخة والطول والسماكة وباقي الحقول مطلوبة");
        }
        // Set pending output data and show confirmation dialog
        setPendingOutput({...outputForm});
        setShowOutputConfirmDialog(true);
    };

    const confirmOutputSubmit = async () => {
        try {
            const num = (value) => Number(String(value).replace(",", "."));
            const response = await warehouseApi.createWarehouseMovement({
                color_id: num(pendingOutput.color_id),
                batch_id: num(pendingOutput.batch_id),
                length: num(pendingOutput.length),
                width: num(FIXED_WIDTH),
                thickness: num(pendingOutput.thickness),
                destination: pendingOutput.destination,
                notes: pendingOutput.notes
            });
            const created = response?.data?.movement || response?.data || response?.movement;
            if (created?.movement_id) setMovements((prev) => [created, ...prev]);
            setOutputForm((prev) => ({
                ...BASE_FORM,
                material_id: pvcMaterial ? String(pvcMaterial.material_id) : "",
                ruler_id: prev.ruler_id,
                width: FIXED_WIDTH,
                destination: MovementDestination.slitting,
                length: lengthValues.find((v) => v.isDefault)?.value ? String(lengthValues.find((v) => v.isDefault).value) : (lengthValues[0] ? String(lengthValues[0].value) : ""),
                thickness: thicknessValues.find((v) => v.isDefault)?.value ? String(thicknessValues.find((v) => v.isDefault).value) : (thicknessValues[0] ? String(thicknessValues[0].value) : "")
            }));
            toast.success("تم حفظ المخرج بنجاح");
            loadMovements();
            setShowOutputConfirmDialog(false);
            setPendingOutput(null);
        } catch (error) {
            console.error(error);
            toast.error("فشل في حفظ المخرج");
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

    const renderOrdersTable = (list) => (
        <div className="flex-1 overflow-auto min-h-0 border rounded-lg bg-white">
            <table className="w-full border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-20">
                    <tr>
                        {["#", "الطول", "اللون", "الوجهة", "رقم الطبخة", "الحالة", "الإجراءات"].map((h) => (
                            <th key={h} className="px-1 py-2 text-center border-b text-sm whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loadingOrders ? (
                        <tr><td colSpan="7" className="p-6"><LoadingState /></td></tr>
                    ) : list.length === 0 ? (
                        <tr><td colSpan="7" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد طلبات</td></tr>
                    ) : list.map((order, index) => {
                        const batch = order.batch || batches.find((b) => String(b.batch_id) === String(order.batch_id));
                        const status = getStatusBadge(order.status);
                        const color = order.color || colors.find((c) => String(c.color_id) === String(order.color_id));
                        return (
                            <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap">#{order.production_order_id}</td>
                                {/* <td className="px-3 py-2 text-center text-sm whitespace-nowrap">{order.width || FIXED_WIDTH}</td> */}
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{order.length || "-"}</td>
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
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
                                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
                                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1.5 shadow-sm">
                                        <span className="font-medium text-blue-700">
                                            {formatDestination(order.destination)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap">{order.batch_number || batch?.batch_number || "-"}</td>
                                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap"><span className={`px-2 py-1 rounded-lg text-xs ${status.className}`}>{status.label}</span></td>
                                <td className="px-1 py-2 align-middle text-center whitespace-nowrap">
                                    <div className="flex h-8 items-center justify-center gap-1">
                                        <button onClick={() => handleOrderSelect(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"><Eye className="w-4 h-4" /></button>
                                        {ordersTab === "current" && (
                                            <>
                                                <button onClick={() => handleApplyOrderToInputs(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"><Hash className="w-4 h-4" /></button>
                                                <button onClick={() => requestCompleteOrderItem(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50"><Check className="w-4 h-4" /></button>
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
            <div className="absolute left-0 bottom-2 z-40">
                <Button
                    type="button"
                    onClick={() => setShowHeader((prev) => !prev)}
                    className="h-10 w-10 rounded-full border-0 bg-secondary-s text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105 hover:bg-primary-f active:scale-95"
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
                            <div className="text-xs opacity-80">اسم المستخدم</div>
                            <div className="text-base font-bold">{user?.full_name || user?.username || "-"}</div>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
                            <div className="text-xs opacity-80">الدور</div>
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
                    <Card className={`p-4 flex flex-col gap-4 min-h-0 ${showHeader ? "col-span-1" : "col-span-2"}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2"><Package className="w-5 h-5 text-secondary-s" /><h2 className="text-sm font-bold">الطلبات</h2></div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className={ordersTab === "current" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setOrdersTab("current")}>قيد الانتظار</Button>
                                <Button variant="outline" size="sm" className={ordersTab === "completed" ? "bg-blue-50 border-blue-300 text-primary-f" : ""} onClick={() => setOrdersTab("completed")}>المكتملة</Button>
                                <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders}><RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? "animate-spin" : ""}`} />تحديث</Button>
                            </div>
                        </div>
                        {renderOrdersTable(ordersTab === "current" ? currentOrders : completedOrders)}
                    </Card>

                    <Card className={`p-4 flex flex-col ${showHeader ? "col-span-2" : "col-span-3"}`}>
                        <h2 className="text-lg font-bold  flex items-center gap-2"><ArrowRight className="w-5 h-5 text-blue-600" />المدخلات</h2>
                        <div className="flex-1 overflow-auto pr-1 space-y-2">
                            {/* {activeOrderItem && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"><div className="text-sm"><div className="font-bold">تم ربط الإدخال بطلب #{activeOrderItem.production_order_id}</div><div className="text-xs text-gray-600">عنصر #{activeOrderItem.production_order_item_id}</div></div><Button variant="outline" size="sm" onClick={() => setActiveOrderItem(null)}>إلغاء الربط</Button></div>} */}
                            <div className="flex gap-2">
                                <Button variant="outline" className={`flex-1 h-13 ${entryTab === "qr" ? "bg-blue-50 border-blue-300 text-primary-f" : ""}`} onClick={() => setEntryTab("qr")}><Search className="w-4 h-4 ml-2" />QR</Button>
                                <Button variant="outline" className={`flex-1 h-13 ${entryTab === "manual" ? "bg-blue-50 border-blue-300 text-primary-f" : ""}`} onClick={() => setEntryTab("manual")}><Hash className="w-4 h-4 ml-2" />يدوي</Button>
                            </div>
                            {entryTab === "qr" ? (
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
                                        <div><Label className={'mb-1'}>الطول</Label><FilterSelect value={outputForm.length} onChange={(e) => setOutputForm((p) => ({ ...p, length: e.target.value }))} searchValue={selectSearch.length} onSearchValueChange={(value) => setSelectSearch((prev) => ({ ...prev, length: value }))} onInputFocus={() => setCurrentInput("select:length")} options={lengthOptions} placeholder="اختر الطول" disabled={!lengthOptions.length} /></div>
                                        {/* <div><Label className={'mb-1'}>الوجهة</Label><FilterSelect value={outputForm.destination} onChange={(e) => setOutputForm((p) => ({ ...p, destination: e.target.value }))} options={[{ value: MovementDestination.slitting, label: "التشريح" }, { value: MovementDestination.cutting, label: "القص" }, { value: MovementDestination.production, label: "الإنتاج" }]} placeholder="اختر الوجهة" /></div> */}
                                    <div className="col-span-2"><Label className={'mb-1'}>ملاحظات</Label><Input className={`h-13`} value={outputForm.notes} onChange={(e) => setOutputForm((p) => ({ ...p, notes: e.target.value }))} onFocus={() => setCurrentInput("notes")} placeholder="ملاحظات اختيارية" /></div>
                                    </div>
                                    <Button onClick={handleOutputSubmit} className="w-full h-13 bg-green-600 hover:bg-green-700"><Check className="w-5 h-5 ml-2" />حفظ المخرج</Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="flex gap-1 flex-1 min-h-0 flex-row-reverse">
                    

                    <Card className="p-4 pb-0 flex flex-col flex-1  min-h-0">
                        {/* <div className="flex items-center justify-between"><h3 className="text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5 text-purple-600" />جدول المخرجات</h3><Button variant="outline" size="sm" onClick={loadMovements} disabled={loadingMovements}><RefreshCw className={`w-4 h-4 ml-2 ${loadingMovements ? "animate-spin" : ""}`} />تحديث</Button></div> */}
                        <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
                            {/* Multi-select controls */}
                            <div className="p-2 bg-gray-100 border-b flex items-center justify-between sticky top-0 z-10">
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
                            
                            <table className="min-w-[1100px] w-full table-fixed border-collapse">
                                <thead className="bg-gray-100 sticky top-8 z-10"><tr>{["", "#", "اللون", "الطبخة", "الطول", "العرض", "السماكة", "الوجهة", "المستخدم", "التوقيت", "الملاحظات", "إجراءات"].map((h) => <th key={h} className="p-2 text-center border-b text-sm">{h}</th>)}</tr></thead>
                                <tbody>
                                    {loadingMovements ? <tr><td colSpan="13" className="p-6"><LoadingState /></td></tr> : sortedMovements.length === 0 ? <tr><td colSpan="13" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد مخرجات</td></tr> : sortedMovements.map((m) => (
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
                                            <td className="p-2 text-center text-sm">{m.color?.color_name || "-"} ({m.color?.color_code || "-"})</td>
                                            <td className="p-2 text-center text-sm">{m.batch?.batch_number || "-"}</td>
                                            <td className="p-2 text-center text-sm">{m.length || "-"}</td>
                                            <td className="p-2 text-center text-sm">{m.width || FIXED_WIDTH}</td>
                                            <td className="p-2 text-center text-sm">{m.thickness || "-"}</td>
                                            <td className="p-2 text-center text-sm">{formatDestination(m.destination)}</td>
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
                                                    <button onClick={() => { setSelectedMovement(m); setShowMovementDetails(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Eye className="w-4 h-4" /></button>
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

            <StyledDialog isOpen={showOrderDetails} onOpenChange={setShowOrderDetails} title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ""}`} contentClassName="max-w-7xl w-full" onCancel={() => setShowOrderDetails(false)} onConfirm={() => setShowOrderDetails(false)} confirmLabel="إغلاق" showCancel={false}>
                {selectedOrder && (
                    <div className="space-y-4 w-full">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><span className="text-gray-500">رقم الطلب:</span> <span className="font-bold">#{selectedOrder.production_order_id}</span></div>
                            <div><span className="text-gray-500">التاريخ:</span> <span className="font-bold">{formatDate(selectedOrder.created_at)}</span></div>
                            <div><span className="text-gray-500">الحالة:</span> <span className="font-bold">{getStatusBadge(selectedOrder.status).label}</span></div>
                            <div><span className="text-gray-500">الوجهة:</span> <span className="font-bold">{formatDestination(selectedOrder.destination)}</span></div>
                            <div><span className="text-gray-500">العرض:</span> <span className="font-bold">{selectedOrder.width || FIXED_WIDTH}</span></div>
                            <div><span className="text-gray-500">الطول:</span> <span className="font-bold">{selectedOrder.length || "-"}</span></div>
                            <div><span className="text-gray-500">السماكة:</span> <span className="font-bold">{selectedOrder.thickness || "-"}</span></div>
                            <div><span className="text-gray-500">النوع:</span> <span className="font-bold">{formatTypeItem(selectedOrder.type_item || selectedOrder.type)}</span></div>
                            <div><span className="text-gray-500">المصدر:</span> <span className="font-bold">{formatSource(selectedOrder.source || "warehouse")}</span></div>
                            <div><span className="text-gray-500">الطبخة:</span> <span className="font-bold">{selectedOrder.batch_number || selectedOrder.batch?.batch_number || "-"}</span></div>
                            <div className="md:col-span-2"><span className="text-gray-500">اللون:</span> <span className="font-bold">{selectedOrder.color_name || selectedOrder.color?.color_name || "-"} ({selectedOrder.color_code || selectedOrder.color?.color_code || "-"})</span></div>
                            <div className="md:col-span-2"><span className="text-gray-500">الملاحظات:</span> <span className="font-bold">{selectedOrder.notes || "-"}</span></div>
                        </div>
                        {loadingOrderDetails ? <LoadingState /> : (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full table-auto text-sm [&_td]:break-words [&_th]:break-words">
                                    <thead className="bg-gray-100"><tr>{["#", "العرض", "الطول", "السماكة", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => <th key={h} className="p-2 text-center">{h}</th>)}</tr></thead>
                                    <tbody>
                                        {orderItems.length === 0 ? <tr><td colSpan="8" className="p-6 text-center text-gray-400">لا توجد عناصر لهذا الطلب</td></tr> : orderItems.map((item, index) => {
                                            return (
                                            <tr key={item.production_order_item_id || index} className="border-t">
                                                <td className="p-2 text-center">#{item.production_order_item_id || index + 1}</td>
                                                <td className="p-2 text-center">{item.width || FIXED_WIDTH}</td>
                                                <td className="p-2 text-center">{item.length || "-"}</td>
                                                <td className="p-2 text-center">{item.thickness || "-"}</td>
                                                <td className="p-2 text-center">{formatDestination(item.destination)}</td>
                                                <td className="p-2 text-center"><span className={`px-2 py-1 rounded-lg text-xs ${getStatusBadge(item.status).className}`}>{getStatusBadge(item.status).label}</span></td>
                                                <td className="p-2 text-center">{item.notes || "-"}</td>
                                                <td className="p-2 text-center"><div className="flex items-center justify-center gap-2"><Button variant="outline" size="sm" onClick={() => handleApplyOrderToInputs(item)}>إدخال</Button><Button variant="outline" size="sm" disabled={String(item.status || "").toLowerCase() === ProductionStatus.completed} onClick={() => requestCompleteOrderItem(item)}>إتمام</Button></div></td>
                                            </tr>
                                        );
                                        })}
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
                    if (pendingCompleteItem) {
                        await handleCompleteOrderItem(pendingCompleteItem);
                    }
                    setShowCompleteDialog(false);
                    setPendingCompleteItem(null);
                }}
                confirmLabel="تأكيد"
                cancelLabel="إلغاء"
            >
                <div className="text-sm text-gray-700">
                    هل تريد إتمام الطلب
                    {" "}
                    <span className="font-bold">
                        #{pendingCompleteItem?.production_order_id || pendingCompleteItem?.production_order_item_id || ""}
                    </span>
                    {" "}
                    ونقله إلى المكتمل؟
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
                    <div className="mt-4">
                        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">العرض</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطول</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">السماكة</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">اللون</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطبخة</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">المسطرة</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الوجهة</th>
                                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{FIXED_WIDTH}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.length || "-"}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingOutput?.thickness || "-"}</td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        {(() => {
                                            const color = colors.find(c => String(c.color_id) === String(pendingOutput?.color_id));
                                            return color ? `${color.color_name} (${color.color_code})` : "-";
                                        })()}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        {(() => {
                                            const batch = batches.find(b => String(b.batch_id) === String(pendingOutput?.batch_id));
                                            return batch ? batch.batch_number : "-";
                                        })()}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        {(() => {
                                            const ruler = rulers.find(r => String(r.ruler_id) === String(pendingOutput?.ruler_id));
                                            return ruler ? ruler.ruler_name : "-";
                                        })()}
                                    </td>
                                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                            {formatDestination(pendingOutput?.destination)}
                                        </span>
                                    </td>
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
                            <div><span className="font-medium">الطول:</span> {pendingDeleteMovement?.length || "-"}</div>
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
