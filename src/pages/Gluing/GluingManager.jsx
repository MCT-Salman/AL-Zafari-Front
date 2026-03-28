// src/pages/Gluing/GluingManager.jsx

import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { productionApi } from "../../api/productionApi";

import { productionProcessApi } from "../../api/productionProcessApi";

import { colorApi } from "../../api/colorApi";

import { batchApi } from "../../api/batchApi";

import { connectSocket, disconnectSocket } from "../../lib/socket";

import { Card } from "../../components/ui/card";

import { Button } from "../../components/ui/button";

import { Input } from "../../components/ui/input";

import { Label } from "../../components/ui/label";

import FilterSelect from "../../components/common/FilterSelect";

import StyledDialog from "../../components/common/StyledDialog";

import LoadingState from "../../components/common/LoadingState";

import NotificationsBell from "../../components/common/NotificationsBell";

import { toast } from "react-hot-toast";

import {

  Package,

  ArrowRight,

  Calculator,

  Eye,

  Check,

  X,

  Trash,

  AlertCircle,

  Search,

  RefreshCw,

  Hash,

  Printer,

  ChevronUp,

  ChevronDown

} from "lucide-react";

import { ProductionStatus, ProductionType, TypeItem, UserRole } from "../../types/enums";



const ROLE_LABELS = {

  [UserRole.admin]: "مدير النظام",

  [UserRole.accountant]: "محاسب",

  [UserRole.cashier]: "كاشير",

  [UserRole.Production_Technician]: "فني إنتاج",

  [UserRole.Cutting_Technician]: "فني قص",

  [UserRole.Slitting_Technician]: "فني تشريح",

  [UserRole.Gluing_Technician]: "فني تغرية",

  [UserRole.Warehouse_Keeper]: "أمين المستودع",

};



