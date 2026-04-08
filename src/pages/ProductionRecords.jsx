// src\pages\ProductionRecords.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { productionApi } from "../api/productionApi";
import { colorApi } from "../api/colorApi";
import { batchApi } from "../api/batchApi";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import FilterSelect from "../components/common/FilterSelect";
import StyledDialog from "../components/common/StyledDialog";
import PaginationControls from "../components/common/PaginationControls";
import ResultsCounter from "../components/common/ResultsCounter";
import RowsPerPageSelector from "../components/common/RowsPerPageSelector";
import NotificationsBell from "../components/common/NotificationsBell";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
    ShoppingCart,
    Plus,
    History,
    Trash2,
    Eye,
    RotateCcw,
    Check,
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
    Search,
    Filter,
    ChevronUp,
    ChevronDown,
    ArrowRight
} from "lucide-react";
import LoadingState from "../components/common/LoadingState";
import { getApiData } from "../utils/api";
import toast from "react-hot-toast";
import { ProductionType, ProductionStatus, TypeItem } from "../types/enums";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

// Production Departments Configuration
const PRODUCTION_DEPARTMENTS = [
    {
        value: ProductionType.warehouse,
        label: "المستودع",
        icon: Package,
        color: "blue"
    },
    {
        value: ProductionType.slitting,
        label: "التشريح",
        icon: Scissors,
        color: "green"
    },
    {
        value: ProductionType.cutting,
        label: "القص",
        color: "orange"
    },
    {
        value: ProductionType.gluing,
        label: "التغرية",
        icon: Droplet,
        color: "purple"
    }
];

    // Format type item function
    const formatTypeItem = (value) => {
        if (value === TypeItem.Machine) return "مكنة";
        if (value === TypeItem.Presser) return "كوي";
        return "-";
    };

