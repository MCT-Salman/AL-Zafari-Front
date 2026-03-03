// src/pages/Invoices/InvoiceManager.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import FilterSelect from "../../components/common/FilterSelect";
import StyledDialog from "../../components/common/StyledDialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
    Receipt,
    History,
    Eye,
    RotateCcw,
    Check,
    EyeOff,
    Home,
    X,
    AlertCircle,
    Edit,
    Save,
    ChevronLeft,
    ChevronRight,
    QrCode,
    Scan,
    FileText,
    User,
    Phone,
    MapPin,
    DollarSign,
    CreditCard,
    Plus,
    Trash2,
    Users,
    ShoppingCart,
    Search,
    Barcode,
    Package,
    Ruler,
    Palette,
    Layers,
    Hash,
    Tag,
    Weight
} from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import toast from "react-hot-toast";

export default function InvoiceManager() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("create");
    const [loading, setLoading] = useState(false);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [editingInvoiceId, setEditingInvoiceId] = useState(null);
    const tableContainerRef = useRef(null);

    // Tabs للإدخال
    const [inputMode, setInputMode] = useState("manual"); // qr, code, manual

    // State للبيانات
    const [invoices, setInvoices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [rulers, setRulers] = useState([]);
    const [colors, setColors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // States للإدخال
    const [qrCode, setQrCode] = useState("");
    const [manualCode, setManualCode] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");

    // Numpad States (مثل صفحة المبيعات)
    const [numpadMode, setNumpadMode] = useState("quantity");
    const [activeField, setActiveField] = useState("quantity");

    // Form State للوضع اليدوي (مثل صفحة المبيعات)
    const [formData, setFormData] = useState({
        material_id: "",
        ruler_id: "",
        color_id: "",
        batch_id: "",
        width: "",
        thickness: "0.6",
        quantity: "",
        order_id: "",
        paid_amount: "",
        notes: ""
    });

    // بيانات تجريبية للمواد والخيارات (مثل صفحة المبيعات)
    useEffect(() => {
        // مواد تجريبية
        setMaterials([
            { material_id: 1, material_name: "PVC" },
            { material_id: 2, material_name: "أكريليك" },
            // { material_id: 3, material_name: "بولي كربونيت" },
            // { material_id: 4, material_name: "خشب MDF" },
            // { material_id: 5, material_name: "ألمنيوم" },
            // { material_id: 6, material_name: "ستانلس ستيل" },
        ]);

        // مساطر تجريبية
        setRulers([
            { ruler_id: 1, ruler_name: "مسطرة 1م", material_id: 1 },
            { ruler_id: 2, ruler_name: "مسطرة 2م", material_id: 1 },
            { ruler_id: 3, ruler_name: "مسطرة 3م", material_id: 2 },
            { ruler_id: 4, ruler_name: "مسطرة 4م", material_id: 2 },
        ]);

        // ألوان تجريبية
        setColors([
            { color_id: 1, color_name: "أبيض", color_code: "WHT", ruler_id: 1 },
            { color_id: 2, color_name: "أسود", color_code: "BLK", ruler_id: 1 },
            { color_id: 3, color_name: "أحمر", color_code: "RED", ruler_id: 2 },
            { color_id: 4, color_name: "أزرق", color_code: "BLU", ruler_id: 2 },
        ]);

        // طبخات تجريبية
        setBatches([
            { batch_id: 1, batch_number: "BATCH-2024-001" },
            { batch_id: 2, batch_number: "BATCH-2024-002" },
            { batch_id: 3, batch_number: "BATCH-2024-003" },
        ]);

        // طلبات تجريبية
        setOrders([
            { 
                order_id: 1, 
                customer: { name: "أحمد محمد", phone: "0912345678", city: "دمشق" }, 
                total_amount: "1250000", 
                status: "completed",
                items: [
                    { material_name: "PVC", color_name: "أبيض", quantity: 50, unit_price: "15000", subtotal: "750000" },
                    { material_name: "PVC", color_name: "أسود", quantity: 30, unit_price: "16667", subtotal: "500000" }
                ]
            },
            { 
                order_id: 2, 
                customer: { name: "محمود علي", phone: "0923456789", city: "حلب" }, 
                total_amount: "850000", 
                status: "pending",
                items: [
                    { material_name: "أكريليك", color_name: "شفاف", quantity: 20, unit_price: "42500", subtotal: "850000" }
                ]
            },
            { 
                order_id: 3, 
                customer: { name: "سامر أحمد", phone: "0934567890", city: "حمص" }, 
                total_amount: "2100000", 
                status: "preparing",
                items: [
                    { material_name: "PVC", color_name: "أحمر", quantity: 100, unit_price: "15000", subtotal: "1500000" },
                    { material_name: "PVC", color_name: "أزرق", quantity: 40, unit_price: "15000", subtotal: "600000" }
                ]
            },
        ]);

        // فواتير تجريبية
        setInvoices([
            { 
                invoice_id: 1, 
                order_id: 1, 
                customer: { name: "أحمد محمد", phone: "0912345678" }, 
                total_amount: "1250000", 
                paid_amount: "1000000", 
                remaining_amount: "250000",
                issued_at: "2026-03-01T10:30:00",
                user: { full_name: "admin" },
                notes: "دفعة أولى"
            },
            { 
                invoice_id: 2, 
                order_id: 2, 
                customer: { name: "محمود علي", phone: "0923456789" }, 
                total_amount: "850000", 
                paid_amount: "850000", 
                remaining_amount: "0",
                issued_at: "2026-03-02T11:45:00",
                user: { full_name: "admin" },
                notes: "مدفوع كامل"
            },
        ]);
    }, []);

    // دوال مساعدة
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        return `${num.toLocaleString()} ل.س`;
    };

    const getFormattedDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getPaymentStatus = (total, paid) => {
        const totalNum = parseFloat(total) || 0;
        const paidNum = parseFloat(paid) || 0;
        
        if (totalNum === 0) return { label: 'غير محدد', className: 'bg-gray-100 text-gray-800' };
        if (paidNum >= totalNum) return { label: 'مدفوع بالكامل', className: 'bg-green-100 text-green-800' };
        if (paidNum === 0) return { label: 'غير مدفوع', className: 'bg-red-100 text-red-800' };
        return { label: 'مدفوع جزئياً', className: 'bg-yellow-100 text-yellow-800' };
    };

    // فلترة الفواتير
    const filteredInvoices = useMemo(() => {
        if (!searchTerm) return invoices;
        const term = searchTerm.toLowerCase();
        return invoices.filter(inv => 
            String(inv.invoice_id).toLowerCase().includes(term) ||
            inv.customer?.name?.toLowerCase().includes(term) ||
            inv.customer?.phone?.toLowerCase().includes(term) ||
            String(inv.order_id).toLowerCase().includes(term)
        );
    }, [invoices, searchTerm]);

    // خيارات الطلبات
    const orderOptions = useMemo(() => {
        return orders.map(o => ({
            value: String(o.order_id),
            label: `طلب #${o.order_id} - ${o.customer?.name || 'بدون زبون'} - ${formatCurrency(o.total_amount)}`
        }));
    }, [orders]);

    // معالجة تغيير الحقول
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === "order_id" && value) {
            const order = orders.find(o => String(o.order_id) === value);
            setSelectedOrder(order || null);
        }
    };

    // البحث بكود الطلب
    const handleCodeSearch = () => {
        if (!manualCode) {
            toast.error("يرجى إدخال كود الطلب");
            return;
        }
        const foundOrder = orders.find(o => String(o.order_id) === manualCode);
        if (foundOrder) {
            handleFieldChange("order_id", String(foundOrder.order_id));
            toast.success(`تم العثور على الطلب #${foundOrder.order_id}`);
        } else {
            toast.error("لم يتم العثور على طلب بهذا الرمز");
        }
    };

    // مسح QR
    const handleQrScan = () => {
        if (!qrCode) {
            toast.error("يرجى إدخال رمز QR");
            return;
        }
        const foundOrder = orders.find(o => String(o.order_id) === qrCode);
        if (foundOrder) {
            handleFieldChange("order_id", String(foundOrder.order_id));
            toast.success(`تم العثور على الطلب #${foundOrder.order_id}`);
        } else {
            toast.error("لم يتم العثور على طلب بهذا الرمز");
        }
    };

    // معالجة الضغط على أزرار النمpad
    const handleNumpadPress = (val) => {
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

    // حفظ الفاتورة
    const saveInvoice = () => {
        if (!selectedOrder) {
            toast.error("يرجى اختيار الطلب");
            return;
        }
        if (!formData.paid_amount || parseFloat(formData.paid_amount) < 0) {
            toast.error("يرجى إدخال مبلغ صحيح");
            return;
        }

        toast.success(editingInvoiceId ? "تم تحديث الفاتورة بنجاح" : "تم إنشاء الفاتورة بنجاح");
        setShowPreview(false);
        setEditingInvoiceId(null);
        setFormData({ 
            material_id: "", ruler_id: "", color_id: "", batch_id: "", 
            width: "", thickness: "0.6", quantity: "", 
            order_id: "", paid_amount: "", notes: "" 
        });
        setSelectedOrder(null);
    };

    // عرض تفاصيل الفاتورة
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
    };

    // تعديل الفاتورة
    const handleEditInvoice = (invoice) => {
        setFormData(prev => ({
            ...prev,
            order_id: String(invoice.order_id),
            paid_amount: invoice.paid_amount,
            notes: invoice.notes || ""
        }));
        const order = orders.find(o => o.order_id === invoice.order_id);
        setSelectedOrder(order || null);
        setEditingInvoiceId(invoice.invoice_id);
        setViewMode("create");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // حذف الفاتورة
    const handleDeleteInvoice = (invoiceId) => {
        if (window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
            setInvoices(prev => prev.filter(inv => inv.invoice_id !== invoiceId));
            toast.success("تم حذف الفاتورة بنجاح");
        }
    };

    // إضافة دفعة
    const handleAddPayment = (invoice) => {
        setSelectedInvoiceForPayment(invoice);
        setPaymentAmount("");
        setShowPaymentDialog(true);
    };

    // تأكيد إضافة الدفعة
    const confirmAddPayment = () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error("يرجى إدخال مبلغ صحيح");
            return;
        }
        if (parseFloat(paymentAmount) > parseFloat(selectedInvoiceForPayment.remaining_amount)) {
            toast.error("المبلغ أكبر من المتبقي");
            return;
        }

        toast.success("تم إضافة الدفعة بنجاح");
        setShowPaymentDialog(false);
        setSelectedInvoiceForPayment(null);
        setPaymentAmount("");
    };

    // مسح جميع الحقول
    const clearForm = () => {
        setFormData({ 
            material_id: "", ruler_id: "", color_id: "", batch_id: "", 
            width: "", thickness: "0.6", quantity: "", 
            order_id: "", paid_amount: "", notes: "" 
        });
        setSelectedOrder(null);
        setQrCode("");
        setManualCode("");
        setEditingInvoiceId(null);
    };

    // التمرير الأفقي للجدول
    const scrollTable = (direction) => {
        if (tableContainerRef.current) {
            const scrollAmount = 200;
            const newScrollLeft = tableContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tableContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }
    };

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
                                <Receipt className="w-5 h-5 ml-2" />
                                فاتورة جديدة
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
                                سجل الفواتير
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/orders")}
                                className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <ShoppingCart className="w-5 h-5 ml-2" />
                                الطلبات
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
                    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_2.2fr_1.6fr] gap-3 h-full min-h-0">
                        
                        {/* العمود الأيمن - يتغير حسب وضع الإدخال */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            
                            {/* Tabs في الأعلى (ثابتة) */}
                            <Card className="flex-shrink-0 p-4">
                                <Label className="font-bold text-base mb-3 block">طريقة الإدخال</Label>
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
                            </Card>

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

                            {inputMode === "code" && (
                                <Card className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden">
                                    <Label className="font-bold text-base mb-3 block">إدخال كود الطلب</Label>
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="w-full space-y-3">
                                                <div className="bg-gray-100 p-4 rounded-xl text-center">
                                                    <Barcode className="w-16 h-16 mx-auto mb-2 text-gray-600" />
                                                    <p className="text-sm text-gray-600">
                                                        أدخل كود الطلب للبحث عنه
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="مثال: 12345"
                                                        value={manualCode}
                                                        onChange={(e) => setManualCode(e.target.value)}
                                                        className="h-12 text-base flex-1 text-center text-xl font-bold"
                                                        onKeyPress={(e) => e.key === 'Enter' && handleCodeSearch()}
                                                    />
                                                    <Button
                                                        onClick={handleCodeSearch}
                                                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                                                        disabled={!manualCode}
                                                    >
                                                        <Search className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {inputMode === "manual" && (
                                <>
                                    {/* أزرار المواد - مثل صفحة المبيعات */}
                                    <Card className="flex-shrink-0 p-4">
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

                                    {/* الأرقام - مثل صفحة المبيعات */}
                                    <Card className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
                                        <div className="flex-shrink-0 mb-2">
                                            <div className="flex gap-2 mb-2">
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
                                                <button
                                                    onClick={() => {
                                                        setNumpadMode("paid");
                                                        setActiveField("paid_amount");
                                                    }}
                                                    className={`
                                                        flex-1 py-2 px-2 rounded-lg text-sm font-bold border-2 
                                                        touch-manipulation transition-all active:scale-95
                                                        ${numpadMode === "paid"
                                                            ? "bg-green-600 text-white border-green-600"
                                                            : "bg-white border-gray-300 hover:bg-gray-100"
                                                        }
                                                    `}
                                                >
                                                    المبلغ
                                                </button>
                                            </div>

                                            <div className="bg-gray-100 rounded-lg py-2 px-3">
                                                <div className="text-xs text-gray-500 mb-0.5">
                                                    {activeField === "quantity" ? "الكمية" :
                                                     activeField === "paid_amount" ? "المبلغ" :
                                                     activeField === "width" ? "العرض" : "القيمة"}
                                                </div>
                                                <div className="text-2xl font-mono font-bold text-gray-800 text-center truncate leading-tight">
                                                    {formData[activeField] || "0"}
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
                                </>
                            )}
                        </div>

                        {/* العمود الأوسط - يتغير حسب وضع الإدخال */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
                            
                            {editingInvoiceId && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                    <span className="text-blue-700 text-sm font-medium">
                                        <Edit className="w-4 h-4 inline ml-1" />
                                        جاري تعديل الفاتورة #{editingInvoiceId}
                                    </span>
                                    <button
                                        onClick={clearForm}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            )}

                            {/* في الوضع اليدوي - نعرض كل الخيارات مثل صفحة المبيعات */}
                            {inputMode === "manual" && (
                                <>
                                    {/* اختيار رقم الطلب */}
                                    <Card className="p-4">
                                        <Label className="font-bold text-base mb-3 block">رقم الطلب</Label>
                                        <FilterSelect
                                            value={formData.order_id}
                                            onChange={(e) => handleFieldChange("order_id", e.target.value)}
                                            options={orderOptions}
                                            placeholder="اختر رقم الطلب..."
                                            className="w-full text-base"
                                        />
                                    </Card>

                                    {/* خيارات إضافية - مثل صفحة المبيعات */}
                                    <Card className="p-4">
                                        <Label className="font-bold text-base mb-3 block">خيارات إضافية</Label>
                                        
                                        <div className="space-y-4">
                                            {/* نوع الطلب */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">نوع الطلب</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleFieldChange("type_item", "Machine")}
                                                        className={`
                                                            py-3 px-2 rounded-xl border-3 text-base font-medium
                                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                                            ${formData.type_item === "Machine"
                                                                ? "border-primary-f bg-primary-f text-white shadow-lg"
                                                                : "border-gray-300 bg-white hover:border-secondary-s"
                                                            }
                                                        `}
                                                    >
                                                        مكنة
                                                    </button>
                                                    <button
                                                        onClick={() => handleFieldChange("type_item", "Presser")}
                                                        className={`
                                                            py-3 px-2 rounded-xl border-3 text-base font-medium
                                                            transition-all touch-manipulation hover:scale-105 active:scale-95
                                                            ${formData.type_item === "Presser"
                                                                ? "border-primary-f bg-primary-f text-white shadow-lg"
                                                                : "border-gray-300 bg-white hover:border-secondary-s"
                                                            }
                                                        `}
                                                    >
                                                        كوي
                                                    </button>
                                                </div>
                                            </div>

                                            {/* العرض */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">العرض</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {["22", "44", "66"].map(w => (
                                                        <button
                                                            key={w}
                                                            onClick={() => handleFieldChange("width", w)}
                                                            className={`
                                                                py-3 px-2 rounded-xl border-3 text-base font-medium
                                                                transition-all touch-manipulation hover:scale-105 active:scale-95
                                                                ${formData.width === w
                                                                    ? "border-secondary-s bg-secondary-s text-white shadow-lg"
                                                                    : "border-gray-300 bg-white hover:border-secondary-s"
                                                                }
                                                            `}
                                                        >
                                                            {w}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* المسطرة */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">المسطرة</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {rulers.map(r => (
                                                        <button
                                                            key={r.ruler_id}
                                                            onClick={() => handleFieldChange("ruler_id", String(r.ruler_id))}
                                                            className={`
                                                                py-3 px-2 rounded-xl border-3 text-base font-medium
                                                                transition-all touch-manipulation hover:scale-105 active:scale-95
                                                                ${String(formData.ruler_id) === String(r.ruler_id)
                                                                    ? "border-secondary-s bg-secondary-s text-white shadow-lg"
                                                                    : "border-gray-300 bg-white hover:border-secondary-s"
                                                                }
                                                            `}
                                                        >
                                                            {r.ruler_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* اللون */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">اللون</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {colors.map(c => (
                                                        <button
                                                            key={c.color_id}
                                                            onClick={() => handleFieldChange("color_id", String(c.color_id))}
                                                            className={`
                                                                py-3 px-2 rounded-xl border-3 text-base font-medium
                                                                transition-all touch-manipulation hover:scale-105 active:scale-95
                                                                ${String(formData.color_id) === String(c.color_id)
                                                                    ? "border-primary-f bg-primary-f text-white shadow-lg"
                                                                    : "border-gray-300 bg-white hover:border-primary-f/50"
                                                                }
                                                            `}
                                                        >
                                                            {c.color_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* رقم الطبخة */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">رقم الطبخة</Label>
                                                <FilterSelect
                                                    value={formData.batch_id}
                                                    onChange={(e) => handleFieldChange("batch_id", e.target.value)}
                                                    options={batches.map(b => ({ value: String(b.batch_id), label: b.batch_number }))}
                                                    placeholder="اختر الطبخة..."
                                                    className="w-full text-sm"
                                                />
                                            </div>

                                            {/* السماكة */}
                                            <div>
                                                <Label className="font-bold text-sm mb-2 block">السماكة (مم)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.thickness}
                                                    onChange={(e) => handleFieldChange("thickness", e.target.value)}
                                                    className="h-12 text-lg text-center font-bold"
                                                    step="0.1"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </>
                            )}

                            {/* في وضع QR/Code - نعرض معلومات الطلب بعد العثور عليه */}
                            {(inputMode === "qr" || inputMode === "code") && selectedOrder && (
                                <Card className="p-4">
                                    <Label className="font-bold text-base mb-3 block">معلومات الطلب</Label>
                                    <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>رقم الطلب: #{selectedOrder.order_id}</div>
                                            <div>الزبون: {selectedOrder.customer?.name}</div>
                                            <div>رقم الهاتف: {selectedOrder.customer?.phone}</div>
                                            <div>الإجمالي: {formatCurrency(selectedOrder.total_amount)}</div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* حقل المبلغ المدفوع (يظهر في جميع الأوضاع) */}
                            <Card className="p-4">
                                <Label className="font-bold text-base mb-3 block">معلومات الدفع</Label>
                                
                                <div className="space-y-4">
                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">المبلغ المدفوع</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={formData.paid_amount}
                                                onChange={(e) => handleFieldChange("paid_amount", e.target.value)}
                                                onClick={() => {
                                                    setActiveField("paid_amount");
                                                    setNumpadMode("paid");
                                                }}
                                                placeholder="0.00"
                                                className={`h-14 text-xl text-center font-bold flex-1 ${
                                                    activeField === "paid_amount" ? "ring-2 ring-green-400" : ""
                                                }`}
                                                step="0.01"
                                                min="0"
                                            />
                                            <span className="text-lg font-bold text-gray-600 whitespace-nowrap">ل.س</span>
                                        </div>
                                    </div>

                                    {selectedOrder && formData.paid_amount && (
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            {(() => {
                                                const total = parseFloat(selectedOrder.total_amount);
                                                const paid = parseFloat(formData.paid_amount) || 0;
                                                const remaining = total - paid;
                                                return (
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>إجمالي الطلب:</span>
                                                            <span className="font-bold">{formatCurrency(total)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>المدفوع:</span>
                                                            <span className="font-bold text-green-600">{formatCurrency(paid)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-1 mt-1">
                                                            <span>المتبقي:</span>
                                                            <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(remaining)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div>
                                        <Label className="font-bold text-sm mb-2 block">ملاحظات</Label>
                                        <Input
                                            type="text"
                                            value={formData.notes}
                                            onChange={(e) => handleFieldChange("notes", e.target.value)}
                                            placeholder="ملاحظات إضافية..."
                                            className="h-12 text-base"
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* زر إنشاء الفاتورة */}
                            <Button
                                onClick={() => setShowPreview(true)}
                                size="lg"
                                className={`h-12 flex-shrink-0 text-base font-bold text-white touch-manipulation active:scale-95 transition-transform ${
                                    editingInvoiceId ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-f hover:bg-secondary-f'
                                }`}
                                disabled={!selectedOrder || !formData.paid_amount}
                            >
                                {editingInvoiceId ? (
                                    <>
                                        <Save className="w-5 h-5 ml-2" />
                                        تحديث الفاتورة
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 ml-2" />
                                        إنشاء فاتورة
                                    </>
                                )}
                            </Button>

                            {/* زر مسح الكل */}
                            {(formData.order_id || formData.paid_amount || formData.notes) && (
                                <Button
                                    onClick={clearForm}
                                    variant="outline"
                                    className="h-12 border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    <X className="w-5 h-5 ml-2" />
                                    مسح الكل
                                </Button>
                            )}
                        </div>

                        {/* العمود الأيسر - ثابت (جدول الطلب) */}
                        <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                            
                            {/* معاينة قبل الحفظ */}
                            {showPreview && (
                                <StyledDialog
                                    isOpen={showPreview}
                                    onOpenChange={setShowPreview}
                                    title={editingInvoiceId ? "تعديل الفاتورة" : "معاينة الفاتورة"}
                                    onCancel={() => setShowPreview(false)}
                                    onConfirm={saveInvoice}
                                    confirmLabel={editingInvoiceId ? "تحديث" : "إنشاء"}
                                    cancelLabel="إلغاء"
                                    confirmVariant="default"
                                    isLoading={loading}
                                >
                                    <div className="space-y-3">
                                        {selectedOrder && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-gray-50 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-500">رقم الطلب</div>
                                                        <div className="font-bold text-sm">#{selectedOrder.order_id}</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-500">الزبون</div>
                                                        <div className="font-bold text-sm">{selectedOrder.customer?.name}</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-500">المبلغ المدفوع</div>
                                                        <div className="font-bold text-sm text-green-600">
                                                            {formatCurrency(formData.paid_amount)}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-500">رقم الهاتف</div>
                                                        <div className="font-bold text-sm">{selectedOrder.customer?.phone}</div>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <div className="text-sm font-bold mb-2">ملخص الدفع</div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>إجمالي الطلب: {formatCurrency(selectedOrder.total_amount)}</div>
                                                        <div>المدفوع: {formatCurrency(formData.paid_amount)}</div>
                                                        <div className={parseFloat(selectedOrder.total_amount) - parseFloat(formData.paid_amount) > 0 ? 'text-red-600' : 'text-green-600'}>
                                                            المتبقي: {formatCurrency(parseFloat(selectedOrder.total_amount) - parseFloat(formData.paid_amount))}
                                                        </div>
                                                        <div>
                                                            الحالة: 
                                                            <span className={`mr-1 px-2 py-0.5 rounded-full text-xs ${
                                                                getPaymentStatus(selectedOrder.total_amount, formData.paid_amount).className
                                                            }`}>
                                                                {getPaymentStatus(selectedOrder.total_amount, formData.paid_amount).label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {formData.notes && (
                                                    <div className="bg-gray-50 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-500">ملاحظات</div>
                                                        <div className="text-sm">{formData.notes}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </StyledDialog>
                            )}
                            
                            {/* جدول الطلب */}
                            <Card className="flex flex-col h-full min-h-0 overflow-hidden">
                                <div className="flex justify-between items-center p-2 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">
                                            {selectedOrder ? `الطلب #${selectedOrder.order_id}` : 'لم يتم اختيار طلب'}
                                        </span>
                                        {selectedOrder && (
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
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedOrder && (
                                            <div className="bg-green-50 px-2 py-1 rounded-lg text-xs">
                                                الإجمالي: <span className="font-bold text-primary-f">{formatCurrency(selectedOrder.total_amount)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    ref={tableContainerRef}
                                    className="flex-1 overflow-auto min-h-0"
                                    style={{ direction: 'rtl' }}
                                >
                                    {selectedOrder ? (
                                        <table className="min-w-[1000px] w-full table-fixed border-collapse">
                                            <thead className="bg-gray-100 sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-2 text-right border-b w-[200px]">المنتج</th>
                                                    <th className="p-2 text-right border-b w-[150px]">اللون</th>
                                                    <th className="p-2 text-center border-b w-[100px]">الكمية</th>
                                                    <th className="p-2 text-center border-b w-[120px]">السعر</th>
                                                    <th className="p-2 text-center border-b w-[120px]">الإجمالي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items?.map((item, index) => (
                                                    <tr key={index} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 break-words text-sm">{item.material_name}</td>
                                                        <td className="p-2 break-words text-sm">{item.color_name}</td>
                                                        <td className="p-2 text-center text-sm">{item.quantity} م</td>
                                                        <td className="p-2 text-center text-sm">{formatCurrency(item.unit_price)}</td>
                                                        <td className="p-2 text-center font-bold text-sm">{formatCurrency(item.subtotal)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-50 font-bold">
                                                    <td colSpan="4" className="p-2 text-left text-sm">المجموع الكلي:</td>
                                                    <td className="p-2 text-center text-primary-f text-sm">{formatCurrency(selectedOrder.total_amount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400">
                                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <span className="text-sm">اختر طلباً من القائمة</span>
                                            <p className="text-xs mt-1">استخدم طرق الإدخال على اليمين</p>
                                        </div>
                                    )}
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
                                    variant="outline"
                                    className="px-4 py-2 text-sm bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s"
                                >
                                    <RotateCcw className="w-4 h-4 ml-1" />
                                    تحديث
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
                                        <th className="p-2 text-center border-b w-24">رقم الطلب</th>
                                        <th className="p-2 text-center border-b w-28">الإجمالي</th>
                                        <th className="p-2 text-center border-b w-28">المدفوع</th>
                                        <th className="p-2 text-center border-b w-28">المتبقي</th>
                                        <th className="p-2 text-center border-b w-28">الحالة</th>
                                        <th className="p-2 text-center border-b w-32">ملاحظات</th>
                                        <th className="p-2 text-center border-b w-40">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="p-8 text-center text-gray-400">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                لا توجد فواتير
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map(invoice => {
                                            const paymentStatus = getPaymentStatus(invoice.total_amount, invoice.paid_amount);
                                            const progress = (parseFloat(invoice.paid_amount) / parseFloat(invoice.total_amount)) * 100;
                                            return (
                                                <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 font-medium text-sm">#{invoice.invoice_id}</td>
                                                    <td className="p-2 text-sm">{getFormattedDate(invoice.issued_at)}</td>
                                                    <td className="p-2 text-sm">{invoice.user?.full_name || '-'}</td>
                                                    <td className="p-2 text-sm">
                                                        <div>
                                                            <div className="font-medium">{invoice.customer?.name}</div>
                                                            <div className="text-gray-500 text-xs">{invoice.customer?.phone}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center text-sm">#{invoice.order_id}</td>
                                                    <td className="p-2 text-center font-bold text-primary-f text-sm">
                                                        {formatCurrency(invoice.total_amount)}
                                                    </td>
                                                    <td className="p-2 text-center text-green-600 font-bold text-sm">
                                                        {formatCurrency(invoice.paid_amount)}
                                                    </td>
                                                    <td className="p-2 text-center text-red-600 font-bold text-sm">
                                                        {formatCurrency(invoice.remaining_amount)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${paymentStatus.className}`}>
                                                                {paymentStatus.label}
                                                            </span>
                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-green-500" 
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center max-w-[150px] truncate text-sm" title={invoice.notes}>
                                                        {invoice.notes || '-'}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleViewInvoice(invoice)}
                                                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"
                                                                title="عرض التفاصيل"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddPayment(invoice)}
                                                                className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"
                                                                title="إضافة دفعة"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditInvoice(invoice)}
                                                                className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded-lg"
                                                                title="تعديل"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteInvoice(invoice.invoice_id)}
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

                        {/* نافذة إضافة دفعة */}
                        {selectedInvoiceForPayment && (
                            <StyledDialog
                                isOpen={showPaymentDialog}
                                onOpenChange={setShowPaymentDialog}
                                title="إضافة دفعة جديدة"
                                onCancel={() => {
                                    setShowPaymentDialog(false);
                                    setSelectedInvoiceForPayment(null);
                                    setPaymentAmount("");
                                }}
                                onConfirm={confirmAddPayment}
                                confirmLabel="إضافة"
                                cancelLabel="إلغاء"
                                isLoading={loading}
                            >
                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-2">معلومات الفاتورة</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>رقم الفاتورة: #{selectedInvoiceForPayment.invoice_id}</div>
                                            <div>رقم الطلب: #{selectedInvoiceForPayment.order_id}</div>
                                            <div>الزبون: {selectedInvoiceForPayment.customer?.name}</div>
                                            <div>الإجمالي: {formatCurrency(selectedInvoiceForPayment.total_amount)}</div>
                                            <div>المدفوع: {formatCurrency(selectedInvoiceForPayment.paid_amount)}</div>
                                            <div>المتبقي: {formatCurrency(selectedInvoiceForPayment.remaining_amount)}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="font-bold text-sm mb-1 block">مبلغ الدفعة</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="أدخل المبلغ..."
                                                className="h-10 text-sm flex-1"
                                                step="0.01"
                                                min="0"
                                                max={selectedInvoiceForPayment.remaining_amount}
                                            />
                                            <span className="text-sm font-bold text-gray-600">ل.س</span>
                                        </div>
                                    </div>
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
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
                                            <div className="font-bold text-sm">{getFormattedDate(selectedInvoice.issued_at)}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">المنشئ</div>
                                            <div className="font-bold text-sm">{selectedInvoice.user?.full_name || '-'}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">رقم الطلب</div>
                                            <div className="font-bold text-sm">#{selectedInvoice.order_id}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">الزبون</div>
                                            <div className="font-bold text-sm">{selectedInvoice.customer?.name}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">رقم الهاتف</div>
                                            <div className="font-bold text-sm">{selectedInvoice.customer?.phone}</div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-sm font-bold mb-2">معلومات الدفع</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>الإجمالي: {formatCurrency(selectedInvoice.total_amount)}</div>
                                            <div>المدفوع: {formatCurrency(selectedInvoice.paid_amount)}</div>
                                            <div>المتبقي: {formatCurrency(selectedInvoice.remaining_amount)}</div>
                                            <div>
                                                الحالة: 
                                                <span className={`mr-1 px-2 py-0.5 rounded-full text-xs ${
                                                    getPaymentStatus(selectedInvoice.total_amount, selectedInvoice.paid_amount).className
                                                }`}>
                                                    {getPaymentStatus(selectedInvoice.total_amount, selectedInvoice.paid_amount).label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedInvoice.notes && (
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            <div className="text-xs text-gray-500">ملاحظات</div>
                                            <div className="text-sm">{selectedInvoice.notes}</div>
                                        </div>
                                    )}
                                </div>
                            </StyledDialog>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}