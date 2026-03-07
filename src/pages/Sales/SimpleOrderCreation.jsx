// src/pages/Sales/SimpleOrderCreation.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
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
    Users,
    EyeOff,
    Home,
    X,
    AlertCircle,
    Edit,
    Save,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    User,
    UserX,
    FileText
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, OrderStatus, CustomerType, PriceColorBy } from "../../types/enums";

export default function SimpleOrderCreation() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("create");
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
    const [customers, setCustomers] = useState([]);
    const [loadingWidths, setLoadingWidths] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

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
        type_item: TypeItem.Machine,
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

    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Numpad
    const [numpadMode, setNumpadMode] = useState("quantity");
    const [activeTextTarget, setActiveTextTarget] = useState(null); // color_search | batch_search | customer_search
    const [colorSearchCode, setColorSearchCode] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [activeField, setActiveField] = useState("quantity");

    const [qrPreview, setQrPreview] = useState({ open: false, url: "", title: "" });
    const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

    // QR Generation Dialog State with quantity editing
    const [qrGenDialog, setQrGenDialog] = useState({
        open: false,
        item: null,
        quantity: "",
        qrUrl: "",
        qrData: ""
    });

    // Helper functions from orderApi
    const getOrderStatus = (order) => orderApi.getOrderStatus(order);
    const getFormattedDate = (order) => orderApi.getFormattedDate(order);
    const formatCurrency = (amount) => orderApi.formatCurrency(amount);
    const getStatusBadge = (status) => orderApi.getStatusBadge(status);
    const getSalesUserName = (order) => orderApi.getSalesUserName(order);
    const getCustomerName = (order) => orderApi.getCustomerName(order);
    const getCustomerPhone = (order) => orderApi.getCustomerPhone(order);
    const getCustomerCity = (order) => orderApi.getCustomerCity(order);
    const getCustomerAddress = (order) => orderApi.getCustomerAddress(order);
    const formatCustomerInfo = (order) => orderApi.formatCustomerInfo(order);
    const calculateOrderTotal = (items) => orderApi.calculateOrderTotal(items);

    const TYPE_OPTIONS = [
        { value: TypeItem.Machine, label: "مكنة" },
        { value: TypeItem.Presser, label: "كوي" }
    ];

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
        if (!orderDetails?.order_id) return;
        try {
            setUpdatingOrderStatus(true);
            await orderApi.updateOrderStatus(orderDetails.order_id, nextStatus);
            setOrderDetails((prev) => (prev ? { ...prev, status: nextStatus } : prev));
            setOrders((prev) => prev.map((o) => (o.order_id === orderDetails.order_id ? { ...o, status: nextStatus } : o)));
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
        switch(status) {
            case OrderStatus.pending:
                return "معلق";
            case OrderStatus.preparing:
                return "قيد التحضير";
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
        if (qrPreview.open) {
            setQrPreview((prev) => ({ ...prev, open: false }));
        }
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
            setLoading(true);
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
            // console.error("Error loading data:", error);
            toast.error("فشل في تحميل البيانات");
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
            setFormData(prev => ({ ...prev, width: "" }));
        } catch (error) {
            // console.error("Error loading widths:", error);
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
        } catch (error) {
            // console.error("Error loading orders:", error);
            toast.error("فشل في تحميل الطلبات");
        } finally {
            setOrdersLoading(false);
        }
    };

    const getQrUrl = (data) => {
        const encoded = encodeURIComponent(String(data || ""));
        return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
    };

    const buildItemQrData = (item) => {
        const payload = {
            kind: "order_item",
            local_item_id: item?.id ?? null,
            material: item?.material_name ?? item?.material_name ?? "",
            ruler: item?.ruler_name ?? item?.ruler_type ?? item?.rulerType ?? item?.ruler?.ruler_name ?? item?.ruler?.ruler_type ?? "",
            color: item?.color_name ?? item?.color_name ?? "",
            color_code: item?.color_code ?? item?.color_code ?? "",
            width: item?.width ?? "",
            thickness: item?.thickness ?? "0.6",
            quantity: item?.quantity ?? "",
            batch: item?.batch_number ?? "",
        };
        return JSON.stringify(payload);
    };

    const openQrPreview = (url, title = "") => {
        setQrPreview({ open: true, url, title });
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

    const closeQrGenDialog = () => {
        setQrGenDialog({
            open: false,
            item: null,
            quantity: "",
            qrUrl: "",
            qrData: ""
        });
    };

    const printQr = (url, title = "QR") => {
        const w = window.open("", "_blank", "width=600,height=700");
        if (!w) return;
        w.document.write(`<!doctype html><html><head><title>${title}</title></head><body style="display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:sans-serif;gap:12px;">
          <h3 style="margin:0;">${title}</h3>
          <img src="${url}" style="width:320px;height:320px;image-rendering:pixelated;" />
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
                    pc.type_item === formData.type_item
                )
            );
        }

        if (!formData.width) return [];
        const targetWidth = Number(formData.width);

        return filteredColors.filter(color => {
            return priceColors.some(pc =>
                String(pc.color_id) === String(color.color_id) &&
                pc.type_item === formData.type_item &&
                (pc.price_color_By === PriceColorBy.isByMeter22 && targetWidth === 22 ||
                 pc.price_color_By === PriceColorBy.isByMeter44 && targetWidth === 44 ||
                 pc.price_color_By === PriceColorBy.isByMeter66 && targetWidth === 66 ||
                 pc.price_color_By === PriceColorBy.isByBlanck)
            );
        });
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

    const isColorPriced = useMemo(() => {
        if (!formData.color_id || !formData.ruler_id) return false;

        if (!priceColors || priceColors.length === 0) {
            return true;
        }

        if (isSelectedMaterialBoard) {
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
            (pc.price_color_By === PriceColorBy.isByMeter22 && targetWidth === 22 ||
             pc.price_color_By === PriceColorBy.isByMeter44 && targetWidth === 44 ||
             pc.price_color_By === PriceColorBy.isByMeter66 && targetWidth === 66 ||
             pc.price_color_By === PriceColorBy.isByBlanck)
        );
    }, [formData.color_id, formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, priceColors]);

    const getColorPricingStatus = (colorId) => {
        if (!priceColors || priceColors.length === 0) return { priced: true, label: "" };

        if (isSelectedMaterialBoard) {
            const isPriced = priceColors.some(pc =>
                String(pc.color_id) === String(colorId) &&
                pc.type_item === formData.type_item
            );
            return { priced: isPriced, label: isPriced ? "" : " (غير مسعر)" };
        }

        if (!formData.width) return { priced: false, label: " (اختر العرض)" };

        const targetWidth = Number(formData.width);
        const isPriced = priceColors.some(pc =>
            String(pc.color_id) === String(colorId) &&
            pc.type_item === formData.type_item &&
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
            type_item: formData.type_item,
            ruler_id: formData.ruler_id,
            color_id: formData.color_id,
            batch_id: formData.batch_id,
            width: formData.width,
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
            thickness: "0.6",
            type_item: TypeItem.Machine,
            ruler_id: "",
            color_id: "",
            batch_id: "",
            width: "",
            quantity: "",
            notes: ""
        }));
        setColorSearchCode("");
        setBatchSearchTerm("");
    };

    const handleEditItem = (item) => {
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

            const response = await orderApi.getOrderById(order.order_id);
            if (!response?.success || !response?.data) {
                toast.error("فشل في جلب تفاصيل الطلب");
                return;
            }

            const details = response.data;
            setEditingOrderId(details.order_id);
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
                    type_item: it.type_item ?? it.typeItem ?? TypeItem.Machine,
                    ruler_id: rawRulerId ? String(rawRulerId) : "",
                    color_id: resolvedColorId ? String(resolvedColorId) : "",
                    batch_id: rawBatchId ? String(rawBatchId) : "",
                    width: it.width !== undefined && it.width !== null ? String(it.width) : "",
                    thickness: String(it.thickness ?? "0.6"),
                    quantity: String(it.quantity ?? ""),
                    notes: it.notes || "",
                    material_name: it.material_name ?? it.material?.material_name ?? resolvedMaterial?.material_name ?? "",
                    ruler_name: it.ruler_name ?? it.ruler?.ruler_name ?? resolvedRuler?.ruler_name ?? resolvedRuler?.ruler_type ?? rulerTypeName ?? "",
                    color_name: it.color_name ?? it.color?.color_name ?? resolvedColor?.color_name ?? "",
                    color_code: it.color_code ?? it.color?.color_code ?? resolvedColor?.color_code ?? "",
                    batch_number: it.batch_number ?? it.batch?.batch_number ?? resolvedBatch?.batch_number ?? "",
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
                type_item: TypeItem.Machine,
                batch_id: "",
            }));

            toast.success(details.order_id ? `تم تحميل الطلب #${details.order_id} للتعديل` : "تم تحميل الطلب للتعديل");
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
                thickness: "0.6",
                type_item: TypeItem.Machine,
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
                thickness: Number(item.thickness ?? formData.thickness ?? 0.6),
                batch_id: item.batch_id ? Number(item.batch_id) : null,
                quantity: Number(item.quantity),
                notes: item.notes || ""
            }));

            const orderData = {
                status: OrderStatus.pending,
                notes: "",
                items: items
            };

            if (customerOption === "existing" && selectedCustomer) {
                orderData.customer_id = Number(selectedCustomer.customer_id);
            }

            if (editingOrderId) {
                await orderApi.updateOrder(editingOrderId, orderData);
            } else {
                await orderApi.createOrder(orderData);
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
        // استخدم order.order_id لأن order هو من قائمة الطلبات
        const response = await orderApi.getOrderById(order.order_id);
        
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

    const clearAllItems = () => {
        if (orderItems.length > 0) {
            setOrderItems([]);
            setEditingItemId(null);
            setFormData(prev => ({
                material_id: prev.material_id,
                thickness: "0.6",
                type_item: TypeItem.Machine,
                ruler_id: "",
                color_id: "",
                batch_id: "",
                width: "",
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
            thickness: "0.6",
            type_item: TypeItem.Machine,
            ruler_id: "",
            color_id: "",
            batch_id: "",
            width: "",
            quantity: "",
            notes: ""
        }));
    };

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers;
        const term = customerSearchTerm.toLowerCase();
        return customers.filter(c => 
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
        const base = batches.map(b => ({
            value: String(b.batch_id),
            label: b.batch_number || `دفعة ${b.batch_id}`
        }));
        if (!term) return base;
        return base.filter(opt => String(opt.label || "").toLowerCase().includes(term) || String(opt.value || "").toLowerCase().includes(term));
    }, [batches, batchSearchTerm]);

    // Color options for select
    const colorOptions = useMemo(() => {
        return filteredColorsBySearch.map(c => {
            const pricingStatus = getColorPricingStatus(c.color_id);
            return {
                value: String(c.color_id),
                label: `${c.color_name} (${c.color_code})${pricingStatus.label}`,
                disabled: !pricingStatus.priced
            };
        });
    }, [filteredColorsBySearch, getColorPricingStatus]);

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
                                طلب جديد
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
                                سجل الطلبات
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/invoice")}
                                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <FileText className="w-5 h-5 ml-2" />
                                الفواتير
                            </Button>
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

            {/* Main Content */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                {viewMode === "create" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.5fr_1.6fr] gap-3 h-full min-h-0">
                        {/* العمود الأيمن - المواد والأرقام */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            {/* أزرار المواد */}
                            <Card className="flex-1 p-4 flex flex-col">
                                <Label className="font-bold text-base mb-3 block">المادة</Label>
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

                            {/* الأرقام */}
                            <Card className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                                <div className="flex-shrink-0 mb-2">
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
                                            onClick={() => handleNumpadPress("clear")}
                                            className="bg-red-100 text-red-700 border-2 border-red-200 rounded-lg text-lg font-bold hover:bg-red-200 active:bg-red-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 h-12"
                                        >
                                            مسح
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* العمود الأوسط - العناصر الإضافية */}
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

                            {!isSelectedMaterialBoard && (
                                <div className="flex-shrink-0 p-3 border-b-2 border-dashed border-gray-300">
                                    {/* <Label className="font-bold text-sm mb-2 block">نوع الطلب</Label> */}
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
                                            disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}
                                            searchValue={colorSearchCode}
                                            onSearchValueChange={(v) => setColorSearchCode(v)}
                                            onInputFocus={() => {
                                                setNumpadMode("text");
                                                setActiveTextTarget("color_search");
                                            }}
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
                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">الصورة</Label>
                                        <div className="h-16 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {selectedColorImage ? (
                                                <img src={selectedColorImage} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-gray-400 text-xs">لا توجد</span>
                                            )}
                                        </div>
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
                                                onClick={() => {
                                                    setActiveField("quantity");
                                                    setNumpadMode("quantity");
                                                }}
                                                className={`h-12 text-lg text-center font-bold flex-1 ${
                                                    activeField === "quantity" ? "ring-2 ring-blue-400" : ""
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
                                                disabled
                                            />
                                            <span className="text-base font-bold text-gray-600 whitespace-nowrap">مم</span>
                                        </div>
                                    </div>
                                    
                                    <div >
                                        <Label className="font-bold text-sm mb-2 block">رقم الطبخة</Label>
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
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">

                            <div className="">
                                <Label className="font-bold text-sm mb-2 block">الملاحظات</Label>
                                <Input
                                    value={formData.notes}
                                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                                    placeholder="ملاحظات إضافية للعنصر..."
                                    className="h-12 text-sm"
                                    />
                            </div>

                            <Button
                                onClick={addOrUpdateItem}
                                size="lg"
                                className={`h-12 flex-shrink-0  text-base font-bold text-white touch-manipulation active:scale-95 transition-transform ${
                                    editingItemId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
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
                                        <Plus className="w-5 h-5 ml-2" />
                                        إضافة للطلب
                                    </>
                                )}
                            </Button>
                                </div>
                        </div>

                        {/* العمود الأيسر - الجدول */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            {/* قسم الزبون */}
                            <Card className="flex-shrink-0 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="font-bold text-sm">الزبون</Label>
                                    <div className="flex gap-1">
                                        {CUSTOMER_OPTIONS.map(option => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setCustomerOption(option.value)}
                                                    className={`
                                                        px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1
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
                                                    <Icon className="w-3 h-3" />
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
                                                    }}
                                                    options={customerOptions}
                                                    searchValue={customerSearchTerm}
                                                    onSearchValueChange={(v) => setCustomerSearchTerm(v)}
                                                    onInputFocus={() => {
                                                        setNumpadMode("text");
                                                        setActiveTextTarget("customer_search");
                                                    }}
                                                    placeholder="اختر الزبون..."
                                                    className="w-full text-sm" 
                                                />
                                            </div>

                                        </div>
                                        {selectedCustomer && (
                                            <div className="bg-blue-50 p-2 rounded-lg text-xs">
                                                <div className="font-bold">{selectedCustomer.name}</div>
                                                <div className="text-gray-600"><span dir="ltr">{selectedCustomer.phone}</span> - {selectedCustomer.city || "لا يوجد مدينة"}</div>
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
                                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="رقم الهاتف *"
                                                value={newCustomer.phone}
                                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="المدينة"
                                                value={newCustomer.city}
                                                onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                                                className="h-10 text-sm"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="العنوان"
                                                value={newCustomer.address}
                                                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                                                className="h-10 text-sm"
                                            />
                                            <div className="col-span-2">
                                                <Input
                                                    type="text"
                                                    placeholder="ملاحظات (اختياري)"
                                                    value={newCustomer.notes}
                                                    onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
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
                                        
                                        {/* <div className="flex gap-2 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded">النوع: زبون</span>
                                            <span className="bg-gray-100 px-2 py-1 rounded">نشط: نعم</span>
                                        </div> */}
                                        
                                        <Button
                                            onClick={handleCreateCustomer}
                                            disabled={!newCustomer.name || !newCustomer.phone || loading}
                                            className="w-full h-9 bg-green-600 hover:bg-green-700 text-white text-sm"
                                        >
                                            {loading ? (
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
                                                        <th className="p-2 text-right border-b">المسطرة</th>
                                                        <th className="p-2 text-right border-b">اللون</th>
                                                        <th className="p-2 text-center border-b">النوع</th>
                                                        <th className="p-2 text-center border-b">الكمية</th>
                                                        <th className="p-2 text-center border-b">السماكة</th>
                                                        <th className="p-2 text-center border-b">الطبخة</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderItems.map(item => (
                                                        <tr key={item.id} className="border-b">
                                                            <td className="p-2">{item.material_name}</td>
                                                            <td className="p-2">{item.ruler_name}</td>
                                                            <td className="p-2">{item.color_name}</td>
                                                            <td className="p-2 text-center">
                                                                {item.type_item === TypeItem.Machine ? "مكنة" : "كوي"}
                                                            </td>
                                                            <td className="p-2 text-center font-bold">{item.quantity} م</td>
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
                            
                            <Card className="flex flex-col h-full min-h-0 overflow-hidden">
                                {/* رأس الجدول مع أزرار التحكم */}
                                <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">العناصر: {orderItems.length}</span>
                                        {orderItems.length > 0 && (
                                            <>
                                                <button
                                                    onClick={clearAllItems}
                                                    className="text-secondary-s hover:bg-red-50 p-1.5 rounded-lg touch-manipulation active:scale-95 transition-transform"
                                                    title="مسح الكل"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="flex gap-1 mr-2">
                                                    <button
                                                        onClick={() => scrollTable('right')}
                                                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded touch-manipulation"
                                                        title="التمرير لليسار"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => scrollTable('left')}
                                                        className="bg-gray-200 hover:bg-gray-300 p-1 rounded touch-manipulation"
                                                        title="التمرير لليمين"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-50 px-2 py-1 rounded-lg text-xs">
                                            إجمالي: <span className="font-bold text-primary-f">{totalPreviewQuantity} م</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowPreview(true)}
                                            disabled={loading || orderItems.length === 0}
                                            className="h-8 bg-secondary-s hover:brightness-110 text-xs px-3 text-white touch-manipulation active:scale-95 transition-transform"
                                        >
                                            {loading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-3 h-3 ml-1" />
                                                    حفظ
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* الجدول مع التمرير الأفقي والعمودي */}
                                <div 
                                    ref={tableContainerRef}
                                    className="flex-1 overflow-auto min-h-0"
                                    style={{ direction: 'rtl' }}
                                >
                                    <table className="max-w-[1300px] w-full table-fixed border-collapse">
                                        <thead className="bg-gray-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-2 text-right border-b w-[100px]">المادة</th>
                                                <th className="p-2 text-right border-b w-[100px]">المسطرة</th>
                                                <th className="p-2 text-right border-b w-[100px]">اللون</th>
                                                <th className="p-2 text-center border-b w-[50px]">النوع</th>
                                                <th className="p-2 text-center border-b w-[60px]">الكمية</th>
                                                <th className="p-2 text-center border-b w-[90px]">السماكة</th>
                                                <th className="p-2 text-center border-b w-[120px]">رقم الطبخة</th>
                                                <th className="p-2 text-center border-b w-[100px]">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map(item => (
                                                <tr 
                                                    key={item.id} 
                                                    className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        editingItemId === item.id ? 'bg-blue-50 border-blue-300' : ''
                                                    }`}
                                                    onClick={() => handleEditItem(item)}
                                                >
                                                    <td className="p-2 break-words text-sm" title={item.material_name}>
                                                        {item.material_name}
                                                    </td>
                                                    <td className="p-2 break-words text-sm" title={item.ruler_name}>
                                                        {item.ruler_name}
                                                    </td>
                                                    <td className="p-2 break-words text-sm" title={item.color_name}>
                                                        {item.color_name}
                                                    </td>
                                                    <td className="p-2 text-center text-sm">
                                                        {item.type_item === TypeItem.Machine ? "مكنة" : "كوي"}
                                                    </td>
                                                    <td className="p-2 text-center font-bold text-sm">
                                                        {item.quantity} م
                                                    </td>
                                                    <td className="p-2 text-center text-sm">
                                                        {item.thickness || "0.6"} مم
                                                    </td>
                                                    <td className="p-2 text-center text-sm" title={item.batch_number}>
                                                        {item.batch_number || "-"}
                                                    </td>
                                                    <td className="p-2 text-center">
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
                            </Card>
                        </div>
                    </div>
                ) : (
                    /* وضع السجل */
                    <Card className="flex flex-col h-full min-h-0 overflow-hidden p-3">
                        <div className="flex justify-between items-center mb-2 flex-shrink-0">
                            <h2 className="font-bold text-lg">سجل الطلبات</h2>
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
                        </div>

                        {/* جدول السجل مع التمرير */}
                        <div className="flex-1 overflow-auto min-h-0 border rounded-lg bg-white">
                            <table className="min-w-[1400px] w-full table-fixed border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-20">
                                    <tr>
                                        <th className="p-2 text-right border-b w-16">#</th>
                                        <th className="p-2 text-right border-b w-28">التاريخ</th>
                                        <th className="p-2 text-center border-b w-20">العناصر</th>
                                        <th className="p-2 text-center border-b w-28">المبيعات</th>
                                        <th className="p-2 text-center border-b w-40">الزبون</th>
                                        <th className="p-2 text-center border-b w-32">ملاحظات</th>
                                        <th className="p-2 text-center border-b w-24">الحالة</th>
                                        <th className="p-2 text-center border-b w-20">عرض</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordersLoading ? (
                                        <tr><td colSpan="9" className="p-6"><LoadingState /></td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد طلبات
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map(order => {
                                            const statusBadge = getStatusBadge(order.status);
                                            return (
                                                    <tr key={order.order_id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 font-medium text-sm">{order.order_id ? `#${order.order_id}` : 'بدون طلب'}</td>
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

                        {/* نافذة تفاصيل الطلب */}
                      {/* نافذة تفاصيل الطلب */}
{orderDetails && (
    <StyledDialog
        isOpen={Boolean(orderDetails)}
        onOpenChange={(open) => { if (!open) setOrderDetails(null); }}
        title={`تفاصيل الطلب ${orderDetails.order_id ? `#${orderDetails.order_id}` : 'بدون طلب'}`}
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
                    <div className="font-bold text-base">{orderDetails.order_id ? `#${orderDetails.order_id}` : 'بدون طلب'}</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
                    <div className="font-bold text-sm">
                        {new Date(orderDetails.created_at).toLocaleDateString('ar-SA', {
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <div className="text-xs text-gray-600">الاسم</div>
                            <div className="font-medium text-sm">{orderDetails.customer.name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">رقم الهاتف</div>
                            <div className="font-medium text-sm text-right" dir="ltr">{orderDetails.customer.phone}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">المدينة</div>
                            <div className="font-medium text-sm">{orderDetails.customer.city || 'غير محدد'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">العنوان</div>
                            <div className="font-medium text-sm">{orderDetails.customer.address || 'غير محدد'}</div>
                        </div>
                       
                    </div>
                </div>
            )}

            {/* معلومات مندوب المبيعات */}
            {orderDetails.sales && (
                <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-700 mb-2 text-sm">مندوب المبيعات</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                            <div className="text-xs text-gray-600">الاسم</div>
                            <div className="font-medium text-sm">{orderDetails.sales.full_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">اسم المستخدم</div>
                            <div className="font-medium text-sm">{orderDetails.sales.username}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600">رقم الموظف</div>
                            <div className="font-medium text-sm">#{orderDetails.sales_user_id}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ملاحظات الطلب */}
            {orderDetails.notes && (
                <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-yellow-700 mb-1 text-sm">ملاحظات الطلب</h4>
                    <div className="text-sm">{orderDetails.notes}</div>
                </div>
            )}

            {/* عناصر الطلب */}
            {orderDetails.items && orderDetails.items.length > 0 ? (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <span>عناصر الطلب</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                {orderDetails.items.length} عنصر
                            </span>
                        </h4>
                        <div className="text-sm bg-gray-100 px-3 py-1 rounded-lg">
                            عدد العناصر: <span className="font-bold">{orderDetails.count_items}</span>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="max-w-[1200px] w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-right">#</th>
                                        <th className="p-3 text-right">المادة</th>
                                        <th className="p-3 text-center">النوع</th>
                                        <th className="p-3 text-center">اللون</th>
                                        <th className="p-3 text-center">المسطرة</th>
                                        <th className="p-3 text-center">الأبعاد (عرض × سماكة)</th>
                                        <th className="p-3 text-center">الكمية</th>
                                        <th className="p-3 text-center">رقم الدفعة</th>
                                        <th className="p-3 text-center">QR</th>
                                        <th className="p-3 text-center">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderDetails.items.map((item, index) => {
                                            const rawColorId = item.color_id ?? item.color?.color_id ?? item.colorId ?? null;
                                            const resolvedColor = rawColorId
                                                ? colors.find((c) => String(c.color_id) === String(rawColorId))
                                                : null;
                                            const rawRulerId = item.ruler_id ?? item.ruler?.ruler_id ?? item.rulerId ?? resolvedColor?.ruler_id ?? null;
                                            const resolvedRuler = rawRulerId
                                                ? rulers.find((r) => String(r.ruler_id) === String(rawRulerId))
                                                : null;
                                            const resolvedRulerName = item.ruler_name ?? item.ruler?.ruler_name ?? item.ruler_type ?? resolvedRuler?.ruler_name ?? "-";

                                            const localItem = {
                                                id: `${orderDetails.order_id}-${index + 1}`,
                                                material_name: item.material_name,
                                                ruler_name: resolvedRulerName,
                                                color_name: item.color_name,
                                                color_code: item.color_code,
                                                width: item.width,
                                                thickness: item.thickness,
                                                quantity: item.quantity,
                                                batch_number: item.batch_number,
                                            };
                                            return (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="p-3 text-center font-medium">{index + 1}</td>
                                            <td className="p-3 font-medium">{item.material_name || 'غير محدد'}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    item.type_item === 'Machine' 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {item.type_item === 'Machine' ? 'مكنة' : 'كوي'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                               <span className="flex flex-col"> {item.color_name || '-'}</span>
                                                <span className="px-2 py-1 rounded-full text-xs  text-purple-700">{item.color_code || '-'}</span>
                                            </td>
                                            <td className="p-3 text-center">{resolvedRulerName}</td>
                                            <td className="p-3 text-center">
                                                {item.width || '-'} × {item.thickness || '0.6'}
                                            </td>
                                            <td className="p-3 text-center font-bold">{item.quantity} م</td>
                                            <td className="p-3 text-center font-mono text-xs">{item.batch_number || '-'}</td>
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
                    لا توجد عناصر في هذا الطلب
                </div>
            )}
        </div>
    </StyledDialog>
)}

                    </Card>

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
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            size="sm"
                            className="bg-secondary-s hover:brightness-110 text-white"
                            onClick={() => printQr(qrPreview.url, qrPreview.title)}
                            disabled={!qrPreview.url}
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
                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    className="bg-secondary-s hover:brightness-110 text-white"
                                    onClick={() => printQr(qrGenDialog.qrUrl, `QR - ${qrGenDialog.item?.color_name || ''}`)}
                                >
                                    طباعة QR
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const url = qrGenDialog.qrUrl;
                                        const title = `QR - ${qrGenDialog.item?.color_name || ''}`;
                                        openQrPreview(url, title);
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
            </div>
        </div>
    );
}
// // src/pages/Sales/SimpleOrderCreation.jsx
// import { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { orderApi } from "../../api/orderApi";
// import { materialApi } from "../../api/materialApi";
// import { rulerApi } from "../../api/rulerApi";
// import { colorApi } from "../../api/colorApi";
// import { batchApi } from "../../api/batchApi";
// import { priceColorApi } from "../../api/priceColorApi";
// import { constantApi } from "../../api/constantApi";
// import { Card } from "../../components/ui/card";
// import { Button } from "../../components/ui/button";
// import FilterSelect from "../../components/common/FilterSelect";
// import StyledDialog from "../../components/common/StyledDialog";
// import { Label } from "../../components/ui/label";
// import { Input } from "../../components/ui/input";
// import {
//     ShoppingCart,
//     Plus,
//     History,
//     Trash2,
//     Eye,
//     RotateCcw,
//     Check,
//     User,
//     Users,
//     LogIn,
//     EyeOff,
//     Home
// } from "lucide-react";
// import LoadingState from "../../components/common/LoadingState";
// import { getApiData } from "../../utils/api";
// import toast from "react-hot-toast";

// export default function SimpleOrderCreation() {
//     const navigate = useNavigate();
//     const [viewMode, setViewMode] = useState("create");
//     const [loading, setLoading] = useState(false);
//     const [isHeaderVisible, setIsHeaderVisible] = useState(true);
//     const [showPreview, setShowPreview] = useState(false);

//     // Data
//     const [materials, setMaterials] = useState([]);
//     const [rulers, setRulers] = useState([]);
//     const [colors, setColors] = useState([]);
//     const [batches, setBatches] = useState([]);
//     const [priceColors, setPriceColors] = useState([]);
//     const [widthValues, setWidthValues] = useState([]); // قيم العرض حسب المادة
//     const [loadingWidths, setLoadingWidths] = useState(false); // حالة تحميل قيم العرض

//     // Form State
//     const [formData, setFormData] = useState({
//         material_id: "",
//         type_item: "Machine",
//         ruler_id: "",
//         color_id: "",
//         batch_id: "",
//         width: "",
//         thickness: "0.6",
//         quantity: "",
//         notes: ""
//     });

//     const [orderItems, setOrderItems] = useState([]);
//     const [orders, setOrders] = useState([]);
//     const [ordersLoading, setOrdersLoading] = useState(false);
//     const [selectedOrder, setSelectedOrder] = useState(null);

//     // Numpad
//     const [numpadMode, setNumpadMode] = useState("quantity");
//     const [colorSearchCode, setColorSearchCode] = useState("");
//     const [activeField, setActiveField] = useState("quantity");

//     const TYPE_OPTIONS = [
//         { value: "Machine", label: "مكنة" },
//         { value: "Presser", label: "كوي" }
//     ];
//     const PRICE_BY_TO_WIDTH = {
//         isByMeter22: 22,
//         isByMeter44: 44,
//         isByMeter66: 66,
//     };
//     const getWidthFromPriceBy = (priceBy) => PRICE_BY_TO_WIDTH[priceBy] ?? null;
//     const totalPreviewQuantity = useMemo(() => {
//         return orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
//     }, [orderItems]);
//     const getStatusLabel = (status) => {
//         const key = String(status || "").toLowerCase();
//         if (key === "pending") return "معلق";
//         if (key === "completed") return "مكتمل";
//         if (key === "cancelled" || key === "canceled") return "ملغي";
//         if (key === "processing") return "قيد المعالجة";
//         if (key === "draft") return "مسودة";
//         return status || "-";
//     };


//     // Load initial data
//     useEffect(() => {
//         loadInitialData();
//     }, []);

//     useEffect(() => {
//         if (viewMode === "history") loadOrders();
//     }, [viewMode]);

//     // Load width values when material changes
//     useEffect(() => {
//         if (formData.material_id) {
//             loadWidthValues(formData.material_id);
//         } else {
//             setWidthValues([]);
//         }
//     }, [formData.material_id]);

//     const loadInitialData = async () => {
//         try {
//             const [matRes, rulerRes, colorRes, batchRes, priceRes] = await Promise.all([
//                 materialApi.getMaterials(),
//                 rulerApi.getRulers(),
//                 colorApi.getColors(),
//                 batchApi.getBatches(),
//                 priceColorApi.getPriceColors(),
//             ]);

//             setMaterials(getApiData(matRes, []) || []);
//             setRulers(getApiData(rulerRes, []) || []);
//             setColors(getApiData(colorRes, []) || []);
//             setBatches(getApiData(batchRes, []) || []);
//             setPriceColors(getApiData(priceRes, []) || []);

//         } catch (error) {
//             toast.error("فشل في تحميل البيانات");
//         }
//     };

//     // جلب قيم العرض حسب المادة
//     const loadWidthValues = async (materialId) => {
//         try {
//             setLoadingWidths(true);
//             const response = await constantApi.getConstantValuesByMaterial(materialId, 'width');
//             const widthData = getApiData(response, []);
//             setWidthValues(widthData);

//             // إعادة تعيين العرض المحدد عند تغيير المادة
//             setFormData(prev => ({ ...prev, width: "" }));
//         } catch (error) {
//             toast.error("فشل في تحميل قيم العرض");
//             setWidthValues([]);
//         } finally {
//             setLoadingWidths(false);
//         }
//     };

//     const loadOrders = async () => {
//         try {
//             setOrdersLoading(true);
//             const response = await orderApi.getOrders();
//             setOrders(getApiData(response, []) || []);
//         } catch {
//             toast.error("فشل في تحميل الطلبات");
//         } finally {
//             setOrdersLoading(false);
//         }
//     };

//     // التحقق مما إذا كانت المادة المحددة تحتوي على كلمة "لوح" أو مشتقاتها
//     const isSelectedMaterialBoard = useMemo(() => {
//         if (!formData.material_id) return false;
//         const selectedMaterial = materials.find(m => String(m.material_id) === String(formData.material_id));
//         const materialName = selectedMaterial?.material_name?.toLowerCase() || "";

//         // التحقق من الكلمات المختلفة للواح
//         const boardKeywords = ["لوح", "ألواح", "board", "boards", "لوحة", "الواح"];
//         return boardKeywords.some(keyword => materialName.includes(keyword));
//     }, [formData.material_id, materials]);

//     // Filters
//     const availableRulers = useMemo(() => {
//         if (!formData.material_id) return [];
//         return rulers.filter(r => String(r.material_id) === String(formData.material_id));
//     }, [formData.material_id, rulers]);

//     const availableColors = useMemo(() => {
//         if (!formData.ruler_id) return [];
//         return colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));
//     }, [formData.ruler_id, colors]);

//     // فلترة الألوان المتاحة مع استبعاد غير المسعرة
//     const availablePricedColors = useMemo(() => {
//         if (!formData.ruler_id) return [];

//         const filteredColors = colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));

//         if (!priceColors || priceColors.length === 0) {
//             return filteredColors;
//         }

//         console.log("=== DEBUG PRICING ===");
//         console.log("formData:", formData);
//         console.log("filteredColors:", filteredColors);
//         console.log("priceColors:", priceColors);

//         if (isSelectedMaterialBoard) {
//             // للمواد اللوحية: تحقق من المسطرة والنوع فقط
//             return filteredColors.filter(color =>
//                 priceColors.some(pc =>
//                     String(pc.color_id) === String(color.color_id) &&
//                     pc.type_item === formData.type_item
//                 )
//             );
//         }

//         if (!formData.width) return [];
//         const targetWidth = Number(formData.width);

//         const result = filteredColors.filter(color => {
//             const hasPricing = priceColors.some(pc =>
//                 String(pc.color_id) === String(color.color_id) &&
//                 pc.type_item === formData.type_item &&
//                 (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
//             );

//             console.log(`Color ${color.color_name} (${color.color_id}):`, {
//                 hasPricing,
//                 colorId: color.color_id,
//                 typeItem: formData.type_item,
//                 width: targetWidth,
//                 matchingPrices: priceColors.filter(pc =>
//                     String(pc.color_id) === String(color.color_id) &&
//                     pc.type_item === formData.type_item
//                 )
//             });

//             return hasPricing;
//         });

//         console.log("Final result:", result);
//         console.log("=== END DEBUG ===");
//         return result;
//     }, [formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, colors, priceColors]);

//     const filteredColorsBySearch = useMemo(() => {
//         if (!colorSearchCode || numpadMode !== "colorSearch") return availablePricedColors;
//         return availablePricedColors.filter(c =>
//             c.color_code?.toLowerCase().includes(colorSearchCode.toLowerCase())
//         );
//     }, [colorSearchCode, availablePricedColors, numpadMode]);

//     const selectedColorImage = useMemo(() => {
//         const color = colors.find(c => String(c.color_id) === String(formData.color_id));
//         return color?.imageUrl || color?.image_url || color?.color_image || null;
//     }, [formData.color_id, colors]);

//     // التحقق مما إذا كان اللون مسعرًا للمسطرة والعرض المحددين
//     const isColorPriced = useMemo(() => {
//         if (!formData.color_id || !formData.ruler_id) return false;

//         if (!priceColors || priceColors.length === 0) {
//             return true;
//         }

//         if (isSelectedMaterialBoard) {
//             // للمواد اللوحية: تحقق من المسطرة والنوع فقط
//             return priceColors.some(pc =>
//                 String(pc.color_id) === String(formData.color_id) &&
//                 pc.type_item === formData.type_item
//             );
//         }

//         if (!formData.width) return false;
//         const targetWidth = Number(formData.width);

//         return priceColors.some(pc =>
//             String(pc.color_id) === String(formData.color_id) &&
//             pc.type_item === formData.type_item &&
//             (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
//         );
//     }, [formData.color_id, formData.ruler_id, formData.width, formData.type_item, isSelectedMaterialBoard, priceColors]);

//     const getColorPricingStatus = (colorId) => {
//         if (!priceColors || priceColors.length === 0) return { priced: true, label: "" };

//         if (isSelectedMaterialBoard) {
//             const isPriced = priceColors.some(pc =>
//                 String(pc.color_id) === String(colorId) &&
//                 pc.type_item === formData.type_item
//             );
//             return { priced: isPriced, label: "" };
//         }

//         if (!formData.width) return { priced: false, label: " (اختر العرض)" };

//         const targetWidth = Number(formData.width);
//         const isPriced = priceColors.some(pc =>
//             String(pc.color_id) === String(colorId) &&
//             pc.type_item === formData.type_item &&
//             (pc.price_color_By === `isByMeter${targetWidth}` || pc.price_color_By === 'isByBlanck')
//         );
//         return { priced: isPriced, label: "" };
//     };

//     const handleFieldChange = (field, value) => {
//         setFormData(prev => {
//             const newData = { ...prev, [field]: value };

//             if (field === "material_id") {
//                 newData.ruler_id = "";
//                 newData.color_id = "";
//                 newData.width = "";
//             } else if (field === "ruler_id") {
//                 newData.color_id = "";
//             } else if (field === "width") {
//                 newData.color_id = "";
//             } else if (field === "type_item") {
//                 newData.color_id = "";
//             }

//             return newData;
//         });
//     };

//     const handleNumpadPress = (val) => {
//         if (numpadMode === "colorSearch") {
//             let search = colorSearchCode;
//             if (val === "clear") search = "";
//             else if (val === "back") search = search.slice(0, -1);
//             else search = search + val;

//             setColorSearchCode(search);

//             const matched = availablePricedColors.find(c => c.color_code === search);
//             if (matched) {
//                 handleFieldChange("color_id", matched.color_id);
//                 setNumpadMode("quantity");
//                 setColorSearchCode("");
//             }
//         } else {
//             let current = String(formData[activeField] || "");
//             if (val === "clear") current = "";
//             else if (val === "back") current = current.slice(0, -1);
//             else if (val === ".") {
//                 if (!current.includes(".")) current = current ? current + "." : "0.";
//             } else {
//                 current = current + val;
//             }
//             handleFieldChange(activeField, current);
//         }
//     };

//     const addItem = () => {
//         if (!formData.material_id || !formData.ruler_id || !formData.color_id || !formData.quantity) {
//             toast.error("يرجى اكمال جميع البيانات");
//             return;
//         }

//         // إذا كانت المادة ليست "لوح" يجب تحديد العرض
//         if (!isSelectedMaterialBoard && !formData.width) {
//             toast.error("يرجى اختيار العرض");
//             return;
//         }

//         // التحقق من أن اللون مسعر
//         if (!isColorPriced) {
//             toast.error("اللون المحدد غير مسعر لهذه المواصفات");
//             return;
//         }

//         const material = materials.find(m => String(m.material_id) === String(formData.material_id));
//         const ruler = rulers.find(r => String(r.ruler_id) === String(formData.ruler_id));
//         const color = colors.find(c => String(c.color_id) === String(formData.color_id));
//         const batch = batches.find(b => String(b.batch_id) === String(formData.batch_id));

//         const newItem = {
//             id: Date.now(),
//             ...formData,
//             material_name: material?.material_name,
//             ruler_name: ruler?.ruler_name,
//             color_name: color?.color_name,
//             batch_number: batch?.batch_number,
//         };

//         setOrderItems(prev => [...prev, newItem]);

//         // Reset form keeping material and thickness
//         setFormData(prev => ({
//             material_id: prev.material_id,
//             thickness: "0.6",
//             type_item: prev.type_item,
//             ruler_id: "",
//             color_id: "",
//             batch_id: "",
//             width: "",
//             quantity: "",
//             notes: ""
//         }));
//         setColorSearchCode("");
//     };

//     const removeItem = (id) => {
//         setOrderItems(prev => prev.filter(item => item.id !== id));
//     };

//     const saveOrder = async () => {
//         if (orderItems.length === 0) {
//             toast.error("أضف عنصراً واحداً على الأقل");
//             return;
//         }

//         try {
//             setLoading(true);
//             const items = orderItems.map(item => ({
//                 type_item: item.type_item,
//                 color_id: Number(item.color_id),
//                 width: Number(item.width) || 0,
//                 thickness: 0.6,
//                 batch_id: Number(item.batch_id) || null,
//                 quantity: Number(item.quantity),
//                 notes: item.notes
//             }));

//             await orderApi.createOrder({ status: "pending", items, notes: "" });
//             toast.success("تم حفظ الطلب بنجاح");
//             setOrderItems([]);
//         } catch {
//             toast.error("فشل في حفظ الطلب");
//         } finally {
//             setLoading(false);
//         }
//     };
//     const handleConfirmSave = async () => {
//         await saveOrder();
//         setShowPreview(false);
//     };


//     return (
//         <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
//             {/* Header - ثابت في الأعلى */}
//             <div className="relative flex-shrink-0">
//                 {isHeaderVisible && (
//                     <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
//                         <div className="flex flex-wrap gap-3">
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={() => setViewMode("create")}
//                                 className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "create"
//                                     ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
//                                     : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
//                                     }`}
//                             >
//                                 <ShoppingCart className="w-5 h-5 ml-2" />
//                                 طلب جديد
//                             </Button>
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={() => setViewMode("history")}
//                                 className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${viewMode === "history"
//                                     ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
//                                     : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
//                                     }`}
//                             >
//                                 <History className="w-5 h-5 ml-2" />
//                                 سجل الطلبات
//                             </Button>
//                         </div>
//                         <div className="flex flex-wrap gap-2">
//                             {/* <Button
//                 size="lg"
//                 variant="outline"
//                 onClick={() => navigate("/profile")}
//                 className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
//               >
//                 <User className="w-5 h-5 ml-2" />
//                 البروفايل
//               </Button> */}
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={() => navigate("/customers")}
//                                 className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
//                             >
//                                 <Users className="w-5 h-5 ml-2" />
//                                 الزبائن
//                             </Button>
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={() => navigate("/dashboard")}
//                                 className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
//                             >
//                                 <Home className="w-5 h-5 ml-2" />
//                                 الرئيسية
//                             </Button>
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={() => setIsHeaderVisible(false)}
//                                 className="px-4 py-3 text-base min-w-[60px] touch-manipulation border-2 bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110"
//                             >
//                                 <EyeOff className="w-5 h-5" />
//                             </Button>
//                         </div>
//                     </div>
//                 )}
//                 {!isHeaderVisible && (
//                     <div className="absolute top-2 right-2 z-20">
//                         <Button
//                             size="lg"
//                             variant="outline"
//                             onClick={() => setIsHeaderVisible(true)}
//                             className="px-4 py-2 text-base bg-secondary-f text-white border-secondary-f hover:bg-secondary-f shadow-lg touch-manipulation"
//                         >
//                             <Eye className="w-5 h-5 ml-2" />
//                             إظهار الهيدر
//                         </Button>
//                     </div>
//                 )}
//             </div>

//             {/* Main Content - يأخذ المساحة المتبقية */}
//             <div className="flex-1 min-h-0 p-3 overflow-hidden">
//                 {viewMode === "create" ? (
//                     /* 
//                       توزيع الأعمدة بشكل ديناميكي:
//                       - العمود الأول: 1.2fr (المواد والأرقام)
//                       - العمود الثاني: 2fr (العناصر الوسطى)
//                       - العمود الثالث: 1.8fr (الجدول)
//                     */
//                     <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr_1fr] gap-1 h-full min-h-0">

//                         {/* العمود الأيمن - أزرار المواد والأرقام */}
//                         <div className="flex flex-col gap-1 h-full min-h-0 overflow-hidden">
//                             {/* أزرار المواد - تستخدم Grid ديناميكي */}
//                             <Card className="flex-shrink-0 p-4">
//                                 <Label className="font-bold text-base mb-3 block">المادة</Label>
//                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-fr">
//                                     {materials.map(m => (
//                                         <button
//                                             key={m.material_id}
//                                             onClick={() => handleFieldChange("material_id", m.material_id)}
//                                             className={`
//                                             aspect-square rounded-2xl border-4 text-xl sm:text-2xl font-bold 
//                                             transition-all touch-manipulation hover:scale-105 active:scale-95
//                                             flex items-center justify-center p-4
//                                             ${String(formData.material_id) === String(m.material_id)
//                                                     ? "border-primary-f bg-secondary-f text-white shadow-lg"
//                                                     : "border-gray-300 bg-white hover:border-secondary-s"
//                                                 }
//                                         `}
//                                         >
//                                             {m.material_name}
//                                         </button>
//                                     ))}
//                                 </div>
//                             </Card>

//                             {/* الأرقام - تأخذ المساحة المتبقية */}
//                             <Card className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
//                                 {/* شاشة العرض الرقمية - مدمجة أكثر */}
//                                 <div className="flex-shrink-0 mb-2">
//                                     <div className="flex gap-2 mb-2">
//                                         <button
//                                             onClick={() => {
//                                                 setNumpadMode("colorSearch");
//                                                 setColorSearchCode("");
//                                             }}
//                                             className={`
//                     flex-1 py-3 px-2 rounded-lg text-sm font-bold border-2 
//                     touch-manipulation transition-all active:scale-95
//                     ${numpadMode === "colorSearch"
//                                                     ? "bg-secondary-s text-white border-secondary-s"
//                                                     : "bg-white border-gray-300 hover:bg-gray-100"
//                                                 }
//                 `}
//                                         >
//                                             بحث بالكود
//                                         </button>
//                                         <button
//                                             onClick={() => {
//                                                 setNumpadMode("quantity");
//                                                 setActiveField("quantity");
//                                             }}
//                                             className={`
//                     flex-1 py-3 px-2 rounded-lg text-sm font-bold border-2 
//                     touch-manipulation transition-all active:scale-95
//                     ${numpadMode === "quantity"
//                                                     ? "bg-primary-f text-white border-primary-f"
//                                                     : "bg-white border-gray-300 hover:bg-gray-100"
//                                                 }
//                 `}
//                                         >
//                                             كتابة الكمية
//                                         </button>
//                                     </div>

//                                     <div className="bg-gray-100 rounded-lg py-2 px-3">
//                                         <div className="text-xs text-gray-500 mb-0.5">
//                                             {numpadMode === "colorSearch" ? "كود اللون" :
//                                                 activeField === "quantity" ? "الكمية" :
//                                                     activeField === "width" ? "العرض" : "القيمة"}
//                                         </div>
//                                         <div className="text-3xl font-mono font-bold text-gray-800 text-center truncate leading-tight">
//                                             {numpadMode === "colorSearch" ? colorSearchCode || "0" : (formData[activeField] || "0")}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* أزرار الأرقام - 4 صفوف فقط (بدون مساحة إضافية) */}
//                                 <div className="flex-1 grid grid-rows-4 gap-1.5 min-h-0">
//                                     {/* الصف 1: 7 8 9 */}
//                                     <div className="grid grid-cols-3 gap-1.5">
//                                         {["7", "8", "9"].map(key => (
//                                             <button
//                                                 key={key}
//                                                 onClick={() => handleNumpadPress(key)}
//                                                 className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                             >
//                                                 {key}
//                                             </button>
//                                         ))}
//                                     </div>

//                                     {/* الصف 2: 4 5 6 */}
//                                     <div className="grid grid-cols-3 gap-1.5">
//                                         {["4", "5", "6"].map(key => (
//                                             <button
//                                                 key={key}
//                                                 onClick={() => handleNumpadPress(key)}
//                                                 className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                             >
//                                                 {key}
//                                             </button>
//                                         ))}
//                                     </div>

//                                     {/* الصف 3: 1 2 3 */}
//                                     <div className="grid grid-cols-3 gap-1.5">
//                                         {["1", "2", "3"].map(key => (
//                                             <button
//                                                 key={key}
//                                                 onClick={() => handleNumpadPress(key)}
//                                                 className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                             >
//                                                 {key}
//                                             </button>
//                                         ))}
//                                     </div>

//                                     {/* الصف 4: . 0 ⌫ مع مسح الكل */}
//                                     <div className="grid grid-cols-3 gap-1.5">
//                                         <button
//                                             onClick={() => handleNumpadPress(".")}
//                                             className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                         >
//                                             .
//                                         </button>
//                                         <button
//                                             onClick={() => handleNumpadPress("0")}
//                                             className="bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold hover:bg-gray-50 active:bg-gray-200 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                         >
//                                             0
//                                         </button>
//                                         <button
//                                             onClick={() => handleNumpadPress("clear")}
//                                             className="bg-red-100 text-red-700 border-2 border-red-200 rounded-lg text-xl font-bold hover:bg-red-200 active:bg-red-300 transition-all flex items-center justify-center touch-manipulation active:scale-95 max-w-30 max-h-25"
//                                         >
//                                             مسح
//                                         </button>
//                                     </div>
//                                 </div>
//                             </Card>
//                         </div>

//                         {/* العمود الأوسط - العناصر الإضافية */}
//                         <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
//                             {!isSelectedMaterialBoard && (
//                                 <div className="flex-shrink-0 p-4 border-b-4 border-dashed border-gray-300 ">
//                                     {/* <Label className="font-bold text-base mb-3 block">نوع الطلب</Label> */}
//                                     <div className="grid grid-cols-2  mx-auto gap-4">
//                                         {TYPE_OPTIONS.map(t => (
//                                             <button
//                                                 key={t.value}
//                                                 onClick={() => handleFieldChange("type_item", t.value)}
//                                                 className={`
//                                                 max-w-40 max-h-48 rounded-2xl border-4 text-xl sm:text-2xl font-medium
//                                                 transition-all touch-manipulation hover:scale-105 active:scale-95
//                                                 flex items-center justify-center p-2
//                                                 ${formData.type_item === t.value
//                                                         ? "border-primary-f bg-primary-f text-white shadow-lg"
//                                                         : "border-gray-300 bg-white hover:border-secondary-s"
//                                                     }
//                                             `}
//                                             >
//                                                 {t.label}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}

//                             {formData.material_id && !isSelectedMaterialBoard && (
//                                 <div className="flex justify-around items-center p-1 pt-0 border-b-4 border-dashed border-gray-300">
//                                     <Label className="font-bold text-base block">
//                                         العرض
//                                         {loadingWidths && <span className="mr-2 text-gray-500 text-sm">جاري التحميل...</span>}
//                                     </Label>
//                                     {widthValues.length > 0 ? (
//                                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
//                                             {widthValues.map(w => (
//                                                 <button
//                                                     key={w.id}
//                                                     onClick={() => handleFieldChange("width", w.value)}
//                                                     className={`
//                                                     min-w-40 max-h-48 rounded-2xl border-4 text-xl sm:text-2xl font-medium
//                                                     transition-all touch-manipulation hover:scale-105 active:scale-95
//                                                     flex items-center justify-center p-4
//                                                     ${formData.width === w.value
//                                                             ? "border-secondary-s bg-secondary-s text-white shadow-lg"
//                                                             : "border-gray-300 bg-white hover:border-secondary-s"
//                                                         }
//                                                 `}
//                                                 >
//                                                     {w.value}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     ) : (
//                                         !loadingWidths && (
//                                             <div className="text-center p-4 text-gray-400 text-base border-2 border-dashed border-gray-300 rounded-xl">
//                                                 لا توجد قيم عرض لهذه المادة
//                                             </div>
//                                         )
//                                     )}
//                                 </div>
//                             )}

//                             <div className="flex justify-center items-center p-1 pt-0 border-b-4 border-dashed border-gray-300">
//                                 <Label className="font-bold text-base block">المسطرة</Label>
//                                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr">
//                                     {availableRulers.length === 0 ? (
//                                         <span className="text-gray-400 text-base col-span-4 text-center p-4">اختر المادة أولاً</span>
//                                     ) : (
//                                         availableRulers.map(r => (
//                                             <button
//                                                 key={r.ruler_id}
//                                                 onClick={() => handleFieldChange("ruler_id", r.ruler_id)}
//                                                 className={`
//                                                max-w-40 max-h-48 rounded-2xl border-4 text-xl sm:text-2xl font-medium
//                                                 transition-all touch-manipulation hover:scale-105 active:scale-95
//                                                 flex items-center justify-center p-2
//                                                 ${String(formData.ruler_id) === String(r.ruler_id)
//                                                         ? "border-secondary-s bg-secondary-s text-white shadow-lg"
//                                                         : "border-gray-300 bg-white hover:border-secondary-s"
//                                                     }
//                                             `}
//                                             >
//                                                 {r.ruler_name}
//                                             </button>
//                                         ))
//                                     )}
//                                 </div>
//                             </div>

//                             <div className="flex-shrink-0 p-1 border-b-4 border-dashed border-gray-300">
//                                 <div className="grid grid-cols-[1fr_140px] gap-4 items-end">
//                                     <div>
//                                         <Label className="font-bold text-base block">
//                                             اللون
//                                             {numpadMode === "colorSearch" && colorSearchCode && (
//                                                 <span className="mr-3 text-secondary-s text-sm">(بحث: {colorSearchCode})</span>
//                                             )}
//                                         </Label>
//                                         <FilterSelect
//                                             value={formData.color_id}
//                                             onChange={(e) => handleFieldChange("color_id", e.target.value)}
//                                             disabled={!formData.ruler_id || (!isSelectedMaterialBoard && !formData.width)}
//                                             options={filteredColorsBySearch.map(c => {
//                                                 const pricingStatus = getColorPricingStatus(c.color_id);
//                                                 return {
//                                                     value: c.color_id,
//                                                     label: `${c.color_name} (${c.color_code})${pricingStatus.label}`
//                                                 };
//                                             })}
//                                             placeholder={
//                                                 !formData.ruler_id
//                                                     ? "اختر المسطرة أولاً"
//                                                     : (!isSelectedMaterialBoard && !formData.width)
//                                                         ? "اختر العرض أولاً"
//                                                         : filteredColorsBySearch.length === 0
//                                                             ? "لا توجد ألوان مسعرة"
//                                                             : "اختر اللون"
//                                             }
//                                             className="w-full text-base p-3 min-h-[50px]"
//                                         />
//                                     </div>
//                                     <div>
//                                         <Label className="font-bold text-base block">الصورة</Label>
//                                         <div className="h-24 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
//                                             {selectedColorImage ? (
//                                                 <img src={selectedColorImage} alt="" className="h-full w-full object-cover" />
//                                             ) : (
//                                                 <span className="text-gray-400 text-sm">لا توجد</span>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* <div className="flex-shrink-0 p-1 border-b-4 border-dashed border-gray-300">
//                                 <Label className="font-bold text-base block">رقم الطبخة</Label>
//                                 <FilterSelect
//                                     value={formData.batch_id}
//                                     onChange={(e) => handleFieldChange("batch_id", e.target.value)}
//                                     disabled={!isSelectedMaterialBoard && !formData.width}
//                                     options={batches.map(b => ({
//                                         value: b.batch_id,
//                                         label: b.batch_number
//                                     }))}
//                                     placeholder={
//                                         (!isSelectedMaterialBoard && !formData.width)
//                                             ? "اختر العرض أولاً"
//                                             : "اختر الطبخة"
//                                     }
//                                     className="w-full text-base p-3 min-h-[50px]"
//                                 />
//                             </div> */}

//                             <div className="flex-shrink-0 p-1 border-b-4 border-dashed border-gray-300">
//                                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//                                     <div>
//                                         <Label className="font-bold text-base block">الكمية</Label>
//                                         <div className="flex items-center gap-3">
//                                             <Input
//                                                 type="number"
//                                                 value={formData.quantity}
//                                                 onChange={(e) => handleFieldChange("quantity", e.target.value)}
//                                                 onClick={() => {
//                                                     setActiveField("quantity");
//                                                     setNumpadMode("quantity");
//                                                 }}
//                                                 className={`h-14 text-xl text-center font-bold flex-1 ${activeField === "quantity" ? "ring-2 ring-blue-400" : ""}`}
//                                                 placeholder="0"
//                                             />
//                                             <span className="text-lg font-bold text-gray-600 whitespace-nowrap">متر</span>
//                                         </div>

//                                     </div>
                                    
//                                     <div>
//                                         <Label className="font-bold text-base mb-3 block">السماكة</Label>
//                                         <div className="flex items-center gap-3">
//                                             <Input
//                                                 type="number"
//                                                 value={formData.thickness}
//                                                 className="h-14 text-lg text-center font-bold flex-1 bg-gray-100"
//                                                 placeholder="0.6"
//                                                 step="0.1"
//                                                 readOnly
//                                             />
//                                             <span className="text-lg font-bold text-gray-600 whitespace-nowrap">مم</span>
//                                         </div>
//                                     </div>
//                                     <div>
//                                         <Label className="font-bold text-base block">رقم الطبخة</Label>
//                                         <FilterSelect
//                                             value={formData.batch_id}
//                                             onChange={(e) => handleFieldChange("batch_id", e.target.value)}
//                                             disabled={!isSelectedMaterialBoard && !formData.width}
//                                             options={batches.map(b => ({
//                                                 value: b.batch_id,
//                                                 label: b.batch_number
//                                             }))}
//                                             placeholder={
//                                                 (!isSelectedMaterialBoard && !formData.width)
//                                                     ? "اختر العرض أولاً"
//                                                     : "اختر الطبخة"
//                                             }
//                                             className="w-full text-base p-3 min-h-[50px]"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="flex-shrink-0 p-4">
//                                 <Label className="font-bold text-base mb-3 block">الملاحظات</Label>
//                                 <Input
//                                     value={formData.notes}
//                                     onChange={(e) => handleFieldChange("notes", e.target.value)}
//                                     placeholder="ملاحظات إضافية..."
//                                     className="h-14 text-base"
//                                 />
//                             </div>

//                             <Button
//                                 onClick={addItem}
//                                 size="lg"
//                                 className="h-14 bg-primary-f hover:bg-secondary-f flex-shrink-0 text-lg font-bold text-white touch-manipulation active:scale-95 transition-transform"
//                                 disabled={!formData.color_id || !formData.quantity || (!isSelectedMaterialBoard && !formData.width)}
//                             >
//                                 <Plus className="w-6 h-6 ml-2" />
//                                 إضافة للطلب
//                             </Button>
//                         </div>

//                         {/* العمود الأيسر - الجدول */}
//                         <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
//                             {showPreview && orderItems.length > 0 && (
//                                 <StyledDialog
//                                     isOpen={showPreview}
//                                     onOpenChange={setShowPreview}
//                                     title="تفاصيل الطلب قبل الحفظ"
//                                     onCancel={() => setShowPreview(false)}
//                                     onConfirm={handleConfirmSave}
//                                     confirmLabel="تأكيد الحفظ"
//                                     cancelLabel="إلغاء"
//                                     confirmVariant="default"
//                                     isLoading={loading}
//                                 >
//                                     <div className="grid grid-cols-2 gap-3 text-sm mb-3">
//                                         <div className="bg-gray-50 rounded-lg p-2">عدد العناصر: <span className="font-bold">{orderItems.length}</span></div>
//                                         <div className="bg-gray-50 rounded-lg p-2">إجمالي الكمية: <span className="font-bold">{totalPreviewQuantity}</span></div>
//                                     </div>
//                                     <div className="max-h-64 overflow-y-auto border rounded-lg">
//                                         <table className="w-full table-fixed border-collapse text-sm">
//                                             <thead className="bg-gray-100 sticky top-0">
//                                                 <tr>
//                                                     <th className="p-2 text-right border-b break-words">المادة</th>
//                                                     <th className="p-2 text-right border-b break-words">المسطرة</th>
//                                                     <th className="p-2 text-right border-b break-words">اللون</th>
//                                                     <th className="p-2 text-center border-b break-words">الأبعاد</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {orderItems.map(item => (
//                                                     <tr key={item.id} className="border-b">
//                                                         <td className="p-2 break-words">{item.material_name}</td>
//                                                         <td className="p-2 break-words">{item.ruler_name}</td>
//                                                         <td className="p-2 break-words">{item.color_name}</td>
//                                                         <td className="p-2 text-center break-words">
//                                                             {(item.width || "-")}x{(item.thickness || "0.6")}x{(item.quantity || "-")}
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 </StyledDialog>
//                             )}
//                             <Card className="flex flex-col h-full min-h-0 overflow-hidden">
//                                 {/* رأس الجدول - ثابت */}
//                                 <div className="flex justify-between items-center p-3 border-b bg-gray-50 flex-shrink-0">
//                                     <span className="font-bold text-base">العناصر المضافة: {orderItems.length}</span>
//                                     <Button
//                                         size="lg"
//                                         onClick={() => setShowPreview(true)}
//                                         disabled={loading || orderItems.length === 0}
//                                         className="h-12 bg-secondary-s hover:brightness-110 text-base px-6 text-white touch-manipulation active:scale-95 transition-transform"
//                                     >
//                                         <Check className="w-5 h-5 ml-2" />
//                                         حفظ الطلب
//                                     </Button>
//                                 </div>

//                                 {/* الجدول مع التمرير العمودي فقط */}
//                                 <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
//                                     <table className="w-full table-fixed border-collapse">
//                                         <thead className="bg-gray-100 sticky top-0 z-10">
//                                             <tr>
//                                                 <th className="p-1 text-sm text-right border-b break-words">المادة</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">المسطرة</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">اللون</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">النوع</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">العرض</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">السماكة</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">الكمية</th>
//                                                 <th className="p-1 text-sm text-right border-b break-words">حذف</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {orderItems.map(item => (
//                                                 <tr key={item.id} className="border-b hover:bg-gray-50">
//                                                     <td className="p-3 break-words">{item.material_name}</td>
//                                                     <td className="p-3 break-words">{item.ruler_name}</td>
//                                                     <td className="p-3 break-words">{item.color_name}</td>
//                                                     <td className="p-3 text-center break-words">
//                                                         {item.type_item === "Machine" ? "مكنة" : "كوي"}
//                                                     </td>
//                                                     <td className="p-3 text-center break-words">{item.width || "-"}</td>
//                                                     <td className="p-3 text-center break-words">{item.thickness || "0.6"}</td>
//                                                     <td className="p-3 text-center font-bold break-words">{item.quantity} م</td>
//                                                     <td className="p-3 text-center">
//                                                         <button
//                                                             onClick={() => removeItem(item.id)}
//                                                             className="text-red-600 hover:bg-red-50 p-2 rounded-lg touch-manipulation active:scale-95 transition-transform"
//                                                         >
//                                                             <Trash2 className="w-5 h-5" />
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                             {orderItems.length === 0 && (
//                                                 <tr>
//                                                     <td colSpan="8" className="p-8 text-center text-gray-400 text-base">
//                                                         لا توجد عناصر مضافة
//                                                     </td>
//                                                 </tr>
//                                             )}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </Card>
//                         </div>
//                     </div>
//                 ) : (
//                     /* وضع السجل */
//                     <Card className="flex flex-col h-full min-h-0 overflow-hidden p-4">
//                         <div className="flex justify-between items-center mb-3 flex-shrink-0">
//                             <h2 className="font-bold text-xl">سجل الطلبات</h2>
//                             <Button
//                                 size="lg"
//                                 variant="outline"
//                                 onClick={loadOrders}
//                                 disabled={ordersLoading}
//                                 className="px-6 py-3 text-base bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110 touch-manipulation active:scale-95 transition-transform"
//                             >
//                                 <RotateCcw className="w-5 h-5 ml-2" />
//                                 تحديث
//                             </Button>
//                         </div>

//                         {/* جدول السجل مع التمرير العمودي فقط */}
//                         <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 border rounded-lg bg-white">
//                             <table className="w-full table-fixed border-collapse">
//                                 <thead className="bg-gray-100 sticky top-0">
//                                     <tr>
//                                         <th className="p-3 text-right border-b break-words">#</th>
//                                         <th className="p-3 text-right border-b break-words">التاريخ</th>
//                                         <th className="p-3 text-center border-b break-words">عدد العناصر</th>
//                                         <th className="p-3 text-center border-b break-words">الإجمالي</th>
//                                         <th className="p-3 text-center border-b break-words">المبيعات</th>
//                                         <th className="p-3 text-center border-b break-words">الزبون</th>
//                                         <th className="p-3 text-center border-b break-words">ملاحظات</th>
//                                         <th className="p-3 text-center border-b break-words">الحالة</th>
//                                         <th className="p-3 text-center border-b break-words">عرض</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {ordersLoading ? (
//                                         <tr><td colSpan="9" className="p-6"><LoadingState /></td></tr>
//                                     ) : orders.map(order => (
//                                         <tr key={order.order_id} className="border-b hover:bg-gray-50">
//                                             <td className="p-3 break-words">{order.order_id}</td>
//                                             <td className="p-3 break-words">{order.created_at?.split("T")[0]}</td>
//                                             <td className="p-3 text-center break-words">{order.count_items ?? order.items?.length ?? 0}</td>
//                                             <td className="p-3 text-center break-words">{order.total_amount ?? "-"}</td>
//                                             <td className="p-3 text-center break-words">{order.sales?.full_name || order.sales?.username || "-"}</td>
//                                             <td className="p-3 text-center break-words">{order.customer?.name || "-"}</td>
//                                             <td className="p-3 text-center break-words">{order.notes || "-"}</td>
//                                             <td className="p-3 text-center break-words">
//                                                 <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
//                                                     {getStatusLabel(order.status)}
//                                                 </span>
//                                             </td>
//                                             <td className="p-3 text-center">
//                                                 <Button
//                                                     size="lg"
//                                                     variant="outline"
//                                                     className="h-10 px-3 touch-manipulation active:scale-95 transition-transform"
//                                                     onClick={() => setSelectedOrder(order)}
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                 </Button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>

//                         {selectedOrder && (
//                             <StyledDialog
//                                 isOpen={Boolean(selectedOrder)}
//                                 onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}
//                                 title={`تفاصيل الطلب #${selectedOrder.order_id}`}
//                                 onCancel={() => setSelectedOrder(null)}
//                                 cancelLabel="إغلاق"
//                                 showFooter={false}
//                             >
//                                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
//                                     <div className="bg-white p-2 rounded-lg border">الحالة: {getStatusLabel(selectedOrder.status)}</div>
//                                     <div className="bg-white p-2 rounded-lg border">الإجمالي: {selectedOrder.total_amount || "-"}</div>
//                                     <div className="bg-white p-2 rounded-lg border">عدد العناصر: {selectedOrder.count_items ?? selectedOrder.items?.length ?? 0}</div>
//                                     <div className="bg-white p-2 rounded-lg border">المبيعات: {selectedOrder.sales?.full_name || selectedOrder.sales?.username || "-"}</div>
//                                     <div className="bg-white p-2 rounded-lg border">الزبون: {selectedOrder.customer?.name || "-"}</div>
//                                     <div className="bg-white p-2 rounded-lg border">ملاحظات: {selectedOrder.notes || "-"}</div>
//                                 </div>
//                                 {selectedOrder.items?.length > 0 && (
//                                     <div className="mt-3 grid grid-cols-2 gap-2 text-base">
//                                         {selectedOrder.items.map((item, i) => (
//                                             <div key={i} className="bg-white p-2 rounded-lg border whitespace-nowrap overflow-hidden text-ellipsis">
//                                                 {item.type_item === "Machine" ? "مكنة" : "كوي"} | {item.width || "-"} | {item.quantity} م
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </StyledDialog>
//                         )}
//                     </Card>
//                 )}
//             </div>
//         </div>
//     );
//   }
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

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
// }
