import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Factory,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  MoveRight,
  Scissors,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import MessageAlert from "../../components/common/MessageAlert";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, colorClass }) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      "border-2",
      colorClass.border
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", colorClass.text)}>
                {value}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            colorClass.bg,
            colorClass.iconBg
          )}>
            <Icon className={cn("w-6 h-6", colorClass.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Section Card for Operations
function OperationsCard({ title, data, icon: Icon, colorClass }) {
  const hasData = data?.byUser?.length > 0;
  
  return (
    <Card className={cn("border-2", colorClass.border)}>
      <CardHeader className={cn("pb-2", colorClass.bg)}>
        <CardTitle className={cn("text-lg flex items-center gap-2", colorClass.text)}>
          <Icon className="w-5 h-5" />
          {title}
          <span className="text-sm font-normal text-gray-500 mr-auto">
            الإجمالي: {data?.total || 0}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {!hasData ? (
          <p className="text-gray-500 text-sm text-center py-4">لا توجد بيانات</p>
        ) : (
          <div className="space-y-2">
            {data.byUser.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium">{item.userName || item.username || "-"}</span>
                <span className={cn("font-bold", colorClass.text)}>{item.count || 0}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductionDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/dashboard/production-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("فشل في جلب الإحصائيات");
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState message="جاري تحميل إحصائيات الإنتاج..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <MessageAlert type="error" message={error} />
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-primary-f text-white rounded-lg hover:bg-primary-f/90"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const productionOrders = stats?.productionOrders || {};
  const productionProcesses = stats?.productionProcesses || {};
  const operations = stats?.operationsByUser || {};

  const colorClasses = {
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
      icon: "text-green-600",
      iconBg: "bg-green-100",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50",
      text: "text-purple-700",
      icon: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50",
      text: "text-orange-700",
      icon: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageHeader
        title="لوحة تحكم الإنتاج"
        subtitle={`التاريخ: ${new Date(stats?.date).toLocaleDateString("ar-SY")}`}
      />

      <div className="mt-6 space-y-6">
        {/* Production Orders Stats */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Factory className="w-5 h-5 text-primary-f" />
            طلبات الإنتاج
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="قيد الانتظار"
              value={productionOrders.pending || 0}
              subtitle="طلبات بانتظار التنفيذ"
              icon={Clock}
              colorClass={colorClasses.amber}
            />
            <StatCard
              title="قيد التحضير"
              value={productionOrders.preparing || 0}
              subtitle="طلبات قيد التنفيذ"
              icon={Factory}
              colorClass={colorClasses.blue}
            />
            <StatCard
              title="مكتملة"
              value={productionOrders.completed || 0}
              subtitle="طلبات منتهية"
              icon={CheckCircle}
              colorClass={colorClasses.green}
            />
            <StatCard
              title="الإجمالي"
              value={productionOrders.total || 0}
              subtitle="جميع الطلبات"
              icon={TrendingUp}
              colorClass={colorClasses.purple}
            />
          </div>
        </div>

        {/* Production Processes Stats */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-f" />
            عمليات الإنتاج
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="قيد الانتظار"
              value={productionProcesses.pending || 0}
              subtitle="عمليات بانتظار التنفيذ"
              icon={Clock}
              colorClass={colorClasses.amber}
            />
            <StatCard
              title="قيد التحضير"
              value={productionProcesses.preparing || 0}
              subtitle="عمليات قيد التنفيذ"
              icon={Factory}
              colorClass={colorClasses.blue}
            />
            <StatCard
              title="مكتملة"
              value={productionProcesses.completed || 0}
              subtitle="عمليات منتهية"
              icon={CheckCircle}
              colorClass={colorClasses.green}
            />
            <StatCard
              title="الإجمالي"
              value={productionProcesses.total || 0}
              subtitle="جميع العمليات"
              icon={TrendingUp}
              colorClass={colorClasses.purple}
            />
          </div>
        </div>

        {/* Operations by User */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-f" />
            العمليات حسب المستخدم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OperationsCard
              title="حركات المستودع"
              data={operations.warehouseMovements}
              icon={MoveRight}
              colorClass={colorClasses.blue}
            />
            <OperationsCard
              title="عمليات التقطيع"
              data={operations.slites}
              icon={Scissors}
              colorClass={colorClasses.orange}
            />
            <OperationsCard
              title="عمليات الإنتاج"
              data={operations.productionProcesses}
              icon={Layers}
              colorClass={colorClasses.green}
            />
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-f text-white rounded-lg hover:bg-primary-f/90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            تحديث البيانات
          </button>
        </div>
      </div>
    </div>
  );
}
