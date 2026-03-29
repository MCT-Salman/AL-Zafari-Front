// src/pages/Slitting/SlittingManager.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sliteApi } from "../../api/sliteApi";
import { colorApi } from "../../api/colorApi";
import { batchApi } from "../../api/batchApi";
import { productionApi } from "../../api/productionApi";
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
  AlertCircle,
  Check,
  Eye,
  Printer,
  RefreshCw,
  Hash,
  Search,
  ChevronUp,
  ChevronDown,
  Trash
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

export default function SlittingManager() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const notificationDedupRef = useRef(new Map());

  useEffect(() => {
    if (!user || user.role !== UserRole.Dissection_Technician) {
      toast.error("غير مصرح لك بالوصول إلى هذه الصفحة");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const [orders, setOrders] = useState([]);
  const [slites, setSlites] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSlites, setLoadingSlites] = useState(false);
  const [colors, setColors] = useState([]);
  const [batches, setBatches] = useState([]);

  const [pendingCompleteItem, setPendingCompleteItem] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [pendingSlite, setPendingSlite] = useState(null);
  const [showSliteConfirmDialog, setShowSliteConfirmDialog] = useState(false);
  const [pendingDeleteSlite, setPendingDeleteSlite] = useState(null);
  const [showDeleteSliteDialog, setShowDeleteSliteDialog] = useState(false);
  const [selectedSlites, setSelectedSlites] = useState(new Set());
  const [showMultiDeleteDialog, setShowMultiDeleteDialog] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [ioMode, setIoMode] = useState("input"); // input | output
  const [qrInput, setQrInput] = useState("");
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const [inputForm, setInputForm] = useState({
    input_width: "66",
    color_id: "",
    batch_id: "",
    input_length: "",
    type_item: "",
    source: "warehouse",
    destination: "slitting",
    notes: ""
  });

  const [outputForm, setOutputForm] = useState({
    output_length: "",
    output_length_22: "",
    output_length_44: "",
    notes: "",
    calculationMode: "" // "22x3" or "44x1-22x1"
  });
  const [selectedOutputPattern, setSelectedOutputPattern] = useState(""); // "22x3" or "44x1-22x1"
  const [outputItems, setOutputItems] = useState([
    { id: 1, length: "", qrUrl: "", qrData: "" }
  ]);

  const [showHeader, setShowHeader] = useState(true);
  const [currentInput, setCurrentInput] = useState("input_length");
  const [ordersTab, setOrdersTab] = useState("current");
  const [expandedSlites, setExpandedSlites] = useState(new Set()); // For managing expanded rows
  const [selectSearch, setSelectSearch] = useState({
    input_width: "",
    color_id: "",
    batch_id: "",
    type_item: "",
    source: "",
    destination: ""
  });
  const toggleSliteDetails = (sliteId) => {
    setExpandedSlites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sliteId)) {
        newSet.delete(sliteId);
      } else {
        newSet.add(sliteId);
      }
      return newSet;
    });
  };

  const translateTypeItem = (value) => {
    const translations = {
      "Presser": "كوي",
      "Machine": "مكنة",
      "كوي": "Presser",
      "مكنة": "Machine"
    };
    return translations[value] || value;
  };

  const translateSource = (value) => {
    const translations = {
      "warehouse": "المستودع",
      "slitting": "التشريح",
      "production": "الإنتاج",
      "cutting": "القص",
      "gluing": "اللصق",
      "المستودع": "warehouse",
      "التشريح": "slitting",
      "الإنتاج": "production",
      "القص": "cutting",
      "اللصق": "gluing"
    };
    return translations[value] || value;
  };

  const handleCalculationModeSelect = (mode) => {
    setSelectedOutputPattern(mode);
    setOutputForm(prev => {
      const newForm = { ...prev, calculationMode: mode };

      if (mode === "22x3") {
        // Set default values for 22*3 calculation
        newForm.output_length_22 = "100";
        newForm.output_length_44 = "";
        // Set output_length string format
        newForm.output_length = "3x22";
      } else if (mode === "44x1-22x1") {
        // Set default values for 44*1-22*1 calculation
        newForm.output_length_22 = "100";
        newForm.output_length_44 = "100";
        // Set output_length string format
        newForm.output_length = "1x44, 1x22";
      }

      return newForm;
    });
  };

  const calculateOutputLength = (inputLength, outputLength22, outputLength44, calculationMode) => {
    if (calculationMode === "22x3") {
      return "3x22";
    } else if (calculationMode === "44x1-22x1") {
      return "1x44, 1x22";
    }
    return "0";
  };

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

  const getStatusBadge = (status) => productionApi.getStatusBadge(String(status || "").toLowerCase());

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

  const sortRecordsAsc = (list = []) => {
    return [...list].sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      if (aDate !== bDate) return aDate - bDate;
      return Number(a?.production_order_item_id || a?.production_order_id || 0) - Number(b?.production_order_item_id || b?.production_order_id || 0);
    });
  };

  const currentOrders = useMemo(
    () => sortRecordsAsc(orders.filter((order) => String(order.status || "").toLowerCase() !== ProductionStatus.completed)),
    [orders]
  );

  const completedOrders = useMemo(
    () => sortRecordsAsc(orders.filter((order) => String(order.status || "").toLowerCase() === ProductionStatus.completed)),
    [orders]
  );

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
      const response = await productionApi.getProductionOrdersByType(ProductionType.slitting);
      const data = response?.data || response;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setOrders(list);
    } catch (error) {
      console.error("Error loading slitting orders:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    try {
      setLoadingOrderDetails(true);
      const response = await productionApi.getProductionOrderItems(order.production_order_id);
      const data = response?.data ?? response;
      setOrderItems(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "فشل في تحميل تفاصيل الطلب");
      setOrderItems([]);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const loadSlites = async () => {
    try {
      setLoadingSlites(true);
      const response = await sliteApi.getSlites();
      const data = response?.data?.slites || response?.data || response;
      setSlites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading slites:", error);
      toast.error("فشل في تحميل المخرجات");
    } finally {
      setLoadingSlites(false);
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
    loadSlites();
  }, []);

  useEffect(() => {
    const calculatedLength = calculateOutputLength(
      inputForm.input_length,
      outputForm.output_length_22,
      outputForm.output_length_44,
      outputForm.calculationMode
    );
    setOutputForm(prev => ({ ...prev, output_length: calculatedLength }));
  }, [inputForm.input_length, outputForm.output_length_22, outputForm.output_length_44, outputForm.calculationMode]);

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
      loadSlites();
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
    const value = String(num);
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: String(prev.input_length || "") + value }));
      return;
    }
    if (currentInput === "output_length") {
      setOutputForm(prev => ({ ...prev, output_length: String(prev.output_length || "") + value }));
      return;
    }
    if (currentInput === "output_length_22") {
      setOutputForm(prev => ({ ...prev, output_length_22: String(prev.output_length_22 || "") + value }));
      return;
    }
    if (currentInput === "output_length_44") {
      setOutputForm(prev => ({ ...prev, output_length_44: String(prev.output_length_44 || "") + value }));
      return;
    }
    if (currentInput === "qr") {
      setQrInput(prev => `${prev || ""}${value}`);
      return;
    }
    if (currentInput === "notes") {
      setOutputForm(prev => ({ ...prev, notes: `${prev.notes || ""}${value}` }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.replace("select:", "");
      setSelectSearch(prev => ({ ...prev, [key]: `${prev[key] || ""}${value}` }));
    }
  };

  const handleBackspace = () => {
    const back = (value) => String(value || "").slice(0, -1);
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: back(prev.input_length) }));
      return;
    }
    if (currentInput === "output_length") {
      setOutputForm(prev => ({ ...prev, output_length: back(prev.output_length) }));
      return;
    }
    if (currentInput === "output_length_22") {
      setOutputForm(prev => ({ ...prev, output_length_22: back(prev.output_length_22) }));
      return;
    }
    if (currentInput === "output_length_44") {
      setOutputForm(prev => ({ ...prev, output_length_44: back(prev.output_length_44) }));
      return;
    }
    if (currentInput === "qr") {
      setQrInput(prev => back(prev));
      return;
    }
    if (currentInput === "notes") {
      setOutputForm(prev => ({ ...prev, notes: back(prev.notes) }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.replace("select:", "");
      setSelectSearch(prev => ({ ...prev, [key]: back(prev[key]) }));
    }
  };

  const handleClear = () => {
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: "" }));
      return;
    }
    if (currentInput === "output_length") {
      setOutputForm(prev => ({ ...prev, output_length: "" }));
      return;
    }
    if (currentInput === "output_length_22") {
      setOutputForm(prev => ({ ...prev, output_length_22: "" }));
      return;
    }
    if (currentInput === "output_length_44") {
      setOutputForm(prev => ({ ...prev, output_length_44: "" }));
      return;
    }
    if (currentInput === "qr") {
      setQrInput("");
      return;
    }
    if (currentInput === "notes") {
      setOutputForm(prev => ({ ...prev, notes: "" }));
      return;
    }
    if (currentInput.startsWith("select:")) {
      const key = currentInput.replace("select:", "");
      setSelectSearch(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleApplyOrderToInputs = (item) => {
    if (!item) return;
    setActiveOrderItem(item);
    setInputForm(prev => ({
      ...prev,
      input_width: item.width ? String(item.width) : "",
      color_id: item.color_id ? String(item.color_id) : "",
      batch_id: item.batch_id ? String(item.batch_id) : "",
      input_length: item.length ? String(item.length) : "",
      type_item: item.type_item || "",
      source: item.source || "warehouse",
      destination: item.destination || "slitting",
      notes: item.notes || ""
    }));
    setIoMode("output");
  };

  const handleCreateSlite = () => {
    try {
      if (!inputForm.input_width || !inputForm.color_id || !inputForm.batch_id || !inputForm.input_length) {
        toast.error("يرجى إدخال جميع بيانات الإدخال المطلوبة");
        return;
      }

      if (!outputForm.calculationMode) {
        toast.error("يرجى اختيار طريقة حساب الكمية الخارجية");
        return;
      }

      // Prepare payload for confirmation dialog
      const payload = {
        color_id: Number(inputForm.color_id),
        batch_id: Number(inputForm.batch_id),
        type_item: "Presser", // Default value since we removed the field
        input_length: Number(inputForm.input_length),
        output_length: outputForm.output_length, // String format: "3x22" or "1x44, 1x22"
        input_width: Number(inputForm.input_width),
        output_length_22: outputForm.calculationMode === "22x3" ? 300 : 100, // 100 or 300 as required
        ...(outputForm.calculationMode === "44x1-22x1" && { output_length_44: 100 }), // Only send for 44x1-22x1 mode
        source: "warehouse", // Default value since we removed the field
        destination: "slitting", // Default value since we removed the field
        notes: outputForm.notes || inputForm.notes
      };

      // Set pending slite data and show confirmation dialog
      setPendingSlite(payload);
      setShowSliteConfirmDialog(true);
    } catch (error) {
      console.error(error);
      toast.error("فشل في إعداد بيانات التشريح");
    }
  };

  const confirmCreateSlite = async () => {
    try {
      const response = await sliteApi.createSlite(pendingSlite);
      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || "فشل في الإخراج");
      }

      toast.success("تم إنشاء عملية التشريح بنجاح");
      loadSlites();
      loadOrders();

      if (activeOrderItem?.production_order_item_id) {
        await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
      }

      // Reset forms
      setInputForm({
        input_width: "66",
        color_id: "",
        batch_id: "",
        input_length: "",
        type_item: "",
        source: "warehouse",
        destination: "slitting",
        notes: ""
      });
      setOutputForm({
        calculationMode: "",
        output_length: "",
        notes: ""
      });
      setActiveOrderItem(null);
      setIoMode("input");
      setShowSliteConfirmDialog(false);
      setPendingSlite(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "فشل في إنشاء عملية التشريح");
    }
  };

  const requestDeleteSlite = (slite) => {
    setPendingDeleteSlite(slite);
    setShowDeleteSliteDialog(true);
  };

  const confirmDeleteSlite = async () => {
    if (!pendingDeleteSlite?.slite_id) return;
    try {
      await sliteApi.deleteSlite(pendingDeleteSlite.slite_id);
      setSlites((prev) => prev.filter((s) => s.slite_id !== pendingDeleteSlite.slite_id));
      toast.success("تم حذف عملية التشريح بنجاح");
      setShowDeleteSliteDialog(false);
      setPendingDeleteSlite(null);
    } catch (error) {
      console.error(error);
      toast.error("فشل في حذف عملية التشريح");
    }
  };

  const toggleSliteSelection = (sliteId) => {
    setSelectedSlites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sliteId)) {
        newSet.delete(sliteId);
      } else {
        newSet.add(sliteId);
      }
      return newSet;
    });
  };

  const toggleAllSlitesSelection = () => {
    if (selectedSlites.size === slites.length) {
      setSelectedSlites(new Set());
    } else {
      setSelectedSlites(new Set(slites.map(s => s.slite_id)));
    }
  };

  const requestMultiDeleteSlites = () => {
    if (selectedSlites.size === 0) {
      toast.error("يرجى تحديد عملية واحدة على الأقل");
      return;
    }
    setShowMultiDeleteDialog(true);
  };

  const confirmMultiDeleteSlites = async () => {
    try {
      const ids = Array.from(selectedSlites);
      await sliteApi.deleteSlites(ids);
      setSlites((prev) => prev.filter((s) => !selectedSlites.has(s.slite_id)));
      toast.success(`تم حذف ${ids.length} عملية تشريح بنجاح`);
      setSelectedSlites(new Set());
      setShowMultiDeleteDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("فشل في حذف عمليات التشريح");
    }
  };

  const requestCompleteOrderItem = (item) => {
    if (!item?.production_order_item_id) return;
    setPendingCompleteItem(item);
    setShowCompleteDialog(true);
  };

  const handleCompleteOrderItem = async (item) => {
    if (!item?.production_order_item_id) return;
    try {
      await productionApi.updateProductionItemStatus(item.production_order_item_id, ProductionStatus.completed);
      toast.success("تم إتمام الطلب ونقله إلى المكتمل");
      loadOrders();
      if (activeOrderItem?.production_order_item_id === item.production_order_item_id) setActiveOrderItem(null);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "فشل تحديث حالة الطلب");
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

  const getColorLabel = (colorId) => {
    const color = colors.find((item) => String(item.color_id) === String(colorId));
    if (!color) return "-";
    return `${color.color_name} (${color.color_code || "-"})`;
  };

  const getBatchLabel = (batchId) => {
    return batches.find((item) => String(item.batch_id) === String(batchId))?.batch_number || "-";
  };

  const formatDestination = (value) => ({
    warehouse: "المستودع",
    slitting: "التشريح",
    production: "الإنتاج",
    cutting: "القص",
    gluing: "اللصق"
  }[value] || value || "-");

  const formatTypeItem = (value) => value === TypeItem.Machine ? "مكنة" : value === TypeItem.Presser ? "كوي" : value || "-";

  const parseQrInput = (text) => {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const parts = raw.split("|").map((p) => String(p ?? "").trim());
    if (parts.length < 4) return null;
    const [width, colorId, batchId, length, typeItem, source, destination] = parts;
    if (!width || !colorId || !batchId || !length) return null;
    return {
      input_width: width,
      color_id: colorId,
      batch_id: batchId,
      input_length: length,
      type_item: typeItem || "",
      source: source || "warehouse",
      destination: destination || "slitting",
    };
  };

  const getQrUrl = (data) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;

  const buildSliteQrData = (slite) => {
    const colorInfo = colors.find((c) => String(c.color_id) === String(slite?.color_id));
    const batchInfo = batches.find((b) => String(b.batch_id) === String(slite?.batch_id));
    return [
      slite?.input_width || "",
      colorInfo?.color_code || "",
      batchInfo?.batch_number || "",
      slite?.input_length || "",
      slite?.output_length_22 || "",
      slite?.output_length_44 || "",
      slite?.slite_id || "",
    ].join("|");
  };

  const buildSliteQrFooter = (slite) => {
    return [
      `${slite?.color?.color_code || "-"}|${slite?.type_item === "Presser" ? "كوي" : "مكنة"}|${slite?.batch?.batch_number || "-"}|${slite?.input_length || "-"}`
    ].join(" | ");
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

  const renderOrdersTable = (list) => (
    <div className="flex-1 overflow-auto min-h-0 rounded-lg border bg-white">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-20 bg-gray-100">
          <tr>
            {["#", "اللون", "العرض", "الكمية", "النوع", "الطبخة", "السماكة", "الوجهة", "المصدر", "الحالة", "المستخدم", "التوقيت", "الملاحظات", "الإجراءات"].map((header) => (
              <th key={header} className="px-1 py-2 text-center text-sm whitespace-nowrap border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loadingOrders ? (
            <tr><td colSpan="15" className="p-6"><LoadingState /></td></tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan="14" className="p-8 text-center text-gray-400">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
                لا توجد طلبات
              </td>
            </tr>
          ) : list.map((order, index) => {
            const statusBadge = getStatusBadge(order.status);
            return (
              <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">#{order.production_order_id}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <div className="text-xs">
                    <div>{order.color?.color_name || "-"}</div>
                    <div className="text-gray-500">({order.color?.color_code || "-"})</div>
                  </div>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.width || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.length || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 font-medium text-gray-700">
                    {formatTypeItem(order.type_item)}
                  </span>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.batch?.batch_number || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.thickness || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
                    {formatDestination(order.destination)}
                  </span>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    {formatDestination(order.source)}
                  </span>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className={`rounded-lg px-2 py-1 text-xs ${statusBadge.className}`}>{statusBadge.label}</span>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{user?.full_name || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{formatDate(order.created_at)}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.notes || "-"}</td>
                <td className="px-1 py-2 text-center align-middle whitespace-nowrap">
                  <div className="flex h-8 items-center justify-center gap-1">
                    <button
                      onClick={() => handleOrderSelect(order)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {ordersTab === "current" && (
                      <>
                        <button
                          onClick={() => handleApplyOrderToInputs(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Hash className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => requestCompleteOrderItem(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
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
      {/* Header Toggle Button */}
       <div className={`absolute left-0 left-[49%] z-40 transition-all duration-300 ${showHeader ? "top-[8.5%]" : "top-[2%]"}`}>

        <Button

          type="button"

          onClick={() => setShowHeader((prev) => !prev)}

          className="h-10 w-10 rounded-full border-2 border-t-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105  active:scale-95"

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
              <h1 className="text-2xl font-bold">إدارة التشريح</h1>
              <p className="text-sm opacity-90">لوحة عمليات التشريح</p>
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

      {/* Main */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Upper */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Upper - Input/Output Form */}
          <Card className="p-4 flex flex-col order-2 min-h-0">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              المدخلات
            </h2>
            <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">
              {activeOrderItem && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-bold">تم ربط الإدخال بطلب #{activeOrderItem.production_order_id}</div>
                    <div className="text-xs text-gray-600">عنصر #{activeOrderItem.production_order_item_id}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveOrderItem(null)}
                  >
                    إلغاء الربط
                  </Button>
                </div>
              )}

              <div>
                {/* Input form for manual entry or QR */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 ${ioMode === "input" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                      onClick={() => setIoMode("input")}
                    >
                      <Search className="w-4 h-4 ml-2" />
                      QR
                    </Button>
                    <Button
                      variant="outline"
                      className={`flex-1 ${ioMode === "output" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
                      onClick={() => setIoMode("output")}
                    >
                      <Hash className="w-4 h-4 ml-2" />
                      يدوي
                    </Button>
                  </div>

                  {ioMode === "input" && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        قم بلصق بيانات QR ثم اضغط "تطبيق البيانات"
                      </div>
                      <Input
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        placeholder="width|color_id|batch_id|length|type_item|source|destination"
                      />
                      <Button
                        onClick={() => {
                          const parsed = parseQrInput(qrInput);
                          if (!parsed) {
                            toast.error("صيغة QR غير صحيحة");
                            return;
                          }
                          setInputForm((prev) => ({
                            ...prev,
                            input_width: parsed.input_width,
                            color_id: parsed.color_id,
                            batch_id: parsed.batch_id,
                            input_length: parsed.input_length,
                            type_item: parsed.type_item || prev.type_item,
                            source: parsed.source || prev.source,
                            destination: parsed.destination || prev.destination,
                          }));
                          setIoMode("output");
                          toast.success("تم تطبيق بيانات QR");
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!qrInput.trim()}
                      >
                        <Check className="w-5 h-5 ml-2" />
                        تطبيق البيانات
                      </Button>
                    </div>
                  )}

                  {ioMode === "output" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>العرض</Label>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {["22", "44", "66"].map((width) => (
                              <button
                                key={width}
                                type="button"
                                onClick={() => setInputForm(prev => ({ ...prev, input_width: width }))}
                                className={`
                                  rounded-xl border-2 text-base font-medium
                                  transition-all hover:scale-[1.02] active:scale-[0.98]
                                  flex items-center justify-center p-3
                                  ${inputForm.input_width === width
                                    ? "border-secondary-f bg-secondary-f text-white shadow-lg"
                                    : "border-gray-300 bg-white hover:border-secondary-f"
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
                            options={colorOptions}
                            placeholder="اختر اللون"
                          />
                        </div>
                        <div>
                          <Label>الطبخة</Label>
                          <FilterSelect
                            value={inputForm.batch_id}
                            onChange={(e) => setInputForm(prev => ({ ...prev, batch_id: e.target.value }))}
                            options={batchOptions}
                            placeholder="اختر الطبخة"
                          />
                        </div>
                        <div>
                          <Label>الكمية</Label>
                          <Input
                            value={inputForm.input_length}
                            onFocus={() => setCurrentInput("input_length")}
                            readOnly
                            className={`text-center ${currentInput === "input_length" ? "ring-2 ring-blue-500" : ""}`}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>الكمية الخارجية</Label>
                          <div className="space-y-3">
                            {/* <div className="text-sm text-gray-600 mb-2">اختر نمط التوزيع:</div> */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant={selectedOutputPattern === "22x3" ? "default" : "outline"}
                                className={`h-16 p-4 flex flex-col items-center justify-center ${selectedOutputPattern === "22x3"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                  }`}
                                onClick={() => handleCalculationModeSelect("22x3")}
                              >
                                <div className="text-lg font-bold">22 × 3</div>
                                {/* <div className="text-xs opacity-80">3 قطع من 22 سم</div> */}
                              </Button>
                              <Button
                                type="button"
                                variant={selectedOutputPattern === "44x1-22x1" ? "default" : "outline"}
                                className={`h-16 p-4 flex flex-col items-center justify-center ${selectedOutputPattern === "44x1-22x1"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                  }`}
                                onClick={() => handleCalculationModeSelect("44x1-22x1")}
                              >
                                <div className="text-lg font-bold">44 × 1 - 22 × 1</div>
                                {/* <div className="text-xs opacity-80">1 قطعة 44 سم + 1 قطعة 22 سم</div> */}
                              </Button>
                            </div>
                            {/* {selectedOutputPattern && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm text-blue-800">
                                  <div className="font-bold mb-1">النمط المحدد:</div>
                                  {selectedOutputPattern === "22x3" ? (
                                    <div>
                                      <span className="font-bold">3x22</span> - سيتم إرسال: output_length_22 = 300
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-bold">1x44, 1x22</span> - سيتم إرسال: output_length_22 = 100, output_length_44 = 100
                                    </div>
                                  )}
                                </div>
                              </div>
                            )} */}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label>ملاحظات</Label>
                          <Input
                            value={inputForm.notes}
                            onFocus={() => setCurrentInput("notes")}
                            placeholder="ملاحظات اختيارية"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateSlite}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      >
                        <ArrowRight className="w-5 h-5 ml-2" />
                        إنشاء عملية التشريح
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Right Upper - Orders Table */}
          <Card className="p-4 flex flex-col space-y-4 order-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                طلبات
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrdersTab("current")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${ordersTab === "current" ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  قيد الانتظار ({currentOrders.length})
                </button>
                <button
                  onClick={() => setOrdersTab("completed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${ordersTab === "completed" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  المكتملة ({completedOrders.length})
                </button>
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
            </div>

            {renderOrdersTable(ordersTab === "current" ? currentOrders : completedOrders)}
          </Card>
        </div>

        {/* Bottom */}
        <div className="flex gap-4 flex-1 min-h-0 flex-row-reverse">

          {/* Outputs Table */}
          <Card className="p-4 flex flex-col flex-1 space-y-4 min-h-0">
            {/* <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                جدول المخرجات
              </h3>
              <Button variant="outline" size="sm" onClick={loadSlites} disabled={loadingSlites}>
                <RefreshCw className={`w-4 h-4 ml-2 ${loadingSlites ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div> */}
            <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
              {loadingSlites ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingState />
                </div>
              ) : slites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium">لا توجد مخرجات</div>
                  <div className="text-sm">لم يتم تسجيل عمليات التشريح بعد</div>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Multi-select controls */}
                  <div className="p-2 bg-gray-100 border-b flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSlites.size === slites.length && slites.length > 0}
                        onChange={toggleAllSlitesSelection}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">
                        تحديد الكل ({selectedSlites.size}/{slites.length})
                      </span>
                    </div>
                    {selectedSlites.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={requestMultiDeleteSlites}
                        className="text-xs"
                      >
                        <Trash className="w-3 h-3 ml-1" />
                        حذف المحدد ({selectedSlites.size})
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
                        <th className="p-2 text-center border-b">رقم الطبخة</th>
                        <th className="p-2 text-center border-b">الكمية</th>
                        <th className="p-2 text-center border-b">الكمية الخارجية</th>
                        <th className="p-2 text-center border-b">النوع</th>
                        <th className="p-2 text-center border-b">المصدر</th>
                        <th className="p-2 text-center border-b">الوجهة</th>
                        <th className="p-2 text-center border-b">1x22</th>
                        <th className="p-2 text-center border-b">1x44</th>
                        <th className="p-2 text-center border-b">المستخدم</th>
                        <th className="p-2 text-center border-b">التوقيت</th>
                        <th className="p-2 text-center border-b">ملاحظات</th>
                        <th className="p-2 text-center border-b">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slites.map(slite => {
                        const isExpanded = expandedSlites.has(slite.slite_id);
                        return (
                          <React.Fragment key={slite.slite_id}>
                            <tr className={`text-xs border-b ${selectedSlites.has(slite.slite_id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedSlites.has(slite.slite_id)}
                                  onChange={() => toggleSliteSelection(slite.slite_id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-2 text-center">#{slite.slite_id}</td>
                              <td className="p-2 text-center">{slite.input_width}</td>
                              <td className="p-2 text-center">
                                {colors.find(c => String(c.color_id) === String(slite.color_id))?.color_name || "-"}{" "}
                                ({colors.find(c => String(c.color_id) === String(slite.color_id))?.color_code || "-"})
                              </td>
                              <td className="p-2 text-center">{batches.find(b => String(b.batch_id) === String(slite.batch_id))?.batch_number || "-"}</td>
                              <td className="p-2 text-center">{slite.input_length}</td>
                              <td className="p-2 text-center">{slite.output_length || "-"}</td>
                              <td className="p-2 text-center">{translateTypeItem(slite.type_item)}</td>
                              <td className="p-2 text-center">{translateSource(slite.source)}</td>
                              <td className="p-2 text-center">{translateSource(slite.destination)}</td>
                              <td className="p-2 text-center">{slite.output_length_22 || "-"}</td>
                              <td className="p-2 text-center">{slite.output_length_44 || "-"}</td>
                              <td className="p-2 text-center">{slite.user?.full_name || slite.user?.username || "-"}</td>
                              <td className="p-2 text-center">{formatDate(slite.created_at)}</td>
                              <td className="p-2 text-center">{slite.notes || "-"}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      const qrData = buildSliteQrData(slite);
                                      const qrFooter = buildSliteQrFooter(slite);
                                      const url = getQrUrl(qrData);
                                      printQr(url, `QR - تشريح #${slite.slite_id}`, qrFooter);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-violet-700 hover:bg-violet-50"
                                    title="طباعة QR"
                                    type="button"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleSliteDetails(slite.slite_id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                                    title={isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                    type="button"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => requestDeleteSlite(slite)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                    title="حذف التشريح"
                                    type="button"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan="16" className="p-0">
                                  <div className="p-4 bg-gray-50 border-b">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="font-semibold text-gray-600">العرض:</span>
                                        <span className="ml-2">{slite.input_width} سم</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">الكمية المدخل:</span>
                                        <span className="ml-2">{slite.input_length} سم</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">الكمية الخارجية:</span>
                                        <span className="ml-2">{slite.output_length || "-"}</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">النوع:</span>
                                        <span className="ml-2">{translateTypeItem(slite.type_item)} ({slite.type_item})</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">المصدر:</span>
                                        <span className="ml-2">{translateSource(slite.source)} ({slite.source})</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">الوجهة:</span>
                                        <span className="ml-2">{translateSource(slite.destination)} ({slite.destination})</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">اللون:</span>
                                        <span className="ml-2">
                                          {colors.find(c => String(c.color_id) === String(slite.color_id))?.color_name || "-"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">كود اللون:</span>
                                        <span className="ml-2">
                                          {colors.find(c => String(c.color_id) === String(slite.color_id))?.color_code || "-"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">الطبخة:</span>
                                        <span className="ml-2">
                                          {batches.find(b => String(b.batch_id) === String(slite.batch_id))?.batch_number || "-"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">1x22:</span>
                                        <span className="ml-2">{slite.output_length_22 || "-"}</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">1x44:</span>
                                        <span className="ml-2">{slite.output_length_44 || "-"}</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-gray-600">المستخدم:</span>
                                        <span className="ml-2">{slite.user?.full_name || slite.user?.username || "-"}</span>
                                      </div>
                                      <div className="col-span-2 md:col-span-3">
                                        <span className="font-semibold text-gray-600">ملاحظات:</span>
                                        <span className="ml-2">{slite.notes || "لا توجد ملاحظات"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
          
          {/* Number Pad */}
          <Card className="p-4 pb-0 w-[260px] flex-shrink-0 self-stretch flex flex-col">
            <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <Button key={n} variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(n)}>{n}</Button>
              ))}
              <Button variant="outline" className="h-12 text-lg" onClick={handleClear}><X className="w-4 h-4" /></Button>
              <Button variant="outline" className="h-12 text-lg font-bold" onClick={() => handleNumberClick(0)}>0</Button>
              <Button variant="outline" className="h-12 text-lg" onClick={handleBackspace}><ArrowRight className="w-4 h-4" /></Button>
            </div>
          </Card>

        </div>
      </div>

      <StyledDialog
          isOpen={showOrderDetails}
          onOpenChange={(open) => {
            setShowOrderDetails(open);
            if (!open) {
              setSelectedOrder(null);
              setOrderItems([]);
            }
          }}
          title={`تفاصيل الطلب ${selectedOrder?.production_order_id ? `#${selectedOrder.production_order_id}` : ""}`}
          contentClassName="max-w-6xl w-full"
          onCancel={() => setShowOrderDetails(false)}
          onConfirm={() => setShowOrderDetails(false)}
          confirmLabel="إغلاق"
          showCancel={false}
        >
          {!selectedOrder ? null : (
            <div className="space-y-4 w-full">
              {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><span className="text-gray-500">رقم الطلب:</span> <span className="font-bold">#{selectedOrder.production_order_id}</span></div>
                <div><span className="text-gray-500">التاريخ:</span> <span className="font-bold">{formatDate(selectedOrder.created_at)}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <span className="font-bold">{getStatusBadge(selectedOrder.status).label}</span></div>
                <div><span className="text-gray-500">الوجهة:</span> <span className="font-bold">{formatDestination(selectedOrder.destination)}</span></div>
                <div><span className="text-gray-500">اللون:</span> <span className="font-bold">{getColorLabel(selectedOrder.color_id)}</span></div>
                <div><span className="text-gray-500">الطبخة:</span> <span className="font-bold">{getBatchLabel(selectedOrder.batch_id)}</span></div>
                <div><span className="text-gray-500">الكمية:</span> <span className="font-bold">{selectedOrder.length || "-"}</span></div>
                <div><span className="text-gray-500">النوع:</span> <span className="font-bold">{formatTypeItem(selectedOrder.type_item)}</span></div>
              </div> */}

              {loadingOrderDetails ? (
                <LoadingState />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full table-auto border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-20">
                      <tr>
                        {["#", "العرض", "اللون", "الطبخة", "الكمية", "النوع", "المصدر", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => (
                          <th key={h} className="p-2 text-center border-b text-sm">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.length === 0 ? (
                        <tr><td colSpan="11" className="p-6 text-center text-gray-400">لا توجد عناصر لهذا الطلب</td></tr>
                      ) : orderItems.map((item, index) => (
                        <tr key={item.production_order_item_id || index} className="border-t">
                          <td className="p-2 text-center">#{item.production_order_item_id || index + 1}</td>
                          <td className="p-2 text-center">{item.width || "-"}</td>
                          <td className="p-2 text-center">{getColorLabel(item.color_id)}</td>
                          <td className="p-2 text-center">{getBatchLabel(item.batch_id)}</td>
                          <td className="p-2 text-center">{item.length || "-"}</td>
                          <td className="p-2 text-center">{formatTypeItem(item.type_item || item.type)}</td>
                          <td className="p-2 text-center">{formatDestination(item.source)}</td>
                          <td className="p-2 text-center">{formatDestination(item.destination)}</td>
                          <td className="p-2 text-center"><span className={`px-2 py-1 rounded-lg text-xs ${getStatusBadge(item.status).className}`}>{getStatusBadge(item.status).label}</span></td>
                          <td className="p-2 text-center">{item.notes || "-"}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleApplyOrderToInputs(item)}>إدخال</Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={String(item.status || "").toLowerCase() === ProductionStatus.completed}
                                onClick={() => requestCompleteOrderItem(item)}
                              >
                                إتمام
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
          onConfirm={async () => {
            if (pendingCompleteItem) {
              await handleCompleteOrderItem(pendingCompleteItem);
            }
            setShowCompleteDialog(false);
            setPendingCompleteItem(null);
          }}
          confirmLabel="تأكيد"
          cancelLabel="إلغاء"
        >
          <div className="text-sm text-gray-700">
            هل تريد إتمام الطلب{" "}
            <span className="font-bold">
              #{pendingCompleteItem?.production_order_id || pendingCompleteItem?.production_order_item_id || ""}
            </span>{" "}
            ونقله إلى المكتمل؟
          </div>
        </StyledDialog>

        <StyledDialog
          isOpen={showSliteConfirmDialog}
          onOpenChange={(open) => {
            setShowSliteConfirmDialog(open);
            if (!open) setPendingSlite(null);
          }}
          title="تأكيد عملية التشريح"
          contentClassName="max-w-2xl w-full"
          onCancel={() => {
            setShowSliteConfirmDialog(false);
            setPendingSlite(null);
          }}
          onConfirm={confirmCreateSlite}
          confirmLabel="تأكيد العملية"
          cancelLabel="إلغاء"
        >
          <div className="text-sm text-gray-700">
            هل تريد تنفيذ عملية التشريح؟
            <div className="mt-4">
              <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">عرض المدخل</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الكمية المدخل</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الكمية الخارجي</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">اللون</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الطبخة</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الوجهة</th>
                    <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium">الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingSlite?.input_width || "-"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingSlite?.input_length || "-"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingSlite?.output_length || "-"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                      {(() => {
                        const color = colors.find(c => String(c.color_id) === String(pendingSlite?.color_id));
                        return color ? `${color.color_name} (${color.color_code})` : "-";
                      })()}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                      {(() => {
                        const batch = batches.find(b => String(b.batch_id) === String(pendingSlite?.batch_id));
                        return batch ? batch.batch_number : "-";
                      })()}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        التشريح
                      </span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-sm">{pendingSlite?.notes || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StyledDialog>

      <StyledDialog
        isOpen={showDeleteSliteDialog}
        onOpenChange={(open) => {
          setShowDeleteSliteDialog(open);
          if (!open) setPendingDeleteSlite(null);
        }}
        title="تأكيد حذف عملية التشريح"
        contentClassName="max-w-md w-full"
        onCancel={() => {
          setShowDeleteSliteDialog(false);
          setPendingDeleteSlite(null);
        }}
        onConfirm={confirmDeleteSlite}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmVariant="destructive"
      >
        <div className="text-sm text-gray-700">
          هل تريد حذف عملية التشريح 
          <span className="font-bold"> #{pendingDeleteSlite?.slite_id || ""}</span>؟
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium">العرض:</span> {pendingDeleteSlite?.input_width || "-"}</div>
              <div><span className="font-medium">الكمية:</span> {pendingDeleteSlite?.input_length || "-"}</div>
              <div><span className="font-medium">اللون:</span> {(() => {
                const color = colors.find(c => String(c.color_id) === String(pendingDeleteSlite?.color_id));
                return color ? `${color.color_name} (${color.color_code})` : "-";
              })()}</div>
              <div><span className="font-medium">الطبخة:</span> {(() => {
                const batch = batches.find(b => String(b.batch_id) === String(pendingDeleteSlite?.batch_id));
                return batch ? batch.batch_number : "-";
              })()}</div>
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
          if (!open) setSelectedSlites(new Set());
        }}
        title="تأكيد حذف عمليات التشريح"
        contentClassName="max-w-md w-full"
        onCancel={() => {
          setShowMultiDeleteDialog(false);
          setSelectedSlites(new Set());
        }}
        onConfirm={confirmMultiDeleteSlites}
        confirmLabel="حذف الكل"
        cancelLabel="إلغاء"
        confirmVariant="destructive"
      >
        <div className="text-sm text-gray-700">
          هل تريد حذف 
          <span className="font-bold"> {selectedSlites.size} </span>
          عملية تشريح؟
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs text-red-600 font-medium">
              ⚠️ سيتم حذف جميع العمليات المحددة دفعة واحدة
            </div>
            <div className="mt-2 text-xs text-gray-600">
              العناصر التي سيتم حذفها: #{Array.from(selectedSlites).join(', #')}
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
