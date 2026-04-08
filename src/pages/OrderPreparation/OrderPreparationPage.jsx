// src/pages/OrderPreparation/OrderPreparationPage.jsx
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
    Settings
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { getApiData } from "../../utils/api";
import toast from "react-hot-toast";
import { TypeItem, OrderStatus, ProductionStatus } from "../../types/enums";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function OrderPreparationPage() {
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
                toast.success("تم حفظ طلب الإنتاج بنجاح");
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

                {activeTab === "production-orders" && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <Card className="p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
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
                                    label="طلب"
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
                                                            <td className="p-2 text-right">{firstItem.color?.ruler?.material?.material_name || '-'}</td>
                                                            <td className="p-2 text-right">
                                                                {firstItem.color?.color_name || '-'} ({firstItem.color?.color_code || '-'})
                                                            </td>
                                                            <td className="p-2 text-right">{firstItem.width || '-'}</td>
                                                            <td className="p-2 text-right">{firstItem.quantity || '-'}</td>
                                                            <td className="p-2 text-right">{formatTypeItem(firstItem.type_item)}</td>
                                                            <td className="p-2 text-right">{firstItem.batch?.batch_number || firstItem.batch_number || '-'}</td>
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

                {activeTab === "new-production" && (
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
                                            label: m.material_name
                                        }))}
                                        placeholder="اختر المادة"
                                    />
                                </div>
                                <div>
                                    <Label>المسطرة</Label>
                                    <FilterSelect
                                        value={formData.ruler_id}
                                        onChange={(value) => handleFieldChange("ruler_id", value)}
                                        options={rulers.filter(r => !formData.material_id || String(r.material_id) === String(formData.material_id)).map(r => ({
                                            value: String(r.ruler_id),
                                            label: r.ruler_name
                                        }))}
                                        placeholder="اختر المسطرة"
                                        disabled={!formData.material_id}
                                    />
                                </div>
                            </div>

                            {/* Color and Batch */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                        disabled={!formData.ruler_id}
                                    />
                                </div>
                                <div>
                                    <Label>الطبخة</Label>
                                    <FilterSelect
                                        value={formData.batch_id}
                                        onChange={(value) => handleFieldChange("batch_id", value)}
                                        options={filteredBatches.map(b => ({
                                            value: String(b.batch_id),
                                            label: b.batch_number || `دفعة ${b.batch_id}`
                                        }))}
                                        placeholder="اختر الطبخة"
                                        disabled={!formData.color_id}
                                    />
                                </div>
                            </div>

                            {/* Type and Dimensions */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <Label>النوع</Label>
                                    <FilterSelect
                                        value={formData.type_item}
                                        onChange={(value) => handleFieldChange("type_item", value)}
                                        options={TYPE_ITEM_OPTIONS}
                                        placeholder="اختر النوع"
                                    />
                                </div>
                                <div>
                                    <Label>العرض</Label>
                                    <Input
                                        value={formData.width}
                                        onChange={(e) => handleItemFieldChange("width", e.target.value)}
                                        placeholder="العرض"
                                        onFocus={() => setActiveField("width")}
                                    />
                                </div>
                                <div>
                                    <Label>الكمية</Label>
                                    <Input
                                        value={formData.quantity}
                                        onChange={(e) => handleItemFieldChange("quantity", e.target.value)}
                                        placeholder="الكمية"
                                        onFocus={() => setActiveField("quantity")}
                                    />
                                </div>
                            </div>

                            {/* Thickness and Notes */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>السماكة</Label>
                                    <Input
                                        value={formData.thickness}
                                        onChange={(e) => handleItemFieldChange("thickness", e.target.value)}
                                        placeholder="السماكة"
                                        onFocus={() => setActiveField("thickness")}
                                    />
                                </div>
                                <div>
                                    <Label>ملاحظات</Label>
                                    <Input
                                        value={formData.notes}
                                        onChange={(e) => handleItemFieldChange("notes", e.target.value)}
                                        placeholder="ملاحظات"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button onClick={addProductionItem} className="flex-1">
                                    <Plus className="h-4 w-4 ml-2" />
                                    إضافة عنصر
                                </Button>
                                <Button variant="outline" onClick={clearAllItems}>
                                    مسح الكل
                                </Button>
                            </div>
                        </Card>

                        {/* Production Items */}
                        {productionItems.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">عناصر طلب الإنتاج</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {productionItems.map((item, index) => {
                                        const color = colors.find(c => String(c.color_id) === String(item.color_id));
                                        const batch = batches.find(b => String(b.batch_id) === String(item.batch_id));
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="text-sm">
                                                    <span className="font-medium">{index + 1}. </span>
                                                    {color?.color_name} - {item.width}×{item.quantity}
                                                    {batch && ` - ${batch.batch_number}`}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4">
                                    <Button onClick={saveProductionOrder} className="w-full" disabled={loading}>
                                        {loading ? "جاري الحفظ..." : "حفظ طلب الإنتاج"}
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}