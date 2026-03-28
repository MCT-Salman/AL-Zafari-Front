// src/pages/Slitting/SlittingManager.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  AlertCircle,
  Check,
  X,
  Eye,
  Printer,
  RefreshCw,
  Hash,
  Search,
  ChevronUp,
  ChevronDown
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

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [ioMode, setIoMode] = useState("input"); // input | output
  const [qrInput, setQrInput] = useState("");
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const [inputForm, setInputForm] = useState({
    input_width: "",
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
    notes: ""
  });
  const [outputItems, setOutputItems] = useState([
    { id: 1, length: "", qrUrl: "", qrData: "" }
  ]);

  const [currentInput, setCurrentInput] = useState("input_length");
  const [showHeader, setShowHeader] = useState(true);
  const [ordersTab, setOrdersTab] = useState("current");
  const [selectSearch, setSelectSearch] = useState({
    input_width: "",
    color_id: "",
    batch_id: "",
    type_item: "",
    source: "",
    destination: ""
  });
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

  const sortRecordsDesc = (list = []) => {
    return [...list].sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      return Number(b?.production_order_item_id || b?.production_order_id || 0) - Number(a?.production_order_item_id || a?.production_order_id || 0);
    });
  };

  const currentOrders = useMemo(
    () => sortRecordsDesc(orders.filter((order) => String(order.status || "").toLowerCase() !== ProductionStatus.completed)),
    [orders]
  );

  const completedOrders = useMemo(
    () => sortRecordsDesc(orders.filter((order) => String(order.status || "").toLowerCase() === ProductionStatus.completed)),
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

  const handleCreateSlite = async () => {
    try {
      if (!inputForm.input_width || !inputForm.color_id || !inputForm.batch_id || !inputForm.input_length || !inputForm.type_item) {
        toast.error("يرجى إدخال جميع بيانات الإدخال المطلوبة");
        return;
      }

      const payload = {
        color_id: Number(inputForm.color_id),
        batch_id: Number(inputForm.batch_id),
        type_item: inputForm.type_item,
        input_length: Number(inputForm.input_length),
        output_length: String(outputForm.output_length ?? ""),
        input_width: Number(inputForm.input_width),
        output_length_22: Number(outputForm.output_length_22 || 0),
        output_length_44: Number(outputForm.output_length_44 || 0),
        source: inputForm.source,
        destination: inputForm.destination,
        notes: outputForm.notes || inputForm.notes
      };

      const response = await sliteApi.createSlite(payload);
      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || "فشل في الإخراج");
      }

      toast.success("تم إنشاء عملية التشريح بنجاح");
      loadSlites();
      loadOrders();

      if (activeOrderItem?.production_order_item_id) {
        await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
      }

      setOutputForm({ output_length: "", output_length_22: "", output_length_44: "", notes: "" });
      setActiveOrderItem(null);
      setIoMode("input");
    } catch (error) {
      console.error("Error creating slite:", error);
      toast.error(error?.message || "فشل في إنشاء عملية التشريح");
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
    const colorInfo = colors.find((c) => String(c.color_id) === String(slite?.color_id));
    const batchInfo = batches.find((b) => String(b.batch_id) === String(slite?.batch_id));
    return [
      `اللون: ${colorInfo?.color_name || "-"}`,
      `كود اللون: ${colorInfo?.color_code || "-"}`,
      `العرض: ${slite?.input_width || "-"}`,
      `الطبخة: ${batchInfo?.batch_number || "-"}`,
      `الطول المدخل: ${slite?.input_length || "-"}`,
      `1x22: ${slite?.output_length_22 ?? "-"}`,
      `1x44: ${slite?.output_length_44 ?? "-"}`,
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

  const renderOrdersTable = (list) => (
    <div className="flex-1 overflow-auto min-h-0 rounded-lg border bg-white">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-20 bg-gray-100">
          <tr>
            {["#", "اللون", "الطبخة", "الطول", "النوع", "الوجهة", "الحالة", "الإجراءات"].map((header) => (
              <th key={header} className="px-1 py-2 text-center text-sm whitespace-nowrap border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loadingOrders ? (
            <tr><td colSpan="8" className="p-6"><LoadingState /></td></tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan="8" className="p-8 text-center text-gray-400">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
                لا توجد طلبات
              </td>
            </tr>
          ) : list.map((order, index) => {
            const statusBadge = getStatusBadge(order.status);
            return (
              <tr key={order.production_order_item_id || `${order.production_order_id}-${index}`} className="h-14 border-b hover:bg-gray-50">
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">#{order.production_order_id}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{getColorLabel(order.color_id)}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{getBatchLabel(order.batch_id)}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{order.length || "-"}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">{formatTypeItem(order.type_item)}</td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    {formatDestination(order.destination)}
                  </span>
                </td>
                <td className="px-1 py-2 text-center align-middle text-sm whitespace-nowrap">
                  <span className={`rounded-lg px-2 py-1 text-xs ${statusBadge.className}`}>{statusBadge.label}</span>
                </td>
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
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
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
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-5 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Top Area - Inputs + Orders */}
        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Orders Table */}
          <Card className="p-4 flex flex-col space-y-4 min-h-0">
            <div className="flex items-center justify-between mb-4">
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
            </div>
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

            {renderOrdersTable(ordersTab === "current" ? currentOrders : completedOrders)}
          </Card>

          {/* Input/Output Form */}
          <Card className="p-4 flex flex-col min-h-0">
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
                          <FilterSelect
                            value={inputForm.input_width}
                            onChange={(e) => setInputForm(prev => ({ ...prev, input_width: e.target.value }))}
                            options={[
                              { value: "22", label: "22" },
                              { value: "44", label: "44" },
                              { value: "66", label: "66" }
                            ]}
                            placeholder="اختر العرض"
                          />
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
                          <Label>الطول</Label>
                          <Input
                            value={inputForm.input_length}
                            onFocus={() => setCurrentInput("input_length")}
                            readOnly
                            className={`text-center ${currentInput === "input_length" ? "ring-2 ring-blue-500" : ""}`}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>النوع</Label>
                          <FilterSelect
                            value={inputForm.type_item}
                            onChange={(e) => setInputForm(prev => ({ ...prev, type_item: e.target.value }))}
                            options={[
                              { value: TypeItem.Machine, label: "مكنة" },
                              { value: TypeItem.Presser, label: "كوي" }
                            ]}
                            placeholder="اختر النوع"
                          />
                        </div>
                        <div>
                          <Label>المصدر</Label>
                          <FilterSelect
                            value={inputForm.source}
                            onChange={(e) => setInputForm(prev => ({ ...prev, source: e.target.value }))}
                            options={[
                              { value: "warehouse", label: "المستودع" },
                              { value: "slitting", label: "التشريح" }
                            ]}
                            placeholder="المصدر"
                          />
                        </div>
                        <div>
                          <Label>الوجهة</Label>
                          <FilterSelect
                            value={inputForm.destination}
                            onChange={(e) => setInputForm(prev => ({ ...prev, destination: e.target.value }))}
                            options={[
                              { value: "slitting", label: "التشريح" },
                              { value: "production", label: "الإنتاج" }
                            ]}
                            placeholder="الوجهة"
                          />
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

        </div>

        {/* Bottom - Outputs Table */}
        <div className="flex gap-4">
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
          <Card className="p-4 flex flex-col flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                جدول المخرجات
              </h3>
              <Button variant="outline" size="sm" onClick={loadSlites} disabled={loadingSlites}>
                <RefreshCw className={`w-4 h-4 ml-2 ${loadingSlites ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>
            <div className="flex-1 min-h-[200px] overflow-auto border rounded-lg bg-white">
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
                  <div className="p-2 bg-gray-50 text-xs font-bold grid grid-cols-12 gap-2">
                    <div>العرض</div>
                    <div>اللون</div>
                    <div>رقم الطبخة</div>
                    <div>الطول</div>
                    <div>النوع</div>
                    <div>المصدر</div>
                    <div>الوجهة</div>
                    <div>1x22</div>
                    <div>1x44</div>
                    <div>المستخدم</div>
                    <div>التوقيت</div>
                    <div>ملاحظات</div>
                  </div>
                  {slites.map(slite => (
                    <div key={slite.slite_id} className="p-3">
                      <div className="grid grid-cols-12 gap-2 text-xs">
                        <div>{slite.input_width}</div>
                        <div>
                          {colors.find(c => String(c.color_id) === String(slite.color_id))?.color_name || "-"}{" "}
                          ({colors.find(c => String(c.color_id) === String(slite.color_id))?.color_code || "-"})
                        </div>
                        <div>{batches.find(b => String(b.batch_id) === String(slite.batch_id))?.batch_number || "-"}</div>
                        <div>{slite.input_length}</div>
                        <div>{slite.type_item}</div>
                        <div>{slite.source}</div>
                        <div>{slite.destination}</div>
                        <div>{slite.output_length_22 || "-"}</div>
                        <div>{slite.output_length_44 || "-"}</div>
                        <div>{slite.user?.full_name || slite.user?.username || "-"}</div>
                        <div>{formatDate(slite.created_at)}</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{slite.notes || "-"}</span>
                          <button
                            onClick={() => {
                              const qrData = buildSliteQrData(slite);
                              const qrFooter = buildSliteQrFooter(slite);
                              const url = getQrUrl(qrData);
                              printQr(url, `QR - تشريح #${slite.slite_id}`, qrFooter);
                            }}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-violet-700 hover:bg-violet-50"
                            title="طباعة QR"
                            type="button"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          

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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><span className="text-gray-500">رقم الطلب:</span> <span className="font-bold">#{selectedOrder.production_order_id}</span></div>
                <div><span className="text-gray-500">التاريخ:</span> <span className="font-bold">{formatDate(selectedOrder.created_at)}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <span className="font-bold">{getStatusBadge(selectedOrder.status).label}</span></div>
                <div><span className="text-gray-500">الوجهة:</span> <span className="font-bold">{formatDestination(selectedOrder.destination)}</span></div>
                <div><span className="text-gray-500">اللون:</span> <span className="font-bold">{getColorLabel(selectedOrder.color_id)}</span></div>
                <div><span className="text-gray-500">الطبخة:</span> <span className="font-bold">{getBatchLabel(selectedOrder.batch_id)}</span></div>
                <div><span className="text-gray-500">الطول:</span> <span className="font-bold">{selectedOrder.length || "-"}</span></div>
                <div><span className="text-gray-500">النوع:</span> <span className="font-bold">{formatTypeItem(selectedOrder.type_item)}</span></div>
              </div>

              {loadingOrderDetails ? (
                <LoadingState />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full table-auto text-sm [&_td]:break-words [&_th]:break-words">
                    <thead className="bg-gray-100">
                      <tr>
                        {["#", "العرض", "الطول", "النوع", "المصدر", "الوجهة", "الحالة", "الملاحظات", "الإجراءات"].map((h) => (
                          <th key={h} className="p-2 text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.length === 0 ? (
                        <tr><td colSpan="9" className="p-6 text-center text-gray-400">لا توجد عناصر لهذا الطلب</td></tr>
                      ) : orderItems.map((item, index) => (
                        <tr key={item.production_order_item_id || index} className="border-t">
                          <td className="p-2 text-center">#{item.production_order_item_id || index + 1}</td>
                          <td className="p-2 text-center">{item.width || "-"}</td>
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
            </span>
            {" "}ونقله إلى المكتمل؟
          </div>
        </StyledDialog>
      </div>
    </div>
  );
}
