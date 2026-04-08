// OrderPreparer.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/common/DashboardHeader";
import { orderApi } from "../../api/orderApi";
import { salesApi } from "../../api/salesApi";
import { customerApi } from "../../api/customerApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { priceColorApi } from "../../api/priceColorApi";
import { constantApi } from "../../api/constantApi";
import { useExport } from "../../hooks/useExport";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import PaginationControls from "../../components/common/PaginationControls";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { ShoppingCart, Plus, History, Trash2, Eye, RotateCcw, Check, Users, EyeOff, Home, LogOut, X, AlertCircle,  Edit, Save, Download, ChevronLeft, ChevronRight, UserPlus, User, UserX, FileText, Palette, Printer } from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, OrderStatus, CustomerType, PriceColorBy } from "../../types/enums";
import { useAuth } from "../../context/AuthContext";
import ColorsReadOnly from "./ColorsReadOnly";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function OrderPreparer() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [viewMode, setViewMode] = useState("orders"); // create | history | colors | orders
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const tableContainerRef = useRef(null);

    // Data
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [priceColors, setPriceColors] = useState([]);
    const [widthValues, setWidthValues] = useState([]);
    const [thicknessValues, setThicknessValues] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loadingWidths, setLoadingWidths] = useState(false);
    const [loadingThickness, setLoadingThickness] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // History filters
    const [historySearchTerm, setHistorySearchTerm] = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("");
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingOrders, setDeletingOrders] = useState(false);

    // Pagination states for orders history table
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    // Pagination states for orders records table (orders tab)
    const [ordersRecordsPage, setOrdersRecordsPage] = useState(1);
    const [ordersRecordsRowsPerPage, setOrdersRecordsRowsPerPage] = useState(20);

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState("");
    const [customerOption, setCustomerOption] = useState("none"); // none, existing, new

    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: "",
        customer_type: CustomerType.customer,
        city: "",
        address: "",
        is_active: true,
        notes: ""
    });

    // Form State
    const [formData, setFormData] = useState({
        material_id: "",
        type_item: "",
        ruler_id: "",
        color_id: "",
        batch_id: "",
        width: "",
        thickness: "",
        quantity: "",
        notes: ""
    });

    const [orderItems, setOrderItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [ordersRecords, setOrdersRecords] = useState([]);
    const [ordersRecordsLoading, setOrdersRecordsLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filtered orders for display
    const filteredOrders = useMemo(() => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        return safeOrders.filter(order => {
            const term = String(historySearchTerm || "").toLowerCase().trim();
            const matchesSearch = !term || (
                String(getOrderId(order) || "").toLowerCase().includes(term) ||
                String(order.customer_name || "").toLowerCase().includes(term) ||
                String(order.phone || "").toLowerCase().includes(term) ||
                (order.customer?.name && String(order.customer.name).toLowerCase().includes(term)) ||
                (order.customer?.phone && String(order.customer.phone).toLowerCase().includes(term)) ||
                (order.notes && String(order.notes).toLowerCase().includes(term)) ||
                (order.total_amount && String(order.total_amount).toLowerCase().includes(term)) ||
                (order.paid_amount && String(order.paid_amount).toLowerCase().includes(term)) ||
                (order.remaining_amount && String(order.remaining_amount).toLowerCase().includes(term)) ||
                (order.sales?.full_name && String(order.sales.full_name).toLowerCase().includes(term)) ||
                (order.sales?.username && String(order.sales.username).toLowerCase().includes(term)) ||
                (order.status && String(order.status).toLowerCase().includes(term)) ||
                (order.created_at && new Date(order.created_at).toLocaleDateString('en-US').includes(term))
            );
            const matchesStatus = !historyStatusFilter || String(order.status || "").toLowerCase() === String(historyStatusFilter).toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [orders, historySearchTerm, historyStatusFilter]);

    // Pagination logic for orders history table
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Pagination logic for orders records table
    const ordersRecordsTotalPages = Math.ceil(ordersRecords.length / ordersRecordsRowsPerPage) || 1;
    const ordersRecordsStartIndex = (ordersRecordsPage - 1) * ordersRecordsRowsPerPage;
    const ordersRecordsEndIndex = ordersRecordsStartIndex + ordersRecordsRowsPerPage;
    const paginatedOrdersRecords = ordersRecords.slice(ordersRecordsStartIndex, ordersRecordsEndIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [historySearchTerm, historyStatusFilter]);

    useEffect(() => {
        setOrdersRecordsPage(1);
    }, [ordersRecordsRowsPerPage, ordersRecords.length]);

    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Numpad
    const [numpadMode, setNumpadMode] = useState("quantity");
    const [activeTextTarget, setActiveTextTarget] = useState(null); // color_search | batch_search | customer_search
    const [colorSearchCode, setColorSearchCode] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [activeField, setActiveField] = useState("quantity");

    const [qrPreview, setQrPreview] = useState({
        open: false,
        url: "",
        title: "",
        colorCode: "",
        quantity: "",
        batchNumber: "",
        footerText: ""
    });

    const [orderQrPreview, setOrderQrPreview] = useState({
        open: false,
        qrUrl: "",
        qrData: "",
        itemsCount: 0,
        totalQuantity: 0,
        footerText: ""
    });

    // Production orders state for order-preparer
    const [productionOrders, setProductionOrders] = useState([]);
    const [productionLoading, setProductionLoading] = useState(false);
    const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

    // QR Generation Dialog State with quantity editing
    const [qrGenDialog, setQrGenDialog] = useState({
        open: false,
        item: null,
        quantity: "",
        qrUrl: "",
        qrData: ""
    });

    const [savingQrQuantity, setSavingQrQuantity] = useState(false);
    const isOrderPreparer = true;
    const showOrderSwitch = true;

    const ordersApi = orderApi;

    const isQrQuantityChanged = useMemo(() => {
        const current = String(qrGenDialog.quantity ?? "");
        const original = String(qrGenDialog.item?.quantity ?? "");
        return current !== original;
    }, [qrGenDialog.quantity, qrGenDialog.item?.quantity]);

    const { exportToExcel: exportOrdersToExcel, loading: exportingOrders } = useExport({
        sheetName: "الطلبات",
        columns: [
            { key: "order_id", header: "#" },
            { key: "date", header: "التاريخ" },
            { key: "items", header: "العناصر" },
            { key: "sales", header: "المبيعات" },
            { key: "customer", header: "الزبون" },
            { key: "status", header: "الحالة" },
            { key: "notes", header: "ملاحظات" },
        ],

        columnWidths: [
            { wch: 8 },
            { wch: 20 },
            { wch: 12 },
            { wch: 22 },
            { wch: 22 },
            { wch: 14 },
            { wch: 28 },
        ],
    });

    // Helper functions from orderApi
    const getOrderStatus = (order) => ordersApi.getOrderStatus(order);
    const getFormattedDate = (order) => ordersApi.getFormattedDate(order);
    const formatCurrency = (amount) => ordersApi.formatCurrency(amount);
    const getStatusBadge = (status) => ordersApi.getStatusBadge(status);
    const getSalesUserName = (order) => ordersApi.getSalesUserName(order);
    const getCustomerName = (order) => ordersApi.getCustomerName(order);
    const getCustomerPhone = (order) => ordersApi.getCustomerPhone(order);
    const getCustomerCity = (order) => ordersApi.getCustomerCity(order);
    const getCustomerAddress = (order) => ordersApi.getCustomerAddress(order);
    const formatCustomerInfo = (order) => ordersApi.formatCustomerInfo(order);
    const calculateOrderTotal = (items) => ordersApi.calculateOrderTotal(items);
    const getOrderId = (order) => order?.order_id ?? order?.Sales_order_id ?? order?.sales_order_id ?? order?.id ?? null;

    const TYPE_OPTIONS = [
        { value: TypeItem.Machine, label: "مكنة" },
        { value: TypeItem.Presser, label: "كوي" }
    ];

    const formatTypeItem = (value) => {
        if (value === TypeItem.Machine) return "مكنة";
        if (value === TypeItem.Presser) return "كوي";
        return "-";
    };

    const formatTypeItemString = (value) => {
        if (!value) return "-";
        const raw = String(value);
        const v = raw.toLowerCase();
        if (v === String(TypeItem.Machine).toLowerCase() || v.includes("machine")) return "مكنة";
        if (v === String(TypeItem.Presser).toLowerCase() || v.includes("presser")) return "كوي";
        // إن كانت قيمة أخرى معرّفة نعرضها كما هي
        return raw;
    };



    const CUSTOMER_OPTIONS = [
        { value: "none", label: "بدون زبون", icon: UserX },
        { value: "existing", label: "زبون موجود", icon: User },
        { value: "new", label: "زبون جديد", icon: UserPlus }
    ];

    const PRICE_BY_TO_WIDTH = {
        [PriceColorBy.isByMeter22]: 22,
        [PriceColorBy.isByMeter44]: 44,
        [PriceColorBy.isByMeter66]: 66,
        [PriceColorBy.isByBlanck]: null
    };



    const handleUpdateOrderStatus = async (nextStatus) => {

        if (!getOrderId(orderDetails)) return;

        try {

            setUpdatingOrderStatus(true);

            await ordersApi.updateOrderStatus(getOrderId(orderDetails), nextStatus);

            setOrderDetails((prev) => (prev ? { ...prev, status: nextStatus } : prev));

            setOrders((prev) => prev.map((o) => (getOrderId(o) === getOrderId(orderDetails) ? { ...o, status: nextStatus } : o)));
            setOrdersRecords((prev) => prev.map((o) => (getOrderId(o) === getOrderId(orderDetails) ? { ...o, status: nextStatus } : o)));

            toast.success("تم تحديث الحالة");

        } catch (error) {

            toast.error("فشل في تحديث الحالة");

        } finally {

            setUpdatingOrderStatus(false);

        }

    };



    const totalPreviewQuantity = useMemo(() => {

        return orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    }, [orderItems]);



    const getStatusLabel = (status) => {

        switch (status) {

            case OrderStatus.pending:

                return "قيد الانتظار";

            case OrderStatus.preparing:

                return "قيد التحضير";

            case OrderStatus.outofwarehouse:

                return "اخراج من المستودع";

            case OrderStatus.completed:

                return "مكتمل";

            case OrderStatus.canceled:

                return "ملغي";

            default:

                return status || "-";

        }

    };



    const formatPhoneNumber = (phone) => {

        if (!phone) return "";

        let cleaned = phone.replace(/\D/g, "");

        if (cleaned.startsWith("0")) {

            cleaned = cleaned.substring(1);

        }

        if (cleaned.startsWith("963")) {

            return `+${cleaned}`;

        }

        return `+963${cleaned}`;

    };



    // Load initial data

    useEffect(() => {

        loadInitialData();

        loadCustomers();

    }, []);



    useEffect(() => {

        if (viewMode === "history") loadOrders();

    }, [viewMode]);

    useEffect(() => {

        if (viewMode === "orders") loadOrdersRecords();

    }, [viewMode]);



    useEffect(() => {

        if (qrPreview.open) {

            setQrPreview((prev) => ({ ...prev, open: false }));

        }

    }, [viewMode]);



    // Load width values and thickness when material changes

    useEffect(() => {

        if (formData.material_id) {

            loadWidthValues(formData.material_id);

            loadThicknessFromMaterial(formData.material_id);

        } else {

            setWidthValues([]);

            setFormData(prev => ({ ...prev, width: "" }));

        }

    }, [formData.material_id]);



    const loadInitialData = async () => {
        try {
            setLoading(true);
            
            console.log("[OrderPreparer] Starting loadInitialData...");
            console.log("[OrderPreparer] API URL:", import.meta.env.VITE_API_URL);
            console.log("[OrderPreparer] Token exists:", !!localStorage.getItem('accessToken'));
            
            const [matRes, rulerRes, colorRes, batchRes, priceRes] = await Promise.all([
                materialApi.getMaterials().catch(err => {
                    console.error("[OrderPreparer] Materials API failed:", err);
                    throw err;
                }),
                rulerApi.getRulers().catch(err => {
                    console.error("[OrderPreparer] Rulers API failed:", err);
                    throw err;
                }),
                colorApi.getColors().catch(err => {
                    console.error("[OrderPreparer] Colors API failed:", err);
                    throw err;
                }),
                batchApi.getBatches().catch(err => {
                    console.error("[OrderPreparer] Batches API failed:", err);
                    throw err;
                }),
                priceColorApi.getPriceColors().catch(err => {
                    console.error("[OrderPreparer] PriceColors API failed:", err);
                    throw err;
                }),
            ]);

            console.log("[OrderPreparer] All APIs succeeded");
            setMaterials(getApiData(matRes, []) || []);
            setRulers(getApiData(rulerRes, []) || []);
            setColors(getApiData(colorRes, []) || []);
            setBatches(getApiData(batchRes, []) || []);
            setPriceColors(getApiData(priceRes, []) || []);

        } catch (error) {
            console.error("[OrderPreparer] Error loading initial data:", error);
            console.error("[OrderPreparer] Error message:", error?.message);
            console.error("[OrderPreparer] Error response:", error?.response);
            toast.error("فشل في تحميل البيانات: " + (error?.message || "خطأ غير معروف"));
        } finally {
            setLoading(false);
        }
    };



    const loadCustomers = async () => {

        try {

            setLoadingCustomers(true);

            const response = await customerApi.getCustomers();

            setCustomers(getApiData(response, []) || []);

        } catch (error) {

            // console.error("Error loading customers:", error);

            toast.error("فشل في تحميل العملاء");

        } finally {

            setLoadingCustomers(false);

        }

    };



    const loadWidthValues = async (materialId) => {
        try {
            setLoadingWidths(true);
            const response = await constantApi.getConstantValuesByMaterial(materialId, 'width');
            const widthData = getApiData(response, []);
            setWidthValues(widthData);
            // Set default width if isDefault is true
            const defaultWidth = widthData.find(w => w.isDefault);
            if (defaultWidth) {
                setFormData(prev => ({ ...prev, width: String(defaultWidth.value) }));
            } else if (widthData.length > 0) {
                // If no default but has values, set the first one
                setFormData(prev => ({ ...prev, width: String(widthData[0].value) }));
            } else {
                setFormData(prev => ({ ...prev, width: "" }));
            }
        } catch (error) {
            // console.error("Error loading widths:", error);
            toast.error("فشل في تحميل قيم العرض");
            setWidthValues([]);
            setFormData(prev => ({ ...prev, width: "" }));
        } finally {
            setLoadingWidths(false);
        }
    };



    const loadThicknessFromMaterial = async (materialId) => {

        try {

            setLoadingThickness(true);

            const response = await constantApi.getConstantValuesByMaterial(materialId, 'thickness');

            const thicknessData = getApiData(response, []);

            setThicknessValues(thicknessData);



            // Set default thickness if isDefault is true

            const defaultThickness = thicknessData.find(t => t.isDefault);

            if (defaultThickness) {

                setFormData(prev => ({ ...prev, thickness: String(defaultThickness.value) }));

            } else if (thicknessData.length > 0) {

                // If no default but has values, set the first one

                setFormData(prev => ({ ...prev, thickness: String(thicknessData[0].value) }));

            }

        } catch (error) {

            // console.error("Error loading thickness:", error);

            setThicknessValues([]);

            // Keep existing thickness if error occurs

        } finally {

            setLoadingThickness(false);

        }

    };



    const loadOrders = async () => {

        try {

            setOrdersLoading(true);

            const response = await ordersApi.getOrders();

            const data = getApiData(response, []) || [];

            const nextOrders = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);

            setOrders(nextOrders);

        } catch (error) {

            // console.error("Error loading orders:", error);

            toast.error("فشل في تحميل الطلبات");

        } finally {

            setOrdersLoading(false);

        }

    };

    const loadOrdersRecords = async () => {
        try {
            setOrdersRecordsLoading(true);
            const response = await orderApi.getOrders();
            const data = getApiData(response, []) || [];
            const nextOrders = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
            setOrdersRecords(nextOrders);
        } catch (error) {
            toast.error("فشل في تحميل سجل الطلبات");
        } finally {
            setOrdersRecordsLoading(false);
        }
    };



    const handleExportOrders = () => {

        if (!orders || orders.length === 0) {

            toast.error("لا توجد طلبات للتصدير");

            return;

        }

        const exportRows = orders.map((order) => ({

            order_id: getOrderId(order) ? `#${getOrderId(order)}` : "بدون طلب",

            date: getFormattedDate(order),

            items: order.count_items ?? order.items?.length ?? 0,

            sales: getSalesUserName(order) || "-",

            customer: getCustomerName(order) || "-",

            status: getStatusBadge(order.status)?.label || "-",

            notes: order.notes || "",

        }));

        exportOrdersToExcel(exportRows, "الطلبات");

    };



    const getQrUrl = (data) => {

        const encoded = encodeURIComponent(String(data || ""));

        return `https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encoded}`;

    };



    const getOrderQrUrl = (data) => {

        const encoded = encodeURIComponent(String(data || ""));

        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;

    };



    const buildOrderQrData = (items) => {

        const orderId = editingOrderId ?? "-";

        const customerName = customerOption === "existing"

            ? (selectedCustomer?.name ?? "-")

            : customerOption === "new"

                ? (newCustomer?.name ?? "-")

                : "-";

        const customerPhone = customerOption === "existing"

            ? (selectedCustomer?.phone ?? "-")

            : customerOption === "new"

                ? (newCustomer?.phone ?? "-")

                : "-";

        const customerCity = customerOption === "existing"

            ? (selectedCustomer?.city ?? "-")

            : customerOption === "new"

                ? (newCustomer?.city ?? "-")

                : "-";

        const customerAddress = customerOption === "existing"

            ? (selectedCustomer?.address ?? "-")

            : customerOption === "new"

                ? (newCustomer?.address ?? "-")

                : "-";



        const itemsText = (items || []).map((item, index) => {

            const typeLabel = formatTypeItemString(item.type_item);

            return [

                `#${index + 1}`,

                `المادة:${item.material_name ?? "-"}`,

                `النوع:${typeLabel || "-"}`,

                `المسطرة:${item.ruler_name ?? "-"}`,

                `اللون:${item.color_name ?? "-"}`,

                `كود اللون:${item.color_code ?? "-"}`,

                `العرض:${item.width ?? "-"}`,

                `الطول:${item.length ?? 100}`,

                `السماكة:${item.thickness ?? "-"}`,

                `الكمية:${item.quantity ?? "-"}`,

                `الطبخة:${item.batch_number ?? "-"}`,

                `ملاحظات:${item.notes ?? "-"}`

            ].join("|");

        }).join("\n");



        return [

            `رقم الطلب:${orderId}`,

            `الزبون:${customerName}`,

            `هاتف الزبون:${customerPhone}`,

            `المدينة:${customerCity}`,

            `العنوان:${customerAddress}`,

            `عدد العناصر:${orderItems.length}`,

            `إجمالي الكمية:${totalPreviewQuantity} م`,

            "العناصر:",

            itemsText || "-"

        ].join("\n");

    };



    const buildItemQrData = (item) => {

        console.log("Debug - buildItemQrData item:", item);

        console.log("Debug - item.employee_id:", item.employee_id);

        console.log("Debug - user object:", user);

        console.log("Debug - user keys:", user ? Object.keys(user) : "user is null");

        console.log("Debug - user.user_id:", user?.user_id);

        console.log("Debug - user.id:", user?.id);

        console.log("Debug - user.employee_id:", user?.employee_id);



        const typeLabel = formatTypeItemString(item?.type_item);



        const values = [

            item?.material_name ?? "",

            item?.ruler_name ?? item?.ruler_type ?? item?.rulerType ?? item?.ruler?.ruler_name ?? item?.ruler?.ruler_type ?? "",

            item?.color_code ?? item?.color_code ?? "",

            item?.width ?? "",

            item?.length ?? 100,

            item?.thickness ?? "",

            item?.quantity ?? "",

            item?.batch_number ?? "",

            typeLabel ?? "",

            item?.employee_id ?? user?.user_id ?? user?.id ?? user?.employee_id ?? ""

        ];

        const result = values.join('|');

        console.log("Debug - QR data result:", result);

        return result;

    };



    const openQrPreview = (url, title = "", meta = {}) => {

        // Use the same values and order as buildItemQrData

        const material = meta.material_name || meta.material || "";

        const ruler = meta.ruler_name || meta.ruler_type || meta.rulerType || meta.ruler?.ruler_name || meta.ruler?.ruler_type || "";

        const colorCode = meta.color_code || meta.colorCode || "";

        const width = meta.width || "";

        const length = meta.length ?? 100;

        const thickness = meta.thickness || "";

        const quantity = meta.quantity || "";

        const batch = meta.batch_number || meta.batchNumber || "";

        const typeLabel = meta.type_label || meta.typeLabel || "";

        const employeeId = meta.employeeId || meta.employee_id || user?.user_id || user?.id || user?.employee_id || "";



        // Build footer with same order as QR data: material|ruler|color_code|width|length|thickness|quantity|batch|type|employeeId

        const footer = [material, ruler, colorCode, width, length, thickness, quantity, batch, typeLabel, employeeId].filter(v => v !== "").join("|");



        setQrPreview({

            open: true,

            url,

            title,

            material,

            ruler,

            colorCode,

            width,

            length,

            thickness,

            quantity,

            batchNumber: batch,

            typeLabel,

            employeeId,

            footerText: footer

        });

    };



    const openQrGenDialog = (item) => {

        const initialQty = item?.quantity ? String(item.quantity) : "";

        const itemWithQty = { ...item, quantity: initialQty };

        const qrData = buildItemQrData(itemWithQty);

        const qrUrl = getQrUrl(qrData);



        setQrGenDialog({

            open: true,

            item: item,

            quantity: initialQty,

            qrUrl: qrUrl,

            qrData: qrData

        });

    };



    const updateQrGenQuantity = (newQuantity) => {

        setQrGenDialog(prev => {

            const updatedItem = { ...prev.item, quantity: newQuantity };

            const newQrData = buildItemQrData(updatedItem);

            const newQrUrl = getQrUrl(newQrData);

            return {

                ...prev,

                quantity: newQuantity,

                qrUrl: newQrUrl,

                qrData: newQrData

            };

        });

    };



    const applyQrGenQuantity = async () => {

        const targetId = qrGenDialog.item?.id;

        const orderId = qrGenDialog.item?.order_id ?? qrGenDialog.item?.sales_order_id ?? qrGenDialog.item?.Sales_order_id ?? qrGenDialog.item?.salesOrder?.sales_order_id ?? getOrderId(orderDetails);

        const orderItemId = qrGenDialog.item?.order_item_id;

        if (targetId == null || !orderId || !orderItemId) {

            toast.error("لا يمكن حفظ الكمية");

            return;

        }



        try {

            setSavingQrQuantity(true);

            const quantityValue = Number(qrGenDialog.quantity);

            if (!Number.isFinite(quantityValue)) {

                toast.error("الكمية غير صالحة");

                return;

            }

            const itemPayload = {

                type_item: qrGenDialog.item?.type_item ?? "",

                color_id: qrGenDialog.item?.color_id ?? qrGenDialog.item?.color?.color_id ?? null,

                batch_id: qrGenDialog.item?.batch_id ?? qrGenDialog.item?.batch?.batch_id ?? null,

                width: Number(qrGenDialog.item?.width) || 0,

                length: Number(qrGenDialog.item?.length ?? 100),

                thickness: Number(qrGenDialog.item?.thickness) || 0,

                quantity: quantityValue,

                status: qrGenDialog.item?.status ?? OrderStatus.pending,

                notes: qrGenDialog.item?.notes ?? ""

            };



            await ordersApi.updateOrderItem(orderId, orderItemId, itemPayload);



            setOrderDetails(prev => {

                if (!prev?.items) return prev;

                const updatedItems = prev.items.map(item =>

                    (item.order_item_id === orderItemId)

                        ? { ...item, quantity: quantityValue }

                        : item

                );

                return { ...prev, items: updatedItems };

            });



            setQrGenDialog(prev => ({

                ...prev,

                item: { ...prev.item, quantity: quantityValue }

            }));



            toast.success("تم حفظ الكمية");

        } catch (error) {

            toast.error(error?.message || "فشل في حفظ الكمية");

        } finally {

            setSavingQrQuantity(false);

        }

    };



    const closeQrGenDialog = () => {

        setQrGenDialog({

            open: false,

            item: null,

            quantity: "",

            qrUrl: "",

            qrData: ""

        });

    };



    const printQr = (url, title = "QR", footer = "", direction = "rtl") => {

        const w = window.open("", "_blank", "width=600,height=700");

        if (!w) return;

        w.document.write(`<!doctype html><html><head><title>${title}</title></head><body style="display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:sans-serif;gap:12px;direction:${direction};">

          <h3 style="margin:0;">${title}</h3>

          <img src="${url}" style="width:320px;height:320px;image-rendering:pixelated;" />

          <div dir="${direction}" style="margin-top:8px;font-size:28px;font-weight:bold;text-align:${direction === 'rtl' ? 'right' : 'left'};">${footer}</div>

          <script>window.onload = () => { window.print(); };</script>

        </body></html>`);

        w.document.close();

    };



    const handleCreateCustomer = async () => {

        if (!newCustomer.name || !newCustomer.phone) {

            toast.error("الاسم ورقم الهاتف مطلوبان");

            return;

        }



        try {

            setLoading(true);



            const formattedPhone = formatPhoneNumber(newCustomer.phone);



            const customerData = {

                name: newCustomer.name,

                phone: formattedPhone,

                customer_type: CustomerType.customer,

                city: newCustomer.city || "",

                address: newCustomer.address || "",

                is_active: true,

                notes: newCustomer.notes || ""

            };



            // console.log("Creating customer with data:", customerData);



            const response = await customerApi.createCustomer(customerData);

            const createdCustomer = getApiData(response, {});



            if (createdCustomer) {

                toast.success("تم إنشاء الزبون بنجاح");

                setCustomers(prev => [...prev, createdCustomer]);

                setSelectedCustomer(createdCustomer);

                setCustomerOption("existing");

                setNewCustomer({

                    name: "",

                    phone: "",

                    customer_type: CustomerType.customer,

                    city: "",

                    address: "",

                    is_active: true,

                    notes: ""

                });

            }

        } catch (error) {

            // console.error("Error creating customer:", error);

            toast.error(error.response?.data?.message || "فشل في إنشاء الزبون");

        } finally {

            setLoading(false);

        }

    };



    const isSelectedMaterialBoard = useMemo(() => {

        if (!formData.material_id) return false;

        const selectedMaterial = materials.find(m => String(m.material_id) === String(formData.material_id));

        const materialName = selectedMaterial?.material_name?.toLowerCase() || "";

        const boardKeywords = ["لوح", "ألواح", "board", "boards", "لوحة", "الواح"];

        return boardKeywords.some(keyword => materialName.includes(keyword));

    }, [formData.material_id, materials]);

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

    const getMaterialConstantLabel = useCallback((material, type) => {

        const values = material?.constant_values || [];

        const candidates = values.filter(v => v.type === type);

        const pick = candidates.find(v => v.isDefault) || candidates[0];

        if (!pick) return "-";

        return pick.label || `${pick.value ?? ""} ${pick.unit || ""}`.trim();

    }, []);



    // Filters

    const availableRulers = useMemo(() => {

        if (!formData.material_id) return [];

        return rulers.filter(r => String(r.material_id) === String(formData.material_id));

    }, [formData.material_id, rulers]);



    const availableColors = useMemo(() => {

        if (!formData.ruler_id) return [];

        return colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));

    }, [formData.ruler_id, colors]);



    const availablePricedColors = useMemo(() => {

        if (!formData.ruler_id) return [];



        const filteredColors = colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));



        if (!priceColors || priceColors.length === 0) {

            return filteredColors;

        }



        if (isSelectedMaterialBoard) {

            return filteredColors.filter(color =>

                priceColors.some(pc =>

                    String(pc.color_id) === String(color.color_id) &&

                    (!isSelectedMaterialPvc || pc.type_item === formData.type_item)

                )

            );

        }



        if (!formData.width) return [];

        const targetWidth = Number(formData.width);



        return filteredColors.filter(color => {

            return priceColors.some(pc =>

                String(pc.color_id) === String(color.color_id) &&

                (!isSelectedMaterialPvc || pc.type_item === formData.type_item) &&

                (pc.price_color_By === PriceColorBy.isByMeter22 && targetWidth === 22 ||

                    pc.price_color_By === PriceColorBy.isByMeter44 && targetWidth === 44 ||

                    pc.price_color_By === PriceColorBy.isByMeter66 && targetWidth === 66 ||

                    pc.price_color_By === PriceColorBy.isByBlanck)

            );

        });

    }, [formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, isSelectedMaterialPvc, colors, priceColors]);



    const filteredColorsBySearch = useMemo(() => {

        if (!colorSearchCode || numpadMode !== "colorSearch") return availablePricedColors;

        return availablePricedColors.filter(c =>

            c.color_code?.toLowerCase().includes(colorSearchCode.toLowerCase())

        );

    }, [colorSearchCode, availablePricedColors, numpadMode]);



    const isColorPriced = useMemo(() => {

        if (!formData.color_id || !formData.ruler_id) return false;



        if (!priceColors || priceColors.length === 0) {

            return true;

        }



        if (isSelectedMaterialBoard) {

            return priceColors.some(pc =>

                String(pc.color_id) === String(formData.color_id) &&

                (!isSelectedMaterialPvc || pc.type_item === formData.type_item)

            );

        }



        if (!formData.width) return false;

        const targetWidth = Number(formData.width);



        return priceColors.some(pc =>

            String(pc.color_id) === String(formData.color_id) &&

            (!isSelectedMaterialPvc || pc.type_item === formData.type_item) &&

            (pc.price_color_By === PriceColorBy.isByMeter22 && targetWidth === 22 ||

                pc.price_color_By === PriceColorBy.isByMeter44 && targetWidth === 44 ||

                pc.price_color_By === PriceColorBy.isByMeter66 && targetWidth === 66 ||

                pc.price_color_By === PriceColorBy.isByBlanck)

        );

    }, [formData.color_id, formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, isSelectedMaterialPvc, priceColors]);



    const getColorPricingStatus = (colorId) => {

        if (!priceColors || priceColors.length === 0) return { priced: true, label: "" };



        if (isSelectedMaterialBoard) {

            const isPriced = priceColors.some(pc =>

                String(pc.color_id) === String(colorId) &&

                (!isSelectedMaterialPvc || pc.type_item === formData.type_item)

            );

            return { priced: isPriced, label: isPriced ? "" : " (غير مسعر)" };

        }



        if (!formData.width) return { priced: false, label: " (اختر العرض)" };



        const targetWidth = Number(formData.width);

        const isPriced = priceColors.some(pc =>

            String(pc.color_id) === String(colorId) &&

            (!isSelectedMaterialPvc || pc.type_item === formData.type_item) &&

            (pc.price_color_By === PriceColorBy.isByMeter22 && targetWidth === 22 ||

                pc.price_color_By === PriceColorBy.isByMeter44 && targetWidth === 44 ||

                pc.price_color_By === PriceColorBy.isByMeter66 && targetWidth === 66 ||

                pc.price_color_By === PriceColorBy.isByBlanck)

        );

        return { priced: isPriced, label: isPriced ? "" : " (غير مسعر)" };

    };



    const handleFieldChange = (field, value) => {

        setFormData(prev => {

            const newData = { ...prev, [field]: value };



            if (field === "material_id") {

                newData.ruler_id = "";

                newData.color_id = "";

                newData.batch_id = "";

                newData.width = "";

                newData.type_item = "";

            } else if (field === "ruler_id") {

                newData.color_id = "";

                newData.batch_id = "";

            } else if (field === "width") {

                newData.color_id = "";

                newData.batch_id = "";

            } else if (field === "type_item") {

                newData.color_id = "";

                newData.batch_id = "";

            }



            return newData;

        });

    };



    const handleNumpadPress = (val) => {

        if (numpadMode === "text") {

            const apply = (prev) => {

                let next = String(prev || "");

                if (val === "clear") next = "";

                else if (val === "back") next = next.slice(0, -1);

                else next = next + val;

                return next;

            };



            if (activeTextTarget === "color_search") {

                const next = apply(colorSearchCode);

                setColorSearchCode(next);

                const matched = availablePricedColors.find(c => String(c.color_code) === String(next));

                if (matched) {

                    handleFieldChange("color_id", String(matched.color_id));

                    setNumpadMode("quantity");

                    setActiveTextTarget(null);

                    setColorSearchCode("");

                    toast.success(`تم العثور على اللون: ${matched.color_name}`);

                }

                return;

            }



            if (activeTextTarget === "batch_search") {

                setBatchSearchTerm((prev) => apply(prev));

                return;

            }



            if (activeTextTarget === "customer_search") {

                setCustomerSearchTerm((prev) => apply(prev));

                return;

            }



            return;

        }



        let current = String(formData[activeField] || "");

        if (val === "clear") current = "";

        else if (val === "back") current = current.slice(0, -1);

        else if (val === ".") {

            if (!current.includes(".")) current = current ? current + "." : "0.";

        } else {

            current = current + val;

        }

        handleFieldChange(activeField, current);

    };



    const addOrUpdateItem = () => {

        if (!formData.material_id || !formData.ruler_id || !formData.color_id || !formData.quantity) {

            toast.error("يرجى اكمال جميع البيانات");

            return;

        }



        if (isSelectedMaterialPvc && !formData.type_item) {

            toast.error("يرجى اختيار النوع");

            return;

        }



        if (!isSelectedMaterialBoard && !formData.width) {

            toast.error("يرجى اختيار العرض");

            return;

        }



        if (!isColorPriced) {

            toast.error("اللون المحدد غير مسعر لهذه المواصفات");

            return;

        }



        const material = materials.find(m => String(m.material_id) === String(formData.material_id));

        const ruler = rulers.find(r => String(r.ruler_id) === String(formData.ruler_id));

        const color = colors.find(c => String(c.color_id) === String(formData.color_id));

        const batch = batches.find(b => String(b.batch_id) === String(formData.batch_id));



        const newItemBase = {

            id: editingItemId || Date.now(),

            material_id: formData.material_id,

            type_item: formData.type_item || "",

            ruler_id: formData.ruler_id,

            color_id: formData.color_id,

            batch_id: formData.batch_id,

            width: formData.width,

            length: 100,

            thickness: formData.thickness,

            quantity: formData.quantity,

            notes: formData.notes,

            material_name: material?.material_name,

            ruler_name: ruler?.ruler_name ?? ruler?.ruler_type,

            color_name: color?.color_name,

            color_code: color?.color_code,

            batch_number: batch?.batch_number,

        };



        const qrData = buildItemQrData(newItemBase);

        const newItem = {

            ...newItemBase,

            qrData,

            qrUrl: getQrUrl(qrData),

        };



        if (editingItemId) {

            setOrderItems(prev => prev.map(item =>

                item.id === editingItemId ? newItem : item

            ));

            toast.success("تم تحديث العنصر بنجاح");

            setEditingItemId(null);

        } else {

            setOrderItems(prev => [...prev, newItem]);

            toast.success("تم إضافة العنصر بنجاح");

        }



        setFormData(prev => ({

            material_id: prev.material_id,

            thickness: prev.thickness,

            type_item: prev.type_item,

            width: prev.width,

            ruler_id: "",

            color_id: "",

            batch_id: "",

            quantity: "",

            notes: ""

        }));

        setColorSearchCode("");

        setBatchSearchTerm("");

    };



    const handleEditItem = (item) => {

        setFormData({

            material_id: String(item.material_id),

            type_item: item.type_item || "",

            ruler_id: String(item.ruler_id),

            color_id: String(item.color_id),

            batch_id: item.batch_id ? String(item.batch_id) : "",

            width: item.width || "",

            thickness: item.thickness || "",

            quantity: item.quantity,

            notes: item.notes || ""

        });

        setEditingItemId(item.id);

        window.scrollTo({ top: 0, behavior: 'smooth' });

    };



    const handleGenerateOrderQr = () => {

        if (!orderItems || orderItems.length === 0) {

            toast.error("لا توجد عناصر لتوليد QR");

            return;

        }

        const qrData = buildOrderQrData(orderItems);

        const qrUrl = getOrderQrUrl(qrData);

        const footerText = `عدد العناصر: ${orderItems.length} | إجمالي الكمية: ${totalPreviewQuantity} م`;

        setOrderQrPreview({

            open: true,

            qrUrl,

            qrData,

            itemsCount: orderItems.length,

            totalQuantity: totalPreviewQuantity,

            footerText

        });

    };



    const handleGenerateQrDirectly = () => {

        if (!formData.material_id || !formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)) {

            toast.error("يرجى ملء جميع الحقول المطلوبة");

            return;

        }



        // Create a single item from form data

        const material = materials.find(m => String(m.material_id) === String(formData.material_id));

        const ruler = rulers.find(r => String(r.ruler_id) === String(formData.ruler_id));

        const color = colors.find(c => String(c.color_id) === String(formData.color_id));

        const batch = batches.find(b => String(b.batch_id) === String(formData.batch_id));



        const singleItem = {

            material_id: formData.material_id,

            material_name: material?.material_name || '',

            ruler_id: formData.ruler_id,

            ruler_name: ruler?.ruler_name || '',

            color_id: formData.color_id,

            color_name: color?.color_name || '',

            color_code: color?.color_code || '',

            batch_id: formData.batch_id,

            batch_number: batch?.batch_number || '',

            width: formData.width,

            thickness: formData.thickness,

            quantity: formData.quantity,

            notes: formData.notes,

            type_item: formData.type_item

        };



        const qrData = buildOrderQrData([singleItem]);

        const qrUrl = getOrderQrUrl(qrData);

        const footerText = `مادة: ${material?.material_name} | كمية: ${formData.quantity} م`;



        setOrderQrPreview({

            open: false, // Don't open dialog, just set the data

            qrUrl,

            qrData,

            itemsCount: 1,

            totalQuantity: parseFloat(formData.quantity) || 0,

            footerText

        });



        toast.success("تم توليد رمز QR بنجاح");

    };



    const handleAddProductionOrder = () => {

        if (!formData.material_id || !formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)) {

            toast.error("يرجى ملء جميع الحقول المطلوبة");

            return;

        }



        // Create a production order item from form data

        const material = materials.find(m => String(m.material_id) === String(formData.material_id));

        const ruler = rulers.find(r => String(r.ruler_id) === String(formData.ruler_id));

        const color = colors.find(c => String(c.color_id) === String(formData.color_id));

        const batch = batches.find(b => String(b.batch_id) === String(formData.batch_id));



        const productionItem = {

            id: Date.now(), // Temporary ID

            material_id: formData.material_id,

            material_name: material?.material_name || '',

            ruler_id: formData.ruler_id,

            ruler_name: ruler?.ruler_name || '',

            color_id: formData.color_id,

            color_name: color?.color_name || '',

            color_code: color?.color_code || '',

            batch_id: formData.batch_id,

            batch_number: batch?.batch_number || '',

            width: formData.width,

            thickness: formData.thickness,

            quantity: formData.quantity,

            notes: formData.notes,

            type_item: formData.type_item,

            status: 'pending',

            created_at: new Date().toISOString()

        };



        setProductionOrders(prev => [...prev, productionItem]);



        // Reset form for next item

        setFormData({

            material_id: String(filteredMaterials[0]?.material_id || ""), // Keep material selected

            type_item: "",

            ruler_id: "",

            color_id: "",

            batch_id: "",

            width: "",

            thickness: "",

            quantity: "",

            notes: ""

        });



        toast.success("تم إضافة الطلب إلى قائمة الإنتاج");

    };



    const handleSendProductionOrders = async () => {

        if (productionOrders.length === 0) {

            toast.error("لا توجد طلبات لإرسالها");

            return;

        }



        setProductionLoading(true);

        try {

            // Collect all items from production orders

            const allItems = productionOrders.map(order => ({

                type_item: order.type_item,

                color_id: parseInt(order.color_id),

                batch_id: parseInt(order.batch_id),

                width: parseFloat(order.width),

                length: parseFloat(getMaterialConstantLabel(selectedMaterial, "height")) || 100,

                quantity: parseInt(order.quantity),

                thickness: parseFloat(order.thickness),

                notes: order.notes

            }));



            const orderData = {

                status: 'pending',

                notes: '',

                items: allItems

            };



            console.log("Sending order data:", JSON.stringify(orderData, null, 2));

            await salesApi.createSalesOrder(orderData);



            toast.success(`تم إرسال ${productionOrders.length} طلب إلى الإنتاج بنجاح`);

            setProductionOrders([]); // Clear the list



        } catch (error) {

            console.error("Error sending production orders:", error);

            toast.error("فشل في إرسال الطلبات إلى الإنتاج");

        } finally {

            setProductionLoading(false);

        }

    };



    const handleUpdateProductionOrder = () => {

        try {

            // Find the order being edited

            const orderIndex = productionOrders.findIndex(order => order.id === editingItemId);

            if (orderIndex === -1) {

                toast.error("لم يتم العثور على الطلب للتعديل");

                return;

            }

            // Update the order in the list

            const updatedOrder = {

                ...productionOrders[orderIndex],

                material_id: formData.material_id,

                ruler_id: formData.ruler_id,

                color_id: formData.color_id,

                batch_id: formData.batch_id,

                width: formData.width,

                thickness: formData.thickness,

                quantity: formData.quantity,

                notes: formData.notes,

                type_item: formData.type_item

            };

            setProductionOrders(prev => {

                const newOrders = [...prev];

                newOrders[orderIndex] = updatedOrder;

                return newOrders;

            });

            // Reset editing mode

            setEditingItemId(null);

            // Clear form

            setFormData({

                material_id: "",

                ruler_id: "",

                color_id: "",

                batch_id: "",

                width: "",

                thickness: "",

                quantity: "",

                notes: "",

                type_item: ""

            });

            toast.success("تم تحديث طلب الإنتاج بنجاح");

        } catch (error) {

            console.error("Error updating production order:", error);

            toast.error("فشل في تحديث طلب الإنتاج");

        }

    };



    const handleEditProductionOrder = (order) => {

        try {

            // Switch to production order tab

            setViewMode("colors");

            // Set the form data with the order details

            setFormData({

                material_id: order.material_id,

                ruler_id: order.ruler_id,

                color_id: order.color_id,

                batch_id: order.batch_id,

                width: order.width,

                thickness: order.thickness,

                quantity: order.quantity,

                notes: order.notes || "",

                type_item: order.type_item

            });

            // Set editing mode for the order

            setEditingItemId(order.id);

            toast.success("تم تحميل طلب الإنتاج للتعديل");

        } catch (error) {

            console.error("Error editing production order:", error);

            toast.error("فشل في تحميل طلب الإنتاج للتعديل");

        }

    };



    const handleEditOrderFromHistory = async (order) => {

        try {

            setLoadingDetails(true);



            if (materials.length === 0 || rulers.length === 0 || colors.length === 0 || batches.length === 0) {

                await loadInitialData();

            }

            if (customers.length === 0) {

                await loadCustomers();

            }



            const response = await ordersApi.getOrderById(getOrderId(order));

            if (!response?.success || !response?.data) {

                toast.error("فشل في جلب تفاصيل الطلب");

                return;

            }



            const details = response.data;

            setEditingOrderId(getOrderId(details));

            setViewMode("create");



            const customerId = details.customer?.customer_id ?? details.customer_id ?? details.customerId ?? null;

            const resolvedCustomer = customerId

                ? (customers.find((c) => String(c.customer_id) === String(customerId)) || details.customer || null)

                : (details.customer || null);



            if (resolvedCustomer && (resolvedCustomer.customer_id || resolvedCustomer.name || resolvedCustomer.phone)) {

                setSelectedCustomer(resolvedCustomer);

                setCustomerOption("existing");

            } else {

                setSelectedCustomer(null);

                setCustomerOption("none");

            }



            const mappedItems = (details.items || []).map((it, idx) => {

                console.log("Debug - Item data:", it);

                console.log("Debug - Details data:", details);

                console.log("Debug - employee_id from item:", it.employee_id);

                console.log("Debug - employee_id from details:", details.employee_id);

                console.log("Debug - current user:", user?.user_id);



                const rawColorCode = it.color_code ?? it.color?.color_code ?? it.colorCode ?? null;

                const rawColorName = it.color_name ?? it.color?.color_name ?? it.colorName ?? null;

                const rawColorId = it.color_id ?? it.color?.color_id ?? it.colorId ?? null;



                const colorByCode = rawColorCode

                    ? colors.find((c) => String(c.color_code).trim() === String(rawColorCode).trim())

                    : null;

                const colorByName = rawColorName

                    ? colors.find((c) => String(c.color_name).trim() === String(rawColorName).trim())

                    : null;



                const resolvedColor = rawColorId

                    ? colors.find((c) => String(c.color_id) === String(rawColorId))

                    : (colorByCode || colorByName);



                const resolvedColorId = rawColorId ?? resolvedColor?.color_id ?? null;



                const rulerTypeName = it.ruler_type ?? it.rulerType ?? it.ruler_name ?? it.ruler?.ruler_name ?? null;

                const rulerByName = rulerTypeName

                    ? rulers.find((r) => {

                        const rName = r?.ruler_name ?? r?.ruler_type ?? "";

                        return String(rName).trim() === String(rulerTypeName).trim();

                    })

                    : null;



                const rawRulerId = it.ruler_id ?? it.ruler?.ruler_id ?? it.rulerId ?? resolvedColor?.ruler_id ?? rulerByName?.ruler_id ?? null;

                const resolvedRuler = rawRulerId

                    ? rulers.find((r) => String(r.ruler_id) === String(rawRulerId))

                    : null;



                const materialName = it.material_name ?? it.material?.material_name ?? null;

                const materialByName = materialName

                    ? materials.find((m) => String(m.material_name).trim() === String(materialName).trim())

                    : null;



                const rawMaterialId = it.material_id ?? it.material?.material_id ?? it.materialId ?? resolvedRuler?.material_id ?? materialByName?.material_id ?? null;

                const resolvedMaterial = rawMaterialId

                    ? materials.find((m) => String(m.material_id) === String(rawMaterialId))

                    : null;



                const rawBatchId = it.batch_id ?? it.batch?.batch_id ?? it.batchId ?? null;

                const resolvedBatch = rawBatchId

                    ? batches.find((b) => String(b.batch_id) === String(rawBatchId))

                    : null;



                const local = {

                    id: Date.now() + idx,

                    material_id: rawMaterialId ? String(rawMaterialId) : "",

                    type_item: it.type_item ?? it.typeItem ?? "",

                    ruler_id: rawRulerId ? String(rawRulerId) : "",

                    color_id: resolvedColorId ? String(resolvedColorId) : "",

                    batch_id: rawBatchId ? String(rawBatchId) : "",

                    width: it.width !== undefined && it.width !== null ? String(it.width) : "",

                    length: it.length !== undefined && it.length !== null ? Number(it.length) : 100,

                    thickness: String(it.thickness ?? ""),

                    quantity: String(it.quantity ?? ""),

                    notes: it.notes || "",

                    material_name: it.material_name ?? it.material?.material_name ?? resolvedMaterial?.material_name ?? "",

                    ruler_name: it.ruler_name ?? it.ruler?.ruler_name ?? resolvedRuler?.ruler_name ?? resolvedRuler?.ruler_type ?? rulerTypeName ?? "",

                    color_name: it.color_name ?? it.color?.color_name ?? resolvedColor?.color_name ?? "",

                    color_code: it.color_code ?? it.color?.color_code ?? resolvedColor?.color_code ?? "",

                    batch_number: it.batch_number ?? it.batch?.batch_number ?? resolvedBatch?.batch_number ?? "",

                    employee_id: it.employee_id ?? details?.employee_id ?? user?.user_id ?? ""

                };

                const qrData = buildItemQrData(local);

                return { ...local, qrData, qrUrl: getQrUrl(qrData) };

            });



            setOrderItems(mappedItems);



            // تجهيز الفورم ليكون جاهز لإضافة عناصر جديدة

            setFormData((prev) => ({

                ...prev,

                material_id: mappedItems[0]?.material_id || "",

                ruler_id: "",

                color_id: "",

                width: "",

                quantity: "",

                notes: "",

                thickness: mappedItems[0]?.thickness || prev.thickness,

                type_item: "",

                batch_id: "",

            }));



            toast.success(getOrderId(details) ? `تم تحميل الطلب #${getOrderId(details)} للتعديل` : "تم تحميل الطلب للتعديل");

            window.scrollTo({ top: 0, behavior: "smooth" });

        } catch (error) {

            toast.error("حدث خطأ أثناء تحميل الطلب للتعديل");

        } finally {

            setLoadingDetails(false);

        }

    };



    const removeItem = (id) => {

        if (editingItemId === id) {

            setEditingItemId(null);

            setFormData(prev => ({

                material_id: prev.material_id,

                thickness: prev.thickness,

                type_item: prev.type_item,

                width: prev.width,

                ruler_id: "",

                color_id: "",

                batch_id: "",

                quantity: "",

                notes: ""

            }));

        }

        setOrderItems(prev => prev.filter(item => item.id !== id));

        toast.success("تم حذف العنصر");

    };



    const saveOrder = async () => {

        if (orderItems.length === 0) {

            toast.error("أضف عنصراً واحداً على الأقل");

            return;

        }



        try {

            setLoading(true);



            const items = orderItems.map(item => {

                const lengthValue = Number(item.length ?? 100);

                const payload = {

                    color_id: Number(item.color_id),

                    width: Number(item.width) || 0,

                    length: Number.isFinite(lengthValue) ? lengthValue : 100,

                    thickness: Number(item.thickness ?? formData.thickness ?? 0),

                    quantity: Number(item.quantity),

                    notes: item.notes || ""

                };

                if (item.type_item) payload.type_item = item.type_item;

                if (item.batch_id) payload.batch_id = Number(item.batch_id);

                return payload;

            });



            const orderData = {

                status: OrderStatus.pending,

                notes: "",

                items: items

            };



            if (customerOption === "existing" && selectedCustomer) {

                orderData.customer_id = Number(selectedCustomer.customer_id);

            }



            if (editingOrderId) {

                await ordersApi.updateOrder(editingOrderId, orderData);

            } else {

                await ordersApi.createOrder(orderData);

            }



            toast.success(editingOrderId ? "تم تحديث الطلب بنجاح" : "تم حفظ الطلب بنجاح");



            setOrderItems([]);

            setSelectedCustomer(null);

            setCustomerOption("none");

            setShowPreview(false);

            setEditingItemId(null);

            setEditingOrderId(null);



            if (viewMode === "history") {

                loadOrders();

            }



        } catch (error) {

            // console.error("Error saving order:", error);

            toast.error("فشل في حفظ الطلب");

        } finally {

            setLoading(false);

        }

    };



    const handleConfirmSave = async () => {

        await saveOrder();

    };



    const handleViewOrderDetails = async (order) => {

        try {

            setLoadingDetails(true);

            // استخدم رقم الطلب من أي حقل متاح حسب الـ API

            const response = await ordersApi.getOrderById(getOrderId(order));



            if (response.success && response.data) {

                // البيانات الكاملة موجودة في response.data

                setOrderDetails(response.data);

            } else {

                toast.error("فشل في جلب تفاصيل الطلب");

            }

        } catch (error) {

            console.error("Error fetching order details:", error);

            toast.error("حدث خطأ في جلب تفاصيل الطلب");

        } finally {

            setLoadingDetails(false);

        }

    };



    // Multiple delete functions

    const handleSelectOrder = (orderId) => {

        setSelectedOrders(prev =>

            prev.includes(orderId)

                ? prev.filter(id => id !== orderId)

                : [...prev, orderId]

        );

    };



    const handleSelectAllOrders = () => {

        if (selectedOrders.length === filteredOrders.length) {

            setSelectedOrders([]);

        } else {

            setSelectedOrders(filteredOrders.map(order => getOrderId(order)));

        }

    };



    const handleDeleteSelectedOrders = async () => {

        if (selectedOrders.length === 0) {

            toast.error("يرجى تحديد طلب واحد على الأقل");

            return;

        }

        setShowDeleteDialog(true);

    };



    const confirmDeleteSelectedOrders = async () => {

        try {

            setDeletingOrders(true);



            // Debug: Log selected orders

            console.log('Selected orders to delete:', selectedOrders);

            console.log('Selected orders types:', selectedOrders.map(id => typeof id));



            const response = await ordersApi.deleteMultipleOrders(selectedOrders);



            if (response.success) {

                toast.success("تم حذف الطلبات بنجاح");

                await loadOrders();

                setSelectedOrders([]);

                setShowDeleteDialog(false);

            } else {

                toast.error(response.message || "فشل في حذف الطلبات");

            }

        } catch (error) {

            console.error("Error deleting orders:", error);

            toast.error(error.message || "حدث خطأ في حذف الطلبات");

        } finally {

            setDeletingOrders(false);

        }

    };



    const clearAllItems = () => {
        if (orderItems.length > 0) {
            setOrderItems([]);
            setEditingItemId(null);
            setFormData(prev => ({
                material_id: prev.material_id,
                thickness: prev.thickness,
                type_item: prev.type_item,
                width: prev.width,
                ruler_id: "",
                color_id: "",
                batch_id: "",
                quantity: "",
                notes: ""
            }));
            toast.success("تم مسح جميع العناصر");
        }
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setFormData(prev => ({
            material_id: prev.material_id,
            thickness: prev.thickness,
            type_item: prev.type_item,
            width: prev.width,
            ruler_id: "",
            color_id: "",
            batch_id: "",
            quantity: "",
            notes: ""
        }));
    };

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        const baseCustomers = Array.isArray(customers) ? customers : [];
        if (!customerSearchTerm) return baseCustomers;
        const term = customerSearchTerm.toLowerCase();
        return baseCustomers.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term) ||
            c.city?.toLowerCase().includes(term)
        );
    }, [customers, customerSearchTerm]);

    // Customer options for select
    const customerOptions = useMemo(() => {
        return filteredCustomers.map(c => ({
            value: String(c.customer_id),
            label: customerApi.formatCustomerDisplay(c)
        }));
    }, [filteredCustomers]);

    const filteredBatchOptions = useMemo(() => {
        const term = String(batchSearchTerm || "").trim().toLowerCase();
        const baseBatches = Array.isArray(batches) ? batches : [];
        const visibleBatches = formData.material_id
            ? baseBatches.filter(b => String(b.material_id) === String(formData.material_id))
            : baseBatches;
        let base = visibleBatches.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || "دفعة " + b.batch_id
        }));

        // Filter by search term
        if (term) {
            base = base.filter(b =>
                b.label.toLowerCase().includes(term)
            );
        }

        // When editing, ensure the selected batch is always in options
        if (editingItemId && formData.batch_id) {
            const selectedBatch = batches.find(b => String(b.batch_id) === String(formData.batch_id));
            if (selectedBatch && !base.find(opt => opt.value === String(formData.batch_id))) {
                base.push({
                    value: String(selectedBatch.batch_id),
                    label: selectedBatch.batch_number || "دفعة " + selectedBatch.batch_id
                });
            }
        }
        return base;
    }, [batches, formData.material_id, formData.batch_id, batchSearchTerm, editingItemId]);

    // Width options for select
    const widthOptions = useMemo(() => {
        return widthValues.map(w => ({
            value: String(w.value),
            label: w.label || `${w.value} ${w.unit || ""}`.trim()
        }));
    }, [widthValues]);

    // Thickness options for select
    const thicknessOptions = useMemo(() => {

        return thicknessValues.map(t => ({

            value: String(t.value),

            label: t.label || `${t.value} ${t.unit || ""}`.trim()

        }));

    }, [batches, formData.material_id]);

    // Ruler options for select
    const rulerOptions = useMemo(() => {

        const availableRulers = formData.material_id

            ? rulers.filter(r => String(r.material_id) === String(formData.material_id))

            : rulers;

        return availableRulers.map(r => ({
            value: String(r.ruler_id),
            label: r.ruler_name
        }));
    }, [rulers, formData.material_id]);

    // Color options for select
    const colorOptions = useMemo(() => {
        return availablePricedColors.map(c => ({
            value: String(c.color_id),
            label: c.color_name + " (" + c.color_code + ")"
        }));
    }, [availablePricedColors]);

    // Batch options for select
    const batchOptions = useMemo(() => {
        const baseBatches = Array.isArray(batches) ? batches : [];
        const base = formData.material_id ? baseBatches.filter(b => String(b.material_id) === String(formData.material_id)) : baseBatches;
        return base.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || "دفعة " + b.batch_id
        }));

    }, [batches, formData.material_id]);

    // Scroll table horizontally
    const scrollTable = (direction) => {
        if (tableContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = tableContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tableContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }
    };

    const printOrderItemReceipt = useCallback((item, order) => {
        const material = materials.find(m => String(m.material_id) === String(item.material_id));
        const ruler = rulers.find(r => String(r.ruler_id) === String(item.ruler_id));
        const color = colors.find(c => String(c.color_id) === String(item.color_id));
        const batch = batches.find(b => String(b.batch_id) === String(item.batch_id));

        const lines = [
            { label: "رقم الطلب", value: getOrderId(order) ?? "-" },
            { label: "التاريخ", value: order?.created_at ? new Date(order.created_at).toLocaleString("en-US") : "-" },
            { label: "المادة", value: material?.material_name || item.material_name || "-" },
            { label: "المسطرة", value: ruler?.ruler_name || item.ruler_name || "-" },
            { label: "اللون", value: color?.color_name || item.color_name || "-" },
            { label: "كود اللون", value: color?.color_code || item.color_code || "-" },
            { label: "العرض", value: item.width ?? "-" },
            { label: "السماكة", value: item.thickness ?? "-" },
            { label: "الكمية", value: item.quantity ?? "-" },
            { label: "دفعة", value: batch?.batch_number || item.batch_number || "-" },
            { label: "ملاحظات", value: item.notes || "-" },
        ];

        const w = window.open("", "_blank", "width=380,height=700");
        if (!w) return;

        w.document.write(`
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>طباعة سطر طلب</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 12px; }

                .title { font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 10px; }

                .row { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px dashed #ddd; }

                .label { font-weight: 700; color: #111; }

                .value { color: #111; text-align: right; }

                .footer { margin-top: 10px; text-align: center; font-size: 11px; color: #666; }

                @media print { body { width: 80mm; } }

              </style>

            </head>

            <body>

              <div class="title">سطر طلب</div>

              ${lines.map(l => `

                <div class="row">

                  <div class="label">${String(l.label)}</div>

                  <div class="value">${String(l.value)}</div>

                </div>

              `).join("")}

              <div class="footer">Alzafari</div>

              <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 250); };</script>

            </body>

            </html>

        `);

        w.document.close();
    }, [materials, rulers, colors, batches]);

    // Filter materials for order-preparer - only show PVC materials
    const filteredMaterials = useMemo(() => {
        if (!isOrderPreparer) return materials;
        return materials.filter(m => {
            const materialName = m.material_name?.toLowerCase() || "";
            return materialName.includes("pvc");
        });
    }, [materials, isOrderPreparer]);

    // Auto-select first PVC material for order-preparer
    useEffect(() => {
        if (isOrderPreparer && filteredMaterials.length > 0 && !formData.material_id) {
            setFormData(prev => ({
                ...prev,
                material_id: String(filteredMaterials[0].material_id)
            }));
        }
    }, [isOrderPreparer, filteredMaterials, formData.material_id]);


    if (loading && viewMode === "create" && materials.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingState />
            </div>
        );
    }

    return (

        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <DashboardHeader
                isHeaderVisible={isHeaderVisible}
                setIsHeaderVisible={setIsHeaderVisible}
                hideCustomersAndInvoices={true}
                hideHeaderToggle={true}
            />

            <div className="flex-1 min-h-0 overflow-hidden">

                {/* Tabs Navigation - WhatsApp Style (Sticky) */}

                <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white mt-2 mx-2 rounded-t-lg shadow-sm px-2 py-2">

                    <button

                        onClick={() => setViewMode("orders")}

                        className={`flex-1 min-w-[140px] py-2 px-4 text-sm font-semibold transition-all rounded-lg border ${viewMode === "orders"
                            ? "bg-primary-f text-white border-primary-f shadow"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}

                    >

                        طلبات orders

                    </button>

                    <button

                        onClick={() => setViewMode("history")}

                        className={`flex-1 min-w-[140px] py-2 px-4 text-sm font-semibold transition-all rounded-lg border ${viewMode === "history"
                            ? "bg-primary-f text-white border-primary-f shadow"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}

                    >

                        سجل الطلبات

                        
                    </button>

                    {showOrderSwitch && (

                        <button

                            onClick={() => setViewMode("create")}

                            className={`flex-1 min-w-[160px] py-2 px-4 text-sm font-semibold transition-all rounded-lg border ${viewMode === "create"
                                ? "bg-primary-f text-white border-primary-f shadow"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                }`}

                        >

                            {isOrderPreparer ? "توليد QR" : "المواد"}

                            
                        </button>

                    )}

                    <button

                        onClick={() => setViewMode("colors")}

                        className={`flex-1 min-w-[160px] py-2 px-4 text-sm font-semibold transition-all rounded-lg border ${viewMode === "colors"
                            ? "bg-primary-f text-white border-primary-f shadow"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}

                    >

                        {isOrderPreparer ? "طلب انتاج" : "الشركات المكافئة"}

                        
                    </button>

                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                {viewMode === "colors" ? (

                    isOrderPreparer ? (

                        <div className="h-full min-h-0 px-2 pb-2">

                            <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.5fr_1.6fr] gap-2 h-full min-h-0">

                                {/* العمود الأيمن - المواد والأرقام */}

                                <div className="flex flex-col gap-2 h-full min-h-0 overflow-auto">

                                    {/* أزرار المواد */}

                                    <Card className="flex-1 p-2 flex flex-col">

                                        <Label className="font-bold text-sm mb-1 block">المادة</Label>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr">

                                            {(Array.isArray(isOrderPreparer ? filteredMaterials : materials) ? (isOrderPreparer ? filteredMaterials : materials) : []).map(m => (

                                                <button

                                                    key={m.material_id}

                                                    onClick={() => handleFieldChange("material_id", String(m.material_id))}

                                                    className={`

                                                        aspect-square rounded-xl border-3 text-lg sm:text-xl font-bold 

                                                        transition-all touch-manipulation hover:scale-105 active:scale-95

                                                        flex items-center justify-center p-2

                                                        ${String(formData.material_id) === String(m.material_id)

                                                            ? "border-primary-f bg-secondary-f text-white shadow-lg"

                                                            : isOrderPreparer

                                                                ? "border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100"

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



                                    {/* الأرقام */}

                                    <Card className="flex-[3] flex flex-col p-2 max-h-[560px] overflow-auto">

                                        <div className="flex-shrink-1 mb-1">

                                            <div className="bg-gray-100 rounded-lg py-2 px-3">

                                                <div className="text-xs text-gray-500 mb-0.5">

                                                    {numpadMode === "colorSearch" ? "كود اللون" :

                                                        activeField === "quantity" ? "الكمية" :

                                                            activeField === "width" ? "العرض" : "القيمة"}

                                                </div>

                                                <div className="text-2xl font-mono font-bold text-gray-800 text-center truncate leading-tight">

                                                    {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}

                                                </div>

                                            </div>

                                        </div>



                                        {/* أزرار الأرقام */}

                                        <div className="flex-1 grid grid-rows-4 gap-1 min-h-0">

                                            <div className="grid grid-cols-3 gap-1">

                                                {["9", "8", "7"].map(key => (

                                                    <button

                                                        key={key}

                                                        onClick={() => handleNumpadPress(key)}

                                                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                    >

                                                        {key}

                                                    </button>

                                                ))}

                                            </div>

                                            <div className="grid grid-cols-3 gap-1">

                                                {["6", "5", "4"].map(key => (

                                                    <button

                                                        key={key}

                                                        onClick={() => handleNumpadPress(key)}

                                                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                    >

                                                        {key}

                                                    </button>

                                                ))}

                                            </div>

                                            <div className="grid grid-cols-3 gap-1">

                                                {["3", "2", "1"].map(key => (

                                                    <button

                                                        key={key}

                                                        onClick={() => handleNumpadPress(key)}

                                                        className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                    >

                                                        {key}

                                                    </button>

                                                ))}

                                            </div>

                                            <div className="grid grid-cols-3 gap-1">

                                                <button

                                                    onClick={() => handleNumpadPress(".")}

                                                    className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                >

                                                    .

                                                </button>

                                                <button

                                                    onClick={() => handleNumpadPress("0")}

                                                    className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                >

                                                    0

                                                </button>

                                                <button

                                                    onClick={() => handleNumpadPress("clear")}

                                                    className="bg-red-100 text-red-700 border-2 border-red-200 rounded-lg text-xl font-bold hover:bg-red-200 active:bg-red-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-16"

                                                >

                                                    مسح

                                                </button>

                                            </div>

                                        </div>

                                    </Card>

                                </div>



                                {/* العمود الأوسط - العناصر الإضافية */}

                                <div className={`flex flex-col gap-2 h-full min-h-0 overflow-y-auto border-4 rounded-xl p-1 ${materialBorderClass}`}>

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



                                    {formData.material_id && !isSelectedMaterialPvc && (

                                        <div className="bg-primary-s border border-primary-f/20 text-secondary-f text-sm p-3 rounded-lg">

                                            <div className="font-bold mb-2">معلومات الأبعاد</div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                                                <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                                    <div className="text-xs text-secondary-t">الطول</div>

                                                    <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "height")}</div>

                                                </div>

                                                <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                                    <div className="text-xs text-secondary-t">العرض</div>

                                                    <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "width")}</div>

                                                </div>

                                                <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                                    <div className="text-xs text-secondary-t">السماكة</div>

                                                    <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "thickness")}</div>

                                                </div>

                                            </div>

                                        </div>

                                    )}



                                    {isSelectedMaterialPvc && (

                                        <div className="flex-shrink-0 p-2 border-b-2 border-dashed border-gray-300">

                                            <div className="grid grid-cols-2 gap-3">

                                                {TYPE_OPTIONS.map(t => (

                                                    <button

                                                        key={t.value}

                                                        onClick={() => handleFieldChange("type_item", t.value)}

                                                        className={`

                                                            rounded-xl border-3 text-base font-medium

                                                            transition-all touch-manipulation hover:scale-105 active:scale-95

                                                            flex items-center justify-center p-2

                                                            ${formData.type_item === t.value

                                                                ? "border-primary-f bg-primary-f text-white shadow-lg"

                                                                : "border-gray-300 bg-white hover:border-primary-f"

                                                            }

                                                        `}

                                                    >

                                                        {t.label}

                                                    </button>

                                                ))}

                                            </div>

                                        </div>

                                    )}



                                    <div className="space-y-2">

                                        {/* أولاً: العرض على سطر واحد */}
                                        <div>

                                            <Label className="font-bold text-sm mb-1 block">العرض</Label>

                                            {widthValues.length > 1 ? (

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                                                    {widthOptions.map(w => (

                                                        <button

                                                            key={w.value}

                                                            onClick={() => {

                                                                console.log("Width clicked:", w.value, typeof w.value);

                                                                console.log("Current formData.width:", formData.width, typeof formData.width);

                                                                console.log("isSelectedMaterialBoard:", isSelectedMaterialBoard);

                                                                console.log("widthValues:", widthValues);

                                                                handleFieldChange("width", w.value);

                                                            }}

                                                            className={`

                                                                rounded-xl border-3 text-base font-medium

                                                                transition-all touch-manipulation hover:scale-105 active:scale-95

                                                                flex items-center justify-center p-2

                                                                ${String(formData.width) === String(w.value)

                                                                    ? "border-secondary-s bg-secondary-s text-white shadow-lg"

                                                                    : "border-gray-300 bg-white hover:border-secondary-s"

                                                                }

                                                            `}

                                                            disabled={widthValues.length === 0}

                                                        >

                                                            {w.label}

                                                        </button>

                                                    ))}

                                                </div>

                                            ) : (

                                                <Input

                                                    type="number"

                                                    value={formData.width}

                                                    onChange={(e) => handleFieldChange("width", e.target.value)}

                                                    onClick={() => {

                                                        setActiveField("width");

                                                        setNumpadMode("quantity");

                                                    }}

                                                    className="h-9 text-base text-center font-bold bg-gray-100"

                                                    placeholder={widthValues.length === 1 ? widthValues[0].label : "0"}

                                                    disabled={!isSelectedMaterialBoard}

                                                />

                                            )}

                                        </div>



                                        {/* ثانياً: المسطرة على سطر واحد */}
                                        <div>

                                            <Label className="font-bold text-sm mb-1 block">المسطرة</Label>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                                                {rulerOptions.map(r => (

                                                    <button

                                                        key={r.value}

                                                        onClick={() => handleFieldChange("ruler_id", r.value)}

                                                        className={`

                                                            rounded-xl border-3 text-base font-medium

                                                            transition-all touch-manipulation hover:scale-105 active:scale-95

                                                            flex items-center justify-center p-2

                                                            ${formData.ruler_id === r.value

                                                                ? "border-secondary-s bg-secondary-s text-white shadow-lg"

                                                                : "border-gray-300 bg-white hover:border-secondary-s"

                                                            }

                                                        `}

                                                        disabled={!formData.material_id}

                                                    >

                                                        {r.label}

                                                    </button>

                                                ))}

                                            </div>

                                        </div>



                                        {/* ثالثاً: اللون select */}
                                        <div>

                                            <Label className="font-bold text-sm mb-1 block">اللون</Label>

                                            <FilterSelect

                                                value={formData.color_id ? String(formData.color_id) : ""}

                                                onChange={(e) => handleFieldChange("color_id", e.target.value)}

                                                disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}

                                                searchValue={colorSearchCode}

                                                onSearchValueChange={(v) => setColorSearchCode(v)}

                                                options={colorOptions}

                                                placeholder="اختر اللون"

                                                className="w-full text-sm"

                                            />

                                        </div>



                                        {/* رابعاً: الكمية - السماكة - رقم الطبخة على سطر واحد */}
                                        <div className="grid grid-cols-3 gap-2">

                                            <div>

                                                <Label className="font-bold text-sm mb-1 block">الكمية</Label>

                                                <Input

                                                    type="number"

                                                    value={formData.quantity}

                                                    onChange={(e) => handleFieldChange("quantity", e.target.value)}

                                                    onClick={() => {

                                                        setActiveField("quantity");

                                                        setNumpadMode("quantity");

                                                    }}

                                                    className="h-9 text-base text-center font-bold bg-gray-100"

                                                    placeholder="0"

                                                />

                                            </div>



                                            <div>

                                                <Label className="font-bold text-sm mb-1 block">السماكة</Label>

                                                {thicknessValues.length > 1 ? (

                                                    <FilterSelect

                                                        value={formData.thickness ? String(formData.thickness) : ""}

                                                        onChange={(e) => handleFieldChange("thickness", e.target.value)}

                                                        options={thicknessOptions}

                                                        placeholder="السماكة"

                                                        className="w-full text-sm"

                                                    />

                                                ) : (

                                                    <Input

                                                        type="number"

                                                        value={formData.thickness}

                                                        onChange={(e) => handleFieldChange("thickness", e.target.value)}

                                                        onClick={() => {

                                                            setActiveField("thickness");

                                                            setNumpadMode("quantity");

                                                        }}

                                                        className="h-9 text-base text-center font-bold bg-gray-100"

                                                        placeholder={thicknessValues.length === 1 ? thicknessValues[0].label : "0.6"}

                                                        step="0.1"

                                                    />

                                                )}

                                            </div>



                                            <div>

                                                <Label className="font-bold text-sm mb-1 block">رقم الطبخة</Label>

                                                <FilterSelect

                                                    value={formData.batch_id ? String(formData.batch_id) : ""}

                                                    onChange={(e) => handleFieldChange("batch_id", e.target.value)}

                                                    disabled={!isSelectedMaterialBoard && !formData.width}

                                                    searchValue={batchSearchTerm}

                                                    onSearchValueChange={(v) => setBatchSearchTerm(v)}

                                                    options={batchOptions}

                                                    placeholder="اختر الطبخة"

                                                    className="w-full text-sm"

                                                />

                                            </div>

                                        </div>



                                        {/* خامساً: الملاحظات */}

                                        <div>

                                            <Label className="font-bold text-sm mb-1 block">الملاحظات</Label>

                                            <Input

                                                value={formData.notes}

                                                onChange={(e) => handleFieldChange("notes", e.target.value)}

                                                placeholder="ملاحظات..."

                                                className="h-12 text-base"

                                            />

                                        </div>



                                        {/* سادساً: زر التعديل أو الإضافة */}

                                        {editingItemId ? (

                                            <div className="mt-auto pt-1 flex gap-2">

                                                <Button

                                                    onClick={cancelEdit}

                                                    size="sm"

                                                    variant="outline"

                                                    className="flex-1 h-10 text-base font-bold touch-manipulation active:scale-95 transition-transform"

                                                >

                                                    <X className="w-4 h-4 ml-2" />

                                                    إلغاء

                                                </Button>

                                                <Button

                                                    onClick={handleUpdateProductionOrder}

                                                    size="sm"

                                                    className="flex-1 h-10 text-base font-bold text-white touch-manipulation active:scale-95 transition-transform bg-green-600 hover:bg-green-700"

                                                >

                                                    <Check className="w-4 h-4 ml-2" />

                                                    تأكيد

                                                </Button>

                                            </div>

                                        ) : (

                                            <div className="mt-auto pt-1">

                                                <Button

                                                    onClick={handleAddProductionOrder}

                                                    size="sm"

                                                    className="w-full h-12 text-base font-bold text-white touch-manipulation active:scale-95 transition-transform bg-orange-600 hover:bg-orange-700"

                                                    disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}

                                                >

                                                    <Plus className="w-5 h-5 ml-2" />

                                                    إضافة لطلب الإنتاج

                                                </Button>

                                            </div>

                                        )}

                                    </div>

                                </div>



                                {/* العمود الأيسر - قائمة طلبات الإنتاج */}

                                <div className="flex flex-col gap-3 h-full min-h-0 overflow-auto">

                                    <Card className="flex flex-col h-full min-h-0 overflow-hidden">

                                        {/* رأس القائمة مع أزرار التحكم */}

                                        <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">

                                            <div className="flex items-center gap-2">

                                                <span className="font-bold text-lg">طلبات الإنتاج</span>

                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">

                                                    {productionOrders.length}

                                                </span>

                                            </div>

                                            <div className="flex items-center gap-2">

                                                <Button

                                                    size="sm"

                                                    variant="outline"

                                                    onClick={handleSendProductionOrders}

                                                    disabled={productionLoading || productionOrders.length === 0}

                                                    className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"

                                                >

                                                    {productionLoading ? "جاري الإرسال..." : "إرسال للإنتاج"}

                                                </Button>

                                            </div>

                                        </div>



                                        {/* جدول طلبات الإنتاج */}

                                        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 max-h-[50vh] min-[1366px]:min-h-[40vh]">

                                            {productionOrders.length > 0 ? (

                                                <table className="w-full text-sm">

                                                    <thead className="bg-gray-100 sticky top-0 z-10">

                                                        <tr>

                                                            <th className="p-2 text-right border-b">المادة</th>

                                                            <th className="p-2 text-center border-b">العرض</th>

                                                            <th className="p-2 text-right border-b">اللون</th>

                                                            <th className="p-2 text-center border-b">النوع</th>

                                                            <th className="p-2 text-center border-b">الكمية</th>

                                                            <th className="p-2 text-right border-b">المسطرة</th>

                                                            <th className="p-2 text-center border-b">السماكة</th>

                                                            <th className="p-2 text-center border-b">الطبخة</th>

                                                            <th className="p-2 text-center border-b">إجراء</th>

                                                        </tr>

                                                    </thead>

                                                    <tbody>

                                                        {productionOrders.map((order, index) => (

                                                            <tr key={order.id} className="border-b hover:bg-gray-50">

                                                                <td className="p-2 font-medium">{order.material_name}</td>

                                                                <td className="p-2 text-center">{order.width || "-"}</td>

                                                                <td className="p-2">

                                                                    <div className="flex items-center justify-center gap-1">

                                                                        <div

                                                                            className="w-4 h-4 rounded border border-gray-300"

                                                                            style={{ backgroundColor: order.color_code }}

                                                                        />

                                                                        <span className="text-xs">{order.color_code}</span>

                                                                    </div>

                                                                </td>

                                                                <td className="p-2 text-center">

                                                                    {formatTypeItem(order.type_item)}

                                                                </td>

                                                                <td className="p-2 text-center font-bold">{order.quantity} م</td>

                                                                <td className="p-2">{order.ruler_name || "-"}</td>

                                                                <td className="p-2 text-center">{order.thickness || "0.6"}</td>

                                                                <td className="p-2 text-center">{order.batch_number || "-"}</td>

                                                                <td className="p-2 text-center">

                                                                    <div className="flex items-center justify-center gap-2">

                                                                        <button

                                                                            onClick={() => handleEditProductionOrder(order)}

                                                                            className="text-blue-600 hover:text-blue-800 text-sm"

                                                                            title="تعديل الطلب"

                                                                        >

                                                                            <Edit className="w-4 h-4" />

                                                                        </button>

                                                                        <button

                                                                            onClick={() => setProductionOrders(prev => prev.filter(item => item.id !== order.id))}

                                                                            className="text-red-600 hover:text-red-800 text-sm"

                                                                            title="حذف الطلب"

                                                                        >

                                                                            <Trash2 className="w-4 h-4" />

                                                                        </button>

                                                                    </div>

                                                                </td>

                                                            </tr>

                                                        ))}

                                                    </tbody>

                                                </table>

                                            ) : (

                                                <div className="flex items-center justify-center h-full text-gray-400">

                                                    <div className="text-center">

                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">

                                                            <Plus className="w-8 h-8 text-gray-400" />

                                                        </div>

                                                        <p className="text-lg">لا توجد طلبات إنتاج</p>

                                                        <p className="text-sm mt-2">قم بإضافة طلبات لإرسالها للإنتاج</p>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    </Card>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="h-full min-h-0">

                            <ColorsReadOnly />

                        </div>

                    )

                ) : viewMode === "create" ? (

                    <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.5fr_1.6fr] gap-2 h-full min-h-0 px-2 pb-2">

                        {/* العمود الأيمن - المواد والأرقام */}

                        <div className="flex flex-col gap-2 h-full min-h-0 overflow-auto">

                            {/* أزرار المواد */}

                            <Card className="flex-1 p-2 flex flex-col">

                                <Label className="font-bold text-sm mb-1 block">المادة</Label>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr">

                                    {(Array.isArray(isOrderPreparer ? filteredMaterials : materials) ? (isOrderPreparer ? filteredMaterials : materials) : []).map(m => (

                                        <button

                                            key={m.material_id}

                                            onClick={() => handleFieldChange("material_id", String(m.material_id))}

                                            className={`

                                                aspect-square rounded-xl border-3 text-lg sm:text-xl font-bold 

                                                transition-all touch-manipulation hover:scale-105 active:scale-95

                                                flex items-center justify-center p-2

                                                ${String(formData.material_id) === String(m.material_id)

                                                    ? "border-primary-f bg-secondary-f text-white shadow-lg"

                                                    : isOrderPreparer

                                                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100"

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







                            {/* الأرقام */}

                            <Card className="flex-[3] flex flex-col p-2 min-h-0 overflow-auto">

                                <div className="flex-shrink-0 mb-1">

                                    {/* <div className="flex gap-2 mb-2">

                                        <button

                                            onClick={() => {

                                                setNumpadMode("colorSearch");

                                                setColorSearchCode("");

                                            }}

                                            className={`

                                                flex-1 py-2 px-2 rounded-lg text-sm font-bold border-2 

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

                                                flex-1 py-2 px-2 rounded-lg text-sm font-bold border-2 

                                                touch-manipulation transition-all active:scale-95

                                                ${numpadMode === "quantity"

                                                    ? "bg-primary-f text-white border-primary-f"

                                                    : "bg-white border-gray-300 hover:bg-gray-100"

                                                }

                                            `}

                                        >

                                            كتابة الكمية

                                        </button>

                                    </div> */}



                                    <div className="bg-gray-100 rounded-lg py-2 px-3">

                                        <div className="text-xs text-gray-500 mb-0.5">

                                            {numpadMode === "colorSearch" ? "كود اللون" :

                                                activeField === "quantity" ? "الكمية" :

                                                    activeField === "width" ? "العرض" : "القيمة"}

                                        </div>

                                        <div className="text-2xl font-mono font-bold text-gray-800 text-center truncate leading-tight">

                                            {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}

                                        </div>

                                    </div>

                                </div>



                                {/* أزرار الأرقام */}

                                <div className="flex-1 grid grid-rows-4 gap-1 min-h-0">

                                    <div className="grid grid-cols-3 gap-1">

                                        {["7", "8", "9"].map(key => (

                                            <button

                                                key={key}

                                                onClick={() => handleNumpadPress(key)}

                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

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

                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

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

                                                className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

                                            >

                                                {key}

                                            </button>

                                        ))}

                                    </div>

                                    <div className="grid grid-cols-3 gap-1">

                                        <button

                                            onClick={() => handleNumpadPress(".")}

                                            className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

                                        >

                                            .

                                        </button>

                                        <button

                                            onClick={() => handleNumpadPress("0")}

                                            className="bg-white border-2 border-gray-300 rounded-lg text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

                                        >

                                            0

                                        </button>

                                        <button

                                            onClick={() => handleNumpadPress("clear")}

                                            className="bg-red-100 text-red-700 border-2 border-red-200 rounded-lg text-lg font-bold hover:bg-red-200 active:bg-red-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-10"

                                        >

                                            مسح

                                        </button>

                                    </div>

                                </div>

                            </Card>

                        </div>



                        {/* العمود الأوسط - العناصر الإضافية */}

                        <div className={`flex flex-col gap-2 h-full min-h-0 overflow-y-auto border-4 rounded-xl p-1 ${materialBorderClass}`}>

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



                            {formData.material_id && !isSelectedMaterialPvc && (

                                <div className="bg-primary-s border border-primary-f/20 text-secondary-f text-sm p-3 rounded-lg">

                                    <div className="font-bold mb-2">معلومات الأبعاد</div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                                        <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                            <div className="text-xs text-secondary-t">الطول</div>

                                            <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "height")}</div>

                                        </div>

                                        <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                            <div className="text-xs text-secondary-t">العرض</div>

                                            <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "width")}</div>

                                        </div>

                                        <div className="bg-white/80 rounded-md px-3 py-2 border border-primary-f/10 text-center">

                                            <div className="text-xs text-secondary-t">السماكة</div>

                                            <div className="font-semibold">{getMaterialConstantLabel(selectedMaterial, "thickness")}</div>

                                        </div>

                                    </div>

                                </div>

                            )}



                            {isSelectedMaterialPvc && (

                                <div className="flex-shrink-0 p-2 border-b-2 border-dashed border-gray-300">

                                    {/* <Label className="font-bold text-sm mb-2 block">نوع الطلب</Label> */}

                                    <div className="grid grid-cols-2 gap-2">

                                        {TYPE_OPTIONS.map(t => (

                                            <button

                                                key={t.value}

                                                onClick={() => handleFieldChange("type_item", t.value)}

                                                className={`

                                                    rounded-2xl border-3 text-lg font-bold

                                                    transition-all touch-manipulation hover:scale-105 active:scale-95

                                                    flex items-center justify-center px-4 py-3 min-h-[56px]

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

                                </div>

                            )}



                            {formData.material_id && !isSelectedMaterialBoard && (

                                <div className="p-2 border-b-2 border-dashed border-gray-300">

                                    <Label className="font-bold text-sm mb-2 block">

                                        العرض

                                        {loadingWidths && <span className="mr-2 text-gray-500 text-xs">جاري التحميل...</span>}

                                    </Label>

                                    {widthValues.length > 0 ? (

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                                            {widthValues.map(w => (

                                                <button

                                                    key={w.id}

                                                    onClick={() => handleFieldChange("width", w.value)}

                                                    className={`

                                                        rounded-xl border-3 text-base font-medium

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

                                            <div className="text-center p-3 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-xl">

                                                لا توجد قيم عرض

                                            </div>

                                        )

                                    )}

                                </div>

                            )}



                            <div className="p-2 border-b-2 border-dashed border-gray-300">

                                <Label className="font-bold text-sm mb-1 block">المسطرة</Label>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                                    {availableRulers.length === 0 ? (

                                        <span className="text-gray-400 text-sm col-span-3 text-center p-2">اختر المادة أولاً</span>

                                    ) : (

                                        availableRulers.map(r => (

                                            <button

                                                key={r.ruler_id}

                                                onClick={() => handleFieldChange("ruler_id", String(r.ruler_id))}

                                                className={`

                                                    rounded-xl border-3 text-base font-medium

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

                            </div>



                            <div className="p-2 border-b-2 border-dashed border-gray-300">

                                <div className="grid grid-cols-[1fr_100px] gap-2 items-end">

                                    <div>

                                        <Label className="font-bold text-sm mb-2 block">

                                            اللون

                                            {numpadMode === "colorSearch" && colorSearchCode && (

                                                <span className="mr-2 text-secondary-s text-xs">(بحث: {colorSearchCode})</span>

                                            )}

                                        </Label>

                                        <FilterSelect

                                            value={formData.color_id ? String(formData.color_id) : ""}

                                            onChange={(e) => handleFieldChange("color_id", e.target.value)}

                                            disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}

                                            searchValue={colorSearchCode}

                                            onSearchValueChange={(v) => setColorSearchCode(v)}

                                            onInputFocus={() => {

                                                setNumpadMode("text");

                                                setActiveTextTarget("color_search");

                                            }}

                                            keepOpen={activeTextTarget === "color_search"}

                                            showSelectedImage={true}

                                            options={colorOptions}

                                            placeholder={

                                                !formData.ruler_id

                                                    ? "اختر المسطرة أولاً"

                                                    : (!isSelectedMaterialBoard && !formData.width)

                                                        ? "اختر العرض أولاً"

                                                        : colorOptions.length === 0

                                                            ? "لا توجد ألوان مسعرة"

                                                            : "اختر اللون"

                                            }

                                            className="w-full text-sm"

                                        />

                                    </div>

                                </div>

                            </div>



                            <div className="p-2 border-b-2 border-dashed border-gray-300">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

                                    <div>

                                        <Label className="font-bold text-sm mb-1 block">الكمية</Label>

                                        <div className="flex items-center gap-2">

                                            <Input

                                                type="number"

                                                value={formData.quantity}

                                                onChange={(e) => handleFieldChange("quantity", e.target.value)}

                                                onClick={() => {

                                                    setActiveField("quantity");

                                                    setNumpadMode("quantity");

                                                }}

                                                className={`h-12 text-lg text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""

                                                    }`}

                                                placeholder="0"

                                            />

                                            <span className="text-base font-bold text-gray-600 whitespace-nowrap">متر</span>

                                        </div>

                                    </div>



                                    <div>

                                        <Label className="font-bold text-sm mb-1 block">السماكة</Label>

                                        {thicknessValues.length > 1 ? (

                                            <FilterSelect

                                                value={formData.thickness ? String(formData.thickness) : ""}

                                                onChange={(e) => handleFieldChange("thickness", e.target.value)}

                                                options={thicknessOptions}

                                                placeholder="اختر السماكة"

                                                className="w-full text-sm"

                                            />

                                        ) : (

                                            <div className="flex items-center gap-2">

                                                <Input

                                                    type="number"

                                                    value={formData.thickness}

                                                    onChange={(e) => handleFieldChange("thickness", e.target.value)}

                                                    className="h-12 text-lg text-center font-bold flex-1 bg-gray-100"

                                                    placeholder={thicknessValues.length === 1 ? thicknessValues[0].label : "0.6"}

                                                    step="0.1"

                                                    readOnly={thicknessValues.length === 1}

                                                    disabled={thicknessValues.length === 1}

                                                />

                                                <span className="text-base font-bold text-gray-600 whitespace-nowrap">مم</span>

                                            </div>

                                        )}

                                    </div>



                                    <div >

                                        <Label className="font-bold text-sm mb-1 block">رقم الطبخة</Label>

                                        <FilterSelect

                                            value={formData.batch_id ? String(formData.batch_id) : ""}

                                            onChange={(e) => handleFieldChange("batch_id", e.target.value)}

                                            disabled={!isSelectedMaterialBoard && !formData.width}

                                            searchValue={batchSearchTerm}

                                            onSearchValueChange={(v) => setBatchSearchTerm(v)}

                                            onInputFocus={() => {

                                                setNumpadMode("text");

                                                setActiveTextTarget("batch_search");

                                            }}

                                            keepOpen={activeTextTarget === "batch_search"}

                                            options={filteredBatchOptions}

                                            placeholder={

                                                (!isSelectedMaterialBoard && !formData.width)

                                                    ? "اختر العرض أولاً"

                                                    : filteredBatchOptions.length === 0

                                                        ? "لا توجد طبخات"

                                                        : "اختر الطبخة"

                                            }

                                            className="w-full text-sm"

                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">

                                <div className="md:col-span-2">

                                    <Label className="font-bold text-sm mb-1 block">الملاحظات</Label>

                                    <Input

                                        value={formData.notes}

                                        onChange={(e) => handleFieldChange("notes", e.target.value)}

                                        placeholder="ملاحظات إضافية للعنصر..."

                                        className="h-9 text-sm"

                                    />

                                </div>

                            </div>

                            <div className="mt-auto pt-1">

                                <div className="flex gap-2">

                                    {editingItemId && (

                                        <button

                                            onClick={cancelEdit}

                                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors h-10"

                                        >

                                            إلغاء

                                        </button>

                                    )}

                                    <Button

                                        onClick={isOrderPreparer ? handleGenerateQrDirectly : addOrUpdateItem}

                                        size="sm"

                                        className={`${editingItemId ? 'flex-1' : 'w-full'} h-10 text-base font-bold text-white touch-manipulation active:scale-95 transition-transform ${editingItemId ? 'bg-green-600 hover:bg-green-700' : isOrderPreparer ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary-f hover:bg-secondary-f'

                                            }`}

                                        disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}

                                    >

                                        {editingItemId ? (

                                            <>

                                                <Save className="w-5 h-5 ml-2" />

                                                تحديث العنصر

                                            </>

                                        ) : (

                                            <>

                                                {isOrderPreparer ? (

                                                    <>

                                                        <Plus className="w-5 h-5 ml-2" />

                                                        توليد رمز QR

                                                    </>

                                                ) : (

                                                    <>

                                                        <Plus className="w-5 h-5 ml-2" />

                                                        إضافة للطلب

                                                    </>

                                                )}

                                            </>

                                        )}

                                    </Button>

                                </div>

                            </div>

                        </div>



                        {/* العمود الأيسر - جدول المواد للمعاينة فقط */}

                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-auto">

                            {isOrderPreparer ? (

                                <Card className="flex flex-col h-full min-h-0 overflow-auto">

                                    {/* رأس العرض مع أزرار التحكم */}

                                    {/* <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">

                                        <div className="flex items-center gap-2">

                                            <span className="font-bold text-lg">عرض QR</span>

                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">

                                                توليد تلقائي

                                            </span>

                                        </div>

                                        <div className="flex items-center gap-2">

                                            <Button

                                                size="sm"

                                                variant="outline"

                                                onClick={handleGenerateOrderQr}

                                                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"

                                            >

                                                توليد وطباعة QR

                                            </Button>

                                        </div>

                                    </div> */}



                                    {/* عرض QR */}

                                    <div className="flex-1 flex items-center justify-center p-4">

                                        {orderQrPreview.qrUrl ? (

                                            <div className="text-center space-y-4">

                                                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">

                                                    <img

                                                        src={orderQrPreview.qrUrl}

                                                        alt="order-qr"

                                                        className="h-64 w-64 mx-auto border rounded"

                                                    />

                                                </div>

                                                <div className="space-y-2">

                                                    <div className="grid grid-cols-2 gap-2 text-sm max-w-xs mx-auto">

                                                        <div className="bg-gray-50 rounded-lg p-2">

                                                            عدد العناصر: <span className="font-bold">{orderQrPreview.itemsCount || orderItems.length}</span>

                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-2">

                                                            إجمالي الكمية: <span className="font-bold">{orderQrPreview.totalQuantity || orderItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} م</span>

                                                        </div>

                                                    </div>

                                                    <div className="flex items-center justify-center gap-2">

                                                        <Button

                                                            size="sm"

                                                            className="bg-secondary-s hover:brightness-110 text-white"

                                                            onClick={() => printQr(orderQrPreview.qrUrl, "QR للطلب", orderQrPreview.footerText, "rtl")}

                                                            disabled={!orderQrPreview.qrUrl}

                                                        >

                                                            <Printer className="w-4 h-4 ml-1" />

                                                            طباعة

                                                        </Button>

                                                        <Button

                                                            size="sm"

                                                            variant="outline"

                                                            onClick={() => setOrderQrPreview(prev => ({ ...prev, open: true }))}

                                                        >

                                                            <Eye className="w-4 h-4 ml-1" />

                                                            معاينة

                                                        </Button>

                                                    </div>

                                                </div>

                                            </div>

                                        ) : (

                                            <div className="text-center text-gray-400">

                                                <div className="mb-4">

                                                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">

                                                        <span className="text-4xl text-gray-400">QR</span>

                                                    </div>

                                                </div>

                                                <p className="text-lg">قم بإضافة عناصر لتوليد QR</p>

                                                <p className="text-sm mt-2">سيتم عرض رمز QR هنا تلقائياً</p>

                                            </div>

                                        )}

                                    </div>

                                </Card>

                            ) : (

                                <>

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

                                            <div className="space-y-2">

                                                {/* معلومات الزبون في المعاينة */}

                                                {customerOption === "existing" && selectedCustomer && (

                                                    <div className="bg-blue-50 p-2 rounded-lg">

                                                        <div className="text-xs text-secondary-f font-bold">الزبون:</div>

                                                        <div className="text-sm">{customerApi.formatCustomerInfo(selectedCustomer)}</div>

                                                    </div>

                                                )}

                                                {customerOption === "new" && newCustomer.name && (

                                                    <div className="bg-green-50 p-2 rounded-lg">

                                                        <div className="text-xs text-primary-f font-bold">زبون جديد:</div>

                                                        <div className="text-sm">{newCustomer.name} - {formatPhoneNumber(newCustomer.phone)}</div>

                                                    </div>

                                                )}



                                                <div className="grid grid-cols-2 gap-3 text-sm">

                                                    <div className="bg-gray-50 rounded-lg p-2">

                                                        عدد العناصر: <span className="font-bold">{orderItems.length}</span>

                                                    </div>

                                                    <div className="bg-gray-50 rounded-lg p-2">

                                                        إجمالي الكمية: <span className="font-bold">{totalPreviewQuantity} م</span>

                                                    </div>

                                                </div>



                                                <div className="max-h-64 overflow-y-auto border rounded-lg">

                                                    <table className="w-full text-sm">

                                                        <thead className="bg-gray-100 sticky top-0">

                                                            <tr>

                                                                <th className="p-2 text-right border-b">المادة</th>

                                                                <th className="p-2 text-center border-b">العرض</th>

                                                                <th className="p-2 text-right border-b">اللون</th>

                                                                <th className="p-2 text-center border-b">النوع</th>

                                                                <th className="p-2 text-center border-b">الكمية</th>

                                                                <th className="p-2 text-right border-b">المسطرة</th>

                                                                <th class2="p-2 text-center border-b">السماكة</th>

                                                                <th className="p-2 text-center border-b">الطبخة</th>

                                                            </tr>

                                                        </thead>

                                                        <tbody>

                                                            {orderItems.map(item => (

                                                                <tr key={item.id} className="border-b">

                                                                    <td className="p-2">{item.material_name}</td>

                                                                    <td className="p-2 text-center">{item.width || "-"}</td>

                                                                    <td className="p-2">{item.color_name}</td>

                                                                    <td className="p-2 text-center">

                                                                        {formatTypeItem(item.type_item)}

                                                                    </td>

                                                                    <td className="p-2 text-center font-bold">{item.quantity} م</td>

                                                                    <td className="p-2">{item.ruler_name}</td>

                                                                    <td className="p-2 text-center">{item.thickness || "0.6"}</td>

                                                                    <td className="p-2 text-center">{item.batch_number || "-"}</td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            </div>

                                        </StyledDialog>

                                    )}



                                    {/* زر إلغاء التعديل بجانب زر الحفظ */}

                                    {/* {editingItemId && (

                                <div className="flex gap-2 justify-center mt-2">

                                    <button

                                        onClick={cancelEdit}

                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"

                                    >

                                        إلغاء التعديل

                                    </button>

                                </div>

                            )} */}



                                    <Card className="flex flex-col h-full min-h-0 overflow-auto">

                                        {/* رأس الجدول مع أزرار التحكم */}

                                        <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">

                                            <div className="flex items-center gap-2">

                                                <span className="font-bold text-lg">العناصر: {orderItems.length}</span>

                                                {isOrderPreparer && (

                                                    <Button

                                                        size="sm"

                                                        variant="outline"

                                                        onClick={handleGenerateOrderQr}

                                                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"

                                                    >

                                                        QR

                                                    </Button>

                                                )}

                                                {orderItems.length > 0 && (

                                                    <>



                                                        <button

                                                            onClick={clearAllItems}

                                                            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg touch-manipulation active:scale-95 transition-transform flex items-center gap-1"

                                                            title="مسح جميع العناصر"

                                                        >

                                                            <Trash2 className="w-4 h-4" />

                                                            <span className="text-xs font-medium">مسح العناصر</span>

                                                        </button>

                                                        <div className="flex gap-1 mr-2">

                                                            <button

                                                                onClick={() => scrollTable('right')}

                                                                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg touch-manipulation active:scale-95 transition-transform"

                                                                title="التمرير لليسار"

                                                            >

                                                                <ChevronRight className="w-4 h-4" />

                                                            </button>

                                                            <button

                                                                onClick={() => scrollTable('left')}

                                                                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg touch-manipulation active:scale-95 transition-transform"

                                                                title="التمرير لليمين"

                                                            >

                                                                <ChevronLeft className="w-4 h-4" />

                                                            </button>

                                                        </div>

                                                    </>

                                                )}

                                            </div>

                                            <div className="flex items-center gap-2">

                                                <div className="bg-green-50 px-2 py-1 rounded-lg text-lg">

                                                    إجمالي: <span className="font-bold text-primary-f">{totalPreviewQuantity} م</span>

                                                </div>

                                            </div>

                                        </div>



                                        {/* الجدول مع التمرير الأفقي والعمودي */}

                                        <div

                                            ref={tableContainerRef}

                                            className="flex-1 overflow-y-auto overflow-x-auto min-h-0 max-h-[50vh] min-[1366px]:min-h-[40vh]"

                                            style={{ direction: 'rtl' }}

                                        >

                                            <table className="max-w-[1100px] w-full table-fixed border-collapse">

                                                <thead className="bg-gray-100 sticky top-0 z-10">

                                                    <tr>

                                                        <th className="p-1 text-right border-b w-[50px]">المادة</th>

                                                        <th className="p-1 text-center border-b w-[55px]">العرض</th>

                                                        <th className="p-1 text-right border-b w-[50px]">اللون</th>

                                                        <th className="p-1 text-center border-b w-[45px]">النوع</th>

                                                        <th className="p-1 text-center border-b w-[55px]">الكمية</th>

                                                        <th className="p-1 text-right border-b w-[80px]">المسطرة</th>

                                                        <th className="p-1 text-center border-b w-[70px]">السماكة</th>

                                                        <th className="p-1 text-center border-b w-[95px]">رقم الطبخة</th>

                                                        <th className="p-1 text-center border-b w-[80px]">الإجراءات</th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {orderItems.map(item => (

                                                        <tr

                                                            key={item.id}

                                                            className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${editingItemId === item.id ? 'bg-blue-50 border-blue-300' : ''

                                                                }`}

                                                            onClick={() => handleEditItem(item)}

                                                        >

                                                            <td className="p-1 break-words text-sm" title={item.material_name}>

                                                                {item.material_name}

                                                            </td>

                                                            <td className="p-1 text-center text-sm">

                                                                {item.width || "-"}

                                                            </td>

                                                            <td className="p-1 break-words text-sm font-mono" title={item.color_code}>

                                                                {item.color_code}

                                                            </td>

                                                            <td className="p-1 text-center text-sm">

                                                                {formatTypeItem(item.type_item)}

                                                            </td>

                                                            <td className="p-1 text-center font-bold text-sm">

                                                                {item.quantity} م

                                                            </td>

                                                            <td className="p-1 break-words text-sm" title={item.ruler_name}>

                                                                {item.ruler_name}

                                                            </td>

                                                            <td className="p-1 text-center text-sm">

                                                                {item.thickness || ""} مم

                                                            </td>

                                                            <td className="p-1 text-center text-sm" title={item.batch_number}>

                                                                {item.batch_number || "-"}

                                                            </td>

                                                            <td className="p-1 text-center">

                                                                <div className="flex items-center justify-center gap-1">

                                                                    {editingItemId === item.id && (

                                                                        <span className="text-blue-600 text-xs ml-1">

                                                                            <Edit className="w-3 h-3 inline" />

                                                                        </span>

                                                                    )}

                                                                    <button

                                                                        onClick={(e) => {

                                                                            e.stopPropagation();

                                                                            removeItem(item.id);

                                                                        }}

                                                                        className="text-secondary-s hover:bg-red-50 p-1.5 rounded-lg touch-manipulation active:scale-95 transition-transform"

                                                                        title="حذف"

                                                                    >

                                                                        <Trash2 className="w-4 h-4" />

                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    ))}

                                                    {orderItems.length === 0 && (

                                                        <tr>

                                                            <td colSpan="8" className="p-8 text-center text-primary-f">

                                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />

                                                                <span className="text-sm">لا توجد عناصر مضافة</span>

                                                                <p className="text-xs mt-1">اضغط على العناصر في اليمين لإضافتها</p>

                                                            </td>

                                                        </tr>

                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                        <div className="flex justify-end pt-2">

                                            {isOrderPreparer ? (

                                                <Button

                                                    size="lg"

                                                    onClick={handleGenerateOrderQr}

                                                    disabled={orderItems.length === 0}

                                                    className="h-12 bg-purple-600 hover:bg-purple-700 text-base px-6 text-white touch-manipulation active:scale-95 transition-transform"

                                                >

                                                    <Printer className="w-4 h-4 ml-2" />

                                                    توليد وطباعة QR

                                                </Button>

                                            ) : (

                                                <Button

                                                    size="lg"

                                                    onClick={() => setShowPreview(true)}

                                                    disabled={loading || orderItems.length === 0}

                                                    className="h-12 bg-secondary-s hover:brightness-110 text-base px-6 text-white touch-manipulation active:scale-95 transition-transform"

                                                >

                                                    {loading ? (

                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                                                    ) : (

                                                        <>

                                                            <Check className="w-4 h-4 ml-2" />

                                                            {isOrderPreparer ? "توليد QR" : "حفظ"}

                                                        </>

                                                    )}

                                                </Button>

                                            )}

                                        </div>

                                    </Card>

                                </>

                            )}

                        </div>

                    </div>

                ) : viewMode === "orders" ? (

                    <>

                        {/* وضع طلبات Orders */}

                        <Card className="flex flex-col h-full min-h-0 overflow-auto p-2">

                            <div className="flex justify-between items-center mb-1 flex-shrink-0">

                                <h2 className="font-bold text-lg">سجل طلبات المبيعات</h2>

                                <div className="flex items-center gap-2">

                                    <Button

                                        size="sm"

                                        variant="outline"

                                        onClick={loadOrdersRecords}

                                        disabled={ordersRecordsLoading}

                                        className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110 touch-manipulation active:scale-95 transition-transform"

                                    >

                                        <RotateCcw className="w-4 h-4 ml-1" />

                                        تحديث

                                    </Button>

                                </div>

                            </div>



                            {/* جدول طلبات Orders */}

                            <div className="flex-1 overflow-y-auto overflow-x-auto xl:overflow-x-hidden min-h-0 border rounded-lg bg-white max-h-[50vh] min-[1366px]:min-h-[40vh]">

                                <table className="min-w-[1200px] w-full table-fixed border-collapse">

                                    <thead className="bg-gray-100 sticky top-0 z-20">

                                        <tr>

                                            <th className="p-2 text-right border-b w-10">#</th>

                                            <th className="p-2 text-right border-b w-20">التاريخ</th>

                                            <th className="p-2 text-center border-b w-10">العناصر</th>

                                            <th className="p-2 text-center border-b w-20">الزبون</th>

                                            <th className="p-2 text-center border-b w-32">ملاحظات</th>

                                            <th className="p-2 text-center border-b w-15">الحالة</th>

                                            <th className="p-2 text-center border-b w-20">عرض</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {ordersRecordsLoading ? (

                                            <tr><td colSpan="7" className="p-6"><LoadingState /></td></tr>

                                        ) : ordersRecords.length === 0 ? (

                                            <tr>

                                                <td colSpan="7" className="p-8 text-center text-gray-400">

                                                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />

                                                    لا توجد طلبات

                                                </td>

                                            </tr>

                                        ) : (

                                            paginatedOrdersRecords.map((order, index) => {

                                                const statusBadge = getStatusBadge(order.status);

                                                return (

                                                    <tr key={order.order_id || order.id || index} className="border-b hover:bg-gray-50">

                                                        <td className="p-2 font-medium text-sm">#{ordersRecordsStartIndex + index + 1}</td>

                                                        <td className="p-2 text-sm">{getFormattedDate(order)}</td>

                                                        <td className="p-2 text-center">

                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">

                                                                {order.count_items ?? order.items?.length ?? 0}

                                                            </span>

                                                        </td>

                                                        <td className="p-2 text-center">

                                                            {order.customer ? (

                                                                <div className="text-sm">

                                                                    <div className="font-medium">{order.customer.name}</div>

                                                                    <div className="text-gray-500 text-xs" dir="ltr">{order.customer.phone}</div>

                                                                </div>

                                                            ) : (

                                                                <span className="text-gray-400 text-xs">بدون زبون</span>

                                                            )}

                                                        </td>

                                                        <td className="p-2 text-center max-w-[150px] truncate text-sm" title={order.notes}>

                                                            {order.notes || "-"}

                                                        </td>

                                                        <td className="p-2 text-center">

                                                            <span className={`px-2 py-1 rounded-lg text-xs ${statusBadge.className}`}>

                                                                {statusBadge.label}

                                                            </span>

                                                        </td>

                                                        <td className="p-2 text-center">

                                                            <Button

                                                                size="sm"

                                                                variant="outline"

                                                                className="h-8 px-2 text-xs touch-manipulation active:scale-95 transition-transform hover:bg-primary-f hover:text-white"

                                                                onClick={() => handleViewOrderDetails(order)}

                                                                disabled={loadingDetails}

                                                            >

                                                                {loadingDetails ? (

                                                                    <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin ml-1" />

                                                                ) : (

                                                                    <Eye className="w-3 h-3 ml-1" />

                                                                )}

                                                                عرض

                                                            </Button>

                                                        </td>

                                                    </tr>

                                                );

                                            })

                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* Pagination Controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-gray-50 border-t">
                                <ResultsCounter
                                    currentPage={ordersRecordsPage}
                                    totalPages={ordersRecordsTotalPages}
                                    rowsPerPage={ordersRecordsRowsPerPage}
                                    totalResults={ordersRecords.length}
                                />
                                <div className="flex items-center gap-2">
                                    <RowsPerPageSelector
                                        value={ordersRecordsRowsPerPage}
                                        onChange={setOrdersRecordsRowsPerPage}
                                    />
                                    <PaginationControls
                                        currentPage={ordersRecordsPage}
                                        totalPages={ordersRecordsTotalPages}
                                        onPageChange={setOrdersRecordsPage}
                                    />
                                </div>
                            </div>

                        </Card>

                    </>

                ) : (

                    <>

                        {/* وضع السجل */}

                        <Card className="flex flex-col h-full min-h-0 overflow-auto p-2">

                            <div className="flex justify-between items-center mb-1 flex-shrink-0">

                                <h2 className="font-bold text-lg">سجل الطلبات</h2>

                                <div className="flex items-center gap-2">

                                    {selectedOrders.length > 0 && (

                                        <Button

                                            size="sm"

                                            variant="destructive"

                                            onClick={handleDeleteSelectedOrders}

                                            className="px-4 py-2 text-sm"

                                        >

                                            <Trash2 className="w-4 h-4 ml-1" />

                                            حذف المحدد ({selectedOrders.length})

                                        </Button>

                                    )}

                                    <Button

                                        size="sm"

                                        variant="outline"

                                        onClick={loadOrders}

                                        disabled={ordersLoading}

                                        className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110 touch-manipulation active:scale-95 transition-transform"

                                    >

                                        <RotateCcw className="w-4 h-4 ml-1" />

                                        تحديث

                                    </Button>

                                    <Button

                                        size="sm"

                                        variant="outline"

                                        onClick={handleExportOrders}

                                        disabled={exportingOrders || orders.length === 0}

                                        className="px-4 py-2 text-sm"

                                    >

                                        <Download className="w-4 h-4 ml-1" />

                                        {exportingOrders ? "جارٍ التصدير..." : "تصدير Excel"}

                                    </Button>

                                </div>

                            </div>



                            <div className="flex flex-col sm:flex-row gap-2 mb-2">

                                <Input

                                    value={historySearchTerm}

                                    onChange={(e) => setHistorySearchTerm(e.target.value)}

                                    placeholder="بحث في الطلبات ..."

                                    className="h-10 py-6"

                                />

                                <FilterSelect

                                    label=""

                                    value={historyStatusFilter}

                                    onChange={(e) => setHistoryStatusFilter(e.target.value)}

                                    options={[

                                        { value: "", label: "كل الحالات" },

                                        { value: "pending", label: "قيد الانتظار" },

                                        { value: "outofwarehouse", label: "اخراج من المستودع" },

                                        { value: "completed", label: "مكتمل" },

                                        { value: "cancelled", label: "ملغي" },

                                    ]}

                                />

                            </div>



                            {/* جدول السجل مع التمرير */}

                            <div className="flex-1 overflow-y-auto overflow-x-auto xl:overflow-x-hidden min-h-0 border rounded-lg bg-white max-h-[50vh] min-[1366px]:min-h-[40vh]">

                                <table className="min-w-[1400px] w-full table-fixed border-collapse">

                                    <thead className="bg-gray-100 sticky top-0 z-20">

                                        <tr>

                                            <th className="p-2 text-center border-b w-12">

                                                <input

                                                    type="checkbox"

                                                    checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0 && selectedOrders.length > 0}

                                                    onChange={handleSelectAllOrders}

                                                    className="w-4 h-4 text-primary-f border-gray-300 rounded focus:ring-primary-f"

                                                />

                                            </th>

                                            <th className="p-2 text-right border-b w-10">#</th>

                                            <th className="p-2 text-right border-b w-20">التاريخ</th>

                                            <th className="p-2 text-center border-b w-10">العناصر</th>

                                            <th className="p-2 text-center border-b w-10">المبيعات</th>

                                            <th className="p-2 text-center border-b w-20">الزبون</th>

                                            <th className="p-2 text-center border-b w-32">ملاحظات</th>

                                            <th className="p-2 text-center border-b w-15">الحالة</th>

                                            <th className="p-2 text-center border-b w-20">عرض</th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {ordersLoading ? (

                                            <tr><td colSpan="10" className="p-6"><LoadingState /></td></tr>

                                        ) : filteredOrders.length === 0 ? (

                                            <tr>

                                                <td colSpan="10" className="p-8 text-center text-gray-400">

                                                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />

                                                    لا توجد طلبات

                                                </td>

                                            </tr>

                                        ) : (

                                            paginatedOrders.map((order, index) => {

                                                const statusBadge = getStatusBadge(order.status);

                                                return (

                                                    <tr key={getOrderId(order)} className="border-b hover:bg-gray-50">

                                                        <td className="p-2 text-center">

                                                            <input

                                                                type="checkbox"

                                                                checked={selectedOrders.includes(getOrderId(order))}

                                                                onChange={() => handleSelectOrder(getOrderId(order))}

                                                                className="w-4 h-4 text-primary-f border-gray-300 rounded focus:ring-primary-f"

                                                            />

                                                        </td>

                                                        <td className="p-2 font-medium text-sm">#{startIndex + index + 1}</td>

                                                        <td className="p-2 text-sm">{getFormattedDate(order)}</td>

                                                        <td className="p-2 text-center">

                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">

                                                                {order.count_items ?? order.items?.length ?? 0}

                                                            </span>

                                                        </td>

                                                        <td className="p-2 text-center text-sm">{getSalesUserName(order)}</td>

                                                        <td className="p-2 text-center">

                                                            {order.customer ? (

                                                                <div className="text-sm">

                                                                    <div className="font-medium">{order.customer.name}</div>

                                                                    <div className="text-gray-500 text-xs" dir="ltr">{order.customer.phone}</div>

                                                                </div>

                                                            ) : (

                                                                <span className="text-gray-400 text-xs">بدون زبون</span>

                                                            )}

                                                        </td>

                                                        <td className="p-2 text-center max-w-[150px] truncate text-sm" title={order.notes}>

                                                            {order.notes || "-"}

                                                        </td>

                                                        <td className="p-2 text-center">

                                                            <span className={`px-2 py-1 rounded-lg text-xs ${statusBadge.className}`}>

                                                                {statusBadge.label}

                                                            </span>

                                                        </td>

                                                        <td className="p-2 text-center">

                                                            <div className="flex items-center justify-center gap-2">

                                                                <Button

                                                                    size="sm"

                                                                    variant="outline"

                                                                    className="h-8 px-2 text-xs touch-manipulation active:scale-95 transition-transform hover:bg-primary-f hover:text-white"

                                                                    onClick={() => handleViewOrderDetails(order)}

                                                                    disabled={loadingDetails}

                                                                >

                                                                    {loadingDetails ? (

                                                                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin ml-1" />

                                                                    ) : (

                                                                        <Eye className="w-3 h-3 ml-1" />

                                                                    )}

                                                                    عرض

                                                                </Button>

                                                                <Button

                                                                    size="sm"

                                                                    variant="outline"

                                                                    className="h-8 px-2 text-xs touch-manipulation active:scale-95 transition-transform hover:bg-secondary-s hover:text-white"

                                                                    onClick={() => handleEditOrderFromHistory(order)}

                                                                    disabled={loadingDetails}

                                                                >

                                                                    <Edit className="w-3 h-3 ml-1" />

                                                                    تعديل

                                                                </Button>

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

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-gray-50 border-t">

                                <ResultsCounter

                                    currentPage={currentPage}

                                    totalPages={totalPages}

                                    rowsPerPage={rowsPerPage}

                                    totalResults={filteredOrders.length}

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



                            {/* نافذة تفاصيل الطلب */}

                            {/* نافذة تفاصيل الطلب */}


                        </Card>

                    </>

                )}
                </div>



                {/* نافذة تفاصيل الطلب */}
                {orderDetails && (
                    <StyledDialog
                        isOpen={Boolean(orderDetails)}
                        onOpenChange={(open) => { if (!open) setOrderDetails(null); }}
                        title={`تفاصيل الطلب ${getOrderId(orderDetails) ? `#${getOrderId(orderDetails)}` : 'بدون طلب'}`}
                        onCancel={() => setOrderDetails(null)}
                        cancelLabel="إغلاق"
                        showFooter={false}
                        className="w-[98vw] max-w-[1800px]"
                    >
                        <div className="space-y-4 p-1">
                            {/* معلومات أساسية للطلب - استخدم orderDetails مباشرة */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="text-xs text-gray-500">رقم الطلب</div>
                                    <div className="font-bold text-base">{getOrderId(orderDetails) ? `#${getOrderId(orderDetails)}` : 'بدون طلب'}</div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
                                    <div className="font-bold text-sm">
                                        {new Date(orderDetails.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="text-xs text-gray-500">الحالة</div>
                                    <div className="mt-1">
                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusBadge(orderDetails.status).className}`}>
                                            {getStatusBadge(orderDetails.status).label}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="text-xs text-gray-500">تعديل الحالة</div>
                                    <div className="mt-1">
                                        <FilterSelect
                                            value={orderDetails.status}
                                            onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                                            disabled={updatingOrderStatus}
                                            options={Object.values(OrderStatus).map((s) => ({ value: s, label: getStatusLabel(s) }))}
                                            placeholder="اختر الحالة..."
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* معلومات الزبون */}
                            {orderDetails.customer && (
                                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                                    <h4 className="font-bold text-blue-700 mb-2 text-sm flex items-center gap-2">
                                        <span>معلومات الزبون</span>
                                        <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">
                                            {orderDetails.customer.customer_type === 'customer' ? 'زبون' : 'مورد'}
                                        </span>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <div className="text-xs text-gray-500">الاسم</div>
                                            <div className="font-medium text-sm">{orderDetails.customer.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">الهاتف</div>
                                            <div className="font-medium text-sm text-right" dir="ltr">{orderDetails.customer.phone}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">المدينة</div>
                                            <div className="font-medium text-sm">{orderDetails.customer.city || 'غير محدد'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">العنوان</div>
                                            <div className="font-medium text-sm">{orderDetails.customer.address || 'غير محدد'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* معلومات المبيعات */}
                            {orderDetails.sales && (
                                <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                                    <h4 className="font-bold text-green-700 mb-2 text-sm">معلومات المبيعات</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <div className="text-xs text-gray-500">الموظف</div>
                                            <div className="font-medium text-sm">{orderDetails.sales.full_name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">اسم المستخدم</div>
                                            <div className="font-medium text-sm">{orderDetails.sales.username}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">رقم المستخدم</div>
                                            <div className="font-medium text-sm">#{orderDetails.sales_user_id}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ملاحظات الطلب */}
                            {orderDetails.notes && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <h4 className="font-bold text-yellow-700 mb-2 text-sm">ملاحظات الطلب</h4>
                                    <div className="text-sm">{orderDetails.notes}</div>
                                </div>
                            )}

                            {/* عناصر الطلب */}
                            {orderDetails.items && orderDetails.items.length > 0 ? (
                                <div className="space-y-2">
                                    {/* <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-gray-700">
                                            عناصر الطلب
                                        </h4>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                            {orderDetails.items.length} عنصر
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div>
                                            عدد العناصر: <span className="font-bold">{orderDetails.count_items}</span>
                                        </div>
                                        <div>
                                            إجمالي الكمية: <span className="font-bold">{calculateOrderTotal(orderDetails.items)} م</span>
                                        </div>
                                    </div> */}

                                    <div className="border rounded-lg overflow-visible">
                                        <div>
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-2 text-right">#</th>
                                                        <th className="p-2 text-right">المادة</th>
                                                        <th className="p-2 text-right">المسطرة</th>
                                                        <th className="p-2 text-right">اللون</th>
                                                        <th className="p-2 text-right">الكود</th>
                                                        <th className="p-2 text-right">العرض</th>
                                                        <th className="p-2 text-right">السماكة</th>
                                                        <th className="p-2 text-right">الكمية</th>
                                                        <th className="p-2 text-right">الدفعة</th>
                                                        {isOrderPreparer && (
                                                            <th className="p-2 text-center">QR</th>
                                                        )}
                                                        {/* <th className="p-2 text-center">طباعة</th> */}
                                                        <th className="p-2 text-center">ملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderDetails.items.map((item, index) => {
                                                        const localItem = {
                                                            ...item,
                                                            id: `${getOrderId(orderDetails)}-${index + 1}`,
                                                            order_id: getOrderId(orderDetails),
                                                            material_name: item.material_name || materials.find(m => String(m.material_id) === String(item.material_id))?.material_name || "-",
                                                            ruler_name: item.ruler_name || rulers.find(r => String(r.ruler_id) === String(item.ruler_id))?.ruler_name || "-",
                                                            color_name: item.color_name || colors.find(c => String(c.color_id) === String(item.color_id))?.color_name || "-",
                                                            color_code: item.color_code || colors.find(c => String(c.color_id) === String(item.color_id))?.color_code || "-",
                                                            batch_number: item.batch_number || batches.find(b => String(b.batch_id) === String(item.batch_id))?.batch_number || "-",
                                                            quantity: item.quantity ?? 0
                                                        };
                                                        return (
                                                            <tr key={localItem.id} className="border-t">
                                                                <td className="p-3 text-right font-bold">{index + 1}</td>
                                                                <td className="p-3 text-right">{localItem.material_name}</td>
                                                                <td className="p-3 text-right">{localItem.ruler_name}</td>
                                                                <td className="p-3 text-right">
                                                                    <span className="inline-block px-2 py-1 rounded text-white text-xs" style={{ background: localItem.color_code || "#999" }}>
                                                                        {localItem.color_name}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <span className="font-mono text-xs">{localItem.color_code || "-"}</span>
                                                                </td>
                                                                <td className="p-3 text-right">{localItem.width ?? "-"}</td>
                                                                <td className="p-3 text-right">{localItem.thickness ?? "-"}</td>
                                                                <td className="p-3 text-right font-bold">{localItem.quantity}</td>
                                                                <td className="p-3 text-right">{localItem.batch_number || "-"}</td>
                                                                {isOrderPreparer && (
                                                                    <td className="p-3 text-center">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => openQrGenDialog(localItem)}
                                                                            className="h-8 px-2 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                                                        >
                                                                            توليد QR
                                                                        </Button>
                                                                    </td>
                                                                )}
                                                                {/* <td className="p-3 text-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => printOrderItemReceipt(localItem, orderDetails)}
                                                                    className="h-8 px-2 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    <Printer className="w-4 h-4 ml-1" />
                                                                    طباعة
                                                                </Button>
                                                            </td> */}
                                                                <td className="p-3 text-center max-w-[150px] truncate" title={item.notes}>
                                                                    {item.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* ملاحظات العناصر المنفصلة */}
                                    {orderDetails.items.some(item => item.notes) && (
                                        <div className="mt-3 space-y-2">
                                            <h5 className="font-bold text-sm text-gray-600">ملاحظات العناصر:</h5>
                                            {orderDetails.items.map((item, index) => (
                                                item.notes && (
                                                    <div key={index} className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 text-sm">
                                                        <span className="font-bold">العنصر {index + 1}:</span> {item.notes}
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 border rounded-lg">
                                    لا يوجد عناصر في هذا الطلب
                                </div>
                            )}
                        </div>
                    </StyledDialog>
                )}

                <StyledDialog

                    isOpen={qrPreview.open}

                    onOpenChange={(open) => setQrPreview((prev) => ({ ...prev, open }))}

                    title={qrPreview.title || "QR"}

                    onCancel={() => setQrPreview((prev) => ({ ...prev, open: false }))}

                    cancelLabel="إغلاق"

                    showFooter={false}

                >

                    <div className="space-y-3">

                        <div className="flex items-center justify-center">

                            {qrPreview.url ? (

                                <img src={qrPreview.url} alt="qr" className="h-80 w-80 border rounded" />

                            ) : null}

                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 text-lg font-bold" dir="rtl" style={{ textAlign: "right" }}>

                            {qrPreview.footerText || ""}

                        </div>

                        <div className="flex items-center justify-center gap-2">

                            <Button

                                size="sm"

                                className="bg-secondary-s hover:brightness-110 text-white"

                                onClick={() => printQr(qrPreview.url, qrPreview.title, qrPreview.footerText, 'rtl')}

                                disabled={!qrPreview.url}

                            >

                                طباعة

                            </Button>

                        </div>

                    </div>

                </StyledDialog>



                <StyledDialog

                    isOpen={orderQrPreview.open}

                    onOpenChange={(open) => setOrderQrPreview((prev) => ({ ...prev, open }))}

                    title="QR للطلب"

                    onCancel={() => setOrderQrPreview((prev) => ({ ...prev, open: false }))}

                    cancelLabel="إغلاق"

                    showFooter={false}

                >

                    <div className="space-y-3">

                        <div className="grid grid-cols-2 gap-2 text-sm">

                            <div className="bg-gray-50 rounded-lg p-2">

                                عدد العناصر: <span className="font-bold">{orderQrPreview.itemsCount}</span>

                            </div>

                            <div className="bg-gray-50 rounded-lg p-2">

                                إجمالي الكمية: <span className="font-bold">{orderQrPreview.totalQuantity} م</span>

                            </div>

                        </div>

                        <div className="flex items-center justify-center">

                            {orderQrPreview.qrUrl ? (

                                <img src={orderQrPreview.qrUrl} alt="order-qr" className="h-72 w-72 border rounded" />

                            ) : null}

                        </div>

                        <div className="flex items-center justify-center gap-2">

                            <Button

                                size="sm"

                                className="bg-secondary-s hover:brightness-110 text-white"

                                onClick={() => printQr(orderQrPreview.qrUrl, "QR للطلب", orderQrPreview.footerText, "rtl")}

                                disabled={!orderQrPreview.qrUrl}

                            >

                                طباعة

                            </Button>

                        </div>

                    </div>

                </StyledDialog>



                {/* QR Generation Dialog with Quantity Editing */}

                <StyledDialog

                    isOpen={qrGenDialog.open}

                    onOpenChange={(open) => { if (!open) closeQrGenDialog(); }}

                    title="توليد QR - تعديل الكمية"

                    onCancel={closeQrGenDialog}

                    cancelLabel="إغلاق"

                    showFooter={false}

                >

                    <div className="space-y-4 p-2">

                        {/* معلومات العنصر */}

                        {qrGenDialog.item && (

                            <div className="bg-gray-50 p-3 rounded-lg border space-y-2">

                                <div className="grid grid-cols-2 gap-2 text-sm">

                                    <div>

                                        <span className="text-gray-500">المادة:</span>

                                        <span className="font-medium mr-1">{qrGenDialog.item.material_name}</span>

                                    </div>

                                    <div>

                                        <span className="text-gray-500">المسطرة:</span>

                                        <span className="font-medium mr-1">{qrGenDialog.item.ruler_name}</span>

                                    </div>

                                    <div>

                                        <span className="text-gray-500">اللون:</span>

                                        <span className="font-medium mr-1">{qrGenDialog.item.color_name}</span>

                                    </div>

                                    <div>

                                        <span className="text-gray-500">الكود:</span>

                                        <span className="font-medium mr-1">{qrGenDialog.item.color_code || '-'}</span>

                                    </div>

                                </div>

                            </div>

                        )}



                        {/* تعديل الكمية */}

                        <div className="space-y-2">

                            <Label className="font-bold">الكمية (متر)</Label>

                            <div className="flex items-center gap-2">

                                <Input

                                    type="number"

                                    value={qrGenDialog.quantity}

                                    onChange={(e) => updateQrGenQuantity(e.target.value)}

                                    className="h-12 text-lg font-bold text-center"

                                    placeholder="0"

                                />

                                <span className="text-gray-500 font-medium">م</span>

                            </div>

                            <Button

                                size="sm"

                                className="bg-primary-f hover:bg-secondary-f text-white"

                                onClick={applyQrGenQuantity}

                                disabled={!isQrQuantityChanged || savingQrQuantity}

                            >

                                {savingQrQuantity ? "جاري الحفظ..." : "حفظ الكمية"}

                            </Button>

                            <div className="text-xs text-gray-400">

                                الكمية الأصلية: {qrGenDialog.item?.quantity} م

                            </div>

                        </div>



                        {/* معاينة QR */}

                        {qrGenDialog.qrUrl && (

                            <div className="space-y-3">

                                <div className="flex items-center justify-center bg-gray-50 p-4 rounded-lg border">

                                    <img

                                        src={qrGenDialog.qrUrl}

                                        alt="qr"

                                        className="h-64 w-64 border rounded shadow-sm"

                                    />

                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 border">

                                    <div>

                                        <span className="font-semibold">كود اللون:</span>{" "}

                                        <span>{qrGenDialog.item?.color_code || "-"}</span>

                                    </div>

                                    <div>

                                        <span className="font-semibold">الكمية:</span>{" "}

                                        <span>{qrGenDialog.quantity || qrGenDialog.item?.quantity || "-"}</span>

                                    </div>

                                    <div>

                                        <span className="font-semibold">الطبخة:</span>{" "}

                                        <span>{qrGenDialog.item?.batch_number || "-"}</span>

                                    </div>

                                    <div>

                                        <span className="font-semibold">نوع الطلب:</span>{" "}

                                        <span>{formatTypeItemString(qrGenDialog.item?.type_item)}</span>

                                    </div>

                                </div>

                                <div className="flex items-center justify-center gap-2">

                                    <Button

                                        size="sm"

                                        className="bg-secondary-s hover:brightness-110 text-white"

                                        onClick={() => {

                                            const footer = [

                                                qrGenDialog.item?.material_name || "",

                                                qrGenDialog.item?.ruler_name || qrGenDialog.item?.ruler_type || "",

                                                qrGenDialog.item?.color_code || "",

                                                qrGenDialog.item?.width || "",

                                                qrGenDialog.item?.thickness || "",

                                                qrGenDialog.quantity || qrGenDialog.item?.quantity || "",

                                                qrGenDialog.item?.batch_number || "",

                                                formatTypeItemString(qrGenDialog.item?.type_item),

                                                user?.user_id || user?.id || user?.employee_id || ""

                                            ].filter(v => v !== "").join("|");

                                            printQr(qrGenDialog.qrUrl, `QR - ${qrGenDialog.item?.color_name || ''}`, footer, 'rtl');

                                        }}

                                    >

                                        طباعة QR

                                    </Button>

                                    <Button

                                        size="sm"

                                        variant="outline"

                                        onClick={() => {

                                            const url = qrGenDialog.qrUrl;

                                            const title = `QR - ${qrGenDialog.item?.color_name || ''}`;

                                            openQrPreview(url, title, {

                                                material_name: qrGenDialog.item?.material_name || "",

                                                ruler_name: qrGenDialog.item?.ruler_name || qrGenDialog.item?.ruler_type || "",

                                                color_code: qrGenDialog.item?.color_code || "",

                                                width: qrGenDialog.item?.width || "",

                                                thickness: qrGenDialog.item?.thickness || "",

                                                quantity: qrGenDialog.quantity || qrGenDialog.item?.quantity || "",

                                                batch_number: qrGenDialog.item?.batch_number || "",

                                                type_label: formatTypeItemString(qrGenDialog.item?.type_item),

                                                employeeId: user?.user_id || user?.id || user?.employee_id || ""

                                            });

                                            closeQrGenDialog();

                                        }}

                                    >

                                        فتح في نافذة منفصلة

                                    </Button>

                                </div>

                            </div>

                        )}



                        {/* ملاحظات */}

                        <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">

                            <span className="font-bold">ملاحظة:</span> عند تعديل الكمية، سيتم تحديث QR تلقائياً. يمكنك الطباعة أو فتح QR في نافذة منفصلة.

                        </div>

                    </div>

                </StyledDialog>



                {/* Delete Confirmation Dialog */}

                <StyledDialog

                    isOpen={showDeleteDialog}

                    onOpenChange={setShowDeleteDialog}

                    title="تأكيد الحذف"

                    description={`هل أنت متأكد من حذف ${selectedOrders.length} طلب؟ لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الطلبات المحددة بشكل نهائي.`}

                    onCancel={() => setShowDeleteDialog(false)}

                    onConfirm={confirmDeleteSelectedOrders}

                    cancelLabel="إلغاء"

                    confirmLabel={deletingOrders ? "جاري الحذف..." : `حذف (${selectedOrders.length})`}

                    isLoading={deletingOrders}

                    confirmVariant="destructive"

                />

            </div>

        </div>
    );
}
