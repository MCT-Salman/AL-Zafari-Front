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
import LoadingState from "../../components/common/LoadingState";
import NotificationsBell from "../../components/common/NotificationsBell";
import { toast } from "react-hot-toast";
import {
  Package,
  ArrowRight,
  Calculator,
  X,
  RefreshCw,
  Hash,
  Search
} from "lucide-react";
import { ProductionStatus, ProductionType, TypeItem, UserRole } from "../../types/enums";

export default function GluingManager() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notificationDedupRef = useRef(new Map());

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
    type_item: "",
    source: "cutting",
    destination: "gluing",
    notes: ""
  });

  const [outputForm, setOutputForm] = useState({
    output_length: "50",
    waste: "",
    notes: ""
  });

  const [currentInput, setCurrentInput] = useState("input_length");
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
    if (currentInput === "output_length") {
      setOutputForm(prev => ({ ...prev, output_length: String(prev.output_length || "") + num.toString() }));
      return;
    }
    if (currentInput === "waste") {
      setOutputForm(prev => ({ ...prev, waste: String(prev.waste || "") + num.toString() }));
    }
  };
  const handleDecimalClick = () => {
    if (currentInput === "input_length") {
      setInputForm(prev => ({ ...prev, input_length: appendDecimal(prev.input_length) }));
      return;
    }
    if (currentInput === "output_length") {
      setOutputForm(prev => ({ ...prev, output_length: appendDecimal(prev.output_length) }));
      return;
    }
    if (currentInput === "waste") {
      setOutputForm(prev => ({ ...prev, waste: appendDecimal(prev.waste) }));
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
    if (currentInput === "waste") {
      setOutputForm(prev => ({ ...prev, waste: back(prev.waste) }));
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
    if (currentInput === "waste") {
      setOutputForm(prev => ({ ...prev, waste: "" }));
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
      source: item.source || "cutting",
      destination: item.destination || "gluing",
      notes: item.notes || ""
    }));
    setIoMode("output");
  };

  const handleCreateProcess = async () => {
    try {
      if (!inputForm.input_width || !inputForm.color_id || !inputForm.batch_id || !inputForm.input_length || !inputForm.type_item) {
        toast.error("يرجى إدخال جميع بيانات الإدخال المطلوبة");
        return;
      }
      if (!outputForm.output_length) {
        toast.error("يرجى إدخال طول الإخراج");
        return;
      }

      const payload = {
        color_id: Number(inputForm.color_id),
        batch_id: Number(inputForm.batch_id),
        type_item: inputForm.type_item,
        input_length: toNumber(inputForm.input_length),
        output_length: normalizeDecimal(outputForm.output_length ?? ""),
        input_width: toNumber(inputForm.input_width),
        waste: outputForm.waste ? toNumber(outputForm.waste) : null,
        type: "gluing",
        source: inputForm.source,
        destination: inputForm.destination,
        notes: outputForm.notes || inputForm.notes
      };

      const response = await productionProcessApi.createProcess(payload);
      if (response?.success === false || response?.error) {
        throw new Error(response?.message || response?.error || "فشل في الإخراج");
      }

      toast.success("تم إنشاء عملية التغريه بنجاح");
      loadProcesses();
      loadOrders();

      if (activeOrderItem?.production_order_item_id) {
        await productionApi.updateProductionItemStatus(activeOrderItem.production_order_item_id, ProductionStatus.completed);
        setOrders(prev => (Array.isArray(prev) ? prev.filter(o => String(o.production_order_item_id) !== String(activeOrderItem.production_order_item_id)) : prev));
      }

      setOutputForm({ output_length: "50", waste: "", notes: "" });
      setActiveOrderItem(null);
      setIoMode("input");
    } catch (error) {
      console.error("Error creating gluing process:", error);
      toast.error(error?.message || "فشل في إنشاء عملية التغريه");
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

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <Package className="w-7 h-7" />
            <div>
              <h1 className="text-2xl font-bold">إدارة التغريه</h1>
              <p className="text-sm opacity-90">لوحة عمليات التغريه</p>
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
                      placeholder="width|color_id|batch_id|length|type_item|source|destination"
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
                      <div className="flex gap-2 mt-2">
                        <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer ${inputForm.input_width === "22" ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                          <input
                            type="checkbox"
                            checked={inputForm.input_width === "22"}
                            onChange={() => setInputForm(prev => ({ ...prev, input_width: prev.input_width === "22" ? "" : "22" }))}
                          />
                          22
                        </label>
                        <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer ${inputForm.input_width === "44" ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                          <input
                            type="checkbox"
                            checked={inputForm.input_width === "44"}
                            onChange={() => setInputForm(prev => ({ ...prev, input_width: prev.input_width === "44" ? "" : "44" }))}
                          />
                          44
                        </label>
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
                          { value: "cutting", label: "القص" },
                          { value: "gluing", label: "التغريه" }
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
                          { value: "gluing", label: "التغريه" },
                          { value: "production", label: "الإنتاج" }
                        ]}
                        placeholder="الوجهة"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>ملاحظات</Label>
                      <Input
                        value={inputForm.notes}
                        onChange={(e) => setInputForm(prev => ({ ...prev, notes: e.target.value }))}
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
                        <td className="p-2 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>طول الإخراج</Label>
                    <Input
                      value={outputForm.output_length}
                      onFocus={() => setCurrentInput("output_length")}
                      readOnly
                      className={`text-center ${currentInput === "output_length" ? "ring-2 ring-blue-500" : ""}`}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>الهدر</Label>
                    <Input
                      value={outputForm.waste}
                      onFocus={() => setCurrentInput("waste")}
                      readOnly
                      className={`text-center ${currentInput === "waste" ? "ring-2 ring-blue-500" : ""}`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    value={outputForm.notes}
                    onChange={(e) => setOutputForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات الإخراج"
                  />
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCreateProcess}>
                  إخراج
                </Button>
              </div>
            )}
            </div>
          </Card>

          {/* Right Upper - Inputs Table */}
          <Card className="p-4 flex flex-col space-y-4 order-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                جدول المدخلات
              </h2>
              <Button variant="outline" size="sm" onClick={loadOrders} disabled={loadingOrders}>
                <RefreshCw className={`w-4 h-4 ml-2 ${loadingOrders ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingState />
                </div>
              ) : orders.filter(o => String(o.status || "").toLowerCase() === ProductionStatus.pending).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium">لا توجد طلبات</div>
                  <div className="text-sm">لا توجد طلبات للتغريه</div>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="p-2 bg-gray-50 text-xs font-bold grid grid-cols-9 gap-2">
                    <div>#</div>
                    <div>العرض</div>
                    <div>اللون</div>
                    <div>الطبخة</div>
                    <div>الطول</div>
                    <div>النوع</div>
                    <div>المصدر</div>
                    <div>الوجهة</div>
                    <div>الحالة</div>
                  </div>
                  {orders
                    .filter(order => String(order.status || "").toLowerCase() === ProductionStatus.pending)
                    .map(order => {
                    const colorInfo = colors.find(c => String(c.color_id) === String(order.color_id));
                    const colorName = colorInfo?.color_name || "-";
                    const colorCode = colorInfo?.color_code || "-";
                    const batchNumber = batches.find(b => String(b.batch_id) === String(order.batch_id))?.batch_number || "-";
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <div key={order.production_order_item_id} className="p-3 hover:bg-gray-50">
                        <div className="grid grid-cols-9 gap-2 text-xs">
                          <div className="font-bold">#{order.production_order_id}</div>
                          <div>{order.width}</div>
                          <div>{colorName} ({colorCode})</div>
                          <div>{batchNumber}</div>
                          <div>{order.length}</div>
                          <div>{order.type_item}</div>
                          <div>{order.source}</div>
                          <div>{order.destination}</div>
                          <div>
                            <span className={`px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">{order.notes || "-"}</div>
                          <Button size="sm" variant="outline" onClick={() => handleApplyOrderToInputs(order)}>
                            إدخال
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom */}
        <div className="flex gap-4 flex-1 min-h-0 flex-row-reverse">
          {/* Outputs Table */}
          <Card className="p-4 flex flex-col flex-1 space-y-4 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                جدول المخرجات
              </h3>
              <Button variant="outline" size="sm" onClick={loadProcesses} disabled={loadingProcesses}>
                <RefreshCw className={`w-4 h-4 ml-2 ${loadingProcesses ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
              {loadingProcesses ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingState />
                </div>
              ) : processes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium">لا توجد مخرجات</div>
                  <div className="text-sm">لم يتم تسجيل عمليات التغريه بعد</div>
                </div>
              ) : (
                <div className="divide-y">
                  <div className="p-2 bg-gray-50 text-xs font-bold grid grid-cols-10 gap-2">
                    <div>العرض</div>
                    <div>اللون</div>
                    <div>الطبخة</div>
                    <div>الطول الدخل</div>
                    <div>الطول الخارج</div>
                    <div>الهدر</div>
                    <div>الوجهة</div>
                    <div>المستخدم</div>
                    <div>التوقيت</div>
                    <div>الملاحظات</div>
                  </div>
                  {processes.map(proc => {
                    const colorInfo = proc.color || colors.find(c => String(c.color_id) === String(proc.color_id));
                    const colorName = colorInfo?.color_name || "-";
                    const colorCode = colorInfo?.color_code || "-";
                    const batchNumber = proc.batch?.batch_number || batches.find(b => String(b.batch_id) === String(proc.batch_id))?.batch_number || "-";
                    return (
                      <div key={proc.process_id} className="p-3">
                        <div className="grid grid-cols-10 gap-2 text-xs">
                          <div>{proc.input_width}</div>
                          <div>{colorName} ({colorCode})</div>
                          <div>{batchNumber}</div>
                          <div>{proc.input_length}</div>
                          <div>{proc.output_length}</div>
                          <div>{proc.waste ?? "-"}</div>
                          <div>{proc.destination}</div>
                          <div>{proc.user?.full_name || proc.user?.username || "-"}</div>
                          <div>{formatDate(proc.created_at)}</div>
                          <div>{proc.notes || "-"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Number Pad */}
          <Card className="p-4 w-[260px] flex-shrink-0 self-stretch flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              لوحة الأرقام
            </h3>
            <div className="grid grid-cols-3 gap-2 flex-1 content-start overflow-auto">
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
    </div>
  );
}
