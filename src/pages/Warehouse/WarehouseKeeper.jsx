// src\pages\Warehouse\WarehouseKeeper.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { warehouseApi } from "../../api/warehouseApi";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import LoadingState from "../../components/common/LoadingState";
import {
    Package,
    ArrowRight,
    Calculator,
    Eye,
    Check,
    X,
    AlertCircle,
    Search,
    RefreshCw,
    Plus,
    Minus,
    Hash,
    Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { UserRole, MovementDestination } from "../../types/enums";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function WarehouseKeeper() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Check if user has warehouse keeper role
    useEffect(() => {
        if (!user || user.role !== UserRole.Warehouse_Keeper) {
            toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
            navigate('/dashboard');
            return;
        }
    }, [user, navigate]);

    // State management
    const [activeTab, setActiveTab] = useState("inputs"); // inputs | outputs
    const [orders, setOrders] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

    // Number pad and output form
    const [outputForm, setOutputForm] = useState({
        color_id: "",
        batch_id: "",
        length: "",
        width: "",
        thickness: "",
        destination: "",
        notes: ""
    });
    const [currentInput, setCurrentInput] = useState("length");

    // Load data
    const loadOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await warehouseApi.getWarehouseOrders();
            if (response.success) {
                setOrders(response.data || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error("فشل في تحميل الطلبات");
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadMovements = async () => {
        try {
            setLoadingMovements(true);
            const response = await warehouseApi.getWarehouseMovements();
            if (response.success) {
                setMovements(response.data.movements || []);
            }
        } catch (error) {
            console.error('Error loading movements:', error);
            toast.error("فشل في تحميل حركات المستودع");
        } finally {
            setLoadingMovements(false);
        }
    };

    useEffect(() => {
        loadOrders();
        loadMovements();
    }, []);

    // Handle order selection
    const handleOrderSelect = async (order) => {
        setSelectedOrder(order);
        try {
            setLoadingOrderDetails(true);
            const response = await warehouseApi.getProductionOrderItems(order.production_order_id);
            if (response.success) {
                setOrderItems(response.data || []);
            }
        } catch (error) {
            console.error('Error loading order items:', error);
            toast.error("فشل في تحميل تفاصيل الطلب");
        } finally {
            setLoadingOrderDetails(false);
        }
        setShowOrderDetails(true);
    };

    // Number pad functions
    const handleNumberClick = (num) => {
        const currentValue = outputForm[currentInput] || "";
        if (currentValue.length < 10) { // Limit input length
            setOutputForm(prev => ({
                ...prev,
                [currentInput]: currentValue + num.toString()
            }));
        }
    };

    const handleBackspace = () => {
        setOutputForm(prev => ({
            ...prev,
            [currentInput]: prev[currentInput].slice(0, -1)
        }));
    };

    const handleClear = () => {
        setOutputForm(prev => ({
            ...prev,
            [currentInput]: ""
        }));
    };

    // Handle output submission
    const handleOutputSubmit = async () => {
        try {
            // Validate required fields (batch_id is optional)
            if (!outputForm.color_id || !outputForm.length ||
                !outputForm.width || !outputForm.thickness || !outputForm.destination) {
                toast.error("يرجى ملء جميع الحقول المطلوبة");
                return;
            }

            // Build payload without sending batch_id when not selected or equals "0"
            const payload = {
                color_id: outputForm.color_id,
                length: outputForm.length,
                width: outputForm.width,
                thickness: outputForm.thickness,
                destination: outputForm.destination,
                notes: outputForm.notes,
            };

            if (outputForm.batch_id && outputForm.batch_id !== "0") {
                payload.batch_id = outputForm.batch_id;
            }

            const response = await warehouseApi.createWarehouseMovement(payload);
            if (response.success) {
                toast.success("تم إنشاء حركة المستودع بنجاح");
                setOutputForm({
                    color_id: "",
                    batch_id: "",
                    length: "",
                    width: "",
                    thickness: "",
                    destination: "",
                    notes: ""
                });
                loadMovements(); // Reload movements
            }
        } catch (error) {
            console.error('Error creating warehouse movement:', error);
            toast.error("فشل في إنشاء حركة المستودع");
        }
    };

    // Format destination label
    const formatDestination = (destination) => {
        const labels = {
            [MovementDestination.slitting]: "التشريح",
            [MovementDestination.cutting]: "القص",
            [MovementDestination.production]: "الإنتاج"
        };
        return labels[destination] || destination;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
            {/* Header */}
            <div className="flex-shrink-0 bg-blue-600 text-white p-4 shadow-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">إدارة المستودع</h1>
                            <p className="text-sm opacity-90">نظام إدارة المواد والمخرجات</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">مرحباً، {user?.full_name}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                        >
                            تسجيل الخروج
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-4 p-4 min-h-0">
                {/* Top Area - Inputs + Orders */}
                <div className="grid grid-cols-2 gap-4 min-h-[260px]">
                    {/* Inputs */}
                    <Card className="p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        المدخلات
                    </h2>
                    <div className="flex-1">
                        {/* Input form for manual entry or QR */}
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1">
                                    <Search className="w-4 h-4 ml-2" />
                                    QR
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    <Hash className="w-4 h-4 ml-2" />
                                    يدوي
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>اللون</Label>
                                    <FilterSelect
                                        value={outputForm.color_id}
                                        onChange={(e) => setOutputForm(prev => ({ ...prev, color_id: e.target.value }))}
                                        options={[]} // Will be populated from API
                                        placeholder="اختر اللون"
                                    />
                                </div>
                                <div>
                                    <Label>رقم الطبخة (اختياري)</Label>
                                    <FilterSelect
                                        value={outputForm.batch_id}
                                        onChange={(e) => setOutputForm(prev => ({ ...prev, batch_id: e.target.value }))}
                                        options={[]} // Will be populated من API مشابه لصفحة الطلبات
                                        placeholder="اختر رقم الطبخة إن وجد"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label>الطول</Label>
                                    <Input
                                        value={outputForm.length}
                                        onFocus={() => setCurrentInput("length")}
                                        readOnly
                                        className={`text-center ${currentInput === "length" ? "ring-2 ring-blue-500" : ""}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>العرض</Label>
                                    <Input
                                        value={outputForm.width}
                                        onFocus={() => setCurrentInput("width")}
                                        readOnly
                                        className={`text-center ${currentInput === "width" ? "ring-2 ring-blue-500" : ""}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>السماكة</Label>
                                    <Input
                                        value={outputForm.thickness}
                                        onFocus={() => setCurrentInput("thickness")}
                                        readOnly
                                        className={`text-center ${currentInput === "thickness" ? "ring-2 ring-blue-500" : ""}`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>الوجهة</Label>
                                <FilterSelect
                                    value={outputForm.destination}
                                    onChange={(e) => setOutputForm(prev => ({ ...prev, destination: e.target.value }))}
                                    options={[
                                        { value: MovementDestination.slitting, label: "التشريح" },
                                        { value: MovementDestination.cutting, label: "القص" },
                                        { value: MovementDestination.production, label: "الإنتاج" }
                                    ]}
                                    placeholder="اختر الوجهة"
                                />
                            </div>
                            <div>
                                <Label>ملاحظات</Label>
                                <Input
                                    value={outputForm.notes}
                                    onChange={(e) => setOutputForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="ملاحظات اختيارية"
                                />
                            </div>
                            <Button
                                onClick={handleOutputSubmit}
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={!outputForm.color_id || !outputForm.length || !outputForm.width || !outputForm.thickness || !outputForm.destination}
                            >
                                <Check className="w-5 h-5 ml-2" />
                                إخراج
                            </Button>
                        </div>
                    </div>
                    </Card>

                    {/* Current / Completed Orders */}
                    <Card className="p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-orange-600" />
                            طلبات حالية أو مكتملة
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            disabled={loadingOrders}
                        >
                            <RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? 'animate-spin' : ''}`} />
                            تحديث
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto border rounded-lg bg-white">
                        {loadingOrders ? (
                            <div className="flex items-center justify-center h-32">
                                <LoadingState />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <div className="text-lg font-medium">لا توجد طلبات</div>
                                <div className="text-sm">لا توجد طلبات جاهزة للمستودع</div>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {orders.map(order => (
                                    <div
                                        key={order.production_order_id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleOrderSelect(order)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">طلب #{order.production_order_id}</div>
                                                <div className="text-sm text-gray-600">
                                                    {order.color_name} ({order.color_code})
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-medium">
                                                    {order.width} مم × {order.thickness} مم
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {order.batch_number}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </Card>
                </div>

                {/* Bottom Area - Outputs (full width) + Number Pad on the right */}
                <div className="flex gap-4 min-h-[260px]">
                    {/* Outputs Table - takes remaining width */}
                    <Card className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-purple-600" />
                                جدول المخرجات
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadMovements}
                                disabled={loadingMovements}
                            >
                                <RefreshCw className={`w-4 h-4 ml-2 ${loadingMovements ? 'animate-spin' : ''}`} />
                                تحديث
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-lg bg-white">
                            {loadingMovements ? (
                                <div className="flex items-center justify-center h-32">
                                    <LoadingState />
                                </div>
                            ) : movements.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <div className="text-lg font-medium">لا توجد مخرجات</div>
                                    <div className="text-sm">لم يتم تسجيل أي حركات مستودع بعد</div>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {movements.map(movement => (
                                        <div key={movement.movement_id} className="p-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-medium">حركة #{movement.movement_id}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {movement.color?.color_name} ({movement.color?.color_code})
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(movement.created_at)}
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium">
                                                        {movement.length} م × {movement.width} مم × {movement.thickness} مم
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDestination(movement.destination)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Number Pad - fixed width on the right */}
                    <Card className="p-4 w-[260px] flex-shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-green-600" />
                            لوحة الأرقام
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-12 text-lg font-bold"
                                    onClick={() => handleNumberClick(num)}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-12 text-lg"
                                onClick={handleClear}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-lg font-bold"
                                onClick={() => handleNumberClick(0)}
                            >
                                0
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 text-lg"
                                onClick={handleBackspace}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Order Details Dialog */}
            <StyledDialog
                isOpen={showOrderDetails}
                onOpenChange={setShowOrderDetails}
                title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ''}`}
                contentClassName="max-w-4xl w-full"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        {/* Order Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-bold text-blue-700 mb-3">معلومات الطلب</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">رقم الطلب</Label>
                                    <div className="font-bold">#{selectedOrder.production_order_id}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">اللون</Label>
                                    <div className="font-bold">{selectedOrder.color_name} ({selectedOrder.color_code})</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الأبعاد</Label>
                                    <div className="font-bold">{selectedOrder.width} × {selectedOrder.thickness} مم</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الطبخة</Label>
                                    <div className="font-bold">{selectedOrder.batch_number}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">التاريخ</Label>
                                    <div className="font-bold">{formatDate(selectedOrder.created_at)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">الحالة</Label>
                                    <div className="font-bold">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                            مكتمل
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        {loadingOrderDetails ? (
                            <div className="flex justify-center py-8">
                                <LoadingState />
                            </div>
                        ) : orderItems.length > 0 ? (
                            <div>
                                <h4 className="font-bold mb-3">عناصر الطلب</h4>
                                <div className="border rounded-lg">
                                    <table className="w-full text-sm table-fixed">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-center">العرض</th>
                                                <th className="p-2 text-center">الكمية</th>
                                                <th className="p-2 text-center">النوع</th>
                                                <th className="p-2 text-center">المصدر</th>
                                                <th className="p-2 text-center">الوجهة</th>
                                                <th className="p-2 text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2 text-center">{item.width}</td>
                                                    <td className="p-2 text-center">{item.length}</td>
                                                    <td className="p-2 text-center">{item.type}</td>
                                                    <td className="p-2 text-center">{item.source}</td>
                                                    <td className="p-2 text-center">{item.destination}</td>
                                                    <td className="p-2 text-center">
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <div>لا توجد عناصر لهذا الطلب</div>
                            </div>
                        )}
                    </div>
                )}
            </StyledDialog>
        </div>
    );
}