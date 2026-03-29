// src/pages/Cutting/CuttingManager.jsx
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
  X,
  Trash,
  RefreshCw,
  Hash,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Check,
  AlertCircle,
  Printer
} from "lucide-react";
import { ProductionStatus, ProductionType, TypeItem, UserRole } from "../../types/enums";

const ROLE_LABELS = {
  [UserRole.admin]: "مدير النظام",
  [UserRole.accountant]: "محاسب",
  [UserRole.cashier]: "كاشير",
  [UserRole.sales]: "مبيعات",
  [UserRole.production_manager]: "مدير الإنتاج",
  [UserRole.Warehouse_Keeper]: "أمين المستودع",
  [UserRole.Warehouse_Products]: "أمين مستودع المنتجات",
  [UserRole.Dissection_Technician]: "فني التشريح",
  [UserRole.Cutting_Technician]: "فني القص",
  [UserRole.Gluing_Technician]: "فني اللصق"
};

export default function CuttingManager() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notificationDedupRef = useRef(new Map());

  useEffect(() => {
    if (!user || user.role !== UserRole.Cutting_Technician) {
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

  const [ioMode, setIoMode] = useState("input"); // input | output
  const [inputMode, setInputMode] = useState("manual"); // manual | qr
  const [qrInput, setQrInput] = useState("");
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const [inputForm, setInputForm] = useState({
    input_width: "",
    color_id: "",
    batch_id: "",
    thickness: "0.6",
    input_length: "",
    type_item: TypeItem.Machine,
    source: "slitting",
    destination: "gluing",
    notes: ""
  });

  const [outputForm, setOutputForm] = useState({
    notes: ""
  });
  const [outputItems, setOutputItems] = useState([
    { id: 1, length: "", qrUrl: "", qrData: "" }
  ]);

  const [currentInput, setCurrentInput] = useState("input_length");
  const [selectSearch, setSelectSearch] = useState({
    input_width: "",
    color_id: "",
    batch_id: ""
  });
  const [showHeader, setShowHeader] = useState(true);
  const [ordersTab, setOrdersTab] = useState("current");
  const [pendingProcess, setPendingProcess] = useState(null);
  const [showProcessConfirmDialog, setShowProcessConfirmDialog] = useState(false);
  const [pendingDeleteProcess, setPendingDeleteProcess] = useState(null);
  const [showDeleteProcessDialog, setShowDeleteProcessDialog] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState(new Set());
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [pendingCompleteItem, setPendingCompleteItem] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

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
  const formatLengthValue = (value) => {
    const rounded = Number(Number(value).toFixed(3));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  };
  const splitLengthIntoFifties = (value) => {
    const total = toNumber(value);
    if (!Number.isFinite(total) || total <= 0) return [];

    const parts = [];
    let remaining = total;

    while (remaining > 50) {
      parts.push("50");
      remaining = Number((remaining - 50).toFixed(3));
    }

    if (remaining > 0) {
      // If the last piece is less than 50, combine it with the previous one
      if (remaining < 50 && parts.length > 0) {
        const lastIndex = parts.length - 1;
        const previousValue = toNumber(parts[lastIndex]);
        const combinedValue = previousValue + remaining;
        parts[lastIndex] = formatLengthValue(combinedValue);
      } else {
        parts.push(formatLengthValue(remaining));
      }
    }

    return parts;
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

  const selectedColorInfo = useMemo(
    () => colors.find((color) => String(color.color_id) === String(inputForm.color_id)),
    [colors, inputForm.color_id]
  );

  const selectedThickness = useMemo(() => (
    inputForm.thickness ||
    activeOrderItem?.thickness ||
    selectedColorInfo?.thickness ||
    "0.6"
  ), [activeOrderItem?.thickness, inputForm.thickness, selectedColorInfo?.thickness]);

  useEffect(() => {
    const generatedLengths = splitLengthIntoFifties(inputForm.input_length);

    setOutputItems((prev) => {
      if (generatedLengths.length === 0) {
        return [{ id: 1, length: "", qrUrl: "", qrData: "", qrFooter: "" }];
      }

      return generatedLengths.map((length, index) => ({
        id: prev[index]?.id ?? `generated-${index}`,
        length,
        qrUrl: "",
        qrData: "",
        qrFooter: ""
      }));
    });
  }, [inputForm.input_length]);

  useEffect(() => {
    setInputForm((prev) => {
      const nextThickness = String(activeOrderItem?.thickness ?? selectedColorInfo?.thickness ?? "0.6");
      if (prev.thickness || prev.thickness === nextThickness) return prev;
      return { ...prev, thickness: nextThickness };
    });
  }, [activeOrderItem?.thickness, selectedColorInfo?.thickness]);

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
      const response = await productionApi.getProductionOrdersByType(ProductionType.cutting);
      const data = response?.data || response;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setOrders(list);
    } catch (error) {
      console.error("Error loading cutting orders:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const response = await productionProcessApi.getProcessesByType("cutting");
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
      if (payload?.title || payload?.body) {
        toast.success(`${payload.title}: ${payload.body}`);
      }
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
      setInputForm(prev => ({ ...prev, input_length: String(prev.input_length || "") + num.toString() }));
      return;
    }
    if (currentInput === "thickness") {
      setInputForm(prev => ({ ...prev, thickness: String(prev.thickness || "") + num.toString() }));
      return;
    }
    if (currentInput === "input_notes") {
      setInputForm(prev => ({ ...prev, notes: `${prev.notes || ""}${num}` }));
      return;
    }
    if (currentInput === "output_notes") {
      setOutputForm(prev => ({ ...prev, notes: `${prev.notes || ""}${num}` }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.split(":")[1];
      setSelectSearch(prev => ({ ...prev, [key]: `${prev[key] || ""}${num}` }));
    }
  };
  const handleDecimalClick = () => {
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: appendDecimal(prev.input_length) }));
      return;
    }
    if (currentInput === "thickness") {
      setInputForm(prev => ({ ...prev, thickness: appendDecimal(prev.thickness) }));
      return;
    }
    if (currentInput === "input_notes") {
      setInputForm(prev => ({ ...prev, notes: `${prev.notes || ""},` }));
      return;
    }
    if (currentInput === "output_notes") {
      setOutputForm(prev => ({ ...prev, notes: `${prev.notes || ""},` }));
    }
  };

  const handleBackspace = () => {
    const back = (value) => String(value || "").slice(0, -1);
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: back(prev.input_length) }));
      return;
    }
    if (currentInput === "thickness") {
      setInputForm(prev => ({ ...prev, thickness: back(prev.thickness) }));
      return;
    }
    if (currentInput === "input_notes") {
      setInputForm(prev => ({ ...prev, notes: back(prev.notes) }));
      return;
    }
    if (currentInput === "output_notes") {
      setOutputForm(prev => ({ ...prev, notes: back(prev.notes) }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.split(":")[1];
      setSelectSearch(prev => ({ ...prev, [key]: back(prev[key]) }));
    }
  };

  const handleClear = () => {
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: "" }));
      return;
    }
    if (currentInput === "thickness") {
      setInputForm(prev => ({ ...prev, thickness: "" }));
      return;
    }
    if (currentInput === "input_notes") {
      setInputForm(prev => ({ ...prev, notes: "" }));
      return;
    }
    if (currentInput === "output_notes") {
      setOutputForm(prev => ({ ...prev, notes: "" }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.split(":")[1];
      setSelectSearch(prev => ({ ...prev, [key]: "" }));
    }
  };

  const buildOutputQrData = (lengthValue) => {
    const colorInfo = selectedColorInfo;
    const batchInfo = batches.find(b => String(b.batch_id) === String(inputForm.batch_id));
    const rulerName = colorInfo?.ruler?.ruler_name || "";
    const typeLabel = inputForm.type_item === TypeItem.Presser ? "كوي" : "مكنة";

    const values = [
      rulerName,
      colorInfo?.color_code || "",
      inputForm.input_width || "",
      selectedThickness || "",
      batchInfo?.batch_number || "",
      typeLabel,
      user?.user_id ?? user?.id ?? user?.employee_id ?? "",
      lengthValue || ""
    ];
    return values.join("|");
  };

  const buildOutputQrFooter = (lengthValue, process = null) => {
    // If process object is provided (from processes table), use its data
    if (process) {
      return [
        `${process.color?.color_code || "-"}|${process.type_item === "Presser" ? "كوي" : "مكنة"}|${process.batch?.batch_number || "-"}|${lengthValue || "-"}`
      ].join(" | ");
    }
    
    // Otherwise use input form data (from manual input)
    const colorInfo = selectedColorInfo;
    const batchInfo = batches.find(b => String(b.batch_id) === String(inputForm.batch_id));
    const colorCode = colorInfo?.color_code || "-";
    const typeLabel = inputForm.type_item === TypeItem.Presser ? "كوي" : "مكنة";
    return [
      `${colorCode}|${typeLabel}|${batchInfo?.batch_number || "-"}|${lengthValue || "-"}`
    ].join(" | ");
  };

  const getQrUrl = (data) => {
    const encoded = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encoded}`;
  };

  const printQr = (url, title = "QR", footer = "") => {
    if (!url) return;
    const win = window.open("", "_blank", "width=420,height=520");
    if (!win) return;
    win.document.write(`
      <html dir="rtl">
        <head><title>${title}</title></head>
        <body style="font-family: Tahoma, Arial, sans-serif; text-align:center; padding:16px;">
          <div style="margin-bottom:12px; font-size:12px; color:#444;">${footer}</div>
          <img src="${url}" style="width:240px;height:240px;border:1px solid #ddd;border-radius:8px;" />
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
    setInputForm(prev => ({
      ...prev,
      input_width: item.width ? String(item.width) : "",
      color_id: item.color_id ? String(item.color_id) : "",
      batch_id: item.batch_id ? String(item.batch_id) : "",
      thickness: item.thickness ? String(item.thickness) : "",
      input_length: item.length ? String(item.length) : "",
      type_item: item.type_item || TypeItem.Machine,
      source: "slitting",
      destination: "gluing",
      notes: item.notes || ""
    }));
    setIoMode("output");
  };

  const handleCreateProcess = () => {
    try {
      if (!inputForm.input_width || !inputForm.color_id || !inputForm.batch_id || !inputForm.input_length) {
        toast.error("يرجى إدخال جميع بيانات الإدخال المطلوبة");
        return;
      }
      const lengths = outputItems.map(i => String(i.length || "").trim()).filter(Boolean);
      const normalizedLengths = lengths.map(normalizeDecimal);
      if (lengths.length === 0) {
        toast.error("يرجى إدخال طول الإخراج");
        return;
      }

      // Prepare payload for confirmation dialog
      const payload = {
        color_id: Number(inputForm.color_id),
        batch_id: Number(inputForm.batch_id),
        type_item: inputForm.type_item || TypeItem.Machine,
        thickness: toNumber(selectedThickness),
        input_length: toNumber(inputForm.input_length),
        output_length: normalizedLengths.join(" - "),
        input_width: toNumber(inputForm.input_width),
        type: "cutting",
        source: "slitting",
        destination: "gluing",
        notes: outputForm.notes || inputForm.notes
      };

      // Set pending process data and show confirmation dialog
      setPendingProcess(payload);
      setShowProcessConfirmDialog(true);
    } catch (error) {
      console.error(error);
      toast.error("فشل في إعداد بيانات القص");
    }
  };

  const confirmCreateProcess = async () => {
    try {
      const response = await productionProcessApi.createProcess(pendingProcess);
      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || "فشل في الإخراج");
      }

      toast.success("تم إنشاء عملية القص بنجاح");
      loadProcesses();
      loadOrders();

      if (activeOrderItem?.production_order_item_id) {
        await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
      }

      // Reset forms
      setInputForm({
        input_width: "",
        color_id: "",
        batch_id: "",
        thickness: "0.6",
        input_length: "",
        type_item: TypeItem.Machine,
        source: "slitting",
        destination: "gluing",
        notes: ""
      });
      setOutputForm({ notes: "" });
      setOutputItems([{ id: 1, length: "", qrUrl: "", qrData: "" }]);
      setActiveOrderItem(null);
      setIoMode("input");
      setShowProcessConfirmDialog(false);
      setPendingProcess(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "فشل في إنشاء عملية القص");
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
      toast.success("تم حذف عملية القص بنجاح");
      setShowDeleteProcessDialog(false);
      setPendingDeleteProcess(null);
    } catch (error) {
      console.error(error);
      toast.error("فشل في حذف عملية القص");
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
      toast.success(`تم حذف ${ids.length} عملية قص بنجاح`);
      setSelectedProcesses(new Set());
      setShowMultiDeleteDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("فشل في حذف عمليات القص");
    }
  };

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

  const formatDestination = (destination) => {
    const destMap = {
      "slitting": "التشريح",
      "cutting": "القص",
      "gluing": "اللصق",
      "production": "الإنتاج",
      "warehouse": "المستودع"
    };
    return destMap[destination] || destination || "-";
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    try {
      setLoadingOrderDetails(true);
      // Load order items if needed
      // For cutting, we can use the order data directly or load additional details
      setOrderItems([order]); // For now, use the order itself
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
      
      // Update local state to reflect the change
      setOrders(prev => 
        Array.isArray(prev) 
          ? prev.map(o => 
                String(o.production_order_item_id) === String(pendingCompleteItem.production_order_item_id) 
                  ? { ...o, status: ProductionStatus.completed }
                  : o
              )
          : prev
      );
      
      toast.success(`تم إتمام الطلب #${pendingCompleteItem.production_order_id} بنجاح`);
      
      // Close dialogs
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
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 sticky top-0 z-20">
          <tr>
            {["#", "اللون", "العرض", "الكمية", "النوع", "الطبخة", "السماكة", "الوجهة", "المصدر", "الحالة", "المستخدم", "التوقيت", "الملاحظات", "الإجراءات"].map((h) => (
              <th key={h} className="px-1 py-2 text-center border-b text-sm whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loadingOrders ? (
            <tr><td colSpan="15" className="p-6"><LoadingState /></td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan="15" className="p-8 text-center text-gray-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />لا توجد طلبات</td></tr>
          ) : list.map((order, index) => {
            const colorInfo = colors.find(c => String(c.color_id) === String(order.color_id));
            const batchInfo = batches.find(b => String(b.batch_id) === String(order.batch_id));
            const status = getStatusBadge(order.status);
            return (
              <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">
                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap">#{order.production_order_id}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
                  <div className="text-xs">
                    <div>{colorInfo?.color_name || "-"}</div>
                    <div className="text-gray-500">({colorInfo?.color_code || "-"})</div>
                  </div>
                </td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{order.width || "-"}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{order.length || "-"}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 font-medium text-gray-700">
                    {order.type_item === TypeItem.Machine ? "مكنة" : order.type_item === TypeItem.Presser ? "كوي" : order.type_item || "-"}
                  </span>
                </td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{batchInfo?.batch_number || "-"}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{order.thickness || "-"}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                    {formatDestination(order.destination)}
                  </span>
                </td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    {formatDestination(order.source)}
                  </span>
                </td>
                <td className="px-3 py-2 align-middle text-center text-sm whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-lg text-xs ${status.className}`}>{status.label}</span>
                </td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{user?.full_name || "-"}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{formatDate(order.created_at)}</td>
                <td className="px-1 py-2 align-middle text-center text-sm whitespace-nowrap">{order.notes || "-"}</td>
                <td className="px-1 py-2 align-middle text-center whitespace-nowrap">
                  <div className="flex h-8 items-center justify-center gap-1">
                    <button 
                      onClick={() => handleOrderSelect(order)} 
                      className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" 
                      title="عرض تفاصيل الطلب"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {ordersTab === "current" && (
                      <>
                        <button 
                          onClick={() => handleApplyOrderToInputs(order)} 
                          className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" 
                          title="تطبيق البيانات على الإدخال"
                        >
                          <Hash className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => requestCompleteOrderItem(order)} 
                          className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50" 
                          title="إتمام الطلب"
                        >
                          <Check className="w-4 h-4" />
                        </button>
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
       <div className={`absolute left-0 left-[49%] z-40 transition-all duration-300 ${showHeader ? "top-[7.5%]" : "top-[2%]"}`}>

        <Button

          type="button"

          onClick={() => setShowHeader((prev) => !prev)}

          className="h-10 w-10 rounded-full border-2 border-t-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105  active:scale-95"

          title={showHeader ? "إخفاء الهيدر" : "إظهار الهيدر"}

        >

          {showHeader ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}

        </Button>

      </div>

      {showHeader && (
      <div className="flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
          <div className="flex items-center gap-1">
            <Package className="w-7 h-7" />
            <div><h1 className="text-2xl font-bold">إدارة القص</h1><p className="text-sm opacity-90">لوحة عمليات القص</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
              {/* <div className="text-xs opacity-80">اسم المستخدم</div> */}
              <div className="text-base font-bold">{user?.full_name || user?.username || "-"}</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
              {/* <div className="text-xs opacity-80">الدور</div> */}
              <div className="text-base font-bold">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Button size="lg" variant="outline" onClick={() => { logout(); navigate("/login"); }} className="px-5 py-3 text-base min-w-[120px] border-2 bg-white/10 text-white border-white/30 hover:bg-white/20">
              <ArrowRight className="w-4 h-4 ml-2 rotate-180" />تسجيل الخروج
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

      {/* Main */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Upper */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Upper - Input/Output */}
          <Card className="p-4 flex flex-col order-2 min-h-0">
            <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={ioMode === "input" ? "default" : "outline"}
                  onClick={() => setIoMode("input")}
                >
                  إدخال
                </Button>
                <Button
                  variant={ioMode === "output" ? "default" : "outline"}
                  onClick={() => setIoMode("output")}
                >
                  إخراج
                </Button>
              </div>
            </div>

            {ioMode === "input" ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={`flex-1 ${inputMode === "qr" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                    onClick={() => setInputMode("qr")}
                  >
                    <Search className="w-4 h-4 ml-2" />
                    QR
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 ${inputMode === "manual" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                    onClick={() => setInputMode("manual")}
                  >
                    <Hash className="w-4 h-4 ml-2" />
                    يدوي
                  </Button>
                </div>

                {inputMode === "qr" && (
                  <div className="space-y-2">
                    <Input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="width|color_id|batch_id|thickness|length"
                    />
                    <Button
                      className="w-full"
                      onClick={() => toast.success("تم تطبيق بيانات QR")}
                      disabled={!qrInput.trim()}
                    >
                      تطبيق
                    </Button>
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
                      <FilterSelect
                        value={inputForm.color_id}
                        onChange={(e) => setInputForm(prev => ({ ...prev, color_id: e.target.value }))}
                        searchValue={selectSearch.color_id}
                        onSearchValueChange={(value) => setSelectSearch(prev => ({ ...prev, color_id: value }))}
                        onInputFocus={() => setCurrentInput("select:color_id")}
                        options={colorOptions}
                        placeholder="اختر اللون"
                      />
                    </div>
                    <div>
                      <Label>الطبخة</Label>
                      <FilterSelect
                        value={inputForm.batch_id}
                        onChange={(e) => setInputForm(prev => ({ ...prev, batch_id: e.target.value }))}
                        searchValue={selectSearch.batch_id}
                        onSearchValueChange={(value) => setSelectSearch(prev => ({ ...prev, batch_id: value }))}
                        onInputFocus={() => setCurrentInput("select:batch_id")}
                        options={batchOptions}
                        placeholder="اختر الطبخة"
                      />
                    </div>
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        value={inputForm.input_length}
                        onChange={(e) => setInputForm(prev => ({ ...prev, input_length: e.target.value }))}
                        onFocus={() => setCurrentInput("input_length")}
                        className={`text-center ${currentInput === "input_length" ? "ring-2 ring-blue-500" : ""}`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>السماكة</Label>
                      <Input
                        value={inputForm.thickness}
                        onChange={(e) => setInputForm(prev => ({ ...prev, thickness: e.target.value }))}
                        onFocus={() => setCurrentInput("thickness")}
                        className={`text-center ${currentInput === "thickness" ? "ring-2 ring-blue-500" : ""}`}
                        placeholder="-"
                      />
                    </div>
                    <div >
                      <Label>ملاحظات</Label>
                      <Input
                        value={inputForm.notes}
                        onChange={(e) => setInputForm(prev => ({ ...prev, notes: e.target.value }))}
                        onFocus={() => setCurrentInput("input_notes")}
                        placeholder="ملاحظات اختيارية"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        className="w-full"
                        onClick={() => setIoMode("output")}
                      >
                        إدخال
                      </Button>
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
                        <th className="p-2 text-center">السماكة</th>
                        <th className="p-2 text-center">الكمية المدخل</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-2 text-center">{inputForm.input_width || "-"}</td>
                        <td className="p-2 text-center">
                          {colors.find(c => String(c.color_id) === String(inputForm.color_id))?.color_name || "-"}{" "}
                          ({colors.find(c => String(c.color_id) === String(inputForm.color_id))?.color_code || "-"})
                        </td>
                        <td className="p-2 text-center">
                          {batches.find(b => String(b.batch_id) === String(inputForm.batch_id))?.batch_number || "-"}
                        </td>
                        <td className="p-2 text-center">{selectedThickness || "-"}</td>
                        <td className="p-2 text-center">{inputForm.input_length || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>الكمية المخرج</Label>
                    {outputItems.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <Input
                          value={item.length}
                          readOnly
                          className="text-center bg-gray-50"
                          placeholder=""
                        />
                        {/* <Button
                          variant="outline"
                          onClick={() => {
                            const qrData = buildOutputQrData(item.length);
                            const footer = buildOutputQrFooter(item.length);
                            if (!item.length) {
                              toast.error("أدخل طولًا أولاً");
                              return;
                            }
                            const url = getQrUrl(qrData);
                            setOutputItems(prev => prev.map(it => (
                              it.id === item.id ? { ...it, qrUrl: url, qrData, qrFooter: footer } : it
                            )));
                          }}
                        >
                          QR
                        </Button> */}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!item.length) {
                              toast.error("أدخل طولًا أولاً");
                              return;
                            }
                            const qrData = buildOutputQrData(item.length);
                            const footer = buildOutputQrFooter(item.length);
                            const url = getQrUrl(qrData);
                            printQr(url, `QR - قص (${item.length})`, footer);
                          }}
                        >
                         QR
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={outputForm.notes}
                    onChange={(e) => setOutputForm(prev => ({ ...prev, notes: e.target.value }))}
                    onFocus={() => setCurrentInput("output_notes")}
                    placeholder="ملاحظات الإخراج"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCreateProcess}>
                      إخراج
                    </Button>
                    {/* <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const items = outputItems.filter(i => i.length);
                        if (items.length === 0) {
                          toast.error("أدخل طولًا أولاً");
                          return;
                        }
                        items.forEach((it) => {
                            const qrData = buildOutputQrData(it.length);
                            const url = getQrUrl(qrData);
                            const footer = buildOutputQrFooter(it.length);
                            printQr(url, `QR - قص (${it.length})`, footer);
                          });
                        }}
                    >
                      طباعة كل QR
                    </Button> */}
                  </div>
                </div>
              </div>
            )}
            </div>
          </Card>

          {/* Right Upper - Inputs Table */}
          <Card className="p-4 flex flex-col space-y-4 order-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                الطلبات
              </h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant={ordersTab === "current" ? "default" : "outline"}
                  size="sm" 
                  className={ordersTab === "current" ? "bg-blue-50 border-blue-300 text-blue-700" : "text-blue-600 border-blue-200 hover:bg-blue-50"} 
                  onClick={() => setOrdersTab("current")}
                >
                  قيد الانتظار
                </Button>
                <Button 
                  variant={ordersTab === "completed" ? "default" : "outline"}
                  size="sm" 
                  className={ordersTab === "completed" ? "bg-green-50 border-green-300 text-green-700" : "text-green-600 border-green-200 hover:bg-green-50"} 
                  onClick={() => setOrdersTab("completed")}
                >
                  المكتملة
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadOrders} 
                  disabled={loadingOrders}
                >
                  <RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? "animate-spin" : ""}`} />
                  تحديث
                </Button>
              </div>
            </div>
            {renderOrdersTable(ordersTab === "current" ? orders.filter(o => String(o.status || "").toLowerCase() === ProductionStatus.pending) : orders.filter(o => String(o.status || "").toLowerCase() === ProductionStatus.completed))}
          </Card>
        </div>

        {/* Bottom */}
        <div className="flex gap-4 flex-1 min-h-0 flex-row-reverse">
          {/* Outputs Table */}
          <Card className="p-4 flex flex-col flex-1 space-y-4 min-h-0">
            
            <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
              {loadingProcesses ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingState />
                </div>
              ) : processes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium">لا توجد مخرجات</div>
                  <div className="text-sm">لم يتم تسجيل عمليات القص بعد</div>
                </div>
              ) : (
                <div>
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
                        <th className="p-2 text-center border-b">الكمية</th>
                        <th className="p-2 text-center border-b">النوع</th>
                        <th className="p-2 text-center border-b">الكمية المخرج</th>
                        <th className="p-2 text-center border-b">الوجهة</th>
                        <th className="p-2 text-center border-b">المستخدم</th>
                        <th className="p-2 text-center border-b">التوقيت</th>
                        <th className="p-2 text-center border-b">ملاحظات</th>
                        <th className="p-2 text-center border-b">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processes.map(proc => {
                        const colorInfo = proc.color || colors.find(c => String(c.color_id) === String(proc.color_id));
                        const colorName = colorInfo?.color_name || "-";
                        const colorCode = colorInfo?.color_code || "-";
                        const batchNumber = proc.batch?.batch_number || batches.find(b => String(b.batch_id) === String(proc.batch_id))?.batch_number || "-";
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
                            <td className="p-2 text-center">{proc.type_item === TypeItem.Presser ? "كوي" : "مكنة"}</td>
                            <td className="p-2 text-center">{proc.output_length}</td>
                            <td className="p-2 text-center">{formatDestination(proc.destination)}</td>
                            <td className="p-2 text-center">{proc.user?.full_name || proc.user?.username || "-"}</td>
                            <td className="p-2 text-center">{formatDate(proc.created_at)}</td>
                            <td className="p-2 text-center">{proc.notes || "-"}</td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    const qrData = buildOutputQrData(proc.output_length);
                                    const footer = buildOutputQrFooter(proc.output_length, proc);
                                    const url = getQrUrl(qrData);
                                    printQr(url, `QR - قص #${proc.process_id}`, footer);
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50"
                                  title="طباعة QR"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => requestDeleteProcess(proc)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                  title="حذف عملية القص"
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

          {/* Number Pad */}
          <Card className="p-4 w-[260px] flex-shrink-0 self-stretch flex flex-col">
            
            <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-12 text-lg font-bold"
                  onClick={() => handleNumberClick(num)}
                >
                  {num}
                </Button>
              ))}
              <Button variant="outline" className="h-12 text-lg" onClick={handleClear}>
                <X className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(0)}>
                0
              </Button>
              <Button variant="outline" className="h-12 text-lg" onClick={handleDecimalClick}>
                ,
              </Button>
              <Button variant="outline" className="h-12 text-lg" onClick={handleBackspace}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <StyledDialog isOpen={showOrderDetails} onOpenChange={setShowOrderDetails} title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ""}`} contentClassName="max-w-7xl w-full" onCancel={() => setShowOrderDetails(false)} onConfirm={() => setShowOrderDetails(false)} confirmLabel="إغلاق" showCancel={false}>
        {selectedOrder && (
          <div className="space-y-4 w-full">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-gray-500">رقم الطلب:</span> <span className="font-bold">#{selectedOrder.production_order_id}</span></div>
              <div><span className="text-gray-500">العرض:</span> <span className="font-bold">{selectedOrder.width || "-"}</span></div>
              <div><span className="text-gray-500">الكمية:</span> <span className="font-bold">{selectedOrder.length || "-"}</span></div>
              <div><span className="text-gray-500">النوع:</span> <span className="font-bold">{selectedOrder.type_item === TypeItem.Machine ? "مكنة" : selectedOrder.type_item === TypeItem.Presser ? "كوي" : selectedOrder.type_item || "-"}</span></div>
              <div className="md:col-span-2"><span className="text-gray-500">اللون:</span> <span className="font-bold">{colors.find(c => String(c.color_id) === String(selectedOrder.color_id))?.color_name || "-"} ({colors.find(c => String(c.color_id) === String(selectedOrder.color_id))?.color_code || "-"})</span></div>
              <div className="md:col-span-2"><span className="text-gray-500">الطبخة:</span> <span className="font-bold">{batches.find(b => String(b.batch_id) === String(selectedOrder.batch_id))?.batch_number || "-"}</span></div>
              <div><span className="text-gray-500">المصدر:</span> <span className="font-bold">{formatDestination(selectedOrder.source)}</span></div>
              <div><span className="text-gray-500">الوجهة:</span> <span className="font-bold">{formatDestination(selectedOrder.destination)}</span></div>
              <div><span className="text-gray-500">الحالة:</span> <span className="font-bold">{getStatusBadge(selectedOrder.status).label}</span></div>
              <div className="md:col-span-2"><span className="text-gray-500">الملاحظات:</span> <span className="font-bold">{selectedOrder.notes || "-"}</span></div>
            </div>
            {loadingOrderDetails ? <LoadingState /> : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full table-auto text-sm [&_td]:break-words [&_th]:break-words">
                  <thead className="bg-gray-100">
                    <tr>
                      {["#", "العرض", "اللون", "الطبخة", "الكمية", "النوع", "المصدر", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => (
                        <th key={h} className="p-2 text-center whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => {
                      const colorInfo = colors.find(c => String(c.color_id) === String(item.color_id));
                      const batchInfo = batches.find(b => String(b.batch_id) === String(item.batch_id));
                      const status = getStatusBadge(item.status);
                      return (
                        <tr key={item.production_order_item_id || index} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-center">#{item.production_order_id}</td>
                          <td className="p-2 text-center">{item.width || "-"}</td>
                          <td className="p-2 text-center">
                            <div className="text-xs">
                              <div>{colorInfo?.color_name || "-"}</div>
                              <div className="text-gray-500">({colorInfo?.color_code || "-"})</div>
                            </div>
                          </td>
                          <td className="p-2 text-center">{batchInfo?.batch_number || "-"}</td>
                          <td className="p-2 text-center">{item.length || "-"}</td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 font-medium text-gray-700">
                              {item.type_item === TypeItem.Machine ? "مكنة" : item.type_item === TypeItem.Presser ? "كوي" : item.type_item || "-"}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                              {formatDestination(item.source)}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                              {formatDestination(item.destination)}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-1 rounded-lg text-xs ${status.className}`}>{status.label}</span>
                          </td>
                          <td className="p-2 text-center text-xs">{item.notes || "-"}</td>
                          <td className="p-2 text-center">
                            <div className="flex h-8 items-center justify-center gap-1">
                              {ordersTab === "current" && (
                                <>
                                  <button 
                                    onClick={() => {
                                      handleApplyOrderToInputs(item);
                                      setShowOrderDetails(false);
                                    }} 
                                    className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" 
                                    title="تطبيق على الإدخال"
                                  >
                                    <Hash className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      requestCompleteOrderItem(item);
                                      setShowOrderDetails(false);
                                    }} 
                                    className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50" 
                                    title="إتمام الطلب"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
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
            )}
          </div>
        )}
      </StyledDialog>

      <StyledDialog
        isOpen={showCompleteDialog}
        onOpenChange={(open) => {
          setShowCompleteDialog(open);
          if (!open) setPendingCompleteItem(null);
        }}
        title="تأكيد إتمام العملية"
        contentClassName="max-w-md w-full"
        onCancel={() => {
          setShowCompleteDialog(false);
          setPendingCompleteItem(null);
        }}
        onConfirm={handleCompleteOrderItem}
        confirmLabel="تأكيد"
        cancelLabel="إلغاء"
      >
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold">
            هل أنت متأكد من إتمام الطلب #{pendingCompleteItem?.production_order_id}
            {" "}
            ونقله إلى المكتملة؟
          </div>
        </div>
      </StyledDialog>

      <StyledDialog
        isOpen={showProcessConfirmDialog}
        onOpenChange={(open) => {
          setShowProcessConfirmDialog(open);
          if (!open) setPendingProcess(null);
        }}
        title="تأكيد عملية القص"
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
          هل تريد تنفيذ عملية القص؟
          <div className="mt-4">
            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">العرض</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الكمية المدخل</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">السماكة</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">اللون</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطبخة</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الكمية المخرج</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">المصدر</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الوجهة</th>
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.input_width || "-"}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.input_length || "-"}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.thickness || "-"}</td>
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
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm font-bold text-blue-600">
                    {outputItems.map(item => item.length).filter(length => length).join(', ') || '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      التشريح
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      اللصق
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingProcess?.notes || "-"}</td>
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
        title="تأكيد حذف عملية القص"
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
          هل تريد حذف عملية القص 
          <span className="font-bold"> #{pendingDeleteProcess?.process_id || ""}</span>؟
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium">العرض:</span> {pendingDeleteProcess?.input_width || "-"}</div>
              <div><span className="font-medium">الكمية:</span> {pendingDeleteProcess?.input_length || "-"}</div>
              <div><span className="font-medium">السماكة:</span> {pendingDeleteProcess?.thickness || "-"}</div>
              <div><span className="font-medium">اللون:</span> {(() => {
                const color = colors.find(c => String(c.color_id) === String(pendingDeleteProcess?.color_id));
                return color ? `${color.color_name} (${color.color_code})` : "-";
              })()}</div>
              <div><span className="font-medium">الطبخة:</span> {(() => {
                const batch = batches.find(b => String(b.batch_id) === String(pendingDeleteProcess?.batch_id));
                return batch ? batch.batch_number : "-";
              })()}</div>
              <div><span className="font-medium">المصدر:</span> التشريح</div>
              <div><span className="font-medium">الوجهة:</span> اللصق</div>
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
        title="تأكيد حذف عمليات القص"
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
          عملية قص؟
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
    </div>
  );
}