export default function ProductionRecords() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [activeTab, setActiveTab] = useState(ProductionType.warehouse);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [widthFilter, setWidthFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20); // فلتر العرض
    const [activeNav, setActiveNav] = useState("records"); // "create" | "history" | "records"

    const ROLE_LABELS = {
        admin: "مدير النظام",
        accountant: "محاسب",
        cashier: "كاشير",
        sales: "مبيعات",
        production_manager: "مدير الإنتاج",
        warehouse_keeper: "أمين المستودع",
        order_preparer: "طلب انتاج",
        production: "الإنتاج"
    };
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemDetails, setShowItemDetails] = useState(false);

    // Data for all departments
    const [productionData, setProductionData] = useState({
        warehouse: [],
        slitting: [],
        cutting: [],
        gluing: []
    });
    const [loadingData, setLoadingData] = useState({
        warehouse: false,
        slitting: false,
        cutting: false,
        gluing: false
    });

    // Reference data
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);

    // Status options
    const STATUS_OPTIONS = [
        { value: ProductionStatus.pending, label: "قيد الانتظار" },
        { value: ProductionStatus.preparing, label: "قيد التحضير" },
        { value: ProductionStatus.completed, label: "مكتمل" },
        { value: ProductionStatus.canceled, label: "ملغي" }
    ];

    // Load initial data
    useEffect(() => {
        loadReferenceData();
        loadAllProductionData();
    }, []);

    const formatType = (type) => {
        const typeMap = {
            'warehouse': 'المستودع',
            'slitting': 'التشريح',
            'cutting': 'القص',
            'gluing': 'التغرية',
            'orderproduction': 'الإنتاج'
        };
        return typeMap[type] || type || 'غير محدد';
    };

    const formatDestination = (destination) => {
        const destMap = {
            'warehouse': 'المستودع',
            'slitting': 'التشريح',
            'cutting': 'القص',
            'gluing': 'التغرية',
            'production': 'الإنتاج'
        };
        return destMap[destination] || destination || 'غير محدد';
    };

    const formatSource = (source) => {
        const sourceMap = {
            'warehouse': 'المستودع',
            'slitting': 'التشريح',
            'cutting': 'القص',
            'gluing': 'التغرية',
            'production': 'الإنتاج'
        };
        return sourceMap[source] || source || 'غير محدد';
    };

    // Load data for specific department
    useEffect(() => {
        if (activeTab) {
            // Only load if data is not already loaded and not currently loading
            if (!productionData[activeTab] && !loadingData[activeTab]) {
                loadProductionDataByType(activeTab);
            }
        }
    }, [activeTab]);

    const loadReferenceData = async () => {
        try {
            const [colorRes, batchRes] = await Promise.all([
                colorApi.getColors(),
                batchApi.getBatches()
            ]);
            setColors(getApiData(colorRes, []) || []);
            setBatches(getApiData(batchRes, []) || []);
        } catch (error) {
            toast.error("فشل في تحميل البيانات المرجعية");
        }
    };

    const loadAllProductionData = async () => {
        const types = Object.keys(productionData);
        setLoadingData(prev => ({ ...prev, ...Object.fromEntries(types.map(t => [t, true])) }));

        try {
            const promises = types.map(type => loadProductionDataByType(type));
            await Promise.allSettled(promises); // Use Promise.allSettled to prevent one failure from stopping others
        } catch (error) {
            console.error("Error loading production data:", error);
            toast.error("فشل في تحميل بيانات الإنتاج");
        } finally {
            setLoadingData(prev => ({ ...prev, ...Object.fromEntries(types.map(t => [t, false])) }));
        }
    };

    const loadProductionDataByType = async (type) => {
        try {
            setLoadingData(prev => ({ ...prev, [type]: true }));
            const response = await productionApi.getProductionOrdersByType(type);
            const data = getApiData(response, []) || [];

            setProductionData(prev => ({
                ...prev,
                [type]: data
            }));
        } catch (error) {
            console.error(`Error loading ${type} production data:`, error);

            // Check if it's the database schema error
            if (error.message?.includes('production_order_item_id') ||
                error.message?.includes('does not exist in the current database')) {

                // Show a clear message about the backend issue
                toast.error(`مشكلة في قاعدة البيانات - يرجى إبلاغ فريق التطوير`, {
                    duration: 5000,
                    style: {
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        fontSize: '14px'
                    }
                });

                // Set empty data to prevent repeated calls
                setProductionData(prev => ({
                    ...prev,
                    [type]: []
                }));
            } else {
                // For other errors, show the normal error message
                toast.error(`فشل في تحميل بيانات ${PRODUCTION_DEPARTMENTS.find(d => d.value === type)?.label}`);
                setProductionData(prev => ({
                    ...prev,
                    [type]: []
                }));
            }
        } finally {
            setLoadingData(prev => ({ ...prev, [type]: false }));
        }
    };

    // Check if there's a database error (empty data with previous error)
    const hasDatabaseError = useMemo(() => {
        const data = productionData[activeTab] || [];
        return data.length === 0 && !loadingData[activeTab];
    }, [productionData, activeTab, loadingData]);
    const filteredData = useMemo(() => {
        const data = productionData[activeTab] || [];
        const term = searchTerm.toLowerCase();

        return data.filter(item => {
            // Search filter
            const matchesSearch = !term || (
                String(item.production_order_item_id).includes(term) ||
                String(item.production_order_id).includes(term) ||
                item.color?.color_name?.toLowerCase().includes(term) ||
                item.color?.color_code?.toLowerCase().includes(term) ||
                item.batch?.batch_number?.toLowerCase().includes(term) ||
                item.type_item?.toLowerCase().includes(term) ||
                item.thickness?.toLowerCase().includes(term) ||
                item.width?.toLowerCase().includes(term) ||
                item.length?.toLowerCase().includes(term) ||
                item.status?.toLowerCase().includes(term) ||
                item.notes?.toLowerCase().includes(term)
            );

            // Status filter
            const matchesStatus = !statusFilter || String(item.status || "").toLowerCase() === String(statusFilter).toLowerCase();

            // Width filter
            const matchesWidth = !widthFilter || String(item.width || "").toLowerCase().includes(String(widthFilter).toLowerCase());

            return matchesSearch && matchesStatus && matchesWidth;
        });
    }, [productionData, activeTab, searchTerm, statusFilter, widthFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, widthFilter, activeTab]);

    const handleViewItem = (item) => {
        console.log('Viewing item:', item); // Debug log
        setSelectedItem(item);
        setShowItemDetails(true);
    };

    const handleRefreshData = () => {
        loadProductionDataByType(activeTab);
    };

    const handleRefreshAll = () => {
        loadAllProductionData();
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            [ProductionStatus.pending]: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
            [ProductionStatus.preparing]: { label: 'قيد التحضير', className: 'bg-blue-100 text-blue-800' },
            [ProductionStatus.completed]: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
            [ProductionStatus.canceled]: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
        };
        return statusMap[status] || { label: status || 'غير محدد', className: 'bg-gray-100 text-gray-800' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatistics = (type) => {
        const data = productionData[type] || [];
        const total = data.length;
        const pending = data.filter(item => item.status === ProductionStatus.pending).length;
        const preparing = data.filter(item => item.status === ProductionStatus.preparing).length;
        const completed = data.filter(item => item.status === ProductionStatus.completed).length;
        const canceled = data.filter(item => item.status === ProductionStatus.canceled).length;

        return { total, pending, preparing, completed, canceled };
    };

    const renderTabButton = (department) => {
        const isActive = activeTab === department.value;
        const stats = getStatistics(department.value);
        // const Icon = department.icon;

        return (
            <Button
                key={department.value}
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(department.value)}
                className={`flex items-center gap-2 px-4 py-2 h-auto transition-all ${isActive
                        ? `bg-secondary-s text-white border-${department.color}-500`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
            >
                {/* <Icon className="w-4 h-4" /> */}
                <span className="font-medium">{department.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${isActive
                        ? 'bg-secondary-f/20 text-white'
                        : `bg-${department.color}-100 text-${department.color}-700`
                    }`}>
                    {stats.total}
                </span>
            </Button>
        );
    };

    const renderStatisticsCards = () => {
        const stats = getStatistics(activeTab);
        const department = PRODUCTION_DEPARTMENTS.find(d => d.value === activeTab);

        return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Card className="p-3 bg-white border-gray-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-sm text-gray-600">الإجمالي</div>
                    </div>
                </Card>
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                        <div className="text-sm text-yellow-600">قيد الانتظار</div>
                    </div>
                </Card>
                <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">{stats.preparing}</div>
                        <div className="text-sm text-blue-600">قيد التحضير</div>
                    </div>
                </Card>
                <Card className="p-3 bg-green-50 border-green-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                        <div className="text-sm text-green-600">مكتمل</div>
                    </div>
                </Card>
                <Card className="p-3 bg-red-50 border-red-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-700">{stats.canceled}</div>
                        <div className="text-sm text-red-600">ملغي</div>
                    </div>
                </Card>
            </div>
        );
    };

    const renderTable = () => {
        const department = PRODUCTION_DEPARTMENTS.find(d => d.value === activeTab);

        if (loadingData[activeTab]) {
            return (
                <div className="flex items-center justify-center h-64">
                    <LoadingState />
                </div>
            );
        }

        if (filteredData.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <div className="text-lg font-medium">لا توجد بيانات</div>
                    <div className="text-sm">لا توجد عناصر إنتاج في قسم {department.label}</div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full border-collapse bg-white">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">#</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">رقم الطلب</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">اللون</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الطبخة</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">النوع</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">السماكة</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">العرض</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الكمية</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المصدر</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الوجهة</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">التاريخ</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={item.production_order_item_id || index} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{item.production_order_id || '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span>{item.color?.color_name || '-'}</span>
                                            <span className="text-gray-500">({item.color?.color_code || '-'})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{item.batch?.batch_number || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{formatType(item.type)}</td>
                                    <td className="px-4 py-3 text-sm">{item.thickness || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{item.width || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{item.length || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{formatSource(item.source)}</td>
                                    <td className="px-4 py-3 text-sm">{formatDestination(item.destination)}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status).className}`}>
                                            {getStatusBadge(item.status).label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{formatDate(item.created_at)}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewItem(item)}
                                                className="p-1 h-8 w-8"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border-t">
                    <ResultsCounter
                        currentPage={currentPage}
                        totalPages={totalPages}
                        rowsPerPage={rowsPerPage}
                        totalResults={filteredData.length}
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
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
                        {/* Header */}
            <div className={isHeaderVisible ? "h-[88px]" : "h-[36px]"} />

            <div
                className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
                    isHeaderVisible ? "top-[60px]" : "top-2"
                }`}
            >
                <Button
                    type="button"
                    onClick={() => setIsHeaderVisible((prev) => !prev)}
                    className="h-10 w-10 rounded-full border-2 border-t-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105 active:scale-95"
                    title={isHeaderVisible ? "إخفاء الهيدر" : "إظهار الهيدر"}
                >
                    {isHeaderVisible ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </Button>
            </div>

            {isHeaderVisible && (
                <div className="relative flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-40">
                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/production?mode=create")}
                                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${activeNav === "create"
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
                                onClick={() => navigate("/production?mode=history")}
                                className={`px-6 py-3 text-base min-w-[120px] touch-manipulation border-2 ${activeNav === "history"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                    }`}
                            >
                                <History className="w-5 h-5 ml-2" />
                                سجل الإنتاج
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setActiveNav("records")}
                                className={`px-6 py-3 text-base min-w-[140px] touch-manipulation border-2 ${activeNav === "records"
                                    ? "bg-primary-f text-white border-primary-f text-secondary-f text-xl hover:bg-primary-f/50"
                                    : "bg-primary-f text-white border-primary-f hover:bg-primary-f/10"
                                    }`}
                            >
                                <Layers className="w-5 h-5 ml-2" />
                                سجل الإنتاج بالأقسام
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <NotificationsBell />
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setShowLogoutDialog(true)}
                                className="px-5 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <ArrowRight className="w-5 h-5 ml-2 rotate-180" />
                                تسجيل الخروج
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!isHeaderVisible && (
                <div className="fixed top-0 left-0 right-0 z-30">
                    <div className="flex items-center justify-between gap-1 border-secondary-f border-b-2 bg-primary-f px-4 py-1 shadow-sm backdrop-blur">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-secondary-s">
                                {user?.full_name || user?.username || "-"}
                            </div>
                        </div>
                        <div className="h-10 w-px" />
                        <div className="min-w-0 text-right">
                            <div className="truncate text-sm font-bold text-secondary-s">
                                {ROLE_LABELS[user?.role] || user?.role || "-"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
{/* Main Content */}
            <div className="flex-1 min-h-0 p-3 overflow-hidden">
                <div className="h-full flex flex-col min-h-0">
                    {/* Department Tabs */}
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white rounded-lg border">
                        {PRODUCTION_DEPARTMENTS.map(department => renderTabButton(department))}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white rounded-lg border">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="بحث..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>
                        <div className="min-w-[150px]">
                            <FilterSelect
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={[
                                    { value: "", label: "جميع الحالات" },
                                    ...STATUS_OPTIONS
                                ]}
                                placeholder="الحالة"
                            />
                        </div>
                        <div className="min-w-[120px]">
                            <FilterSelect
                                value={widthFilter}
                                onChange={(e) => setWidthFilter(e.target.value)}
                                options={[
                                    { value: "", label: "جميع الأعراض" },
                                    { value: "22", label: "22" },
                                    { value: "44", label: "44" },
                                    { value: "66", label: "66" },

                                ]}
                                placeholder="العرض"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleRefreshData}
                            className="px-4 py-2"
                        >
                            <RefreshCw className="w-4 h-4 ml-2" />
                            تحديث
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    {renderStatisticsCards()}



                    {/* Table */}
                    <div className="flex-1 min-h-0 bg-white rounded-lg border overflow-hidden">
                        {renderTable()}
                    </div>
                </div>
            </div>

            {/* Item Details Dialog */}
            <StyledDialog
                isOpen={showItemDetails}
                onOpenChange={setShowItemDetails}
                title="تفاصيل عنصر الإنتاج"
                className="max-w-4xl"
                showFooter={false}
            >
                {selectedItem && (
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">عنصر الإنتاج #{selectedItem.production_order_item_id}</h3>
                                    <p className="text-sm text-gray-600">طلب الإنتاج #{selectedItem.production_order_id}</p>
                                </div>
                                <div className="text-left">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedItem.status).className}`}>
                                        {getStatusBadge(selectedItem.status).label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-600" />
                                        المعلومات الأساسية
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">رقم العنصر</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.production_order_item_id || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">رقم الطلب</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.production_order_id || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">النوع</Label>
                                            <div className="text-sm font-medium text-gray-900">{formatType(selectedItem.type)}</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">نوع العنصر</Label>
                                            <div className="text-sm font-medium text-gray-900">{formatTypeItem(selectedItem.type_item) || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Material Information */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Droplet className="w-4 h-4 text-green-600" />
                                        معلومات المادة
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">اللون</Label>
                                            <div className="flex items-center gap-2">
                                                {/* <div className="w-4 h-4 rounded border border-gray-300"
                                                    style={{ backgroundColor: selectedItem.color?.color_code ? `#${selectedItem.color.color_code}` : '#f3f4f6' }}>

                                                    </div> */}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{selectedItem.color?.color_name || '-'}</div>
                                                    <div className="text-xs text-gray-500">({selectedItem.color?.color_code || '-'})</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">الطبخة</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.batch?.batch_number || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-purple-600" />
                                        الأبعاد
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">السماكة</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.thickness || '-'} مم</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">العرض</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.width || '-'} مم</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-medium text-gray-500">الكمية</Label>
                                            <div className="text-sm font-medium text-gray-900">{selectedItem.length || '-'} م</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Flow Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-orange-600" />
                                    تدفق العمل
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-gray-500">المصدر</Label>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                            {formatSource(selectedItem.source)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-gray-500">الوجهة</Label>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                                            {formatDestination(selectedItem.destination)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4 text-indigo-600" />
                                    معلومات إضافية
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-500">تاريخ الإنشاء</Label>
                                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedItem.created_at)}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium text-gray-500">حالة الطلب</Label>
                                        <div className="text-sm font-medium text-gray-900">
                                            {selectedItem.productionOrder?.status ? getStatusBadge(selectedItem.productionOrder.status).label : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                ملاحظات
                            </h4>
                            <div className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200 min-h-[60px]">
                                {selectedItem.notes || 'لا توجد ملاحظات'}
                            </div>
                        </div>
                    </div>
                )}
            </StyledDialog>

            {/* Logout Dialog */}
            <StyledDialog
                isOpen={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="تسجيل الخروج"
                onCancel={() => setShowLogoutDialog(false)}
                onConfirm={() => {
                    logout();
                    navigate('/login');
                }}
                confirmLabel="تسجيل الخروج"
                cancelLabel="إلغاء"
                confirmVariant="destructive"
            />
        </div>
    );
}
