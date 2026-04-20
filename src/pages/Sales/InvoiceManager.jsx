// src/pages/Sales/InvoiceManager.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { invoiceApi } from "../../api/invoiceApi";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { priceColorApi } from "../../api/priceColorApi";
import { constantApi } from "../../api/constantApi";
import { settingApi } from "../../api/settingApi";
import { convertArabicToEnglishNumbers, parseArabicNumber } from "../../utils/helpers";
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
    Users,
    EyeOff,
    Home,
    LogOut,
    X,
    AlertCircle,
    Edit,
    Save,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    User,
    UserX,
    Receipt,
    QrCode,
    FileText,
    Search,
    Barcode,
    Printer,
    Download,
    RefreshCw
} from "lucide-react";
import DashboardHeader from "../../components/common/DashboardHeader";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, OrderStatus, CustomerType, PriceColorBy } from "../../types/enums";
import { useDebounce } from "../../hooks/useDebounce";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useExport } from "../../hooks/useExport";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

// مكون فرعي لعرض شريط التقدم
const ProgressBar = ({ value, max, className = "" }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className={`w-full h-1.5 bg-gray-200 rounded-full overflow-hidden ${className}`}>
            <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

// مكون فرعي لعرض حالة الدفع
const PaymentStatusBadge = ({ total, paid }) => {
    const status = invoiceApi.getPaymentStatus(total, paid);
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs ${status.className}`}>
            {status.label}
        </span>
    );
};

// مكون فرعي لعرض معلومات الزبون
const CustomerInfo = ({ customer, compact = false }) => {
    if (!customer) return <span className="text-gray-400">غير محدد</span>;

    if (compact) {
        return (
            <div className="text-sm">
                <div className="font-medium">{customer.name}</div>
                <div className="text-gray-500 text-xs">{customer.phone}</div>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="font-bold">{customer.name}</div>
            <div className="text-sm text-gray-600">{customer.phone}</div>
            {customer.city && <div className="text-xs text-gray-500">{customer.city}</div>}
        </div>
    );
};

// Hook مخصص لإدارة بيانات الفواتير
const useInvoiceData = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ page: 1, limit: 20 });

    const loadInvoices = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            const response = await invoiceApi.getInvoices({
                page: pagination.page,
                limit: pagination.limit,
                ...params
            });

            if (response.success) {
                setInvoices(response.data || []);
                setTotalCount(response.total || 0);
            }
        } catch (error) {
            toast.error("فشل في تحميل الفواتير");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    return {
        invoices,
        setInvoices,
        loading,
        setLoading,
        totalCount,
        pagination,
        setPagination,
        loadInvoices
    };
};

// Hook مخصص لإدارة بيانات المواد
const useMaterialsData = () => {
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [priceColors, setPriceColors] = useState([]);
    const [widthValues, setWidthValues] = useState([]);
    const [loadingWidths, setLoadingWidths] = useState(false);

    const loadInitialData = useCallback(async () => {
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
            toast.error("فشل في تحميل البيانات الأساسية");
        }
    }, []);

    const loadWidthValues = useCallback(async (materialId) => {
        try {
            setLoadingWidths(true);
            if (!materialId) {
                setWidthValues([]); // إذا كان materialId فارغاً، ضع مصفوفة فارغة
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
    }, []);

    return {
        materials,
        rulers,
        colors,
        batches,
        priceColors,
        widthValues,
        setWidthValues,
        loadingWidths,
        loadInitialData,
        loadWidthValues

    };
};

export default function InvoiceManager() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    
    const isAdmin = useMemo(() => {
        const role = (user?.role ?? user?.user_role ?? user?.userRole ?? user?.type ?? "").toString().toLowerCase();
        return role === "admin" || role.includes("admin");
    }, [user]);
    
    const [viewMode, setViewMode] = useLocalStorage("invoice_view_mode", isAdmin ? "history" : "create");
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    const [showUsdPrice, setShowUsdPrice] = useState(true);

    useEffect(() => {
        const loadUsdSetting = async () => {
            try {
                const res = await settingApi.getSettingByKey?.("invoice_show_usd_price");
                const payload = res?.data ?? res;
                const value = payload?.data?.value ?? payload?.data?.setting_value ?? payload?.value ?? payload?.setting_value ?? payload?.data ?? null;
                if (value == null) return;
                const v = String(value).toLowerCase();
                setShowUsdPrice(v === "true" || v === "1" || v === "yes" || v === "on");
            } catch {
                // keep default
            }
        };
        loadUsdSetting();
    }, []);

    useEffect(() => {
        if (!isAdmin && viewMode === "history") {
            setViewMode("create");
        }
    }, [isAdmin, viewMode, setViewMode]);
    const [showPreview, setShowPreview] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const tableContainerRef = useRef(null);
    const searchDebounce = useDebounce(300);

    // Data hooks
    const {
        invoices,
        setInvoices,
        loading: invoicesLoading,
        pagination,
        loadInvoices
    } = useInvoiceData();

    const {
        materials,
        rulers,
        colors,
        batches,
        priceColors,
        widthValues,
        loadingWidths,
        loadInitialData,
        loadWidthValues
    } = useMaterialsData();

    const { exportToExcel: exportInvoicesToExcel, loading: exportingInvoices } = useExport({
        sheetName: "الفواتير",
        columns: [
            { key: "invoice_id", header: "#" },
            { key: "date", header: "التاريخ" },
            { key: "customer", header: "الزبون" },
            { key: "total", header: "الإجمالي" },
            { key: "paid", header: "المدفوع" },
            { key: "remaining", header: "المتبقي" },
            { key: "status", header: "الحالة" },
            { key: "notes", header: "ملاحظات" },
        ],
        columnWidths: [
            { wch: 8 },
            { wch: 18 },
            { wch: 22 },
            { wch: 14 },
            { wch: 14 },
            { wch: 14 },
            { wch: 14 },
            { wch: 28 },
        ],
    });

    // Customer State
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState("");
    const [customerOption, setCustomerOption] = useLocalStorage("invoice_customer_option", "none");
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerBalance, setCustomerBalance] = useState(0);
    const [loadingCustomerBalance, setLoadingCustomerBalance] = useState(false);

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
        thickness: "0.6",
        length: "1",
        quantity: "",
        discount: "0",
        discount_type: "fixed",
        paid_amount: "",
        notes: ""
    });

    const [orderItems, setOrderItems] = useLocalStorage("invoice_order_items", []);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingInvoice, setDeletingInvoice] = useState(false);

    const [inputMode, setInputMode] = useLocalStorage("invoice_input_mode", "manual");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [manualCode, setManualCode] = useState("");

    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [paymentFormData, setPaymentFormData] = useState({
        paid_amount: "",
        discount: "0",
        discount_type: "fixed",
        total_after: ""
    });

    // Numpad
    const [numpadMode, setNumpadMode] = useState("quantity");
    const [colorSearchCode, setColorSearchCode] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [activeField, setActiveField] = useState("quantity");
    const [activeTextTarget, setActiveTextTarget] = useState(null); // color_search | batch_search | customer_search

    // Price calculation
    const [priceCalculation, setPriceCalculation] = useState(null);
    const [calculatingPrice, setCalculatingPrice] = useState(false);

    const invoiceTotalsSummary = useMemo(() => {
        // إذا كانت الفاتورة مرتبطة بطلب، نستخدم قيمة الطلب فقط مع خصم الفاتورة
        if (selectedOrder) {
            const totalBeforeDiscount = parseFloat(selectedOrder.total_amount) || 0;
            let invoiceDiscount = parseFloat(formData.discount) || 0;
            if (formData.discount_type === "percentage") {
                invoiceDiscount = (totalBeforeDiscount * invoiceDiscount) / 100;
            }
            const discountAmount = Math.max(invoiceDiscount, 0);
            const totalAfterDiscount = Math.max(totalBeforeDiscount - discountAmount, 0);
            return { totalBeforeDiscount, discountAmount, totalAfterDiscount };
        }

        // في الفاتورة اليدوية: نجمع خصم العناصر + خصم الفاتورة
        const sumBefore = orderItems.reduce(
            (sum, it) => sum + (parseFloat(it.subtotal_before_discount ?? it.subtotal ?? 0) || 0),
            0
        );
        const sumAfter = orderItems.reduce(
            (sum, it) => sum + (parseFloat(it.subtotal ?? it.subtotal_before_discount ?? 0) || 0),
            0
        );
        const itemsDiscount = Math.max(sumBefore - sumAfter, 0);

        let extraDiscount = parseFloat(formData.discount) || 0;
        if (formData.discount_type === "percentage") {
            // خصم الفاتورة ينطبق على المبلغ بعد خصم العناصر
            extraDiscount = (sumAfter * extraDiscount) / 100;
        }

        const totalBeforeDiscount = sumBefore;
        const discountAmount = Math.max(itemsDiscount + extraDiscount, 0);
        const totalAfterDiscount = Math.max(totalBeforeDiscount - discountAmount, 0);

        return { totalBeforeDiscount, discountAmount, totalAfterDiscount };
    }, [selectedOrder, orderItems, formData.discount, formData.discount_type]);

    // Load initial data
    useEffect(() => {
        loadInitialData();
        loadCustomers();
        loadOrders();
        if (viewMode === "history") {
            loadInvoices();
        }
    }, [viewMode]);

    // Load width values when material changes
    useEffect(() => {
        if (formData.material_id) {
            loadWidthValues(formData.material_id);
        } else {
            // استخدم loadWidthValues مع null لتعيين قيم فارغة
            loadWidthValues(null);
        }
    }, [formData.material_id, loadWidthValues]);

    const loadCustomers = useCallback(async () => {
        try {
            setLoadingCustomers(true);
            const response = await customerApi.getCustomers();
            setCustomers(getApiData(response, []) || []);
        } catch (error) {
            toast.error("فشل في تحميل العملاء");
        } finally {
            setLoadingCustomers(false);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            const response = await orderApi.getOrders({ status: OrderStatus.completed });
            setOrders(getApiData(response, []) || []);
        } catch (error) {
            toast.error("فشل في تحميل الطلبات");
        }
    }, []);

    const handleCreateCustomer = useCallback(async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast.error("الاسم ورقم الهاتف مطلوبان");
            return;
        }

        try {
            setLoadingCustomers(true);
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

            const response = await customerApi.createCustomer(customerData);
            const createdCustomer = getApiData(response, {});

            if (createdCustomer) {
                toast.success("تم إنشاء الزبون بنجاح");
                setCustomers(prev => [...prev, createdCustomer]);
                setSelectedCustomer(createdCustomer);
                setCustomerBalance(Number(createdCustomer.balance || 0));
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
            toast.error(error.response?.data?.message || "فشل في إنشاء الزبون");
        } finally {
            setLoadingCustomers(false);
        }
    }, [newCustomer, setCustomerOption]);

    const loadCustomerBalance = useCallback(async (customerId) => {
        if (!customerId) {
            setCustomerBalance(0);
            return;
        }
        try {
            setLoadingCustomerBalance(true);
            const response = await invoiceApi.getInvoicesByCustomerId(customerId);
            if (response.success && response.data) {
                const totalBalance = response.data.reduce((sum, invoice) => {
                    const remaining = invoice.remaining_amount || 0;
                    return sum + (remaining > 0 ? remaining : 0);
                }, 0);
                setCustomerBalance(totalBalance);
            } else {
                setCustomerBalance(0);
            }
        } catch (error) {
            console.error("Error loading customer balance:", error);
            setCustomerBalance(0);
        } finally {
            setLoadingCustomerBalance(false);
        }
    }, []);

    const formatPhoneNumber = useCallback((phone) => {
        if (!phone) return "";
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("963")) {
            return `+${cleaned}`;
        }
        return `+963${cleaned}`;
    }, []);
    const formatTypeItem = (value) => {
        if (value === TypeItem.Machine) return "مكنة";
        if (value === TypeItem.Presser) return "كوي";
        return "-";
    };

    // Memoized values for performance
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
    const isSelectedMaterialBoard = useMemo(() => {
        if (!formData.material_id) return false;
        const materialName = selectedMaterial?.material_name?.toLowerCase() || "";
        const boardKeywords = ["لوح", "ألواح", "board", "boards", "لوحة", "الواح"];
        return boardKeywords.some(keyword => materialName.includes(keyword));
    }, [formData.material_id, materials, selectedMaterial]);
    const isSelectedMaterialPvc = useMemo(() => {
        if (!formData.material_id) return false;
        const materialName = selectedMaterial?.material_name?.toLowerCase() || "";
        return materialName.includes("pvc");
    }, [formData.material_id, materials, selectedMaterial]);

    // Auto-select default width for PVC when available
    useEffect(() => {
        if (!isSelectedMaterialPvc) return;
        if (!formData.material_id) return;
        if (formData.width) return; // don't override user choice
        if (!widthValues || widthValues.length === 0) return;

        const def = widthValues.find(w => w?.isDefault) || null;
        if (def?.value !== undefined && def?.value !== null && String(def.value).trim() !== "") {
            setFormData(prev => ({ ...prev, width: String(def.value) }));
        }
    }, [isSelectedMaterialPvc, formData.material_id, formData.width, widthValues]);
    const getMaterialConstantLabel = useCallback((material, type) => {
        const values = material?.constant_values || [];
        const candidates = values.filter(v => v.type === type);
        const pick = candidates.find(v => v.isDefault) || candidates[0];
        if (!pick) return "-";
        return pick.label || `${pick.value ?? ""} ${pick.unit || ""}`.trim();
    }, []);

    // Calculate price when color and quantity change
    useEffect(() => {
        const calculatePrice = async () => {
            const requiresType = isSelectedMaterialPvc;
            if (formData.color_id && formData.quantity && (!requiresType || formData.type_item)) {
                try {
                    setCalculatingPrice(true);
                    const payload = {
                        color_id: parseInt(formData.color_id),
                        width: parseFloat(formData.width) || 0,
                        length: parseFloat(formData.length) || 1,
                        quantity: parseFloat(formData.quantity)
                    };
                    if (requiresType) payload.type_item = formData.type_item;

                    const response = await invoiceApi.getMaterialPrice(payload);

                    if (response.success) {
                        setPriceCalculation(response.data);
                    }
                } catch (error) {
                    setPriceCalculation(null);
                } finally {
                    setCalculatingPrice(false);
                }
            } else {
                setPriceCalculation(null);
            }
        };

        const debounceTimer = setTimeout(calculatePrice, 500);
        return () => clearTimeout(debounceTimer);
    }, [formData.color_id, formData.quantity, formData.type_item, formData.width, isSelectedMaterialPvc]);

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

    const totalPreviewQuantity = useMemo(() => {
        return orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, [orderItems]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers;
        const term = customerSearchTerm.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term) ||
            c.city?.toLowerCase().includes(term)
        );
    }, [customers, customerSearchTerm]);

    const customerOptions = useMemo(() => {
        return filteredCustomers.map(c => ({
            value: String(c.customer_id),
            label: `${c.name} - ${c.phone}${c.city ? ` - ${c.city}` : ''}`
        }));
    }, [filteredCustomers]);

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

    const batchOptions = useMemo(() => {
        const base = formData.material_id
            ? batches.filter(b => String(b.material_id) === String(formData.material_id))
            : batches;
        return base.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || `طبخة ${b.batch_id}`
        }));
    }, [batches, formData.material_id]);

    const filteredInvoices = useMemo(() => {
        if (!searchTerm) return invoices;
        const term = searchTerm.toLowerCase();
        return invoices.filter(inv =>
            String(inv.invoice_id).includes(term) ||
            inv.customer?.name?.toLowerCase().includes(term) ||
            inv.customer?.phone?.toLowerCase().includes(term) ||
            (inv.order_id && String(inv.order_id).includes(term)) ||
            (inv.issued_at && new Date(inv.issued_at).toLocaleDateString('en-US').includes(term)) ||
            (inv.total_amount && String(inv.total_amount).includes(term)) ||
            (inv.paid_amount && String(inv.paid_amount).includes(term)) ||
            (inv.remaining_amount && String(inv.remaining_amount).includes(term)) ||
            (inv.notes && inv.notes.toLowerCase().includes(term)) ||
            (inv.status && inv.status.toLowerCase().includes(term))
        );
    }, [invoices, searchTerm]);

    const handleExportInvoices = () => {
        if (!filteredInvoices || filteredInvoices.length === 0) {
            toast.error("لا توجد فواتير للتصدير");
            return;
        }
        const exportRows = filteredInvoices.map(inv => {
            const status = invoiceApi.getPaymentStatus(inv.total_amount, inv.paid_amount);
            return {
                invoice_id: `#${inv.invoice_id}`,
                date: invoiceApi.getFormattedDate(inv.issued_at),
                customer: inv.customer?.name || "-",
                total: invoiceApi.formatCurrency(inv.total_amount || 0),
                paid: invoiceApi.formatCurrency(inv.paid_amount || 0),
                remaining: invoiceApi.formatCurrency(inv.remaining_amount || 0),
                status: status?.label || "-",
                notes: inv.notes || "",
            };
        });
        exportInvoicesToExcel(exportRows, "الفواتير");
    };

    // Handlers
    const handleFieldChange = useCallback((field, value) => {
        // Convert Arabic numerals to English for numeric fields
        let processedValue = value;
        if (['quantity', 'width', 'thickness', 'length', 'paid_amount', 'discount'].includes(field)) {
            processedValue = convertArabicToEnglishNumbers(value);
        }
        
        setFormData(prev => {
            const newData = { ...prev, [field]: processedValue };

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
    }, []);

    const handleNumpadPress = useCallback((val) => {
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
                setBatchSearchTerm(prev => apply(prev));
                return;
            }

            if (activeTextTarget === "customer_search") {
                setManualCode(prev => apply(prev));
                return;
            }

            // General text editing for activeField when no specific text target
            if (!activeTextTarget && activeField) {
                const next = apply(formData[activeField] || "");
                // If editing payment popup fields
                if (showPaymentPopup && (activeField === 'paid_amount' || activeField === 'discount')) {
                    setPaymentFormData(prev => ({ ...prev, [activeField]: next }));
                    return;
                }
                // If editing history payment amount
                if (showPaymentDialog && activeField === 'paymentAmount') {
                    setPaymentAmount(next);
                    return;
                }

                handleFieldChange(activeField, next);
                return;
            }
        }

        if (numpadMode === "colorSearch") {
            let search = colorSearchCode;
            if (val === "clear") search = "";
            else if (val === "back") search = search.slice(0, -1);
            else search = search + val;

            setColorSearchCode(search);

            const matched = availablePricedColors.find(c => c.color_code === search);
            if (matched) {
                handleFieldChange("color_id", String(matched.color_id));
                setNumpadMode("quantity");
                setColorSearchCode("");
                toast.success(`تم العثور على اللون: ${matched.color_name}`);
            }
            return;
        }

        // If payment popup is open and active field is paid/discount, edit paymentFormData
        if (showPaymentPopup && (activeField === 'paid_amount' || activeField === 'discount')) {
            let current = String(paymentFormData[activeField] || "");
            if (val === "clear") current = "";
            else if (val === "back") current = current.slice(0, -1);
            else if (val === ".") {
                if (!current.includes(".")) current = current ? current + "." : "0.";
            } else {
                current = current + val;
            }
            setPaymentFormData(prev => ({ ...prev, [activeField]: current }));
            return;
        }

        // If history payment dialog is open and activeField is paymentAmount, edit that
        if (showPaymentDialog && activeField === 'paymentAmount') {
            let current = String(paymentAmount || "");
            if (val === "clear") current = "";
            else if (val === "back") current = current.slice(0, -1);
            else if (val === ".") {
                if (!current.includes(".")) current = current ? current + "." : "0.";
            } else {
                current = current + val;
            }
            setPaymentAmount(current);
            return;
        }

        // Default: edit formData field
        let current = String(formData[activeField] || "");
        if (val === "clear") current = "";
        else if (val === "back") current = current.slice(0, -1);
        else if (val === ".") {
            if (!current.includes(".")) current = current ? current + "." : "0.";
        } else {
            current = current + val;
        }
        handleFieldChange(activeField, current);
    }, [numpadMode, colorSearchCode, availablePricedColors, formData, activeField, handleFieldChange, showPaymentPopup, paymentFormData, showPaymentDialog, paymentAmount, setPaymentAmount]);

   const addOrUpdateItem = useCallback(() => {
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

    // تحضير batch_id - فقط إذا كانت لها قيمة صالحة
    let batchIdValue = null;
    if (formData.batch_id && 
        formData.batch_id !== "" && 
        formData.batch_id !== null && 
        formData.batch_id !== undefined && 
        formData.batch_id !== "null" && 
        formData.batch_id !== "undefined" && 
        String(formData.batch_id).trim() !== "") {
        batchIdValue = formData.batch_id;
    }

    const newItem = {
        id: editingItemId || Date.now(),
        material_id: formData.material_id,
        type_item: formData.type_item,
        ruler_id: formData.ruler_id,
        color_id: formData.color_id,
        // إذا كانت batch_id غير صالحة، لا نضيف الخاصية نهائياً
        ...(batchIdValue && { batch_id: batchIdValue }),
        width: formData.width,
        thickness: formData.thickness,
        length: formData.length,
        quantity: formData.quantity,
        notes: formData.notes,
        material_name: material?.material_name,
        ruler_name: ruler?.ruler_name,
        color_name: color?.color_name,
        color_code: color?.color_code,
        batch_number: batch?.batch_number,
        unit_price: priceCalculation?.unitPrice || 0,
        price_per_meter: priceCalculation?.price_per_meter ?? null,
        subtotal_before_discount: priceCalculation?.subtotal || 0,
        discount_amount: priceCalculation?.discount || 0,
        subtotal: priceCalculation?.total ?? priceCalculation?.subtotal ?? 0
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

    // Reset form
    setFormData(prev => ({
        material_id: prev.material_id,
        thickness: "0.6",
        type_item: "",
        ruler_id: "",
        color_id: "",
        batch_id: "",
        width: "",
        quantity: "",
        notes: ""
    }));
    setColorSearchCode("");
    setPriceCalculation(null);
}, [formData, isSelectedMaterialBoard, isSelectedMaterialPvc, isColorPriced, materials, rulers, colors, batches, editingItemId, priceCalculation, setOrderItems]);

    const handleEditItem = useCallback((item) => {
        setFormData({
            material_id: String(item.material_id),
            type_item: item.type_item,
            ruler_id: String(item.ruler_id),
            color_id: String(item.color_id),
            batch_id: item.batch_id ? String(item.batch_id) : "",
            width: item.width || "",
            thickness: item.thickness || "0.6",
            quantity: item.quantity,
            notes: item.notes || ""
        });
        setEditingItemId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const removeItem = useCallback((id) => {
        if (editingItemId === id) {
            setEditingItemId(null);
            setFormData(prev => ({
                material_id: prev.material_id,
                thickness: "0.6",
                type_item: "",
                ruler_id: "",
                color_id: "",
                batch_id: "",
                width: "",
                quantity: "",
                notes: ""
            }));
        }
        setOrderItems(prev => prev.filter(item => item.id !== id));
        toast.success("تم حذف العنصر");
    }, [editingItemId, setOrderItems]);

    const clearAllItems = useCallback(() => {
        if (orderItems.length > 0) {
            setOrderItems([]);
            setEditingItemId(null);
            setFormData(prev => ({
                material_id: prev.material_id,
                thickness: "0.6",
                type_item: "",
                ruler_id: "",
                color_id: "",
                batch_id: "",
                width: "",
                quantity: "",
                notes: ""
            }));
            toast.success("تم مسح جميع العناصر");
        }
    }, [orderItems.length, setOrderItems]);

    const cancelEdit = useCallback(() => {
        setEditingItemId(null);
        setFormData(prev => ({
            material_id: prev.material_id,
            thickness: "0.6",
            type_item: "",
            ruler_id: "",
            color_id: "",
            batch_id: "",
            width: "",
            quantity: "",
            notes: ""
        }));
    }, []);

    const handleQrScan = useCallback(() => {
        if (!qrCode) {
            toast.error("يرجى إدخال رمز QR");
            return;
        }
        const foundOrder = orders.find(o => o.order_id === parseInt(qrCode));
        if (foundOrder) {
            setSelectedOrder(foundOrder);
            setFormData(prev => ({ ...prev, order_id: String(foundOrder.order_id) }));
            toast.success("تم العثور على الطلب");
        } else {
            toast.error("لم يتم العثور على طلب بهذا الرمز");
        }
    }, [qrCode, orders]);

    const handleCodeSearch = useCallback(() => {
        if (!manualCode) {
            toast.error("يرجى إدخال كود الطلب");
            return;
        }
        const foundOrder = orders.find(o => o.order_id === parseInt(manualCode));
        if (foundOrder) {
            setSelectedOrder(foundOrder);
            setFormData(prev => ({ ...prev, order_id: String(foundOrder.order_id) }));
            toast.success("تم العثور على الطلب");
        } else {
            toast.error("لم يتم العثور على طلب بهذا الكود");
        }
    }, [manualCode, orders]);

   const saveInvoice = useCallback(async () => {
    const paidAmount = parseFloat(formData.paid_amount);
    if (isNaN(paidAmount) || paidAmount < 0) {
        toast.error("يرجى إدخال مبلغ صحيح");
        return;
    }

    try {
        const totalBeforeDiscount = invoiceTotalsSummary.totalBeforeDiscount;
        const discount = invoiceTotalsSummary.discountAmount;
        const totalAfterDiscount = invoiceTotalsSummary.totalAfterDiscount;

        const invoiceData = {
            order_id: selectedOrder?.order_id ? Number(selectedOrder.order_id) : null,
            customer_id: selectedOrder?.customer_id ? Number(selectedOrder.customer_id) : (selectedCustomer?.customer_id ? Number(selectedCustomer.customer_id) : null),
            total_amount: parseFloat(totalBeforeDiscount),
            discount: discount,
            paid_amount: paidAmount,
            notes: formData.notes || "",
            items: orderItems.map(item => {
                console.log("Processing item:", JSON.stringify(item, null, 2));
                const payload = {
                    color_id: parseInt(item.color_id),
                    width: parseFloat(item.width) || 0,
                    length: parseFloat(item.length) || 1,
                    thickness: parseFloat(item.thickness) || 0.6,
                    quantity: parseFloat(item.quantity),
                    unit_price: parseFloat(item.unit_price) || 0,
                    subtotal: parseFloat(item.subtotal) || 0,
                    notes: item.notes || ""
                };
                
                if (item.type_item) payload.type_item = item.type_item;

                // تعديل هنا: فقط أضف batch_id إذا كانت موجودة وقيمتها صالحة
                if (item.hasOwnProperty('batch_id') && item.batch_id && 
                    item.batch_id !== "" && 
                    item.batch_id !== null && 
                    item.batch_id !== undefined && 
                    item.batch_id !== "null" && 
                    item.batch_id !== "undefined" && 
                    String(item.batch_id).trim() !== "") {
                    
                    payload.batch_id = parseInt(item.batch_id);
                    console.log("Debug - batch_id added to payload:", payload.batch_id);
                } else {
                    // لا نضيف batch_id للـ payload إذا كانت null أو غير موجودة
                    console.log("Debug - batch_id NOT added to payload (null/empty/not present)");
                }

                console.log("Final item payload:", JSON.stringify(payload, null, 2));
                return payload;
            })
        };

        let response;
        if (editingInvoiceId) {
            response = await invoiceApi.updateInvoice(editingInvoiceId, invoiceData);
        } else {
            response = await invoiceApi.createInvoice(invoiceData);
        }

        if (response.success) {
            toast.success(editingInvoiceId ? "تم تحديث الفاتورة بنجاح" : "تم إنشاء الفاتورة بنجاح");

            // Reset form
            setShowPreview(false);
            setEditingInvoiceId(null);
            setSelectedOrder(null);
            setSelectedCustomer(null);
            setCustomerOption("none");
            setOrderItems([]);
            setFormData(prev => ({
                material_id: "",
                thickness: "0.6",
                length: "1",
                type_item: "",
                ruler_id: "",
                color_id: "",
                batch_id: "",
                width: "",
                quantity: "",
                discount: "0",
                discount_type: "fixed",
                notes: ""
            }));
        setPaymentFormData({
            paid_amount: "",
            discount: "0",
            discount_type: "fixed",
            total_after: ""
        });

            if (viewMode === "history") {
                loadInvoices();
            }
        }
    } catch (error) {
        // Extract error message from various possible error formats
        let errorMessage = "فشل في حفظ الفاتورة";
        if (error.message) {
            errorMessage = error.message;
        } else if (error.details && typeof error.details === 'string') {
            errorMessage = error.details;
        } else if (error.error) {
            errorMessage = error.error;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        toast.error(errorMessage);
    }
}, [selectedOrder, formData, editingInvoiceId, viewMode, loadInvoices, orderItems, setOrderItems, selectedCustomer]);
    const handleAddPayment = useCallback(async () => {
        if (!selectedInvoiceForPayment) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("يرجى إدخال مبلغ صحيح");
            return;
        }

        if (amount > parseFloat(selectedInvoiceForPayment.remaining_amount)) {
            toast.error("المبلغ أكبر من المتبقي");
            return;
        }

        try {
            const response = await invoiceApi.addPayment(selectedInvoiceForPayment.invoice_id, {
                payment_amount: amount
            });

            if (response.success) {
                toast.success("تم إضافة الطبخة بنجاح");
                setShowPaymentDialog(false);
                setSelectedInvoiceForPayment(null);
                setPaymentAmount("");

                // Refresh invoices
                loadInvoices();
            }
        } catch (error) {
            // Extract error message from various possible error formats
            let errorMessage = "فشل في إضافة الطبخة";
            if (error.message) {
                errorMessage = error.message;
            } else if (error.details && typeof error.details === 'string') {
                errorMessage = error.details;
            } else if (error.error) {
                errorMessage = error.error;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage);
        }
    }, [selectedInvoiceForPayment, paymentAmount, loadInvoices]);

    const handleDeleteInvoice = useCallback(async () => {
        if (!invoiceToDelete) return;

        try {
            setDeletingInvoice(true);
            const response = await invoiceApi.deleteInvoice(invoiceToDelete.invoice_id);
            if (response.success) {
                toast.success("تم حذف الفاتورة بنجاح");
                loadInvoices();
            }
            setShowDeleteDialog(false);
            setInvoiceToDelete(null);
        } catch (error) {
            // Extract error message from various possible error formats
            let errorMessage = "فشل في حذف الفاتورة";
            if (error.message) {
                errorMessage = error.message;
            } else if (error.details && typeof error.details === 'string') {
                errorMessage = error.details;
            } else if (error.error) {
                errorMessage = error.error;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage);
        } finally {
            setDeletingInvoice(false);
        }
    }, [invoiceToDelete, loadInvoices]);

    const handleEditInvoice = useCallback((invoice) => {
        // populate selected order if invoice has order linkage
        if (invoice.order_id) {
            setSelectedOrder({
                order_id: Number(invoice.order_id),
                customer_id: invoice.customer_id,
                total_amount: invoice.total_amount,
                items: invoice.invoiceItems || []
            });
            setFormData(prev => ({ ...prev, order_id: String(invoice.order_id) }));
        } else {
            setSelectedOrder(null);
            setFormData(prev => ({ ...prev, order_id: "" }));
        }

        // populate items into orderItems state so they appear in the editor
        const mappedItems = (invoice.invoiceItems || []).map(it => {
            // Helper to safely read multiple possible fields
            const getFirst = (obj, keys = []) => {
                for (const k of keys) {
                    const v = obj?.[k];
                    if (v !== undefined && v !== null && v !== "") return v;
                }
                return null;
            };

            // Try many possible locations for ids/names
            let materialId = getFirst(it, ["material_id", "materialId", "material?.material_id"]) || getFirst(it.material, ["material_id", "id"]) || (it.color && it.color.ruler && it.color.ruler.material && getFirst(it.color.ruler.material, ["material_id", "id"]));
            let materialName = getFirst(it, ["material_name", "materialName", "material?.material_name"]) || getFirst(it.material, ["material_name", "name"]) || (it.color && it.color.ruler && it.color.ruler.material && getFirst(it.color.ruler.material, ["material_name", "name"]));

            let rulerId = getFirst(it, ["ruler_id", "rulerId"]) || getFirst(it.ruler, ["ruler_id", "id"])
                || (it.color && it.color.ruler && getFirst(it.color.ruler, ["ruler_id", "id"]));
            let rulerName = getFirst(it, ["ruler_name", "rulerName"]) || getFirst(it.ruler, ["ruler_name", "name"])
                || (it.color && it.color.ruler && getFirst(it.color.ruler, ["ruler_name", "name"]));

            // batch number may be named differently
            const batchNumber = getFirst(it, ["batch_number", "batchNo", "batch_no", "batch", "cooking_number", "cooking_no"]) || (it.batch && getFirst(it.batch, ["batch_number", "batchNo", "batch_no", "batch"])) || "";
            const batchId = getFirst(it, ["batch_id", "batchId"]) || (it.batch && getFirst(it.batch, ["batch_id", "id"])) || null;

            // color id/name
            const colorId = getFirst(it, ["color_id", "colorId"]) || (it.color && getFirst(it.color, ["color_id", "id"])) || null;
            const colorName = getFirst(it, ["color_name", "colorName"]) || (it.color && getFirst(it.color, ["color_name", "name"])) || null;

            // If ids missing try to resolve by name using loaded lists
            if (!materialId && materialName) {
                const found = materials.find(m => String(m.material_name || m.name || "").trim().toLowerCase() === String(materialName).trim().toLowerCase());
                if (found) {
                    materialId = found.material_id;
                    materialName = found.material_name || found.name;
                }
            }

            if (!rulerId && rulerName) {
                const foundR = rulers.find(r => {
                    const rName = (r.ruler_name || r.ruler_type || r.name || '').trim().toLowerCase();
                    return rName === String(rulerName).trim().toLowerCase();
                });
                if (foundR) {
                    rulerId = foundR.ruler_id;
                    rulerName = foundR.ruler_name || foundR.name || foundR.ruler_type;
                }
            }

            // If we have ids but not names, look up names from loaded lists
            if (materialId && !materialName) {
                const found = materials.find(m => String(m.material_id) === String(materialId));
                if (found) materialName = found.material_name || found.name || "";
            }

            if (rulerId && !rulerName) {
                const foundR = rulers.find(r => String(r.ruler_id) === String(rulerId));
                if (foundR) rulerName = foundR.ruler_name || foundR.name || foundR.ruler_type || "";
            }

            return {
                id: it.invoice_item_id || Date.now(),
                material_id: materialId ? String(materialId) : "",
                type_item: it.type_item,
                ruler_id: rulerId ? String(rulerId) : "",
                color_id: colorId ? String(colorId) : (it.color?.color_id ? String(it.color.color_id) : ""),
                width: it.width !== undefined && it.width !== null ? String(it.width) : "",
                length: it.length !== undefined && it.length !== null ? String(it.length) : "",
                thickness: it.thickness !== undefined && it.thickness !== null ? String(it.thickness) : "0.6",
                batch_id: batchId ? String(batchId) : (it.batch_id ? String(it.batch_id) : ""),
                quantity: String(it.quantity || it.qty || it.quantity_m || 0),
                unit_price: String(it.unit_price || it.price || 0),
                unit_price_usd: it.unit_price_usd ?? it.price_per_meter ?? (it.color_price_per_meter ?? null),
                subtotal: String(it.subtotal || it.total || 0),
                notes: it.notes || it.description || "",
                material_name: materialName || it.material?.material_name || it.material?.name || "",
                ruler_name: rulerName || it.ruler?.ruler_name || it.ruler?.name || "",
                color_name: colorName || it.color?.color_name || it.color_name || "",
                batch_number: batchNumber || it.batch_number || it.batch?.batch_number || "",
            };
        });
        setOrderItems(mappedItems);

        // populate customer selection
        if (invoice.customer) {
            setSelectedCustomer(invoice.customer);
            setCustomerOption('existing');
        } else {
            setSelectedCustomer(null);
            setCustomerOption('none');
        }

        setFormData(prev => ({
            ...prev,
            paid_amount: invoice.paid_amount || prev.paid_amount,
            notes: invoice.notes || prev.notes
        }));
        setEditingInvoiceId(invoice.invoice_id);
        setViewMode("create");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [setViewMode]);

    // If user opened edit before materials/batches loaded, re-resolve missing names/ids
    useEffect(() => {
        if (!editingInvoiceId) return;
        if (!materials || materials.length === 0) return;
        let changed = false;
        const resolved = (orderItems || []).map(it => {
            const next = { ...it };

            // material: try fill id from name or name from id
            if ((!next.material_id || next.material_id === "") && next.material_name) {
                const found = materials.find(m => String(m.material_name || m.name || "").trim().toLowerCase() === String(next.material_name).trim().toLowerCase());
                if (found) {
                    next.material_id = String(found.material_id);
                    next.material_name = found.material_name || found.name || next.material_name;
                    changed = true;
                }
            } else if (next.material_id && (!next.material_name || next.material_name === "")) {
                const found = materials.find(m => String(m.material_id) === String(next.material_id));
                if (found) {
                    next.material_name = found.material_name || found.name || "";
                    changed = true;
                }
            }

            // batch: try fill number from id or id from number (only if batches available)
            if (batches && batches.length > 0) {
                if ((!next.batch_number || next.batch_number === "") && next.batch_id) {
                    const foundB = batches.find(b => String(b.batch_id) === String(next.batch_id));
                    if (foundB) {
                        next.batch_number = foundB.batch_number || String(foundB.batch_id);
                        changed = true;
                    }
                }
                if ((!next.batch_id || next.batch_id === "") && next.batch_number) {
                    const foundB2 = batches.find(b => (b.batch_number || "").toString().trim().toLowerCase() === String(next.batch_number).trim().toLowerCase());
                    if (foundB2) {
                        next.batch_id = String(foundB2.batch_id);
                        changed = true;
                    }
                }
            }

            return next;
        });

        if (changed) {
            setOrderItems(resolved);
        }
    }, [materials, orderItems, editingInvoiceId, batches]);

    const clearForm = useCallback(() => {
        setFormData({
            material_id: "",
            type_item: "",
            ruler_id: "",
            color_id: "",
            batch_id: "",
            width: "",
            thickness: "0.6",
            length: "1",
            quantity: "",
            notes: ""
        });
        setPaymentFormData({
            paid_amount: "",
            discount: "0",
            discount_type: "fixed",
            total_after: ""
        });
        setSelectedOrder(null);
        setQrCode("");
        setManualCode("");
        setEditingInvoiceId(null);
        setPriceCalculation(null);
        setShowPaymentPopup(false);
        setShowPreview(false);
    }, []);

    const scrollTable = useCallback((direction) => {
        if (tableContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = tableContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tableContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }
    }, []);

    // Loading state
    if (viewMode === "create" && materials.length === 0 && !invoicesLoading) {
        return (
            <div className=" flex items-center justify-center">
                <LoadingState />
            </div>
        );
    }

    return (
        <div className="h-[95vh] flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <DashboardHeader
                isHeaderVisible={isHeaderVisible}
                setIsHeaderVisible={setIsHeaderVisible}
                hideHeaderToggle={true}
                hideOrderPreparer={true}
                customersLabel="الزبائن"
                invoicesLabel="إضافة فاتورة"
                leftContent={
                    <>
                        <button
                            onClick={() => navigate("/sales?tab=colors")}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all bg-white/10 text-white border-white/30 hover:bg-white/20"
                        >
                            الشركات المكافئة
                        </button>
                        {/* <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setViewMode("create")}
                            className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "create"
                                ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                        >
                            <Receipt className="w-5 h-5 ml-2" />
                            فاتورة جديدة
                        </Button> */}
                        {isAdmin && (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                    setViewMode("history");
                                    loadInvoices();
                                    loadOrders();
                                }}
                                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "history"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                    }`}
                            >
                                <History className="w-5 h-5 ml-2" />
                                سجل الفواتير
                            </Button>
                        )}
                    </>
                }
            />

            {/* Main Content */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                {viewMode === "create" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.5fr_1.6fr] gap-3 h-full min-h-0">

                        {/* العمود الأيمن - يتغير حسب وضع الإدخال */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">

                            {/* Tabs في الأعلى (ثابتة) */}
                            <div className="flex-shrink-0">
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setInputMode("qr")}
                                        className={`
                                            aspect-square rounded-xl border-3 text-sm font-bold
                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                            flex flex-col items-center justify-center gap-2 p-2
                                            ${inputMode === "qr"
                                                ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                                                : "border-gray-300 bg-white hover:border-purple-400"
                                            }
                                        `}
                                    >
                                        <QrCode className="w-8 h-8" />
                                        <span>QR</span>
                                    </button>
                                    {/* <button
                                        onClick={() => setInputMode("code")}
                                        className={`
                                            aspect-square rounded-xl border-3 text-sm font-bold
                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                            flex flex-col items-center justify-center gap-2 p-2
                                            ${inputMode === "code"
                                                ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                                                : "border-gray-300 bg-white hover:border-blue-400"
                                            }
                                        `}
                                    >
                                        <Barcode className="w-8 h-8" />
                                        <span>كود</span>
                                    </button> */}
                                    <button
                                        onClick={() => setInputMode("manual")}
                                        className={`
                                            aspect-square rounded-xl border-3 text-sm font-bold
                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                            flex flex-col items-center justify-center gap-2 p-2
                                            ${inputMode === "manual"
                                                ? "border-green-600 bg-green-600 text-white shadow-lg"
                                                : "border-gray-300 bg-white hover:border-green-400"
                                            }
                                        `}
                                    >
                                        <FileText className="w-8 h-8" />
                                        <span>يدوي</span>
                                    </button>
                                </div>
                            </div>

                            {/* المحتوى يتغير حسب الوضع */}
                            {inputMode === "qr" && (
                                <Card className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
                                    <Label className="font-bold text-base mb-3 block">مسح رمز QR</Label>
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-6 mb-3">
                                            <QrCode className="w-24 h-24 text-gray-600 mb-3" />
                                            <p className="text-sm text-gray-600 text-center">
                                                وجه الكاميرا نحو رمز QR<br />الموجود على الطلب
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="أدخل الرمز يدوياً..."
                                                value={qrCode}
                                                onChange={(e) => setQrCode(e.target.value)}
                                                className="h-12 text-base flex-1"
                                                onKeyPress={(e) => e.key === 'Enter' && handleQrScan()}
                                            />
                                            <Button
                                                onClick={handleQrScan}
                                                className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white"
                                                disabled={!qrCode}
                                            >
                                                <Check className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {inputMode === "manual" && (
                                <>
                                    {/* أزرار المواد - مثل صفحة المبيعات */}
                                    <Card className="flex-shrink-0 p-2">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 auto-rows-fr">
                                            {materials.map(m => (
                                                <button
                                                    key={m.material_id}
                                                    onClick={() => handleFieldChange("material_id", String(m.material_id))}
                                                    className={`
                                                        aspect-square rounded-xl border-3 text-lg sm:text-xl font-bold 
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
                                </>
                            )}

                            {/* لوحة الأرقام - متاحة دائماً عندما لا يكون في وضع QR */}
                            {inputMode !== "qr" && (
                                <Card className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                                    <div className="flex-shrink-0 mb-2">
                                        <div className="bg-gray-100 rounded-lg py-2 px-3">
                                            <div className="text-xs text-gray-500 mb-0.5">
                                                {activeField === "quantity" ? "الكمية" :
                                                    activeField === "paid_amount" ? "المبلغ المدفوع" :
                                                        activeField === "discount" ? "قيمة الخصم" :
                                                            activeField === "paymentAmount" ? "مبلغ الطبخة" :
                                                                activeField === "notes" ? "الملاحظات" :
                                                                    activeField === "width" ? "العرض" : "القيمة"}
                                            </div>
                                            <div className="text-2xl font-mono font-bold text-gray-800 text-center truncate leading-tight">
                                                {showPaymentPopup && (activeField === 'paid_amount' || activeField === 'discount')
                                                    ? (paymentFormData[activeField] || "0")
                                                    : showPaymentDialog && activeField === 'paymentAmount'
                                                        ? (paymentAmount || "0")
                                                        : (formData[activeField] || "0")
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* أزرار لوحة الأرقام */}
                                    <div className="flex-1 grid grid-rows-4 gap-1 min-h-0">
                                        <div className="grid grid-cols-3 gap-1">
                                            {["7", "8", "9"].map(key => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleNumpadPress(key)}
                                                    className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
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
                                                    className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
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
                                                    className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
                                                >
                                                    {key}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => handleNumpadPress(".")}
                                                className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
                                            >
                                                .
                                            </button>
                                            <button
                                                onClick={() => handleNumpadPress("0")}
                                                className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
                                            >
                                                0
                                            </button>
                                            <button
                                                onClick={() => handleNumpadPress("back")}
                                                className="bg-orange-100 text-orange-700 border-2 border-orange-200 rounded-lg text-xl font-bold hover:bg-orange-200 active:bg-orange-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-14"
                                            >
                                                ← حذف
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleNumpadPress("clear")}
                                        className="mt-2 w-full bg-red-100 text-red-700 border-2 border-red-200 rounded-lg py-3 text-lg font-bold hover:bg-red-200 active:bg-red-300 transition-all touch-manipulation active:scale-95"
                                    >
                                        مسح الكل
                                    </button>
                                </Card>
                            )}
                        </div>

                        {/* العمود الأوسط - العناصر الإضافية */}
                        <div className={`flex flex-col gap-3 h-full min-h-0 overflow-y-auto border-4 rounded-xl p-2 ${materialBorderClass}`}>
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

                            {/* في الوضع اليدوي - نعرض كل الخيارات مثل صفحة المبيعات */}
                            {/* معلومات الطلب المحدد */}
                            {selectedOrder && (
                                <Card className="p-4">
                                    <Label className="font-bold text-base mb-3 block">معلومات الطلب</Label>
                                    <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>الزبون: {selectedOrder.customer?.name || 'غير محدد'}</div>
                                            <div>رقم الهاتف: {selectedOrder.customer?.phone || 'غير محدد'}</div>
                                            <div>الإجمالي: {invoiceApi.formatCurrency(selectedOrder.total_amount)}</div>
                                            <div>عدد العناصر: {selectedOrder.items?.length || 0}</div>
                                            <div>الحالة: {selectedOrder.status}</div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {isSelectedMaterialPvc && (
                                <div className="flex-shrink-0 p-3 border-b-2 border-dashed border-gray-300">
                                    <div className="grid grid-cols-2 gap-3">
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
                                <div className="p-3 border-b-2 border-dashed border-gray-300">
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

                            <div className="p-3 border-b-2 border-dashed border-gray-300">
                                <Label className="font-bold text-sm mb-2 block">المسطرة</Label>
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

                            <div className="p-3 border-b-2 border-dashed border-gray-300">
                                <div className="grid grid-cols-[1fr_100px] gap-3 items-end">
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
                                            onInputFocus={() => {
                                                setNumpadMode("text");
                                                setActiveTextTarget("color_search");
                                            }}
                                            searchValue={colorSearchCode}
                                            onSearchValueChange={(v) => setColorSearchCode(v)}
                                            keepOpen={activeTextTarget === "color_search"}
                                            disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}
                                            showSelectedImage={true}
                                            options={colorOptions}
                                            placeholder={
                                                !formData.ruler_id
                                                    ? "اختر المسطرة أولاً"
                                                    : (!isSelectedMaterialBoard && !formData.width)
                                                        ? "اختر العرض أولاً"
                                                        : colorOptions.length === 0
                                                            ? "لا توجد ألوان"
                                                            : "اختر اللون"
                                            }
                                            className="w-full text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border-b-2 border-dashed border-gray-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">الكمية</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => handleFieldChange("quantity", e.target.value)}
                                                onFocus={() => { setActiveField('quantity'); setNumpadMode('quantity'); }}
                                                onClick={() => { setActiveField('quantity'); setNumpadMode('quantity'); }}
                                                className={`h-12 text-lg text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""
                                                    }`}
                                                placeholder="0"
                                            />
                                            <span className="text-base font-bold text-gray-600 whitespace-nowrap">متر</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">السماكة</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={formData.thickness}
                                                className="h-12 text-lg text-center font-bold flex-1 bg-gray-100"
                                                placeholder="0.6"
                                                step="0.1"
                                                readOnly
                                            />
                                            <span className="text-base font-bold text-gray-600 whitespace-nowrap">مم</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">رقم الطبخة</Label>
                                        <FilterSelect
                                            value={formData.batch_id ? String(formData.batch_id) : ""}
                                            onChange={(e) => handleFieldChange("batch_id", e.target.value)}
                                            onInputFocus={() => {
                                                setNumpadMode("text");
                                                setActiveTextTarget("batch_search");
                                            }}
                                            searchValue={batchSearchTerm}
                                            onSearchValueChange={(v) => setBatchSearchTerm(v)}
                                            keepOpen={activeTextTarget === "batch_search"}
                                            disabled={!isSelectedMaterialBoard && !formData.width}
                                            options={batchOptions}
                                            placeholder={
                                                (!isSelectedMaterialBoard && !formData.width)
                                                    ? "اختر العرض أولاً"
                                                    : batchOptions.length === 0
                                                        ? "لا توجد طبخات"
                                                        : "اختر الطبخة"
                                            }
                                            className="w-full text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* عرض معلومات السعر */}
                            {priceCalculation && formData.color_id && formData.quantity && (
                                <Card className="p-4 bg-green-50">
                                    <Label className="font-bold text-base mb-3 block">معلومات السعر</Label>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>سعر الوحدة:</span>
                                            <span className="font-bold flex items-center gap-2">
                                                {invoiceApi.formatCurrency(priceCalculation.unitPrice)}
                                                {showUsdPrice && priceCalculation.price_per_meter !== undefined && (
                                                    <span className="text-xs text-gray-600">
                                                        ({priceCalculation.price_per_meter} $)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>الكمية:</span>
                                            <span>{priceCalculation.quantity} م</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>الإجمالي الكامل:</span>
                                            <span>{invoiceApi.formatCurrency(priceCalculation.subtotal)}</span>
                                        </div>

                                        {priceCalculation.discount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>الخصم ({priceCalculation.discountType === 'percentage' ? `${priceCalculation.discountValue}%` : ''}):</span>
                                                <span>-{invoiceApi.formatCurrency(priceCalculation.discount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t pt-1 mt-1">
                                            <span>الإجمالي بعد الخصم:</span>
                                            <span className="font-bold text-primary-f">{invoiceApi.formatCurrency(priceCalculation.total)}</span>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* حقل الملاحظات فقط */}
                            <Card className="p-4">
                                <Label className="font-bold text-sm mb-2 block">ملاحظات</Label>
                                <Input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                                    onFocus={() => { setActiveField('notes'); setNumpadMode('text'); }}
                                    onClick={() => { setActiveField('notes'); setNumpadMode('text'); }}
                                    placeholder="ملاحظات إضافية..."
                                    className="h-12 text-base"
                                />
                            </Card>

                            <div className="mt-auto space-y-2">
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
                                        onClick={addOrUpdateItem}
                                        size="lg"
                                        className={`${editingItemId ? 'flex-1' : 'w-full'} h-14 text-lg font-bold text-white touch-manipulation active:scale-95 transition-transform ${
                                            editingItemId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
                                        }`}
                                        disabled={!formData.material_id || !formData.ruler_id || !formData.color_id || !formData.quantity}
                                    >
                                        {editingItemId ? (
                                            <>
                                                <Save className="w-5 h-5 ml-2" />
                                                تحديث العنصر
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5 ml-2" />
                                                إضافة للجدول
                                            </>
                                        )}
                                    </Button>
                                </div>
                                {(selectedOrder || formData.notes) && (
                                    <Button
                                        onClick={clearForm}
                                        variant="outline"
                                        className="h-12 w-full border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="w-5 h-5 ml-2" />
                                        مسح الكل
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* العمود الأيسر - الجدول */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            {/* قسم الزبون */}
                            <Card className="flex-shrink-0 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="font-bold text-sm">الزبون</Label>
                                    <div className="flex gap-2">
                                        {CUSTOMER_OPTIONS.map(option => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setCustomerOption(option.value)}
                                                    className={`
                                                        px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 min-h-[44px]
                                                        transition-all touch-manipulation active:scale-95
                                                        ${customerOption === option.value
                                                            ? option.value === "none"
                                                                ? "bg-secondary-s text-white"
                                                                : option.value === "existing"
                                                                    ? "bg-secondary-f text-white"
                                                                    : "bg-primary-f text-white"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        }
                                                    `}
                                                    title={option.label}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="hidden sm:inline">{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {customerOption === "existing" && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <FilterSelect
                                                    value={selectedCustomer ? String(selectedCustomer.customer_id) : ""}
                                                    onChange={(e) => {
                                                        const customer = customers.find(c => String(c.customer_id) === e.target.value);
                                                        setSelectedCustomer(customer || null);
                                                        // Use balance directly from customer API response
                                                        setCustomerBalance(customer ? Number(customer.balance || 0) : 0);
                                                    }}
                                                    options={customerOptions}
                                                    placeholder="اختر الزبون..."
                                                    className="w-full text-sm"
                                                    onInputFocus={() => {
                                                        setNumpadMode("text");
                                                        setActiveTextTarget("customer_search");
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {selectedCustomer && (
                                            <div className="bg-blue-50 p-2 rounded-lg text-xs">
                                                <div className="font-bold">{selectedCustomer.name}</div>
                                                <div className="text-gray-600"><span dir="ltr">{selectedCustomer.phone}</span> - {selectedCustomer.city || "لا يوجد مدينة"}</div>
                                                <div className="mt-1 pt-1 border-t border-blue-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-blue-700">الذمة المتبقية:</span>
                                                        <span className={`font-bold ${customerBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {invoiceApi.formatCurrency(customerBalance)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {customerOption === "new" && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="text"
                                                placeholder="الاسم *"
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="رقم الهاتف *"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="المدينة"
                                                value={newCustomer.city}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="العنوان"
                                                value={newCustomer.address}
                                                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                className="h-10 text-sm"
                                            />
                                            <div className="col-span-2">
                                                <Input
                                                    type="text"
                                                    placeholder="ملاحظات (اختياري)"
                                                    value={newCustomer.notes}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                                                    className="h-10 text-sm w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* معاينة الرقم المنسق */}
                                        {newCustomer.phone && (
                                            <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                                                <span className="font-bold">الرقم بعد التنسيق:</span> <span dir="ltr">{formatPhoneNumber(newCustomer.phone)}</span>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleCreateCustomer}
                                            disabled={!newCustomer.name || !newCustomer.phone || loadingCustomers}
                                            className="w-full h-9 bg-green-600 hover:bg-green-700 text-white text-sm"
                                        >
                                            {loadingCustomers ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4 ml-1" />
                                                    إنشاء الزبون
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {customerOption === "none" && (
                                    <div className="bg-gray-50 p-2 rounded-lg text-center text-gray-500 text-sm">
                                        <UserX className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                        الطلب بدون زبون
                                    </div>
                                )}
                            </Card>

                            {/* نافذة المعاينة */}
                            {showPreview && (
                                <StyledDialog
                                    isOpen={showPreview}
                                    onOpenChange={setShowPreview}
                                    title={editingInvoiceId ? "تحديث الفاتورة" : "إنشاء فاتورة جديدة"}
                                    onCancel={() => setShowPreview(false)}
                                    onConfirm={saveInvoice}
                                    confirmLabel={editingInvoiceId ? "تحديث" : "إنشاء"}
                                    cancelLabel="إلغاء"
                                    confirmVariant="default"
                                    isLoading={invoicesLoading}
                                >
                                    <div className="space-y-3">
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

                                    {/* معلومات الفاتورة */}
                                    <div className="bg-purple-50 p-2 rounded-lg">
                                        <div className="text-xs text-purple-600 font-bold">معلومات الفاتورة:</div>
                                        <div className="space-y-1 text-sm">
                                            <div>
                                                {selectedOrder ? (
                                                    <>طلب مرتبط</>
                                                ) : (
                                                    <>فاتورة يدوية</>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-1">
                                                <div className="flex justify-between">
                                                    <span>الإجمالي:</span>
                                                    <span className="font-bold">{invoiceApi.formatCurrency(invoiceTotalsSummary.totalBeforeDiscount)}</span>
                                                </div>
                                                {invoiceTotalsSummary.discountAmount > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>الخصم:</span>
                                                        <span className="font-bold">-{invoiceApi.formatCurrency(invoiceTotalsSummary.discountAmount)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between border-t pt-1">
                                                    <span>الإجمالي بعد الخصم:</span>
                                                    <span className="font-bold">{invoiceApi.formatCurrency(invoiceTotalsSummary.totalAfterDiscount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* جدول ملخص العناصر */}
                                    {orderItems.length > 0 && !selectedOrder && (
                                        <div className="bg-white p-2 rounded-lg border border-purple-100">
                                            <div className="text-xs text-purple-600 font-bold mb-1">عناصر الفاتورة:</div>
                                            <div className="max-h-48 overflow-auto border rounded">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="p-1 text-right">المادة</th>
                                                            <th className="p-1 text-right">اللون</th>
                                                            <th className="p-1 text-center">العرض</th>
                                                            <th className="p-1 text-center">الكمية</th>
                                                            <th className="p-1 text-center">سعر الوحدة</th>
                                                            <th className="p-1 text-center">الإجمالي بعد الخصم</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderItems.map(it => (
                                                            <tr key={it.id} className="border-t">
                                                                <td className="p-1">{it.material_name}</td>
                                                                <td className="p-1">
                                                                    <div>{it.color_name}</div>
                                                                    <div className="text-[10px] text-gray-500">{it.color_code}</div>
                                                                </td>
                                                                <td className="p-1 text-center">{it.width || "-"}</td>
                                                                <td className="p-1 text-center">{it.quantity} م</td>
                                                                <td className="p-1 text-center">
                                                                    <span className="flex flex-col items-center gap-0.5">
                                                                        <span>{invoiceApi.formatCurrency(it.unit_price || 0)}</span>
                                                                        {showUsdPrice && it.price_per_meter != null && (
                                                                            <span className="text-[10px] text-gray-600">
                                                                                ({it.price_per_meter} $)
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="p-1 text-center font-bold">
                                                                    {invoiceApi.formatCurrency(it.subtotal || 0)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                        {/* معلومات الدفع */}
                                        <div className="bg-green-50 p-2 rounded-lg">
                                            <div className="text-xs text-green-600 font-bold">معلومات الدفع:</div>
                                            <div className="text-sm space-y-1">
                                                <div className="grid grid-cols-1 gap-1">
                                                    <div>
                                                        الإجمالي قبل الخصم:{" "}
                                                        <span className="font-bold">
                                                            {invoiceApi.formatCurrency(invoiceTotalsSummary.totalBeforeDiscount)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        قيمة الخصم:{" "}
                                                        <span className="font-bold text-red-600">
                                                            {invoiceApi.formatCurrency(invoiceTotalsSummary.discountAmount)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        الإجمالي بعد الخصم:{" "}
                                                        <span className="font-bold text-primary-f">
                                                            {invoiceApi.formatCurrency(invoiceTotalsSummary.totalAfterDiscount)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pt-1 border-t mt-1">
                                                    المدفوع:{" "}
                                                    <span className="font-bold">
                                                        {invoiceApi.formatCurrency(formData.paid_amount || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ملاحظات */}
                                        {formData.notes && (
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <div className="text-xs text-gray-500">ملاحظات:</div>
                                                <div className="text-sm">{formData.notes}</div>
                                            </div>
                                        )}
                                    </div>
                                </StyledDialog>
                            )}
                            
                            {/* بوب أب معلومات الدفع عند إنشاء الفاتورة */}
                            {showPaymentPopup && (
                                <StyledDialog
                                    isOpen={showPaymentPopup}
                                    onOpenChange={setShowPaymentPopup}
                                    title={editingInvoiceId ? "تحديث الفاتورة - معلومات الدفع" : "إنشاء فاتورة جديدة - معلومات الدفع"}
                                    onCancel={() => {
                                        setShowPaymentPopup(false);
                                        setPaymentFormData({
                                            paid_amount: "",
                                            discount: "0",
                                            discount_type: "fixed",
                                            total_after: ""
                                        });
                                    }}
                                    onConfirm={() => {
                                        // حساب الخصم من المبلغ الكامل والإجمالي بعد الخصم (لعرض خاص)
                                        const grossTotal = parseFloat(
                                            selectedOrder?.total_amount ||
                                            orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
                                        ) || 0;
                                        const totalAfterInput = parseFloat(paymentFormData.total_after || "0");
                                        let totalAfter = !isNaN(totalAfterInput) && totalAfterInput > 0 ? totalAfterInput : grossTotal;
                                        if (totalAfter > grossTotal) totalAfter = grossTotal;
                                        if (totalAfter < 0) totalAfter = 0;
                                        const discountValue = Math.max(grossTotal - totalAfter, 0);

                                        // نسخ بيانات الدفع إلى formData ثم فتح المعاينة
                                        setFormData(prev => ({
                                            ...prev,
                                            paid_amount: paymentFormData.paid_amount,
                                            discount: String(discountValue),
                                            discount_type: "fixed"
                                        }));
                                        // Use balance directly from customer object for manual invoices
                                        if (selectedCustomer && !selectedOrder) {
                                            setCustomerBalance(Number(selectedCustomer.balance || 0));
                                        }
                                        setShowPreview(true);
                                        setShowPaymentPopup(false);
                                    }}
                                    confirmLabel="متابعة"
                                    cancelLabel="إلغاء"
                                    confirmVariant="default"
                                    isLoading={invoicesLoading}
                                    disabled={!paymentFormData.paid_amount}
                                >
                                    <div className="space-y-4">
                                        {/* معلومات الفاتورة */}
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="text-sm font-bold mb-2 text-blue-700">معلومات الفاتورة</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {selectedOrder ? (
                                                    <>
                                                        <div>الزبون: {selectedOrder.customer?.name || 'غير محدد'}</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>نوع الفاتورة: يدوية</div>
                                                        <div>الزبون: {selectedCustomer?.name || 'غير محدد'}</div>
                                                    </>
                                                )}
                                                <div className="col-span-2 font-bold text-base">
                                                    المبلغ الكامل: {invoiceApi.formatCurrency(selectedOrder?.total_amount || orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0))}
                                                </div>
                                                {selectedCustomer && (
                                                    <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-blue-700 font-medium">الذمة المتبقية:</span>
                                                            <span className={`font-bold ${customerBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {invoiceApi.formatCurrency(customerBalance)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* المبلغ المدفوع والخصم */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">
                                                    المبلغ المدفوع
                                                    {/* <span className="text-xs text-gray-500 font-normal mr-1">(hint)</span> */}
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={paymentFormData.paid_amount}
                                                        onChange={(e) => setPaymentFormData(prev => ({ ...prev, paid_amount: convertArabicToEnglishNumbers(e.target.value) }))}
                                                        onFocus={() => { setActiveField('paid_amount'); setNumpadMode('paid'); }}
                                                        onClick={() => { setActiveField('paid_amount'); setNumpadMode('paid'); }}
                                                        placeholder="0.00"
                                                        className="h-12 text-lg text-center font-bold flex-1"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                    <span className="text-lg font-bold text-gray-600 whitespace-nowrap">ل.س</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    المبلغ الكامل: {invoiceApi.formatCurrency(selectedOrder?.total_amount || orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0))}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">قيمة الخصم</Label>
                                                <Input
                                                    type="number"
                                                    value={paymentFormData.discount}
                                                    onChange={(e) => {
                                                        const raw = convertArabicToEnglishNumbers(e.target.value);
                                                        setPaymentFormData(prev => {
                                                            const gross = parseFloat(
                                                                selectedOrder?.total_amount ||
                                                                orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
                                                            ) || 0;
                                                            let discountVal = parseFloat(raw || "0");
                                                            if (isNaN(discountVal) || discountVal < 0) discountVal = 0;
                                                            if (discountVal > gross) discountVal = gross;
                                                            const totalAfter = Math.max(gross - discountVal, 0);
                                                            return {
                                                                ...prev,
                                                                discount: String(discountVal),
                                                                total_after: String(totalAfter)
                                                            };
                                                        });
                                                    }}
                                                    onFocus={() => { setActiveField('discount'); setNumpadMode('paid'); }}
                                                    onClick={() => { setActiveField('discount'); setNumpadMode('paid'); }}
                                                    placeholder="0"
                                                    className="h-12 text-lg text-center font-bold"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>

                                        {/* تعديل المبلغ بعد الخصم (عرض خاص) */}
                                        {/* <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">الإجمالي بعد الخصم (عرض خاص)</Label>
                                                <Input
                                                    type="number"
                                                    value={paymentFormData.total_after}
                                                    onChange={(e) => {
                                                        const raw = convertArabicToEnglishNumbers(e.target.value);
                                                        setPaymentFormData(prev => {
                                                            const gross = parseFloat(
                                                                selectedOrder?.total_amount ||
                                                                orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
                                                            ) || 0;
                                                            let totalAfter = parseFloat(raw || "0");
                                                            if (isNaN(totalAfter) || totalAfter < 0) totalAfter = 0;
                                                            if (totalAfter > gross) totalAfter = gross;
                                                            const discountVal = Math.max(gross - totalAfter, 0);
                                                            return {
                                                                ...prev,
                                                                total_after: String(totalAfter),
                                                                discount: String(discountVal)
                                                            };
                                                        });
                                                    }}
                                                    placeholder="0.00"
                                                    className="h-12 text-lg text-center font-bold"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <div className="text-xs text-gray-500 mt-1">
                                                    في حال تركه فارغاً سيتم استخدام السعر القياسي بعد الخصم.
                                                </div>
                                            </div>
                                        </div> */}

                                        {/* لوحة الأرقام في نافذة الدفع */}
                                        <div className="bg-gray-100 rounded-lg p-2 space-y-2">
                                            <div className="bg-white rounded-lg py-2 px-3">
                                                <div className="text-xs text-gray-500 mb-0.5">
                                                    {activeField === 'paid_amount' ? "المبلغ المدفوع" : activeField === 'discount' ? "قيمة الخصم" : "القيمة"}
                                                </div>
                                                <div className="text-2xl font-mono font-bold text-gray-800 text-center">
                                                    {paymentFormData[activeField] || "0"}
                                                </div>
                                            </div>

                                            <div className="grid grid-rows-4 gap-1">
                                                <div className="grid grid-cols-3 gap-1">
                                                    {["7", "8", "9"].map(key => (
                                                        <button
                                                            key={key}
                                                            onClick={() => handleNumpadPress(key)}
                                                            className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
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
                                                            className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
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
                                                            className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                        >
                                                            {key}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <button
                                                        onClick={() => handleNumpadPress(".")}
                                                        className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                    >
                                                        .
                                                    </button>
                                                    <button
                                                        onClick={() => handleNumpadPress("0")}
                                                        className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                    >
                                                        0
                                                    </button>
                                                    <button
                                                        onClick={() => handleNumpadPress("back")}
                                                        className="bg-orange-100 text-orange-700 border border-orange-200 rounded text-sm font-bold hover:bg-orange-200 active:bg-orange-300 transition-all active:scale-95 h-10"
                                                    >
                                                        ← حذف
                                                    </button>
                                                </div>
                                            </div>

                                           

                                            <button
                                                onClick={() => handleNumpadPress("clear")}
                                                className="w-full bg-red-100 text-red-700 border border-red-200 rounded py-2 text-sm font-bold hover:bg-red-200 transition-all"
                                            >
                                                مسح الكل
                                            </button>
                                        </div>

                                      
                                    </div>
                                </StyledDialog>
                            )}

                            <Card className="flex flex-col h-full min-h-0 overflow-hidden">
                                {/* رأس الجدول مع أزرار التحكم */}
                                <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">العناصر: {orderItems.length}</span>
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
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => scrollTable('left')}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg touch-manipulation active:scale-95 transition-transform"
                                                        title="التمرير لليمين"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
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
                                    className="flex-1 overflow-auto min-h-0"
                                    style={{ direction: 'rtl' }}
                                >
                                    <table className="min-w-[750px] w-full table-fixed border-collapse">
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
                                                <th className="p-1 text-center border-b w-[80px]">سعر الوحدة</th>
                                                <th className="p-1 text-center border-b w-[80px]">الإجمالي</th>
                                                <th className="p-1 text-center border-b w-[80px]">الخصم</th>
                                                <th className="p-1 text-center border-b w-[190px]">بعد الخصم</th>
                                                <th className="p-1 text-center border-b w-[80px]">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map(item => (
                                                (() => {
                                                    const subtotalBefore = parseFloat(item.subtotal_before_discount ?? item.subtotal ?? 0) || 0;
                                                    const discountAmount = parseFloat(item.discount_amount ?? 0) || 0;
                                                    const afterDiscount = parseFloat(item.subtotal ?? 0) || 0;
                                                    return (
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
                                                        {item.thickness || "0.6"} مم
                                                    </td>
                                                    <td className="p-1 text-center text-sm" title={item.batch_number}>
                                                        {item.batch_number || "-"}
                                                    </td>
                                                    <td className="p-1 text-center text-sm">
                                                        <span className="flex flex-col items-center gap-0.5">
                                                            <span>{invoiceApi.formatCurrency(item.unit_price || 0)}</span>
                                                            {showUsdPrice && item.price_per_meter != null && (
                                                                <span className="text-[10px] text-gray-600">
                                                                    ({item.price_per_meter} $)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="p-1 text-center text-sm font-bold text-primary-f">
                                                        {invoiceApi.formatCurrency(subtotalBefore)}
                                                    </td>
                                                    <td className="p-1 text-center text-sm font-bold text-red-600">
                                                        {discountAmount > 0 ? `-${invoiceApi.formatCurrency(discountAmount)}` : "-"}
                                                    </td>
                                                    <td className="p-1 text-center text-sm font-bold text-primary-f">
                                                        {editingItemId === item.id ? (
                                                            <div className="flex items-center gap-2 w-48">
                                                                <Input
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    value={String(afterDiscount)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        const next = parseFloat(e.target.value || "0") || 0;
                                                                        setOrderItems(prev => prev.map(it => {
                                                                            if (it.id !== item.id) return it;
                                                                            const before = parseFloat(it.subtotal_before_discount ?? it.subtotal ?? 0) || 0;
                                                                            const discount = Math.max(0, before - next);
                                                                            return {
                                                                                ...it,
                                                                                subtotal: next,
                                                                                discount_amount: discount
                                                                            };
                                                                        }));
                                                                    }}
                                                                    className="h-12 w-48 text-center font-bold text-lg"
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingItemId(null);
                                                                        toast.success("تم حفظ السعر بنجاح");
                                                                    }}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            invoiceApi.formatCurrency(afterDiscount)
                                                        )}
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
                                                    );
                                                })()
                                            ))}
                                            {orderItems.length === 0 && (
                                                <tr>
                                                    <td colSpan="13" className="p-8 text-center text-primary-f">
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
                                    <Button
                                                onClick={() => {
                                                    const totalToPay = invoiceTotalsSummary.totalAfterDiscount || invoiceTotalsSummary.totalBeforeDiscount || 0;
                                                    setPaymentFormData(prev => ({
                                                        ...prev,
                                                        paid_amount: totalToPay ? String(totalToPay) : "",
                                                    }));
                                                    setShowPaymentPopup(true);
                                                }}
                                        size="lg"
                                        className={`h-12 text-base px-6 text-white touch-manipulation active:scale-95 transition-transform ${
                                            editingInvoiceId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
                                        }`}
                                        disabled={orderItems.length === 0}
                                    >
                                        {editingInvoiceId ? (
                                            <>
                                                <Save className="w-4 h-4 ml-2" />
                                                تحديث الفاتورة
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 ml-2" />
                                                إنشاء فاتورة
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
                            <h2 className="font-bold text-lg">سجل الفواتير</h2>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="بحث..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 w-48 text-sm"
                                />
                                <Button
                                    size="sm"
                                    onClick={() => loadInvoices()}
                                    className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white"
                                    disabled={invoicesLoading}
                                >
                                    {invoicesLoading ? (
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
                                        handleExportInvoices();
                                    }}
                                    disabled={exportingInvoices || filteredInvoices.length === 0}
                                >
                                    <Download className="w-4 h-4 ml-1" />
                                    {exportingInvoices ? "جارٍ التصدير..." : "تصدير Excel"}
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
                        </div>

                        {/* جدول الفواتير */}
                        <div className="flex-1 overflow-auto min-h-0 border rounded-lg bg-white">
                            <table className="min-w-[1400px] w-full table-fixed border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-20">
                                    <tr>
                                        <th className="p-2 text-right border-b w-20">#</th>
                                        <th className="p-2 text-right border-b w-32">التاريخ</th>
                                        <th className="p-2 text-right border-b w-32">المنشئ</th>
                                        <th className="p-2 text-right border-b w-40">الزبون</th>
                                        <th className="p-2 text-center border-b w-28">الإجمالي</th>
                                        <th className="p-2 text-center border-b w-28">الخصم</th>
                                        <th className="p-2 text-center border-b w-36">الإجمالي بعد الخصم</th>
                                        <th className="p-2 text-center border-b w-28">المدفوع</th>
                                        <th className="p-2 text-center border-b w-28">المتبقي</th>
                                        <th className="p-2 text-center border-b w-28">الحالة</th>
                                        <th className="p-2 text-center border-b w-32">ملاحظات</th>
                                        <th className="p-2 text-center border-b w-40">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoicesLoading ? (
                                        <tr>
                                            <td colSpan="12" className="p-8">
                                                <LoadingState />
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد فواتير
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map(invoice => {
                                            const totalNet = parseFloat(invoice.total_amount) || 0; // after discount (as stored by backend)
                                            const discount = parseFloat(invoice.discount) || 0;
                                            const totalGross = Math.max(totalNet + discount, 0); // before discount
                                            const totalAfterDiscount = totalNet;
                                            const paid = parseFloat(invoice.paid_amount);
                                            const remaining = parseFloat(invoice.remaining_amount);
                                            const progress = (paid / (totalNet || 1)) * 100;

                                            return (
                                                <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 font-medium text-sm">#{invoice.invoice_id}</td>
                                                    <td className="p-2 text-sm">{invoiceApi.getFormattedDate(invoice.issued_at)}</td>
                                                    <td className="p-2 text-sm">{invoice.user?.full_name || '-'}</td>
                                                    <td className="p-2 text-sm">
                                                        <CustomerInfo customer={invoice.customer} compact />
                                                    </td>
                                                    <td className="p-2 text-center font-bold text-primary-f text-sm">
                                                        {invoiceApi.formatCurrency(totalGross)}
                                                    </td>
                                                    <td className="p-2 text-center text-red-600 font-bold text-sm">
                                                        {discount > 0 ? `-${invoiceApi.formatCurrency(discount)}` : invoiceApi.formatCurrency(0)}
                                                    </td>
                                                    <td className="p-2 text-center font-bold text-primary-f text-sm">
                                                        {invoiceApi.formatCurrency(totalAfterDiscount)}
                                                    </td>
                                                    <td className="p-2 text-center text-green-600 font-bold text-sm">
                                                        {invoiceApi.formatCurrency(paid)}
                                                    </td>
                                                    <td className="p-2 text-center text-red-600 font-bold text-sm">
                                                        {invoiceApi.formatCurrency(remaining)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <PaymentStatusBadge total={totalNet} paid={paid} />
                                                            <ProgressBar value={paid} max={totalNet} />
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center max-w-[150px] truncate text-sm" title={invoice.notes}>
                                                        {invoice.notes || '-'}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => setSelectedInvoice(invoice)}
                                                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"
                                                                title="عرض التفاصيل"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInvoiceForPayment(invoice);
                                                                    setPaymentAmount("");
                                                                    setShowPaymentDialog(true);
                                                                }}
                                                                className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"
                                                                title="إضافة طبخة"
                                                                disabled={remaining <= 0}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setInvoiceToDelete(invoice);
                                                                    setShowDeleteDialog(true);
                                                                }}
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

                        {/* معلومات التصفح */}
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                            <div>إجمالي الفواتير: {filteredInvoices.length}</div>
                            {filteredInvoices.length > 0 && (
                                <div>
                                    إجمالي المبيعات: {invoiceApi.formatCurrency(
                                        filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0)
                                    )}
                                </div>
                            )}
                        </div>

                        {/* نافذة إضافة طبخة */}
                        {selectedInvoiceForPayment && (
                            <StyledDialog
                                isOpen={showPaymentDialog}
                                onOpenChange={setShowPaymentDialog}
                                title="إضافة طبخة جديدة"
                                onCancel={() => {
                                    setShowPaymentDialog(false);
                                    setSelectedInvoiceForPayment(null);
                                    setPaymentAmount("");
                                }}
                                onConfirm={handleAddPayment}
                                confirmLabel="إضافة"
                                cancelLabel="إلغاء"
                                isLoading={invoicesLoading}
                            >
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-2">معلومات الفاتورة</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>رقم الفاتورة: #{selectedInvoiceForPayment.invoice_id}</div>
                                            <div>الزبون: {selectedInvoiceForPayment.customer?.name}</div>
                                            <div>الإجمالي: {invoiceApi.formatCurrency(selectedInvoiceForPayment.total_amount)}</div>
                                            <div>المدفوع: {invoiceApi.formatCurrency(selectedInvoiceForPayment.paid_amount)}</div>
                                            <div>المتبقي: {invoiceApi.formatCurrency(selectedInvoiceForPayment.remaining_amount)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">مبلغ الطبخة</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                onFocus={() => { setActiveField('paymentAmount'); setNumpadMode('paid'); }}
                                                onClick={() => { setActiveField('paymentAmount'); setNumpadMode('paid'); }}
                                                placeholder="أدخل المبلغ..."
                                                className="h-10 text-sm flex-1"
                                                step="0.01"
                                                min="0"
                                                max={selectedInvoiceForPayment.remaining_amount}
                                            />
                                            <span className="text-sm font-bold text-gray-600">ل.س</span>
                                        </div>
                                    </div>

                                    {/* لوحة الأرقام لنافذة الطبخة */}
                                    <div className="bg-gray-100 rounded-lg p-2 space-y-2">
                                        <div className="bg-white rounded-lg py-2 px-3">
                                            <div className="text-xs text-gray-500 mb-0.5">مبلغ الطبخة</div>
                                            <div className="text-2xl font-mono font-bold text-gray-800 text-center">
                                                {paymentAmount || "0"}
                                            </div>
                                        </div>

                                        <div className="grid grid-rows-4 gap-1">
                                            <div className="grid grid-cols-3 gap-1">
                                                {["7", "8", "9"].map(key => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleNumpadPress(key)}
                                                        className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
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
                                                        className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
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
                                                        className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                    >
                                                        {key}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-3 gap-1">
                                                <button
                                                    onClick={() => handleNumpadPress(".")}
                                                    className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                >
                                                    .
                                                </button>
                                                <button
                                                    onClick={() => handleNumpadPress("0")}
                                                    className="bg-white border border-gray-300 rounded text-xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all active:scale-95 h-10 text-base"
                                                >
                                                    0
                                                </button>
                                                <button
                                                    onClick={() => handleNumpadPress("back")}
                                                    className="bg-orange-100 text-orange-700 border border-orange-200 rounded text-sm font-bold hover:bg-orange-200 active:bg-orange-300 transition-all active:scale-95 h-10"
                                                >
                                                    ← حذف
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleNumpadPress("clear")}
                                            className="w-full bg-red-100 text-red-700 border border-red-200 rounded py-2 text-sm font-bold hover:bg-red-200 transition-all"
                                        >
                                            مسح الكل
                                        </button>
                                    </div>

                                    {paymentAmount && (
                                        <div className="bg-green-50 p-2 rounded-lg text-sm">
                                            المتبقي بعد الدفع: {invoiceApi.formatCurrency(
                                                parseFloat(selectedInvoiceForPayment.remaining_amount) - parseFloat(paymentAmount)
                                            )}
                                        </div>
                                    )}
                                </div>
                            </StyledDialog>
                        )}

                        {/* نافذة تفاصيل الفاتورة */}
                        {selectedInvoice && (
                            <StyledDialog
                                isOpen={Boolean(selectedInvoice)}
                                onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}
                                title={`تفاصيل الفاتورة #${selectedInvoice.invoice_id}`}
                                onCancel={() => setSelectedInvoice(null)}
                                cancelLabel="إغلاق"
                                showFooter={false}
                            >
                                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                                    {/* معلومات رأس الفاتورة */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
                                            <div className="font-bold text-sm">{invoiceApi.getFormattedDate(selectedInvoice.issued_at)}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">المنشئ</div>
                                            <div className="font-bold text-sm">{selectedInvoice.user?.full_name || '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">الزبون</div>
                                            <div className="font-bold text-sm">{selectedInvoice.customer?.name}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">رقم الهاتف</div>
                                            <div className="font-bold text-sm" dir="ltr">{selectedInvoice.customer?.phone}</div>
                                        </div>
                                        {selectedInvoice.customer?.city && (
                                            <div className="bg-gray-50 p-2 rounded-lg">
                                                <div className="text-xs text-gray-500">المدينة</div>
                                                <div className="font-bold text-sm">{selectedInvoice.customer.city}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* معلومات الدفع */}
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-2">معلومات الدفع</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(() => {
                                                const net = parseFloat(selectedInvoice.total_amount) || 0; // stored after discount
                                                const discount = parseFloat(selectedInvoice.discount) || 0;
                                                const gross = Math.max(net + discount, 0);
                                                return (
                                                    <>
                                                        <div>الإجمالي قبل الخصم: {invoiceApi.formatCurrency(gross)}</div>
                                                        <div>قيمة الخصم: -{invoiceApi.formatCurrency(discount)}</div>
                                                        <div className="col-span-2 font-bold">
                                                            الإجمالي بعد الخصم: {invoiceApi.formatCurrency(net)}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            <div>المدفوع: {invoiceApi.formatCurrency(selectedInvoice.paid_amount)}</div>
                                            <div>المتبقي: {invoiceApi.formatCurrency(selectedInvoice.remaining_amount)}</div>
                                            <div>
                                                الحالة:
                                                <span className="mr-1">
                                                    <PaymentStatusBadge
                                                        total={selectedInvoice.total_amount}
                                                        paid={selectedInvoice.paid_amount}
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                        <ProgressBar
                                            value={selectedInvoice.paid_amount}
                                            max={selectedInvoice.total_amount}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* عناصر الفاتورة */}
                                    {selectedInvoice.invoiceItems?.length > 0 && (
                                        <div>
                                            <div className="text-sm font-bold mb-2">عناصر الفاتورة</div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="p-2 text-right">اللون</th>
                                                            <th className="p-2 text-center">النوع</th>
                                                            <th className="p-2 text-center">العرض</th>
                                                            <th className="p-2 text-center">الكمية</th>
                                                            <th className="p-2 text-center">سعر الوحدة</th>
                                                            <th className="p-2 text-center">الإجمالي</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedInvoice.invoiceItems.map(item => (
                                                            <tr key={item.invoice_item_id} className="border-t">
                                                                <td className="p-2">
                                                                    <div>{item.color?.color_name}</div>
                                                                    <div className="text-xs text-gray-500">{item.color?.color_code}</div>
                                                                </td>
                                                                <td className="p-2 text-center">{formatTypeItem(item.type_item)}</td>
                                                                <td className="p-2 text-center">{item.width || "-"}</td>
                                                                <td className="p-2 text-center">{item.quantity} م</td>
                                                                <td className="p-2 text-center">{invoiceApi.formatCurrency(item.unit_price)}</td>
                                                                <td className="p-2 text-center font-bold">{invoiceApi.formatCurrency(item.subtotal)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* ملاحظات */}
                                    {selectedInvoice.notes && (
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">ملاحظات</div>
                                            <div className="text-sm">{selectedInvoice.notes}</div>
                                        </div>
                                    )}
                                </div>
                            </StyledDialog>
                        )}

                        {showDeleteDialog && invoiceToDelete && (
                            <StyledDialog
                                isOpen={showDeleteDialog}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setShowDeleteDialog(false);
                                        setInvoiceToDelete(null);
                                    }
                                }}
                                title="حذف الفاتورة"
                                onCancel={() => {
                                    setShowDeleteDialog(false);
                                    setInvoiceToDelete(null);
                                }}
                                onConfirm={handleDeleteInvoice}
                                confirmLabel="حذف"
                                cancelLabel="إلغاء"
                                confirmVariant="destructive"
                                isLoading={deletingInvoice}
                            >
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">
                                        هل أنت متأكد من حذف الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        رقم الفاتورة: #{invoiceToDelete.invoice_id}
                                    </div>
                                </div>
                            </StyledDialog>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}

// خيارات النوع
const TYPE_OPTIONS = [
    { value: TypeItem.Machine, label: "مكنة" },
    { value: TypeItem.Presser, label: "كوي" }
];

// خيارات الزبون
const CUSTOMER_OPTIONS = [
    { value: "none", label: "بدون زبون", icon: UserX },
    { value: "existing", label: "زبون موجود", icon: User },
    { value: "new", label: "زبون جديد", icon: UserPlus }
];
