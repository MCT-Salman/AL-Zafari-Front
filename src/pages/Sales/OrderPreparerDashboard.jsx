// src/pages/Sales/OrderPreparerDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Factory,
  Loader2,
  TrendingUp,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import MessageAlert from "../../components/common/MessageAlert";
import { Badge } from "@/components/ui/badge";

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
      <div className={cn("absolute bottom-0 left-0 right-0 h-1", colorClass.gradient)} />
    </Card>
  );
}

// Section Card Component for Order Status
function OrdersSectionCard({ title, icon: Icon, orders, colorClass, total }) {
  const { pending, preparing, completed } = orders || { pending: 0, preparing: 0, completed: 0 };

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className={cn("pb-4", colorClass.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorClass.iconBg)}>
              <Icon className={cn("w-5 h-5", colorClass.icon)} />
            </div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("font-bold", colorClass.badge)}>
            الإجمالي: {total || 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Pending */}
          <div className="text-center p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold text-yellow-800">{pending}</p>
          </div>

          {/* Preparing */}
          <div className="text-center p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">قيد التجهيز</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{preparing}</p>
          </div>

          {/* Completed */}
          <div className="text-center p-4 rounded-xl bg-green-50 border-2 border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">مكتمل</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{completed}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderPreparerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/dashboard/sales-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "فشل في تحميل الإحصائيات");
      }

      setStats(data.data || null);
    } catch (err) {
      setError(err.message || "فشل في تحميل الإحصائيات");
      console.error("[OrderPreparerDashboard] Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const salesColors = {
    border: "border-blue-200",
    text: "text-blue-700",
    bg: "bg-white",
    iconBg: "bg-blue-100",
    icon: "text-blue-600",
    gradient: "bg-gradient-to-r from-blue-400 to-blue-600",
    headerBg: "bg-blue-50/50",
    badge: "border-blue-300 text-blue-700"
  };

  const productionColors = {
    border: "border-orange-200",
    text: "text-orange-700",
    bg: "bg-white",
    iconBg: "bg-orange-100",
    icon: "text-orange-600",
    gradient: "bg-gradient-to-r from-orange-400 to-orange-600",
    headerBg: "bg-orange-50/50",
    badge: "border-orange-300 text-orange-700"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="جاري تحميل إحصائيات الطلبات..." />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <MessageAlert
          type="error"
          message={error}
          onDismiss={() => setError("")}
          dismissable={true}
        />
        <div className="flex justify-center mt-8">
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const { salesOrders, productionOrders } = stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="لوحة تحكم مجهز الطلبات"
          subtitle={stats?.date ? `إحصائيات يوم ${formatDate(stats.date)}` : "إحصائيات الطلبات"}
        />

        {/* Error Message */}
        {error && (
          <MessageAlert
            type="error"
            message={error}
            onDismiss={() => setError("")}
            dismissable={true}
          />
        )}

        {/* Orders Status Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Orders Section */}
          <OrdersSectionCard
            title="حالة طلبات المبيعات"
            icon={ShoppingCart}
            orders={salesOrders}
            colorClass={salesColors}
            total={salesOrders?.total}
          />

          {/* Production Orders Section */}
          <OrdersSectionCard
            title="حالة طلبات الإنتاج"
            icon={Factory}
            orders={productionOrders}
            colorClass={productionColors}
            total={productionOrders?.total}
          />
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales Pending */}
          <Card className="border-2 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">المبيعات - قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {salesOrders?.pending || 0}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Preparing */}
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">المبيعات - قيد التجهيز</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {salesOrders?.preparing || 0}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Completed */}
          <Card className="border-2 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">المبيعات - مكتملة</p>
                  <p className="text-2xl font-bold text-green-700">
                    {salesOrders?.completed || 0}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Total */}
          <Card className="border-2 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">المبيعات - الإجمالي</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {salesOrders?.total || 0}
                  </p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Pending */}
          <Card className="border-2 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">الإنتاج - قيد الانتظار</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {productionOrders?.pending || 0}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Preparing */}
          <Card className="border-2 border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">الإنتاج - قيد التجهيز</p>
                  <p className="text-2xl font-bold text-cyan-700">
                    {productionOrders?.preparing || 0}
                  </p>
                </div>
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Loader2 className="w-5 h-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Completed */}
          <Card className="border-2 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">الإنتاج - مكتملة</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {productionOrders?.completed || 0}
                  </p>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Total */}
          <Card className="border-2 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">الإنتاج - الإجمالي</p>
                  <p className="text-2xl font-bold text-teal-700">
                    {productionOrders?.total || 0}
                  </p>
                </div>
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Factory className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            <span>تحديث الإحصائيات</span>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
}