export default function GluingManager() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const notificationDedupRef = useRef(new Map());

  const [showHeader, setShowHeader] = useState(true);



  useEffect(() => {

    if (!user || user.role !== UserRole.Gluing_Technician) {

      toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");

      navigate("/dashboard");

    }

  }, [user, navigate]);



  const [orders, setOrders] = useState([]);

  const [processes, setProcesses] = useState([]);

  const [loadingOrders, setLoadingOrders] = useState(false);

  const [loadingProcesses, setLoadingProcesses] = useState(false);

  const [colors, setColors] = useState([]);

  const [batches, setBatches] = useState([]);



  const [ioMode, setIoMode] = useState("input");

  const [inputMode, setInputMode] = useState("manual");

  const [qrInput, setQrInput] = useState("");

  const [activeOrderItem, setActiveOrderItem] = useState(null);



  const [inputForm, setInputForm] = useState({

    input_width: "",

    color_id: "",

    batch_id: "",

    input_length: "",

    type_item: TypeItem.Machine,

    source: "cutting",

    destination: "gluing",

    notes: ""

  });



  const [outputForm, setOutputForm] = useState({

    output_length: "50",

    notes: ""

  });



  const [currentInput, setCurrentInput] = useState("input_length");

  const [ordersTab, setOrdersTab] = useState("current");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  const [orderItems, setOrderItems] = useState([]);

  const [pendingCompleteItem, setPendingCompleteItem] = useState(null);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const [pendingProcess, setPendingProcess] = useState(null);

  const [showProcessConfirmDialog, setShowProcessConfirmDialog] = useState(false);

  const [pendingDeleteProcess, setPendingDeleteProcess] = useState(null);

  const [showDeleteProcessDialog, setShowDeleteProcessDialog] = useState(false);

  const [selectedProcesses, setSelectedProcesses] = useState(new Set());

  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);

  const [previewQr, setPreviewQr] = useState(null);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const normalizeDecimal = (value) => String(value ?? "").replace(",", ".");

  const toNumber = (value) => {

    const normalized = normalizeDecimal(value);

    const num = Number(normalized);

    return Number.isNaN(num) ? 0 : num;

  };

  const appendDecimal = (value) => {

    const text = String(value || "");

    if (text.includes(".") || text.includes(",")) return text;

    return text ? `${text},` : "0,";

  };



  const orderStatusConfig = {

    [ProductionStatus.pending]: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" },

    [ProductionStatus.preparing]: { label: "قيد التحضير", className: "bg-blue-100 text-blue-800" },

    [ProductionStatus.completed]: { label: "مكتمل", className: "bg-green-100 text-green-800" },

    [ProductionStatus.canceled]: { label: "ملغي", className: "bg-red-100 text-red-800" }

  };



  const getStatusBadge = (status) => {

    return orderStatusConfig[status] || { label: status || "غير محدد", className: "bg-gray-100 text-gray-700" };

  };



  const colorOptions = useMemo(() => {

    return colors.map(c => ({

      value: String(c.color_id),

      label: `${c.color_name} (${c.color_code})`

    }));

  }, [colors]);



  const batchOptions = useMemo(() => {

    return batches.map(b => ({

      value: String(b.batch_id),

      label: b.batch_number || `دفعة ${b.batch_id}`

    }));

  }, [batches]);



  const shouldNotify = (key, windowMs = 8000) => {

    const now = Date.now();

    const lastSeen = notificationDedupRef.current.get(key);

    if (lastSeen && now - lastSeen < windowMs) return false;

    notificationDedupRef.current.set(key, now);

    return true;

  };



  const loadOrders = async () => {

    try {

      setLoadingOrders(true);

      const response = await productionApi.getProductionOrdersByType(ProductionType.gluing);

      const data = response?.data || response;

      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

      setOrders(list);

    } catch (error) {

      console.error("Error loading gluing orders:", error);

      toast.error("فشل في تحميل الطلبات");

    } finally {

      setLoadingOrders(false);

    }

  };



  const loadProcesses = async () => {

    try {

      setLoadingProcesses(true);

      const response = await productionProcessApi.getProcessesByType("gluing");

      const data = response?.data?.processes || response?.data || response;

      setProcesses(Array.isArray(data) ? data : []);

    } catch (error) {

      console.error("Error loading processes:", error);

      toast.error("فشل في تحميل المخرجات");

    } finally {

      setLoadingProcesses(false);

    }

  };



  const loadReferenceData = async () => {

    try {

      const [colorRes, batchRes] = await Promise.all([

        colorApi.getColors(),

        batchApi.getBatches()

      ]);

      setColors((colorRes?.data?.colors || colorRes?.data || colorRes || []) ?? []);

      setBatches((batchRes?.data?.batches || batchRes?.data || batchRes || []) ?? []);

    } catch (error) {

      toast.error("فشل في تحميل البيانات المرجعية");

    }

  };



  useEffect(() => {

    loadReferenceData();

    loadOrders();

    loadProcesses();

  }, []);



  useEffect(() => {

    const token = localStorage.getItem("accessToken");

    if (!token) return;

    const socket = connectSocket(token);



    const handleNotification = (payload) => {

      const data = payload?.data ?? payload;

      const key = `${payload?.type || "notification"}:${data?.productionOrderId || data?.production_order_id || ""}`;

      if (!shouldNotify(key, 5000)) return;

      loadOrders();

      loadProcesses();

    };



    socket.on("notification", handleNotification);

    socket.on("order:updated", handleNotification);

    socket.on("warehouse:order:new", handleNotification);

    socket.on("warehouse:orders", handleNotification);

    socket.on("order:new", handleNotification);

    socket.on("ORDER_NEW", handleNotification);



    return () => {

      socket.off("notification", handleNotification);

      socket.off("order:updated", handleNotification);

      socket.off("warehouse:order:new", handleNotification);

      socket.off("warehouse:orders", handleNotification);

      socket.off("order:new", handleNotification);

      socket.off("ORDER_NEW", handleNotification);

      disconnectSocket();

    };

  }, []);



  const handleNumberClick = (num) => {

    if (currentInput === "input_length") {

      setInputForm((prev) => ({ ...prev, input_length: String(prev.input_length || "") + num.toString() }));

      return;

    }

    if (currentInput === "output_length") {

      setOutputForm((prev) => ({ ...prev, output_length: String(prev.output_length || "") + num.toString() }));

    }

  };



  const handleDecimalClick = () => {

    if (currentInput === "input_length") {

      setInputForm((prev) => ({ ...prev, input_length: appendDecimal(prev.input_length) }));

      return;

    }

    if (currentInput === "output_length") {

      setOutputForm((prev) => ({ ...prev, output_length: appendDecimal(prev.output_length) }));

    }

  };



  const handleBackspace = () => {

    const back = (value) => String(value || "").slice(0, -1);

    if (currentInput === "input_length") {

      setInputForm((prev) => ({ ...prev, input_length: back(prev.input_length) }));

      return;

    }

    if (currentInput === "output_length") {

      setOutputForm((prev) => ({ ...prev, output_length: back(prev.output_length) }));

    }

  };



  const handleClear = () => {

    if (currentInput === "input_length") {

      setInputForm((prev) => ({ ...prev, input_length: "" }));

      return;

    }

    if (currentInput === "output_length") {

      setOutputForm((prev) => ({ ...prev, output_length: "" }));

    }

  };



  const formatDestination = (destination) => ({

    cutting: "قص",

    gluing: "تغرية",

    production: "إنتاج",

    warehouse: "مستودع",

    slitting: "شق"

  }[destination] || destination || "-");



  const formatDate = (dateString) => {

    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("en-US", {

      year: "numeric",

      month: "short",

      day: "numeric",

      hour: "2-digit",

      minute: "2-digit"

    });

  };



  const buildProcessQrData = (proc) => {

    const colorInfo = proc.color || colors.find((c) => String(c.color_id) === String(proc.color_id));

    const batchInfo = proc.batch || batches.find((b) => String(b.batch_id) === String(proc.batch_id));

    return [

      colorInfo?.color_code || "",

      proc.input_width || "",

      batchInfo?.batch_number || "",

      proc.input_length || "",

      proc.output_length || "",

      proc.process_id || ""

    ].join("|");

  };

  const buildProcessQrFooter = (proc) => {

    const colorInfo = proc.color || colors.find((c) => String(c.color_id) === String(proc.color_id));

    const batchInfo = proc.batch || batches.find((b) => String(b.batch_id) === String(proc.batch_id));

    return [

      `اللون: ${colorInfo?.color_name || "-"}`,

      `كود اللون: ${colorInfo?.color_code || "-"}`,

      `العرض: ${proc.input_width || "-"}`,

      `الطبخة: ${batchInfo?.batch_number || "-"}`,

      `الطول المدخل: ${proc.input_length || "-"}`,

      `الطول المخرج: ${proc.output_length || "-"}`

    ].join(" | ");

  };



  const getQrUrl = (data) =>

    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;



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



  const handleApplyOrderToInputs = (item) => {

    if (!item) return;

    setActiveOrderItem(item);

    setInputForm((prev) => ({

      ...prev,

      input_width: item.width ? String(item.width) : "",

      color_id: item.color_id ? String(item.color_id) : "",

      batch_id: item.batch_id ? String(item.batch_id) : "",

      input_length: item.length ? String(item.length) : "",

      type_item: item.type_item || TypeItem.Machine,

      source: "cutting",

      destination: "gluing",

      notes: item.notes || ""

    }));

    setIoMode("output");

  };



  const handleCreateProcess = () => {

    try {

      if (!inputForm.input_width || !inputForm.color_id || !inputForm.batch_id || !inputForm.input_length) {

        toast.error("يرجى تعبئة جميع بيانات الإدخال");

        return;

      }

      if (!outputForm.output_length) {

        toast.error("يرجى إدخال الطول المخرج");

        return;

      }



      // Prepare payload for confirmation dialog

      const payload = {

        color_id: Number(inputForm.color_id),

        batch_id: Number(inputForm.batch_id),

        type_item: inputForm.type_item || TypeItem.Machine,

        input_length: toNumber(inputForm.input_length),

        output_length: normalizeDecimal(outputForm.output_length ?? ""),

        input_width: toNumber(inputForm.input_width),

        type: "gluing",

        source: "cutting",

        destination: "gluing",

        notes: outputForm.notes || inputForm.notes

      };



      // Set pending process data and show confirmation dialog

      setPendingProcess(payload);

      setShowProcessConfirmDialog(true);

    } catch (error) {

      console.error(error);

      toast.error("فشل في إعداد بيانات التغرية");

    }

  };



  const confirmCreateProcess = async () => {

    try {

      const response = await productionProcessApi.createProcess(pendingProcess);

      if (response?.success === false || response?.error) {

        throw new Error(response?.message || response?.error || "تعذر إنشاء العملية");

      }



      toast.success("تم إنشاء عملية التغرية بنجاح");

      loadProcesses();

      loadOrders();



      if (activeOrderItem?.production_order_item_id) {

        await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);

        setOrders((prev) =>

          Array.isArray(prev)

            ? prev.map((o) =>

              String(o.production_order_item_id) === String(activeOrderItem.production_order_item_id)

                ? { ...o, status: ProductionStatus.completed }

                : o

            )

            : prev

        );

      }



      // Reset forms

      setInputForm({

        input_width: "",

        color_id: "",

        batch_id: "",

        input_length: "",

        type_item: TypeItem.Machine,

        source: "cutting",

        destination: "gluing",

        notes: ""

      });

      setOutputForm({ output_length: "50", notes: "" });

      setActiveOrderItem(null);

      setIoMode("input");

      setShowProcessConfirmDialog(false);

      setPendingProcess(null);

    } catch (error) {

      console.error(error);

      toast.error(error?.message || "فشل في إنشاء عملية التغرية");

    }

  };



  const requestDeleteProcess = (process) => {

    setPendingDeleteProcess(process);

    setShowDeleteProcessDialog(true);

  };



  const confirmDeleteProcess = async () => {

    if (!pendingDeleteProcess?.process_id) return;

    try {

      await productionProcessApi.deleteProcess(pendingDeleteProcess.process_id);

      setProcesses((prev) => prev.filter((p) => p.process_id !== pendingDeleteProcess.process_id));

      toast.success("تم حذف عملية التغرية بنجاح");

      setShowDeleteProcessDialog(false);

      setPendingDeleteProcess(null);

    } catch (error) {

      console.error(error);

      toast.error("فشل في حذف عملية التغرية");

    }

  };



  const toggleProcessSelection = (processId) => {

    setSelectedProcesses(prev => {

      const newSet = new Set(prev);

      if (newSet.has(processId)) {

        newSet.delete(processId);

      } else {

        newSet.add(processId);

      }

      return newSet;

    });

  };



  const toggleAllProcessesSelection = () => {

    if (selectedProcesses.size === processes.length) {

      setSelectedProcesses(new Set());

    } else {

      setSelectedProcesses(new Set(processes.map(p => p.process_id)));

    }

  };



  const requestMultiDeleteProcesses = () => {

    if (selectedProcesses.size === 0) {

      toast.error("يرجى تحديد عملية واحدة على الأقل");

      return;

    }

    setShowMultiDeleteDialog(true);

  };



  const confirmMultiDeleteProcesses = async () => {

    try {

      const ids = Array.from(selectedProcesses);

      await productionProcessApi.deleteProcesses(ids);

      setProcesses((prev) => prev.filter((p) => !selectedProcesses.has(p.process_id)));

      toast.success(`تم حذف ${ids.length} عملية تغليف بنجاح`);

      setSelectedProcesses(new Set());

      setShowMultiDeleteDialog(false);

    } catch (error) {

      console.error(error);

      toast.error("فشل في حذف عمليات التغرية");

    }

  };



  const handleOrderSelect = async (order) => {

    setSelectedOrder(order);

    setShowOrderDetails(true);

    try {

      setLoadingOrderDetails(true);

      setOrderItems([order]);

    } catch (error) {

      console.error("Error loading order details:", error);

      toast.error("فشل في تحميل تفاصيل الطلب");

      setOrderItems([]);

    } finally {

      setLoadingOrderDetails(false);

    }

  };



  const requestCompleteOrderItem = (order) => {

    if (!order?.production_order_item_id) return;

    setPendingCompleteItem(order);

    setShowCompleteDialog(true);

  };



  const handleCompleteOrderItem = async () => {

    if (!pendingCompleteItem?.production_order_item_id) return;

    try {

      await productionApi.updateProductionItemStatus(pendingCompleteItem.production_order_item_id, ProductionStatus.completed);

      setOrders((prev) =>

        Array.isArray(prev)

          ? prev.map((o) =>

            String(o.production_order_item_id) === String(pendingCompleteItem.production_order_item_id)

              ? { ...o, status: ProductionStatus.completed }

              : o

          )

          : prev

      );

      toast.success(`تم إتمام الطلب #${pendingCompleteItem.production_order_id} بنجاح`);

      setShowCompleteDialog(false);

      setShowOrderDetails(false);

      setPendingCompleteItem(null);

    } catch (error) {

      console.error("Error completing order:", error);

      toast.error("فشل في إتمام الطلب");

    }

  };



  const renderOrdersTable = (list) => (

    <div className="flex-1 overflow-auto min-h-0 border rounded-lg bg-white">

      <table className="w-full table-auto border-collapse">

        <thead className="bg-gray-100 sticky top-0 z-20">

          <tr>

            {["#", "العرض", "اللون", "الطبخة", "الطول", "النوع", "المصدر", "الوجهة", "الحالة", "الإجراءات"].map((h) => (

              <th key={h} className="p-2 text-center border-b text-sm">{h}</th>

            ))}

          </tr>

        </thead>

        <tbody>

          {loadingOrders ? (

            <tr><td colSpan="10" className="p-6"><LoadingState /></td></tr>

          ) : list.length === 0 ? (

            <tr><td colSpan="10" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد طلبات</td></tr>

          ) : list.map((order, index) => {

            const colorInfo = colors.find((c) => String(c.color_id) === String(order.color_id));

            const batchInfo = batches.find((b) => String(b.batch_id) === String(order.batch_id));

            const statusBadge = getStatusBadge(order.status);

            return (

              <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">

                <td className="px-1 py-2 text-center text-sm">#{order.production_order_id || index + 1}</td>

                <td className="px-1 py-2 text-center text-sm">{order.width || "-"}</td>

                <td className="px-1 py-2 text-center text-sm">{colorInfo?.color_name || "-"} ({colorInfo?.color_code || "-"})</td>

                <td className="px-1 py-2 text-center text-sm">{batchInfo?.batch_number || "-"}</td>

                <td className="px-1 py-2 text-center text-sm">{order.length || "-"}</td>

                <td className="px-1 py-2 text-center text-sm">{order.type_item === TypeItem.Presser ? "كوي" : "مكنة"}</td>

                <td className="px-1 py-2 text-center text-sm">{formatDestination(order.source)}</td>

                <td className="px-1 py-2 text-center text-sm">{formatDestination(order.destination)}</td>

                <td className="px-1 py-2 text-center text-sm">

                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge.className}`}>

                    {statusBadge.label}

                  </span>

                </td>

                <td className="px-1 py-2 text-center">

                  <div className="flex h-8 items-center justify-center gap-1">

                    <button onClick={() => handleOrderSelect(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="عرض التفاصيل"><Eye className="w-4 h-4" /></button>

                    {String(order.status || "").toLowerCase() === ProductionStatus.pending && (

                      <>

                        <button onClick={() => handleApplyOrderToInputs(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="إدخال"><Hash className="w-4 h-4" /></button>

                        <button onClick={() => requestCompleteOrderItem(order)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50" title="إتمام الطلب"><Check className="w-4 h-4" /></button>

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

      {/* Header Toggle Button */}

      <div className={`absolute left-0 left-[49%] z-40 transition-all duration-300 ${showHeader ? "top-[7.5%]" : "top-[2%]"}`}>

        <Button

          type="button"

          onClick={() => setShowHeader((prev) => !prev)}

          className="h-10 w-10 rounded-full border-2 border-t-secondary-f border-l-secondary-f border-r-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105  active:scale-95"

          title={showHeader ? "إخفاء الهيدر" : "إظهار الهيدر"}

        >

          {showHeader ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}

        </Button>

      </div>



      {/* Header */}

      {showHeader && (

        <div className="flex-shrink-0">

          <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">

            <div className="flex items-center gap-3">

              <Package className="w-7 h-7" />

              <div>

                <h1 className="text-2xl font-bold">إدارة التغرية</h1>

                <p className="text-sm opacity-90">لوحة عمليات التغرية</p>

              </div>

            </div>

            <div className="flex items-center gap-2">

              <NotificationsBell />

              <span className="text-sm">مرحباً، {user?.full_name}</span>

              <Button

                size="lg"

                variant="outline"

                onClick={() => setShowLogoutDialog(true)}

                className="px-5 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"

              >

                <ArrowRight className="w-4 h-4 ml-2 rotate-180" />

                تسجيل الخروج

              </Button>

            </div>

          </div>

        </div>

      )}



      {!showHeader && (

        <div className="flex-shrink-0 text-stone-50">

          <div className="flex items-center justify-between gap-1 border-secondary-f border-b-2 bg-primary-f px-4 py-0 shadow-sm backdrop-blur">

            <div className="min-w-0">

              <div className="truncate text-sm font-bold text-secondary-s">{user?.full_name || user?.username || "-"}</div>

            </div>

            <div className="h-10 w-px" />

            <div className="min-w-0 text-right">

              <div className="truncate text-sm font-bold text-secondary-s">{ROLE_LABELS[user?.role] || user?.role}</div>

            </div>

          </div>

        </div>

      )}



      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

          <Card className="p-4 flex flex-col order-2 min-h-0">

            <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">

              <div className="flex items-center justify-between">

                <div className="flex gap-2">

                  <Button variant={ioMode === "input" ? "default" : "outline"} onClick={() => setIoMode("input")}>إدخال</Button>

                  <Button variant={ioMode === "output" ? "default" : "outline"} onClick={() => setIoMode("output")}>إخراج</Button>

                </div>

              </div>



              {ioMode === "input" ? (

                <div className="space-y-4">

                  <div className="flex gap-2">

                    <Button variant="outline" className={`flex-1 ${inputMode === "qr" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`} onClick={() => setInputMode("qr")}>

                      <Search className="w-4 h-4 ml-2" />QR

                    </Button>

                    <Button variant="outline" className={`flex-1 ${inputMode === "manual" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`} onClick={() => setInputMode("manual")}>

                      <Hash className="w-4 h-4 ml-2" />يدوي

                    </Button>

                  </div>



                  {inputMode === "qr" && (

                    <div className="space-y-2">

                      <Input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="width|color_id|batch_id|length" />

                      <Button className="w-full" onClick={() => toast.success("تم تطبيق بيانات QR")} disabled={!qrInput.trim()}>تطبيق</Button>

                    </div>

                  )}



                  {inputMode === "manual" && (

                    <div className="grid grid-cols-2 gap-3">

                      <div>

                        <Label>العرض</Label>

                        <div className="grid grid-cols-2 gap-2 mt-2">

                          {["22", "44"].map((width) => (

                            <button

                              key={width}

                              type="button"

                              onClick={() => setInputForm(prev => ({ ...prev, input_width: width }))}

                              className={`

                                rounded-xl border-2 text-base font-medium

                                transition-all hover:scale-[1.02] active:scale-[0.98]

                                flex items-center justify-center p-3

                                ${inputForm.input_width === width

                                  ? "border-secondary-s bg-secondary-s text-white shadow-lg"

                                  : "border-gray-300 bg-white hover:border-secondary-s"

                                }

                              `}

                            >

                              {width}

                            </button>

                          ))}

                        </div>

                      </div>

                      <div>

                        <Label>اللون</Label>

                        <FilterSelect value={inputForm.color_id} onChange={(e) => setInputForm(prev => ({ ...prev, color_id: e.target.value }))} options={colorOptions} placeholder="اختر اللون" />

                      </div>

                      <div>

                        <Label>الطبخة</Label>

                        <FilterSelect value={inputForm.batch_id} onChange={(e) => setInputForm(prev => ({ ...prev, batch_id: e.target.value }))} options={batchOptions} placeholder="اختر الطبخة" />

                      </div>

                      <div>

                        <Label>الطول</Label>

                        <Input value={inputForm.input_length} onFocus={() => setCurrentInput("input_length")} readOnly className={`text-center py-6 ${currentInput === "input_length" ? "ring-2 ring-blue-500" : ""}`} placeholder="0" />

                      </div>

                      <div className="col-span-2">

                        <Label>ملاحظات</Label>

                        <Input value={inputForm.notes} onChange={(e) => setInputForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="ملاحظات إضافية" />

                      </div>

                      <div className="col-span-2">

                        <Button className="w-full" onClick={() => setIoMode("output")}>إدخال</Button>

                      </div>

                    </div>

                  )}

                </div>

              ) : (

                <div className="space-y-4">

                  <div className="border rounded-lg p-3 bg-white">

                    <div className="text-sm font-bold mb-2">بيانات الإدخال</div>

                    <table className="w-full text-sm">

                      <thead className="bg-gray-100">

                        <tr>

                          <th className="p-2 text-center">العرض</th>

                          <th className="p-2 text-center">اللون</th>

                          <th className="p-2 text-center">الطبخة</th>

                          {/* <th className="p-2 text-center">السماكة</th> */}

                          <th className="p-2 text-center">الطول المدخل</th>

                        </tr>

                      </thead>

                      <tbody>

                        <tr className="border-t">

                          <td className="p-2 text-center">{inputForm.input_width || "-"}</td>

                          <td className="p-2 text-center">{colors.find(c => String(c.color_id) === String(inputForm.color_id))?.color_name || "-"} ({colors.find(c => String(c.color_id) === String(inputForm.color_id))?.color_code || "-"})</td>

                          <td className="p-2 text-center">{batches.find(b => String(b.batch_id) === String(inputForm.batch_id))?.batch_number || "-"}</td>

                          {/* <td className="p-2 text-center">-</td> */}

                          <td className="p-2 text-center">{inputForm.input_length || "-"}</td>

                        </tr>

                      </tbody>

                    </table>

                  </div>



                  <div className="flex items-center justify-center">

                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />

                  </div>



                  <div>

                    <Label>طول الإخراج</Label>

                    <Input

                      value={outputForm.output_length}

                      onChange={(e) => setOutputForm(prev => ({ ...prev, output_length: e.target.value }))}

                      onFocus={() => setCurrentInput("output_length")}

                      className={`text-center ${currentInput === "output_length" ? "ring-2 ring-blue-500" : ""}`}

                      placeholder="0"

                    />

                  </div>



                  <div>

                    <Label>ملاحظات</Label>

                    <Input value={outputForm.notes} onChange={(e) => setOutputForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="ملاحظات الإخراج" />

                  </div>



                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCreateProcess}>إخراج</Button>

                </div>

              )}

            </div>

          </Card>



          <Card className="p-4 flex flex-col space-y-4 order-1 min-h-0">

            <div className="flex items-center justify-between mb-2">

              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-orange-600" />الطلبات</h2>

              <div className="flex items-center gap-2">

                <Button variant={ordersTab === "current" ? "default" : "outline"} size="sm" className={ordersTab === "current" ? "bg-blue-50 border-blue-300 text-blue-700" : "text-blue-600 border-blue-200 hover:bg-blue-50"} onClick={() => setOrdersTab("current")}>قيد الانتظار</Button>

                <Button variant={ordersTab === "completed" ? "default" : "outline"} size="sm" className={ordersTab === "completed" ? "bg-green-50 border-green-300 text-green-700" : "text-green-600 border-green-200 hover:bg-green-50"} onClick={() => setOrdersTab("completed")}>المكتملة</Button>

                <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders}><RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? "animate-spin" : ""}`} />تحديث</Button>

              </div>

            </div>

            {renderOrdersTable(ordersTab === "current" ? orders.filter(o => String(o.status || "").toLowerCase() === ProductionStatus.pending) : orders.filter(o => String(o.status || "").toLowerCase() === ProductionStatus.completed))}

          </Card>

        </div>



        <div className="flex gap-4 flex-1 min-h-0 flex-row-reverse">

          <Card className="p-4 flex flex-col flex-1 space-y-4 min-h-0">

            {/* <div className="flex items-center justify-between mb-2">

              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-purple-600" />جدول المخرجات</h3>

              <Button variant="outline" size="sm" onClick={loadProcesses} disabled={loadingProcesses}><RefreshCw className={`w-4 h-4 ml-2 ${loadingProcesses ? "animate-spin" : ""}`} />تحديث</Button>

            </div> */}

            <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">

              {loadingProcesses ? (

                <div className="flex items-center justify-center h-32"><LoadingState /></div>

              ) : processes.length === 0 ? (

                <div className="text-center py-8 text-gray-500">

                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />

                  <div className="text-lg font-medium">لا توجد مخرجات</div>

                  <div className="text-sm">سيظهر سجل عمليات التغرية هنا بعد الإنشاء</div>

                </div>

              ) : (

                <div className="divide-y">

                  {/* Multi-select controls */}

                  <div className="p-2 bg-gray-100 border-b flex items-center justify-between sticky top-0 z-10">

                    <div className="flex items-center gap-2">

                      <input

                        type="checkbox"

                        checked={selectedProcesses.size === processes.length && processes.length > 0}

                        onChange={toggleAllProcessesSelection}

                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"

                      />

                      <span className="text-xs text-gray-600">

                        تحديد الكل ({selectedProcesses.size}/{processes.length})

                      </span>

                    </div>

                    {selectedProcesses.size > 0 && (

                      <Button

                        variant="destructive"

                        size="sm"

                        onClick={requestMultiDeleteProcesses}

                        className="text-xs"

                      >

                        <Trash className="w-3 h-3 ml-1" />

                        حذف المحدد ({selectedProcesses.size})

                      </Button>

                    )}

                  </div>



                  <table className="w-full">

                    <thead className="bg-gray-50 sticky top-8 z-10">

                      <tr className="text-xs font-bold">

                        <th className="p-2 text-center border-b"></th>

                        <th className="p-2 text-center border-b">#</th>

                        <th className="p-2 text-center border-b">العرض</th>

                        <th className="p-2 text-center border-b">اللون</th>

                        <th className="p-2 text-center border-b">الطبخة</th>

                        <th className="p-2 text-center border-b">الطول المدخل</th>

                        <th className="p-2 text-center border-b">الطول المخرج</th>

                        <th className="p-2 text-center border-b">الهدر</th>

                        <th className="p-2 text-center border-b">الوجهة</th>

                        <th className="p-2 text-center border-b">المستخدم</th>

                        <th className="p-2 text-center border-b">التوقيت</th>

                        <th className="p-2 text-center border-b">الإجراءات</th>

                      </tr>

                    </thead>

                    <tbody>

                      {processes.map(proc => {

                        const colorInfo = proc.color || colors.find(c => String(c.color_id) === String(proc.color_id));

                        const colorName = colorInfo?.color_name || "-";

                        const colorCode = colorInfo?.color_code || "-";

                        const batchNumber = proc.batch?.batch_number || batches.find(b => String(b.batch_id) === String(proc.batch_id))?.batch_number || "-";

                        const qrData = buildProcessQrData(proc);

                        const qrFooter = buildProcessQrFooter(proc);

                        const qrUrl = getQrUrl(qrData);

                        return (

                          <tr key={proc.process_id} className={`text-xs border-b ${selectedProcesses.has(proc.process_id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}>

                            <td className="p-2 text-center">

                              <input

                                type="checkbox"

                                checked={selectedProcesses.has(proc.process_id)}

                                onChange={() => toggleProcessSelection(proc.process_id)}

                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"

                              />

                            </td>

                            <td className="p-2 text-center">#{proc.process_id}</td>

                            <td className="p-2 text-center">{proc.input_width}</td>

                            <td className="p-2 text-center">{colorName} ({colorCode})</td>

                            <td className="p-2 text-center">{batchNumber}</td>

                            <td className="p-2 text-center">{proc.input_length}</td>

                            <td className="p-2 text-center">{proc.output_length}</td>

                            <td className="p-2 text-center">{proc.waste ?? "-"}</td>

                            <td className="p-2 text-center">{formatDestination(proc.destination)}</td>

                            <td className="p-2 text-center">{proc.user?.full_name || proc.user?.username || "-"}</td>

                            <td className="p-2 text-center">{formatDate(proc.created_at)}</td>

                            <td className="p-2 text-center">

                              <div className="flex items-center justify-center gap-1">

                                <button onClick={() => printQr(qrUrl, `QR - تغرية #${proc.process_id}`, qrFooter)} className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-violet-700 hover:bg-violet-50" title="طباعة QR"><Printer className="w-4 h-4" /></button>

                                <button

                                  onClick={() => requestDeleteProcess(proc)}

                                  className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50"

                                  title="حذف عملية التغرية"

                                >

                                  <Trash className="w-4 h-4" />

                                </button>

                              </div>

                            </td>

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </Card>



          <Card className="p-4 w-[260px] flex-shrink-0 self-stretch flex flex-col">

            <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">

              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (

                <Button key={num} variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(num)}>{num}</Button>

              ))}

              <Button variant="outline" className="h-12 text-lg" onClick={handleClear}><X className="w-4 h-4" /></Button>

              <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(0)}>0</Button>

              <Button variant="outline" className="h-12 text-lg" onClick={handleDecimalClick}>,</Button>

              <Button variant="outline" className="h-12 text-lg" onClick={handleBackspace}><ArrowRight className="w-4 h-4" /></Button>

            </div>

          </Card>

        </div>

      </div>



      <StyledDialog isOpen={showOrderDetails} onOpenChange={setShowOrderDetails} title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ""}`} contentClassName="max-w-5xl w-full" onCancel={() => setShowOrderDetails(false)} onConfirm={() => setShowOrderDetails(false)} confirmLabel="إغلاق" showCancel={false}>

        {loadingOrderDetails ? (

          <div className="py-10"><LoadingState /></div>

        ) : (

          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-3 text-sm">

              <div className="rounded-lg border p-3 bg-gray-50">رقم الطلب: #{selectedOrder?.production_order_id || "-"}</div>

              <div className="rounded-lg border p-3 bg-gray-50">الحالة: {getStatusBadge(selectedOrder?.status).label}</div>

            </div>

            <div className="overflow-auto border rounded-lg">

              <table className="w-full text-sm">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="p-2 text-center">العرض</th><th className="p-2 text-center">اللون</th><th className="p-2 text-center">الطبخة</th><th className="p-2 text-center">الطول</th><th className="p-2 text-center">النوع</th><th className="p-2 text-center">المصدر</th><th className="p-2 text-center">الوجهة</th><th className="p-2 text-center">ملاحظات </th>

                  </tr>

                </thead>

                <tbody>

                  {orderItems.map((item, index) => {

                    const colorInfo = colors.find(c => String(c.color_id) === String(item.color_id));

                    const batchInfo = batches.find(b => String(b.batch_id) === String(item.batch_id));

                    return (

                      <tr key={item.production_order_item_id || index} className="border-t">

                        <td className="p-2 text-center">{item.width || "-"}</td>

                        <td className="p-2 text-center">{colorInfo?.color_name || "-"} ({colorInfo?.color_code || "-"})</td>

                        <td className="p-2 text-center">{batchInfo?.batch_number || "-"}</td>

                        <td className="p-2 text-center">{item.length || "-"}</td>

                        <td className="p-2 text-center">{item.type_item === TypeItem.Presser ? "كوي" : "مكنة"}</td>

                        <td className="p-2 text-center">{formatDestination(item.source)}</td>

                        <td className="p-2 text-center">{formatDestination(item.destination)}</td>

                        <td className="p-2 text-center">{colorInfo?.notes || "-"}</td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

            {selectedOrder?.status === ProductionStatus.pending && (

              <div className="flex justify-end">

                <Button className="bg-green-600 hover:bg-green-700" onClick={() => requestCompleteOrderItem(selectedOrder)}><Check className="w-4 h-4 ml-2" />إتمام الطلب</Button>

              </div>

            )}

          </div>

        )}

      </StyledDialog>



      <StyledDialog isOpen={showCompleteDialog} onOpenChange={setShowCompleteDialog} title="تأكيد إتمام العملية" description="سيتم نقل الطلب إلى حالة مكتمل." confirmLabel="إتمام" cancelLabel="إلغاء" onCancel={() => { setShowCompleteDialog(false); setPendingCompleteItem(null); }} onConfirm={handleCompleteOrderItem}>

        <div className="text-sm text-gray-700">هل أنت متأكد من إتمام الطلب #{pendingCompleteItem?.production_order_id}؟</div>

      </StyledDialog>



      <StyledDialog isOpen={Boolean(previewQr)} onOpenChange={(open) => { if (!open) setPreviewQr(null); }} title={previewQr?.title || "QR"} contentClassName="max-w-md w-full" confirmLabel="إغلاق" showCancel={false} onConfirm={() => setPreviewQr(null)}>

        {previewQr && (

          <div className="space-y-4 text-center">

            <img src={previewQr.url} alt="qr" className="mx-auto h-56 w-56 rounded-lg border bg-white p-2" />

            <div className="text-xs text-gray-600">{previewQr.footer}</div>

            <Button className="w-full" variant="outline" onClick={() => printQr(previewQr.url, previewQr.title, previewQr.footer)}><Printer className="w-4 h-4 ml-2" />طباعة</Button>

          </div>

        )}

      </StyledDialog>



      <StyledDialog

        isOpen={showProcessConfirmDialog}

        onOpenChange={(open) => {

          setShowProcessConfirmDialog(open);

          if (!open) setPendingProcess(null);

        }}

        title="تأكيد عملية التغرية"

        contentClassName="max-w-2xl w-full"

        onCancel={() => {

          setShowProcessConfirmDialog(false);

          setPendingProcess(null);

        }}

        onConfirm={confirmCreateProcess}

        confirmLabel="تأكيد العملية"

        cancelLabel="إلغاء"

      >

        <div className="text-sm text-gray-700">

          هل تريد تنفيذ عملية التغرية

          <div className="mt-4">

            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">

              <thead className="bg-gray-100">

                <tr>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">العرض</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطول المدخل</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطول المخرج</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">اللون</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطبخة</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">المصدر</th>

                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الوجهة</th>

                </tr>

              </thead>

              <tbody>

                <tr className="hover:bg-gray-50">

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.input_width || "-"}</td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.input_length || "-"}</td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.output_length || "-"}</td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">

                    {(() => {

                      const color = colors.find(c => String(c.color_id) === String(pendingProcess?.color_id));

                      return color ? `${color.color_name} (${color.color_code})` : "-";

                    })()}

                  </td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">

                    {(() => {

                      const batch = batches.find(b => String(b.batch_id) === String(pendingProcess?.batch_id));

                      return batch ? batch.batch_number : "-";

                    })()}

                  </td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">

                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">

                      القص

                    </span>

                  </td>

                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">

                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">

                      التغرية

                    </span>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </StyledDialog>



      <StyledDialog

        isOpen={showDeleteProcessDialog}

        onOpenChange={(open) => {

          setShowDeleteProcessDialog(open);

          if (!open) setPendingDeleteProcess(null);

        }}

        title="تأكيد حذف عملية التغرية"

        contentClassName="max-w-md w-full"

        onCancel={() => {

          setShowDeleteProcessDialog(false);

          setPendingDeleteProcess(null);

        }}

        onConfirm={confirmDeleteProcess}

        confirmLabel="حذف"

        cancelLabel="إلغاء"

        confirmVariant="destructive"

      >

        <div className="text-sm text-gray-700">

          هل تريد حذف عملية التغرية

          <span className="font-bold"> #{pendingDeleteProcess?.process_id || ""}</span>؟

          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">

            <div className="grid grid-cols-2 gap-2 text-xs">

              <div><span className="font-medium">العرض:</span> {pendingDeleteProcess?.input_width || "-"}</div>

              <div><span className="font-medium">الطول المدخل:</span> {pendingDeleteProcess?.input_length || "-"}</div>

              <div><span className="font-medium">الطول المخرج:</span> {pendingDeleteProcess?.output_length || "-"}</div>

              <div><span className="font-medium">اللون:</span> {(() => {

                const color = colors.find(c => String(c.color_id) === String(pendingDeleteProcess?.color_id));

                return color ? `${color.color_name} (${color.color_code})` : "-";

              })()}</div>

              <div><span className="font-medium">الطبخة:</span> {(() => {

                const batch = batches.find(b => String(b.batch_id) === String(pendingDeleteProcess?.batch_id));

                return batch ? batch.batch_number : "-";

              })()}</div>

              <div><span className="font-medium">المصدر:</span> القص</div>

              <div><span className="font-medium">الوجهة:</span> التغرية</div>

              <div><span className="font-medium">الملاحظات:</span> {pendingDeleteProcess?.notes || "-"}</div>

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

          if (!open) setSelectedProcesses(new Set());

        }}

        title="تأكيد حذف عمليات التغرية"

        contentClassName="max-w-md w-full"

        onCancel={() => {

          setShowMultiDeleteDialog(false);

          setSelectedProcesses(new Set());

        }}

        onConfirm={confirmMultiDeleteProcesses}

        confirmLabel="حذف الكل"

        cancelLabel="إلغاء"

        confirmVariant="destructive"

      >

        <div className="text-sm text-gray-700">

          هل تريد حذف

          <span className="font-bold"> {selectedProcesses.size} </span>

          عملية تغليف؟

          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">

            <div className="text-xs text-red-600 font-medium">

              ⚠️ سيتم حذف جميع العمليات المحددة دفعة واحدة

            </div>

            <div className="mt-2 text-xs text-gray-600">

              العناصر التي سيتم حذفها: #{Array.from(selectedProcesses).join(', #')}

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

