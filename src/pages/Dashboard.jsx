// src\pages\Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  Factory, 
  Scissors, 
  ArrowUpRight,
  Layers,
  Boxes,
  Palette,
  Clock,
  Wallet,
  FileText,
  ListChecks,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import StatCircle from "../components/common/StatCircle";
import StatsCard from "../components/common/StatsCard";
import LoadingState from "../components/common/LoadingState";
import PaginationControls from "../components/common/PaginationControls";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// الألوان المتاحة فقط
const colors = {
  primaryF: "#004563",
  primaryS: "#F6F6F6",
  secondaryF: "#F7A823",
  secondaryS: "#e94e1b",
  secondaryT: "#0FAEDD",
  secondaryFo: "#878787"
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");


// Dashboard page | صفحة لوحة التحكم المحدثة
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [outputsPage, setOutputsPage] = useState(1);
  const [colorsPage, setColorsPage] = useState(1);
  const [topColorsPage, setTopColorsPage] = useState(1);

  const outputsPageSize = 6;
  const colorsPageSize = 8;
  const topColorsPageSize = 8;

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_BASE_URL}/dashboard/stats?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "فشل في تحميل إحصائيات المدير");
        }
        setStats(data.data || null);
      } catch (err) {
        setError(err.message || "فشل في تحميل إحصائيات المدير");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [period]);

  const mainStats = useMemo(() => {
    const todaySales = stats?.todaySales ?? 0;
    const todayInvoicesCount = stats?.todayInvoicesCount ?? 0;
    const orders = stats?.orders || {};
    return [
      {
        id: 1,
        title: "إجمالي المبيعات لليوم",
        value: Number(todaySales).toLocaleString(),
        unit: "ل.س",
        icon: Wallet,
        iconColor: "text-secondary-f",
        bgColor: "bg-primary-s",
        borderColor: "border-secondary-f"
      },
      {
        id: 2,
        title: "عدد الفواتير",
        value: Number(todayInvoicesCount).toLocaleString(),
        unit: "فاتورة",
        icon: FileText,
        iconColor: "text-primary-f",
        bgColor: "bg-primary-s",
        borderColor: "border-primary-f"
      },
      {
        id: 3,
        title: "عدد الطلبات قيد الانتظار",
        value: Number(orders.pending || 0).toLocaleString(),
        unit: "طلب",
        icon: ShoppingCart,
        iconColor: "text-secondary-t",
        bgColor: "bg-primary-s",
        borderColor: "border-secondary-t"
      },
      {
        id: 4,
        title: "عدد الطلبات قيد التجهيز",
        value: Number(orders.preparing || 0).toLocaleString(),
        unit: "طلب",
        icon: ListChecks,
        iconColor: "text-secondary-s",
        bgColor: "bg-primary-s",
        borderColor: "border-secondary-s"
      },
      {
        id: 5,
        title: "عدد الطلبات المكتملة",
        value: Number(orders.completed || 0).toLocaleString(),
        unit: "طلب",
        icon: ClipboardList,
        iconColor: "text-primary-f",
        bgColor: "bg-primary-s",
        borderColor: "border-primary-f"
      }
    ];
  }, [stats]);

  const operationStats = useMemo(() => {
    const ops = stats?.operationsStats || {};
    const cuttingCount = (ops?.productionProcesses?.byUser || []).reduce(
      (sum, u) => sum + (u?.byType?.cutting?.operationsCount || 0),
      0
    );
    const gluingCount = (ops?.productionProcesses?.byUser || []).reduce(
      (sum, u) => sum + (u?.byType?.gluing?.operationsCount || 0),
      0
    );
    return [
      { id: 1, label: "المستودع الخام", value: ops?.warehouseMovements?.total ?? 0, icon: Package, icon_color: "text-primary-f", num_color: "text-primary-f", subtitle_color: "text-secondary-fo" },
      { id: 2, label: "التشريح", value: ops?.slites?.total ?? 0, icon: Factory, icon_color: "text-secondary-s", num_color: "text-secondary-s", subtitle_color: "text-secondary-fo" },
      { id: 3, label: "القص", value: cuttingCount, icon: Scissors, icon_color: "text-secondary-f", num_color: "text-secondary-f", subtitle_color: "text-secondary-fo" },
      { id: 4, label: "التغرية", value: gluingCount, icon: ArrowUpRight, icon_color: "text-secondary-t", num_color: "text-secondary-t", subtitle_color: "text-secondary-fo" },
    ];
  }, [stats]);

  const productionOrders = useMemo(() => {
    const prod = stats?.productionOrder || {};
    return [
      { id: 1, label: "طلبات قيد الانتظار", value: prod.pending ?? 0, borderColor: "border-secondary-f", bgColor: "bg-secondary-f", textColor: "text-white" },
      { id: 2, label: "طلبات قيد التجهيز", value: prod.preparing ?? 0, borderColor: "border-secondary-t", bgColor: "bg-secondary-t", textColor: "text-white" },
      { id: 3, label: "طلبات مكتملة", value: prod.completed ?? 0, borderColor: "border-primary-f", bgColor: "bg-primary-f", textColor: "text-white" },
    ];
  }, [stats]);

  const orderTotals = useMemo(() => {
    const orders = stats?.orders || {};
    const prod = stats?.productionOrder || {};
    return [
      { id: 1, label: "إجمالي طلبات المبيعات", value: orders.total ?? (orders.pending || 0) + (orders.preparing || 0) + (orders.completed || 0), icon: ShoppingCart, icon_color: "text-secondary-f", num_color: "text-secondary-f", subtitle_color: "text-secondary-fo" },
      { id: 2, label: "إجمالي طلبات الإنتاج", value: prod.total ?? (prod.pending || 0) + (prod.preparing || 0) + (prod.completed || 0), icon: Package, icon_color: "text-secondary-t", num_color: "text-secondary-t", subtitle_color: "text-secondary-fo" }
    ];
  }, [stats]);

  const productionOutputsStats = useMemo(() => {
    const outputs = stats?.productionOutputs?.outputs || {};
    return [
      { id: 1, label: "مخرجات المستودع", value: outputs.warehouseOutputs ?? 0, icon: Boxes, icon_color: "text-primary-f", num_color: "text-primary-f", subtitle_color: "text-secondary-fo" },
      { id: 2, label: "مخرجات التشريح", value: outputs.slittingOutputs ?? 0, icon: Factory, icon_color: "text-secondary-s", num_color: "text-secondary-s", subtitle_color: "text-secondary-fo" },
      { id: 3, label: "مخرجات القص", value: outputs.cuttingOutputs ?? 0, icon: Scissors, icon_color: "text-secondary-f", num_color: "text-secondary-f", subtitle_color: "text-secondary-fo" },
      { id: 4, label: "مخرجات التغرية", value: outputs.gluingOutputs ?? 0, icon: ArrowUpRight, icon_color: "text-secondary-t", num_color: "text-secondary-t", subtitle_color: "text-secondary-fo" }
    ];
  }, [stats]);

  const ordersByColorSummary = useMemo(() => {
    const summary = stats?.ordersByColor?.summary || {};
    return [
      { id: 1, title: "عدد الألوان", value: Number(summary.totalColors || 0).toLocaleString(), unit: "لون", icon: Palette, iconColor: "text-secondary-f", bgColor: "bg-primary-s", borderColor: "border-secondary-f" },
      { id: 2, title: "إجمالي الكمية", value: Number(summary.totalQuantity || 0).toLocaleString(), unit: "قطعة", icon: Layers, iconColor: "text-secondary-t", bgColor: "bg-primary-s", borderColor: "border-secondary-t" },
      { id: 3, title: "إجمالي المبلغ", value: Number(summary.totalAmount || 0).toLocaleString(), unit: "ل.س", icon: Wallet, iconColor: "text-primary-f", bgColor: "bg-primary-s", borderColor: "border-primary-f" },
      { id: 4, title: "إجمالي الطلبات", value: Number(summary.totalOrders || 0).toLocaleString(), unit: "طلب", icon: ShoppingCart, iconColor: "text-secondary-s", bgColor: "bg-primary-s", borderColor: "border-secondary-s" }
    ];
  }, [stats]);

  const topColorsChart = useMemo(() => {
    const top = stats?.ordersByColor?.topColors || [];
    return top.map((c) => ({
      name: c.colorName || "-",
      quantity: Number(c.totalQuantity || 0),
      amount: Number(c.totalAmount || 0),
      orders: Number(c.ordersCount || 0)
    }));
  }, [stats]);

  const totalsExtra = useMemo(() => {
    const orders = stats?.orders || {};
    const prod = stats?.productionOrder || {};
    return {
      salesTotal: orders.total ?? (orders.pending || 0) + (orders.preparing || 0) + (orders.completed || 0),
      productionTotal: prod.total ?? (prod.pending || 0) + (prod.preparing || 0) + (prod.completed || 0),
      productionTotalOps: stats?.operationsStats?.productionProcesses?.total ?? 0,
      productionTotalWaste: (stats?.operationsStats?.productionProcesses?.byUser || []).reduce(
        (sum, u) => sum + (Number(u?.totalWaste) || 0),
        0
      )
    };
  }, [stats]);

  const dateRange = useMemo(() => {
    const range = stats?.productionOutputs?.dateRange || stats?.operationsStats?.dateRange || null;
    if (!range?.startDate || !range?.endDate) return null;
    const start = new Date(range.startDate).toLocaleDateString("en-GB");
    const end = new Date(range.endDate).toLocaleDateString("en-GB");
    return `${start} - ${end}`;
  }, [stats]);

  const outputsByUser = useMemo(() => {
    const ops = stats?.operationsStats || {};
    const warehouseUsers = (ops?.warehouseMovements?.byUser || []).map((u) => ({
      key: `wh-${u.userId}`,
      label: `${u.fullName || u.username || "مستخدم"} قام بإخراج`,
      value: u.operationsCount ?? 0
    }));
    const slittingUsers = (ops?.slites?.byUser || []).map((u) => ({
      key: `slite-${u.userId}`,
      label: `${u.fullName || u.username || "مستخدم"} (التشريح) قام بإخراج`,
      value: u.operationsCount ?? 0
    }));
    const processByType = (ops?.productionProcesses?.byUser || []).flatMap((u) => {
      const byType = u?.byType || {};
      return Object.values(byType).map((t) => ({
        key: `proc-${u.userId}-${t.type}`,
        label: `${u.fullName || u.username || "مستخدم"} (${t.typeLabel || t.type})`,
        value: t.operationsCount ?? 0
      }));
    });
    return [...warehouseUsers, ...slittingUsers, ...processByType];
  }, [stats]);

  const paginatedOutputs = useMemo(() => {
    const start = (outputsPage - 1) * outputsPageSize;
    return outputsByUser.slice(start, start + outputsPageSize);
  }, [outputsByUser, outputsPage, outputsPageSize]);

  const outputsTotalPages = Math.max(1, Math.ceil(outputsByUser.length / outputsPageSize));

  useEffect(() => {
    setOutputsPage(1);
  }, [outputsByUser.length, period]);

  const colorsByColor = useMemo(() => stats?.ordersByColor?.byColor || [], [stats]);

  const paginatedColors = useMemo(() => {
    const start = (colorsPage - 1) * colorsPageSize;
    return colorsByColor.slice(start, start + colorsPageSize);
  }, [colorsByColor, colorsPage, colorsPageSize]);

  const colorsTotalPages = Math.max(1, Math.ceil(colorsByColor.length / colorsPageSize));

  useEffect(() => {
    setColorsPage(1);
  }, [colorsByColor.length, period]);

  const topColors = useMemo(() => stats?.ordersByColor?.topColors || [], [stats]);

  const paginatedTopColors = useMemo(() => {
    const start = (topColorsPage - 1) * topColorsPageSize;
    return topColors.slice(start, start + topColorsPageSize);
  }, [topColors, topColorsPage, topColorsPageSize]);

  const topColorsTotalPages = Math.max(1, Math.ceil(topColors.length / topColorsPageSize));

  useEffect(() => {
    setTopColorsPage(1);
  }, [topColors.length, period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-s flex items-center justify-center">
        <LoadingState message="جاري تحميل لوحة التحكم..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2 bg-primary-s min-h-screen">
      {/* Header */}
      <PageHeader
        title="لوحة التحكم الرئيسية"
        subtitle="نظرة عامة على أداء المبيعات والعمليات"
      />

      <div className="flex items-center justify-end gap-2">
        {[
          { value: "day", label: "يومي" },
          { value: "week", label: "اسبوعي" },
          { value: "month", label: "شهري" },
          { value: "year", label: "سنوي" }
        ].map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
              period === p.value
                ? "bg-primary-f text-white border-primary-f"
                : "bg-white text-primary-f border-primary-f hover:bg-primary-s"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {mainStats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* إجماليات الطلبات */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryT }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Layers className="w-6 h-6 text-secondary-t" />
            إجماليات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderTotals.map((op) => (
              <StatCircle key={op.id} {...op} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* قسم العمليات الموجودة */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f" >
            <Factory className="w-6 h-6 text-secondary-f"  />
            العمليات الموجودة  
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {operationStats.map((op) => (
              <StatCircle  key={op.id}  {...op} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* مخرجات الإنتاج الإجمالية */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryS }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Boxes className="w-6 h-6 text-secondary-s" />
            مخرجات الإنتاج الإجمالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dateRange && (
            <div className="mb-3 text-xs text-gray-500">النطاق الزمني: {dateRange}</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {productionOutputsStats.map((op) => (
              <StatCircle key={op.id} {...op} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-3 bg-primary-s">
              <div className="text-xs text-gray-500">إجمالي عمليات الإنتاج</div>
              <div className="text-lg font-black text-primary-f">{totalsExtra.productionTotalOps}</div>
            </div>
            <div className="rounded-xl border p-3 bg-primary-s">
              <div className="text-xs text-gray-500">إجمالي الهدر</div>
              <div className="text-lg font-black text-primary-f">{totalsExtra.productionTotalWaste}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الطلبات حسب الألوان */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.primaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Palette className="w-6 h-6 text-primary-f" />
            ملخص الطلبات حسب الألوان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {ordersByColorSummary.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الطلبات حسب الألوان */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Palette className="w-6 h-6 text-secondary-f" />
            تفاصيل الطلبات حسب الألوان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg bg-white">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-center">اللون</th>
                  <th className="p-2 text-center">عدد الطلبات</th>
                  <th className="p-2 text-center">إجمالي الكمية</th>
                  <th className="p-2 text-center">إجمالي المبلغ</th>
                  <th className="p-2 text-center">قيد الانتظار</th>
                  <th className="p-2 text-center">قيد التجهيز</th>
                  <th className="p-2 text-center">مكتمل</th>
                  <th className="p-2 text-center">ملغي</th>
                </tr>
              </thead>
              <tbody>
                {paginatedColors.map((c) => (
                  <tr key={c.colorId} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-center font-bold">{c.colorName}</td>
                    <td className="p-2 text-center">{c.ordersCount}</td>
                    <td className="p-2 text-center">{c.totalQuantity}</td>
                    <td className="p-2 text-center">{Number(c.totalAmount || 0).toLocaleString()}</td>
                    <td className="p-2 text-center">{c.byStatus?.pending?.count || 0}</td>
                    <td className="p-2 text-center">{c.byStatus?.preparing?.count || 0}</td>
                    <td className="p-2 text-center">{c.byStatus?.completed?.count || 0}</td>
                    <td className="p-2 text-center">{c.byStatus?.cancelled?.count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {colorsByColor.length > colorsPageSize && (
            <PaginationControls
              currentPage={colorsPage}
              totalPages={colorsTotalPages}
              onPrevious={() => setColorsPage((p) => Math.max(1, p - 1))}
              onNext={() => setColorsPage((p) => Math.min(colorsTotalPages, p + 1))}
              onPageChange={setColorsPage}
            />
          )}
        </CardContent>
      </Card>

      {/* أفضل الألوان */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryT }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Palette className="w-6 h-6 text-secondary-t" />
            أفضل الألوان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg bg-white">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-center">اللون</th>
                  <th className="p-2 text-center">عدد الطلبات</th>
                  <th className="p-2 text-center">إجمالي الكمية</th>
                  <th className="p-2 text-center">إجمالي المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTopColors.map((c) => (
                  <tr key={c.colorId} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-center font-bold">{c.colorName}</td>
                    <td className="p-2 text-center">{c.ordersCount}</td>
                    <td className="p-2 text-center">{c.totalQuantity}</td>
                    <td className="p-2 text-center">{Number(c.totalAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {topColors.length > topColorsPageSize && (
            <PaginationControls
              currentPage={topColorsPage}
              totalPages={topColorsTotalPages}
              onPrevious={() => setTopColorsPage((p) => Math.max(1, p - 1))}
              onNext={() => setTopColorsPage((p) => Math.min(topColorsTotalPages, p + 1))}
              onPageChange={setTopColorsPage}
            />
          )}
        </CardContent>
      </Card>

      {/* مخطط أكثر الألوان مبيعاً */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f">
            <Palette className="w-6 h-6 text-secondary-f" />
            مخطط أكثر الألوان مبيعاً
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topColorsChart.length === 0 ? (
            <div className="text-sm text-gray-500">لا توجد بيانات لعرض المخطط</div>
          ) : (
            <ChartContainer
              className="h-[320px] w-full"
              config={{
                quantity: { label: "الكمية", color: colors.secondaryF }
              }}
            >
              <BarChart data={topColorsChart} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* قسم طلبات الإنتاج والمخرجات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* طلبات الإنتاج */}
        <Card className="lg:col-span-1 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-primary-s">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-primary-f">
              <Package className="w-5 h-5 text-secondary-f" />
              طلبات الإنتاج الموجودة حاليا
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {productionOrders.map((order) => (
              <div 
                key={order.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md",
                  "bg-primary-s"
                )}
                style={{ borderColor: order.borderColor.replace('border-[', '').replace(']', '') }}
              >
                <span className="font-bold text-primary-f" >{order.label}</span>
                <span className={cn("px-4 py-1.5 rounded-full text-sm font-black text-white", order.bgColor)}>
                  {order.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* مخرجات الإنتاج */}
        <Card className="lg:col-span-2 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-primary-s flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-primary-f">
              <Clock className="w-5 h-5 text-secondary-f" />
              مخرجات الإنتاج والعمليات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {outputsByUser.length === 0 ? (
                <div className="text-sm text-gray-500">لا توجد مخرجات حالياً</div>
              ) : (
                <div className="overflow-auto border rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-center">المستخدم</th>
                        <th className="p-2 text-center">العملية</th>
                        <th className="p-2 text-center">عدد العمليات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOutputs.map((item) => {
                        const label = item.label || "";
                        const parts = label.split(" ");
                        const user = parts[0] || item.label;
                        const operation = label.replace(user, "").trim();
                        return (
                          <tr key={item.key} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center font-bold text-primary-f">{user}</td>
                            <td className="p-2 text-center">{operation}</td>
                            <td className="p-2 text-center font-bold">{item.value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {outputsByUser.length > outputsPageSize && (
                <PaginationControls
                  currentPage={outputsPage}
                  totalPages={outputsTotalPages}
                  onPrevious={() => setOutputsPage((p) => Math.max(1, p - 1))}
                  onNext={() => setOutputsPage((p) => Math.min(outputsTotalPages, p + 1))}
                  onPageChange={setOutputsPage}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
