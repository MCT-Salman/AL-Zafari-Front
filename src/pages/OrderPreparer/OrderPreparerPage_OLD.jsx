// src/pages/OrderPreparer/OrderPreparerPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/common/DashboardHeader";
import { orderApi } from "../../api/orderApi";
import { salesApi } from "../../api/salesApi";
import { productionApi } from "../../api/productionApi";
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
import QRCode from "qrcode";
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

export default function OrderPreparerPage() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState("orders"); // orders | production-orders | new-production
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
            const qrData = {
                order_id: order.order_id,
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
        } catch (error) {
            toast.error("فشل في توليد كود QR");
            console.error("QR Code generation error:", error);
        }
    };

    // Print QR Code
    const printQRCode = () => {
        if (!qrCodeDataUrl) return;

        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>QR Code - Order #${selectedOrderForQR?.order_id}</title>
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
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .order-details {
                        font-size: 12px;
                        text-align: right;
                        line-height: 1.5;
                    }
                    @media print {
                        body { margin: 0; }
                        .qr-container { 
                            page-break-inside: avoid;
                            border: 1px solid #333;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="order-info">طلب رقم #${selectedOrderForQR?.order_id}</div>
                    <img src="${qrCodeDataUrl}" class="qr-image" alt="QR Code" />
                    <div class="order-details">
                        <div>العميل: ${selectedOrderForQR?.customer?.name || 'N/A'}</div>
                        <div>المادة: ${selectedOrderForQR?.items?.[0]?.material_name || 'N/A'}</div>
                        <div>اللون: ${selectedOrderForQR?.items?.[0]?.color_name || 'N/A'}</div>
                        <div>العرض: ${selectedOrderForQR?.items?.[0]?.width || 'N/A'}</div>
                        <div>الكمية: ${selectedOrderForQR?.items?.[0]?.quantity || 'N/A'}</div>
                        <div>النوع: ${formatTypeItem(selectedOrderForQR?.items?.[0]?.type_item)}</div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
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
                String(order.production_order_id || "").toLowerCase().includes(term) ||
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
        if (activeTab === "orders") loadOrders();
        if (activeTab === "production-orders") loadProductionOrders();
    }, [activeTab]);

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
            } else if (field === "ruler_id") {
                newData.color_id = "";
                newData.batch_id = "";
            } else if (field === "color_id") {
                newData.batch_id = "";
            }

            return newData;
        });
    };

    const handleItemFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addProductionItem = () => {
        if (!formData.width || !formData.quantity) {
            toast.error("يرجى إدخال العرض والكمية");
            return;
        }

        if (!formData.color_id) {
            toast.error("يرجى اختيار اللون");
            return;
        }

        const newItem = {
            id: Date.now(),
            material_id: formData.material_id,
            ruler_id: formData.ruler_id,
            color_id: formData.color_id,
            batch_id: formData.batch_id,
            width: formData.width,
            thickness: formData.thickness,
            quantity: formData.quantity,
            type_item: formData.type_item,
            notes: formData.notes
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

        setFormData({
            ...formData,
            width: "",
            quantity: "",
            notes: ""
        });
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
        if (!formData.material_id || !formData.type_item || !formData.color_id || !formData.batch_id || !formData.width) {
            toast.error("يرجى ملء جميع الحقول المطلوبة");
            return;
        }

        try {
            setLoading(true);

            const orderData = {
                status: "pending",
                notes: formData.notes,
                items: [{
                    type_item: formData.type_item,
                    color_id: formData.color_id,
                    batch_id: formData.batch_id,
                    width: parseFloat(formData.width),
                    length: parseFloat(formData.quantity) || 100,
                    thickness: parseFloat(formData.thickness) || 0.6,
                    notes: formData.notes
                }]
            };

            const response = await salesApi.createSalesOrder(orderData);
            
            if (response.success) {
                toast.success("تم حفظ طلب الإنتاج بنجاح");
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
            toast.error("فشل في حفظ طلب الإنتاج");
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

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Header */}
            <DashboardHeader
                title="طلب انتاج"
                user={user}
                onLogout={logout}
                isVisible={isHeaderVisible}
                onToggleVisibility={() => setIsHeaderVisible(!isHeaderVisible)}
            />

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8 space-x-reverse">
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "orders"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <FileText className="h-4 w-4" />
                                <span>سجل الطلبات</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("production-orders")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "production-orders"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Package className="h-4 w-4" />
                                <span>سجل طلبات الإنتاج</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("new-production")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "new-production"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <Plus className="h-4 w-4" />
                                <span>طلب جديد للإنتاج</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "orders" && (
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
                                                                <span className={`px-2 py-1 text-xs rounded-full ${orderApi.getStatusBadge(order.status)?.className}`}>
                                                                    {orderApi.getStatusBadge(order.status)?.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-right">{orderApi.getSalesUserName(order)}</td>
                                                            <td className="p-2 text-right">{orderApi.getFormattedDate(order)}</td>
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

                {/* Production Orders Tab */}
                {activeTab === "production-orders" && (
                    <div className="p-6 space-y-6">
                        {/* Filters */}
                        <Card className="p-4">
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <Input
                                        placeholder="بحث في طلبات الإنتاج..."
                                        value={productionSearchTerm}
                                        onChange={(e) => setProductionSearchTerm(e.target.value)}
                                    />
                                </div>
                                <FilterSelect
                                    value={productionStatusFilter}
                                    onChange={setProductionStatusFilter}
                                    options={PRODUCTION_STATUS_OPTIONS}
                                    placeholder="الحالة"
                                />
                            </div>
                        </Card>

                        {/* Production Orders Table */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">سجل طلبات الإنتاج</h3>
                                <ResultsCounter
                                    total={filteredProductionOrders.length}
                                    showing={paginatedProductionOrders.length}
                                    label="طلب إنتاج"
                                />
                            </div>

                            {productionOrdersLoading ? (
                                <LoadingState />
                            ) : paginatedProductionOrders.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            {renderTableHeader(getTableColumns("SALES_ORDERS"))}
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedProductionOrders.map((order) => {
                                                    const firstItem = order.items?.[0] || {};
                                                    return (
                                                        <tr key={order.Sales_order_id} className="hover:bg-gray-50">
                                                            <td className="p-2 text-right">#{order.Sales_order_id}</td>
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
                                                                <span className={`px-2 py-1 text-xs rounded-full ${salesApi.getStatusBadge(order.status)?.className}`}>
                                                                    {salesApi.getStatusBadge(order.status)?.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-right">{salesApi.getIssuedBy(order)}</td>
                                                            <td className="p-2 text-right">{salesApi.getFormattedDate(order)}</td>
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
                                            value={productionRowsPerPage}
                                            onChange={setProductionRowsPerPage}
                                            total={filteredProductionOrders.length}
                                        />
                                        <PaginationControls
                                            currentPage={productionCurrentPage}
                                            totalPages={productionTotalPages}
                                            onPageChange={setProductionCurrentPage}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    لا توجد طلبات إنتاج مطابقة
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* New Production Order Tab */}
                {activeTab === "new-production" && (
                    <div className="p-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">إنشاء طلب إنتاج جديد</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Material Selection */}
                                <div>
                                    <Label className="block text-sm font-medium mb-2">المادة</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {materials.map(material => (
                                            <button
                                                key={material.material_id}
                                                onClick={() => handleFieldChange("material_id", String(material.material_id))}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    formData.material_id === String(material.material_id)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {material.material_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div>
                                    <Label className="block text-sm font-medium mb-2">النوع</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TYPE_ITEM_OPTIONS.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => handleFieldChange("type_item", type.value)}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    formData.type_item === type.value
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Width Selection */}
                                <div>
                                    <Label className="block text-sm font-medium mb-2">العرض</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {widthValues.map(width => (
                                            <button
                                                key={width.value}
                                                onClick={() => handleFieldChange("width", String(width.value))}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    formData.width === String(width.value)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {width.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div>
                                    <Label className="block text-sm font-medium mb-2">اللون</Label>
                                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                        {filteredColors.map(color => (
                                            <button
                                                key={color.color_id}
                                                onClick={() => handleFieldChange("color_id", String(color.color_id))}
                                                className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                                                    formData.color_id === String(color.color_id)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-semibold">{color.color_code}</div>
                                                    <div className="text-xs">{color.color_name}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Batch Selection */}
                                <div>
                                    <Label className="block text-sm font-medium mb-2">الدفعة</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredBatches.map(batch => (
                                            <button
                                                key={batch.batch_id}
                                                onClick={() => handleFieldChange("batch_id", String(batch.batch_id))}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    formData.batch_id === String(batch.batch_id)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {batch.batch_number}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantity and Notes */}
                                <div className="space-y-4">
                                    <div>
                                        <Label className="block text-sm font-medium mb-2">الكمية</Label>
                                        <Input
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => handleFieldChange("quantity", e.target.value)}
                                            placeholder="أدخل الكمية"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium mb-2">السماكة</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.thickness}
                                            onChange={(e) => handleFieldChange("thickness", e.target.value)}
                                            placeholder="أدخل السماكة"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium mb-2">ملاحظات</Label>
                                        <Input
                                            value={formData.notes}
                                            onChange={(e) => handleFieldChange("notes", e.target.value)}
                                            placeholder="ملاحظات اختيارية"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex justify-end space-x-4 space-x-reverse">
                                <Button
                                    onClick={saveProductionOrder}
                                    disabled={loading || !formData.material_id || !formData.type_item || !formData.color_id || !formData.batch_id || !formData.width}
                                    className="px-6 py-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 ml-2" />
                                            حفظ الطلب
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

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
                                    <p>رقم الطلب: #{selectedOrderForQR?.order_id}</p>
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

                {/* Other tabs content would go here - similar to original */}
            </div>
        </div>
    );
}