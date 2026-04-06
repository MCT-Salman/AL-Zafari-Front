// src/pages/OrderPreparer/OrderPreparerStandalone.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/common/DashboardHeader";
import { salesApi } from "../../api/salesApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
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
import { getTableColumns, renderTableHeader } from "../../components/common/StandardTableColumns";
// import QRCode from "qrcode"; // Commented out temporarily
import {
    ShoppingCart,
    Plus,
    History,
    Trash2,
    Eye,
    Check,
    Users,
    X,
    AlertCircle,
    Edit,
    Save,
    Download,
    ChevronLeft,
    ChevronRight,
    Package,
    FileText,
    Settings,
    QrCode,
    Printer
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, OrderStatus, ProductionStatus } from "../../types/enums";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function OrderPreparerStandalone() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [viewMode, setViewMode] = useState("qr"); // qr | production | orders
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const tableContainerRef = useRef(null);

    // Data
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [widthValues, setWidthValues] = useState([]);
    const [loadingWidths, setLoadingWidths] = useState(false);

    // Orders data
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [productionOrders, setProductionOrders] = useState([]);
    const [productionOrdersLoading, setProductionOrdersLoading] = useState(false);

    // QR Code states
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
    const [selectedOrderForQR, setSelectedOrderForQR] = useState(null);

    // Filters
    const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
    const [ordersStatusFilter, setOrdersStatusFilter] = useState("");
    const [productionSearchTerm, setProductionSearchTerm] = useState("");
    const [productionStatusFilter, setProductionStatusFilter] = useState("");

    // Pagination
    const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
    const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(20);
    const [productionCurrentPage, setProductionCurrentPage] = useState(1);
    const [productionRowsPerPage, setProductionRowsPerPage] = useState(20);

    // Production Order Form
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

    const [productionItems, setProductionItems] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);

    // Numpad
    const [activeField, setActiveField] = useState("quantity");

    const TYPE_ITEM_OPTIONS = [
        { value: TypeItem.Machine, label: "مكنة" },
        { value: TypeItem.Presser, label: "كوي" }
    ];

    const ORDER_STATUS_OPTIONS = [
        { value: OrderStatus.pending, label: "قيد الانتظار" },
        { value: OrderStatus.preparing, label: "قيد التحضير" },
        { value: OrderStatus.outofwarehouse, label: "اخراج من المستودع" },
        { value: OrderStatus.completed, label: "مكتمل" },
        { value: OrderStatus.canceled, label: "ملغي" }
    ];

    const PRODUCTION_STATUS_OPTIONS = [
        { value: ProductionStatus.pending, label: "قيد الانتظار" },
        { value: ProductionStatus.preparing, label: "قيد التحضير" },
        { value: ProductionStatus.completed, label: "مكتمل" },
        { value: ProductionStatus.canceled, label: "ملغي" }
    ];

    const formatTypeItem = (value) => {
        if (value === TypeItem.Machine) return "مكنة";
        if (value === TypeItem.Presser) return "كوي";
        return "-";
    };

    // Generate QR Code for order
    const generateQRCode = async (order) => {
        try {
            // QR functionality temporarily disabled
            toast.error("وظيفة QR غير متاحة حالياً");
            console.log("QR Code generation disabled for order:", order);
            
            // TODO: Re-enable when qrcode module is properly installed
            /*
            const qrData = {
                order_id: order.Sales_order_id || order.order_id,
                customer_name: order.customer?.name || "N/A",
                material: order.items?.[0]?.material_name || "N/A",
                color: order.items?.[0]?.color_name || "N/A",
                width: order.items?.[0]?.width || "N/A",
                quantity: order.items?.[0]?.quantity || "N/A",
                type: order.items?.[0]?.type_item || "N/A",
                status: order.status,
                date: new Date().toISOString()
            };

            const qrString = JSON.stringify(qrData);
            const dataUrl = await QRCode.toDataURL(qrString, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeDataUrl(dataUrl);
            setSelectedOrderForQR(order);
            setShowQRDialog(true);
            */
        } catch (error) {
            toast.error("فشل في توليد كود QR");
            console.error("QR Code generation error:", error);
        }
    };

    // Print QR Code
    const printQRCode = () => {
        // QR functionality temporarily disabled
        toast.error("وظيفة الطباعة غير متاحة حالياً");
        console.log("Print QR Code functionality disabled");
        
        // TODO: Re-enable when qrcode module is properly installed
        /*
        if (!qrCodeDataUrl) return;

        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>QR Code - Order #${selectedOrderForQR?.Sales_order_id || selectedOrderForQR?.order_id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                        margin: 0;
                    }
                    .qr-container {
                        display: inline-block;
                        padding: 20px;
                        border: 2px solid #333;
                        border-radius: 10px;
                        margin: 20px;
                    }
                    .qr-image {
                        width: 250px;
                        height: 250px;
                        margin-bottom: 15px;
                    }
                    .order-info {
                        font-size: 14px;
                        margin-bottom: 10px;
                    }
                    .order-info strong {
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-image" />
                    <div class="order-info">
                        <strong>رقم الطلب:</strong> #${selectedOrderForQR?.Sales_order_id || selectedOrderForQR?.order_id}<br>
                        <strong>العميل:</strong> ${selectedOrderForQR?.customer?.name || 'N/A'}<br>
                        <strong>المادة:</strong> ${selectedOrderForQR?.items?.[0]?.material_name || 'N/A'}<br>
                        <strong>اللون:</strong> ${selectedOrderForQR?.items?.[0]?.color_name || 'N/A'}<br>
                        <strong>العرض:</strong> ${selectedOrderForQR?.items?.[0]?.width || 'N/A'}<br>
                        <strong>الكمية:</strong> ${selectedOrderForQR?.items?.[0]?.quantity || 'N/A'}<br>
                        <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        */
    };

    // Filtered data
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const term = String(ordersSearchTerm || "").toLowerCase().trim();
            const matchesSearch = !term || (
                String(order.order_id || "").toLowerCase().includes(term) ||
                (order.customer?.name && String(order.customer.name).toLowerCase().includes(term)) ||
                (order.notes && String(order.notes).toLowerCase().includes(term)) ||
                (order.status && String(order.status).toLowerCase().includes(term))
            );
            const matchesStatus = !ordersStatusFilter || String(order.status || "").toLowerCase() === String(ordersStatusFilter).toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [orders, ordersSearchTerm, ordersStatusFilter]);

    const filteredProductionOrders = useMemo(() => {
        return productionOrders.filter(order => {
            const term = String(productionSearchTerm || "").toLowerCase().trim();
            const matchesSearch = !term || (
                String(order.Sales_order_id || "").toLowerCase().includes(term) ||
                (order.issued_by?.username && String(order.issued_by.username).toLowerCase().includes(term)) ||
                (order.color_name && String(order.color_name).toLowerCase().includes(term)) ||
                (order.notes && String(order.notes).toLowerCase().includes(term)) ||
                (order.status && String(order.status).toLowerCase().includes(term))
            );
            const matchesStatus = !productionStatusFilter || String(order.status || "").toLowerCase() === String(productionStatusFilter).toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [productionOrders, productionSearchTerm, productionStatusFilter]);

    // Pagination
    const ordersTotalPages = Math.ceil(filteredOrders.length / ordersRowsPerPage);
    const ordersStartIndex = (ordersCurrentPage - 1) * ordersRowsPerPage;
    const ordersEndIndex = ordersStartIndex + ordersRowsPerPage;
    const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndex);

    const productionTotalPages = Math.ceil(filteredProductionOrders.length / productionRowsPerPage);
    const productionStartIndex = (productionCurrentPage - 1) * productionRowsPerPage;
    const productionEndIndex = productionStartIndex + productionRowsPerPage;
    const paginatedProductionOrders = filteredProductionOrders.slice(productionStartIndex, productionEndIndex);

    // Reset page when filters change
    useEffect(() => {
        setOrdersCurrentPage(1);
    }, [ordersSearchTerm, ordersStatusFilter]);

    useEffect(() => {
        setProductionCurrentPage(1);
    }, [productionSearchTerm, productionStatusFilter]);

    // Load data
    useEffect(() => {
        loadInitialData();
        if (viewMode === "orders") loadOrders();
        if (viewMode === "production") loadProductionOrders();
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

            // Auto-select first material
            if (filteredMaterials.length > 0) {
                const firstMaterial = filteredMaterials[0];
                setFormData(prev => ({
                    ...prev,
                    material_id: String(firstMaterial.material_id)
                }));
            }

        } catch (error) {
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

    const loadOrders = async () => {
        try {
            setOrdersLoading(true);
            const response = await salesApi.getSalesOrders();
            const ordersData = response.data?.orders || response.data || response;
            const orders = Array.isArray(ordersData) ? ordersData : [];
            setOrders(orders);
        } catch (error) {
            toast.error("فشل في تحميل الطلبات");
        } finally {
            setOrdersLoading(false);
        }
    };

    const loadProductionOrders = async () => {
        try {
            setProductionOrdersLoading(true);
            const response = await salesApi.getSalesOrders();
            const ordersData = response.data?.orders || response.data || response;
            const orders = Array.isArray(ordersData) ? ordersData : [];
            setProductionOrders(orders);
        } catch (error) {
            toast.error("فشل في تحميل طلبات الإنتاج");
        } finally {
            setProductionOrdersLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === "material_id") {
                newData.ruler_id = "";
                newData.color_id = "";
                newData.batch_id = "";
            }

            if (field === "ruler_id") {
                newData.color_id = "";
                newData.batch_id = "";
            }

            if (field === "color_id") {
                newData.batch_id = "";
            }

            return newData;
        });
    };

    const addItem = () => {
        if (!formData.material_id || !formData.type_item || !formData.ruler_id || 
            !formData.color_id || !formData.batch_id || !formData.width) {
            toast.error("يرجى ملء جميع الحقول المطلوبة");
            return;
        }

        const newItem = {
            id: Date.now(),
            material_id: formData.material_id,
            type_item: formData.type_item,
            ruler_id: formData.ruler_id,
            color_id: formData.color_id,
            batch_id: formData.batch_id,
            width: formData.width,
            thickness: formData.thickness,
            quantity: formData.quantity,
            notes: formData.notes
        };

        if (editingItemId) {
            setProductionItems(prev => prev.map(item => 
                item.id === editingItemId ? { ...newItem, id: editingItemId } : item
            ));
            setEditingItemId(null);
        } else {
            setProductionItems(prev => [...prev, newItem]);
        }

        setFormData({
            ...formData,
            color_id: "",
            batch_id: "",
            width: "",
            quantity: "",
            notes: ""
        });

        toast.success(editingItemId ? "تم تحديث العنصر" : "تم إضافة العنصر");
    };

    const editItem = (id) => {
        const item = productionItems.find(i => i.id === id);
        if (item) {
            setFormData(item);
            setEditingItemId(id);
        }
    };

    const removeItem = (id) => {
        if (editingItemId === id) {
            setEditingItemId(null);
        }
        setProductionItems(prev => prev.filter(item => item.id !== id));
        toast.success("تم حذف العنصر");
    };

    const clearAllItems = () => {
        if (productionItems.length > 0) {
            setProductionItems([]);
            setEditingItemId(null);
            toast.success("تم مسح جميع العناصر");
        }
    };

    const saveProductionOrder = async () => {
        if (productionItems.length === 0) {
            toast.error("أضف عنصراً واحداً على الأقل");
            return;
        }

        try {
            setLoading(true);

            const orderData = {
                status: "pending",
                notes: formData.notes,
                items: productionItems.map(item => ({
                    type_item: item.type_item,
                    color_id: item.color_id,
                    batch_id: item.batch_id,
                    width: parseFloat(item.width),
                    length: parseFloat(item.quantity),
                    thickness: parseFloat(item.thickness) || 0.6,
                    notes: item.notes
                }))
            };

            const response = await salesApi.createSalesOrder(orderData);
            
            if (response.success) {
                toast.success("تم إرسال طلب الإنتاج بنجاح");
                setProductionItems([]);
                setFormData({
                    ...formData,
                    color_id: "",
                    batch_id: "",
                    width: "",
                    quantity: "",
                    notes: ""
                });
            }
        } catch (error) {
            toast.error("فشل في إرسال طلب الإنتاج");
        } finally {
            setLoading(false);
        }
    };

    const selectedMaterial = useMemo(() => {
        if (!formData.material_id) return null;
        return materials.find(m => String(m.material_id) === String(formData.material_id)) || null;
    }, [formData.material_id, materials]);

    const filteredColors = useMemo(() => {
        if (!formData.ruler_id) return colors;
        return colors.filter(c => String(c.ruler_id) === String(formData.ruler_id));
    }, [colors, formData.ruler_id]);

    const filteredBatches = useMemo(() => {
        if (!formData.color_id) return [];
        return batches.filter(b => String(b.color_id) === String(formData.color_id));
    }, [batches, formData.color_id]);

    // Helper functions from salesApi
    const getOrderStatus = (order) => order.status || 'غير محدد';
    const getFormattedDate = (order) => salesApi.getFormattedDate(order);
    const getStatusBadge = (status) => salesApi.getStatusBadge(status);
    const getIssuedBy = (order) => salesApi.getIssuedBy(order);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Header */}
            <DashboardHeader
                isHeaderVisible={isHeaderVisible}
                setIsHeaderVisible={setIsHeaderVisible}
                leftContent={
                    <div className="flex items-center flex-nowrap overflow-x-auto">
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setViewMode("qr")}
                            className={`px-4 py-2.5 text-base min-w-[120px] whitespace-nowrap touch-manipulation border-2 ${viewMode === "qr"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                        >
                            <QrCode className="w-5 h-5 ml-2" />
                            توليد QR
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setViewMode("production")}
                            className={`px-4 py-2.5 text-base min-w-[120px] whitespace-nowrap touch-manipulation border-2 ${viewMode === "production"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                        >
                            <Plus className="w-5 h-5 ml-2" />
                            طلب إنتاج
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setViewMode("orders")}
                            className={`px-4 py-2.5 text-base min-w-[120px] whitespace-nowrap touch-manipulation border-2 ${viewMode === "orders"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                }`}
                        >
                            <FileText className="w-5 h-5 ml-2" />
                            سجل الطلبات
                        </Button>
                    </div>
                }
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {viewMode === "qr" && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">توليد QR</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Section - Order Info */}
                                <div className="space-y-4">
                                    <div>
                                        <Label>رقم الطلب</Label>
                                        <Input
                                            placeholder="أدخل رقم الطلب"
                                            value={selectedOrderForQR ? selectedOrderForQR.Sales_order_id || selectedOrderForQR.order_id : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>اسم العميل</Label>
                                        <Input
                                            placeholder="أدخل اسم العميل"
                                            value={selectedOrderForQR ? selectedOrderForQR.customer?.name || '' : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>المادة</Label>
                                        <Input
                                            placeholder="المادة"
                                            value={selectedOrderForQR ? selectedOrderForQR.items?.[0]?.material_name || '' : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>اللون</Label>
                                        <Input
                                            placeholder="اللون"
                                            value={selectedOrderForQR ? `${selectedOrderForQR.items?.[0]?.color_name || ''} (${selectedOrderForQR.items?.[0]?.color_code || ''})` : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>
                                {/* Right Section - Additional Info */}
                                <div className="space-y-4">
                                    <div>
                                        <Label>العرض</Label>
                                        <Input
                                            placeholder="العرض"
                                            value={selectedOrderForQR ? selectedOrderForQR.items?.[0]?.width || '' : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>الكمية</Label>
                                        <Input
                                            placeholder="الكمية"
                                            value={selectedOrderForQR ? selectedOrderForQR.items?.[0]?.quantity || '' : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>النوع</Label>
                                        <Input
                                            placeholder="النوع"
                                            value={selectedOrderForQR ? formatTypeItem(selectedOrderForQR.items?.[0]?.type_item) : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label>الحالة</Label>
                                        <Input
                                            placeholder="الحالة"
                                            value={selectedOrderForQR ? selectedOrderForQR.status || '' : ''}
                                            readOnly
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-6">
                                <Button
                                    onClick={() => {
                                        setSelectedOrderForQR(null);
                                        setQrCodeDataUrl("");
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <X className="h-4 w-4 ml-2" />
                                    مسح
                                </Button>
                                <Button
                                    onClick={printQRCode}
                                    disabled={true}
                                    className="flex-1"
                                >
                                    <Printer className="h-4 w-4 ml-2" />
                                    طباعة QR (غير متاح)
                                </Button>
                            </div>
                        </Card>
                        
                        {/* Orders Table for QR Selection */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">اختر طلب لتوليد QR</h3>
                                <ResultsCounter
                                    total={filteredOrders.length}
                                    showing={paginatedOrders.length}
                                    label="طلب"
                                />
                            </div>

                            {ordersLoading ? (
                                <LoadingState />
                            ) : paginatedOrders.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            {renderTableHeader(getTableColumns("SALES_ORDERS"))}
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedOrders.map((order) => {
                                                    const firstItem = order.items?.[0] || {};
                                                    return (
                                                        <tr key={order.order_id} className="hover:bg-gray-50">
                                                            <td className="p-2 text-right">#{order.order_id}</td>
                                                            <td className="p-2 text-right">{firstItem.material_name || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                {firstItem.color_name || '-'} ({firstItem.color_code || '-'})
                                                            </td>
                                                            <td className="p-2 text-right">{firstItem.width || '-'}</td>
                                                            <td className="p-2 text-right">{firstItem.quantity || '-'}</td>
                                                            <td className="p-2 text-right">{formatTypeItem(firstItem.type_item)}</td>
                                                            <td className="p-2 text-right">{firstItem.batch_number || '-'}</td>
                                                            <td className="p-2 text-right">{firstItem.thickness || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)?.className}`}>
                                                                    {getStatusBadge(order.status)?.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-right">{getIssuedBy(order)}</td>
                                                            <td className="p-2 text-right">{getFormattedDate(order)}</td>
                                                            <td className="p-2 text-right">{order.notes || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                <div className="flex space-x-1 space-x-reverse">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => generateQRCode(order)}
                                                                        title="توليد QR Code"
                                                                    >
                                                                        <QrCode className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <RowsPerPageSelector
                                            value={ordersRowsPerPage}
                                            onChange={setOrdersRowsPerPage}
                                            total={filteredOrders.length}
                                        />
                                        <PaginationControls
                                            currentPage={ordersCurrentPage}
                                            totalPages={ordersTotalPages}
                                            onPageChange={setOrdersCurrentPage}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    لا توجد طلبات مطابقة
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {viewMode === "production" && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">طلب إنتاج</h3>
                            
                            {/* Material Selection */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>المادة</Label>
                                    <FilterSelect
                                        value={formData.material_id}
                                        onChange={(value) => handleFieldChange("material_id", value)}
                                        options={materials.map(m => ({
                                            value: String(m.material_id),
                                            label: String(m.material_name || "")
                                        }))}
                                        placeholder="اختر المادة"
                                    />
                                </div>
                                <div>
                                    <Label>النوع</Label>
                                    <FilterSelect
                                        value={formData.type_item}
                                        onChange={(value) => handleFieldChange("type_item", value)}
                                        options={TYPE_ITEM_OPTIONS}
                                        placeholder="اختر النوع"
                                    />
                                </div>
                            </div>

                            {/* Ruler and Color Selection */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>المسطرة</Label>
                                    <FilterSelect
                                        value={formData.ruler_id}
                                        onChange={(value) => handleFieldChange("ruler_id", value)}
                                        options={rulers.map(r => ({
                                            value: String(r.ruler_id),
                                            label: String(r.ruler_name || "")
                                        }))}
                                        placeholder="اختر المسطرة"
                                    />
                                </div>
                                <div>
                                    <Label>اللون</Label>
                                    <FilterSelect
                                        value={formData.color_id}
                                        onChange={(value) => handleFieldChange("color_id", value)}
                                        options={filteredColors.map(c => ({
                                            value: String(c.color_id),
                                            label: `${c.color_name} (${c.color_code})`
                                        }))}
                                        placeholder="اختر اللون"
                                    />
                                </div>
                            </div>

                            {/* Width and Batch Selection */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>العرض</Label>
                                    <FilterSelect
                                        value={formData.width}
                                        onChange={(value) => handleFieldChange("width", value)}
                                        options={widthValues.map(w => ({
                                            value: String(w.value),
                                            label: String(w.label || w.value)
                                        }))}
                                        placeholder="اختر العرض"
                                    />
                                </div>
                                <div>
                                    <Label>الدفعة</Label>
                                    <FilterSelect
                                        value={formData.batch_id}
                                        onChange={(value) => handleFieldChange("batch_id", value)}
                                        options={filteredBatches.map(b => ({
                                            value: String(b.batch_id),
                                            label: b.batch_number
                                        }))}
                                        placeholder="اختر الدفعة"
                                    />
                                </div>
                            </div>

                            {/* Quantity, Thickness and Notes */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <Label>الكمية</Label>
                                    <Input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => handleFieldChange("quantity", e.target.value)}
                                        placeholder="أدخل الكمية"
                                    />
                                </div>
                                <div>
                                    <Label>السماكة</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData.thickness}
                                        onChange={(e) => handleFieldChange("thickness", e.target.value)}
                                        placeholder="أدخل السماكة"
                                    />
                                </div>
                                <div>
                                    <Label>ملاحظات</Label>
                                    <Input
                                        value={formData.notes}
                                        onChange={(e) => handleFieldChange("notes", e.target.value)}
                                        placeholder="ملاحظات اختيارية"
                                    />
                                </div>
                            </div>

                            {/* Items List */}
                            {productionItems.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium">العناصر المضافة</h4>
                                        <Button variant="outline" size="sm" onClick={clearAllItems}>
                                            <Trash2 className="h-4 w-4 ml-2" />
                                            مسح الكل
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {productionItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm">
                                                    <span className="font-medium">{formatTypeItem(item.type_item)}</span>
                                                    <span className="mr-4">{item.width}</span>
                                                    <span className="mr-4">{item.quantity}</span>
                                                </div>
                                                <div className="flex space-x-2 space-x-reverse">
                                                    <Button variant="ghost" size="sm" onClick={() => editItem(item.id)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 space-x-reverse">
                                <Button
                                    onClick={addItem}
                                    disabled={loading || !formData.material_id || !formData.type_item || !formData.ruler_id || 
                                            !formData.color_id || !formData.batch_id || !formData.width}
                                    variant="outline"
                                    className="px-6 py-2"
                                >
                                    <Plus className="h-4 w-4 ml-2" />
                                    إضافة عنصر
                                </Button>
                                <Button
                                    onClick={saveProductionOrder}
                                    disabled={loading || productionItems.length === 0}
                                    className="px-6 py-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 ml-2" />
                                            إرسال الطلب
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {viewMode === "orders" && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <Card className="p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="بحث في الطلبات..."
                                        value={ordersSearchTerm}
                                        onChange={(e) => setOrdersSearchTerm(e.target.value)}
                                    />
                                </div>
                                <FilterSelect
                                    value={ordersStatusFilter}
                                    onChange={setOrdersStatusFilter}
                                    options={ORDER_STATUS_OPTIONS}
                                    placeholder="الحالة"
                                />
                            </div>
                        </Card>

                        {/* Orders Table */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">سجل الطلبات</h3>
                                <ResultsCounter
                                    total={filteredOrders.length}
                                    showing={paginatedOrders.length}
                                    label="طلب"
                                />
                            </div>

                            {ordersLoading ? (
                                <LoadingState />
                            ) : paginatedOrders.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            {renderTableHeader(getTableColumns("SALES_ORDERS"))}
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedOrders.map((order) => {
                                                    const firstItem = order.items?.[0] || {};
                                                    return (
                                                        <tr key={order.order_id} className="hover:bg-gray-50">
                                                            <td className="p-2 text-right">#{order.order_id}</td>
                                                            <td className="p-2 text-right">{firstItem.material_name || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                {firstItem.color_name || '-'} ({firstItem.color_code || '-'})
                                                            </td>
                                                            <td className="p-2 text-right">{firstItem.width || '-'}</td>
                                                            <td className="p-2 text-right">{firstItem.quantity || '-'}</td>
                                                            <td className="p-2 text-right">{formatTypeItem(firstItem.type_item)}</td>
                                                            <td className="p-2 text-right">{firstItem.batch_number || '-'}</td>
                                                            <td className="p-2 text-right">{firstItem.thickness || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)?.className}`}>
                                                                    {getStatusBadge(order.status)?.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-right">{getIssuedBy(order)}</td>
                                                            <td className="p-2 text-right">{getFormattedDate(order)}</td>
                                                            <td className="p-2 text-right">{order.notes || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                <div className="flex space-x-1 space-x-reverse">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => generateQRCode(order)}
                                                                        title="توليد QR Code"
                                                                    >
                                                                        <QrCode className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <RowsPerPageSelector
                                            value={ordersRowsPerPage}
                                            onChange={setOrdersRowsPerPage}
                                            total={filteredOrders.length}
                                        />
                                        <PaginationControls
                                            currentPage={ordersCurrentPage}
                                            totalPages={ordersTotalPages}
                                            onPageChange={setOrdersCurrentPage}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    لا توجد طلبات مطابقة
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            {/* QR Code Dialog */}
            <StyledDialog
                isOpen={showQRDialog}
                onClose={() => setShowQRDialog(false)}
                title="QR Code للطلب"
            >
                <div className="text-center">
                    {qrCodeDataUrl && (
                        <div>
                            <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto mb-4" />
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p>رقم الطلب: #{selectedOrderForQR?.Sales_order_id || selectedOrderForQR?.order_id}</p>
                                <p>العميل: {selectedOrderForQR?.customer?.name}</p>
                                <p>المادة: {selectedOrderForQR?.items?.[0]?.material_name}</p>
                                <p>اللون: {selectedOrderForQR?.items?.[0]?.color_name}</p>
                                <p>العرض: {selectedOrderForQR?.items?.[0]?.width}</p>
                                <p>الكمية: {selectedOrderForQR?.items?.[0]?.quantity}</p>
                            </div>
                            <div className="flex space-x-2 space-x-reverse justify-center">
                                <Button onClick={printQRCode}>
                                    <Printer className="h-4 w-4 ml-2" />
                                    طباعة
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowQRDialog(false)}
                                >
                                    إغلاق
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </StyledDialog>
        </div>
    );
}