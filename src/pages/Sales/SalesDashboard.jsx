// src/pages/sales/SalesDashboard.jsx
import { useState, useEffect } from "react";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Plus,
  Eye
} from "lucide-react";
import StatsCard from "../../components/common/StatsCard";
import MessageAlert from "../../components/common/MessageAlert";
import LoadingState from "../../components/common/LoadingState";

export default function SalesDashboard() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load orders and customers in parallel
      const [ordersResponse, customersResponse] = await Promise.all([
        orderApi.getOrders({ limit: 10 }), // Get recent orders
        customerApi.getCustomers()
      ]);

      setOrders(ordersResponse.data || []);
      setCustomers(customersResponse.data || []);
    } catch (err) {
      setError(err.message || "فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.is_active).length,
    totalRevenue: orders
      .filter(o => o.status === "completed")
      .reduce((total, order) => {
        return total + parseFloat(order.total_amount || 0);
      }, 0),
    todayOrders: orders.filter(o => {
      const orderDate = new Date(o.created_at).toDateString();
      const today = new Date().toDateString();
      return orderDate === today;
    }).length,
  };

  // Get recent orders
  const recentOrders = orders.slice(0, 5);
  const recentCustomers = customers.slice(0, 5);

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SYP"
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="جاري تحميل لوحة التحكم..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المبيعات</h1>
          <p className="text-gray-600 mt-2">نظرة عامة على المبيعات والعملاء</p>
        </div>

        {/* Error Message */}
        {error && (
          <MessageAlert
            type="error"
            message={error}
            onDismiss={() => setError("")}
            dismissable={true}
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">إنشاء طلب جديد</h3>
                <p className="text-sm text-gray-600 mt-1">بدء طلب مبيعات جديد</p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = "/sales/orders/create"}
              >
                <Plus className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">البحث عن زبون و إضافته</h3>
                <p className="text-sm text-gray-600 mt-1">البحث عن زبون أو إضافة زبون جديد</p>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = "/sales/customers"}
              >
                <Users className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">عرض جميع الطلبات</h3>
                <p className="text-sm text-gray-600 mt-1">عرض وإدارة جميع طلبات المبيعات</p>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => window.location.href = "/sales/orders"}
              >
                <Eye className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatsCard
            id={1}
            title="إجمالي الطلبات"
            value={stats.totalOrders}
            unit="طلب"
            icon={ShoppingCart}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />

          <StatsCard
            id={2}
            title="طلبات اليوم"
            value={stats.todayOrders}
            unit="طلب"
            icon={Calendar}
            iconColor="text-green-600"
            bgColor="bg-green-50"
            borderColor="border-green-200"
          />

          <StatsCard
            id={3}
            title="الطلبات المكتملة"
            value={stats.completedOrders}
            unit="طلب"
            icon={Package}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
            borderColor="border-purple-200"
          />

          <StatsCard
            id={4}
            title="إجمالي العملاء"
            value={stats.totalCustomers}
            unit="عميل"
            icon={Users}
            iconColor="text-orange-600"
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
          />
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">إجمالي الإيرادات</h3>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              من الطلبات المكتملة
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">متوسط قيمة الطلب</h3>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalOrders > 0
                ? formatCurrency(stats.totalRevenue / stats.totalOrders)
                : "0"
              }
            </div>
            <p className="text-sm text-gray-600 mt-2">
              متوسط قيمة جميع الطلبات
            </p>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">الطلبات الأخيرة</h3>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/sales/orders"}
              >
                عرض الكل
              </Button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات حديثة
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusBadge = orderApi.getStatusBadge(order.status);
                  return (
                    <div key={order.order_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">طلب #{order.order_id}</div>
                              <div className="text-sm text-gray-600">
                                {orderApi.getCustomerName(order)}
                              </div>
                            </div>
                          </div>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">
                            {formatCurrency(orderApi.getTotalAmount(order))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {orderApi.getFormattedDate(order)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Customers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">العملاء الأخيرون</h3>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/sales/customers"}
              >
                عرض الكل
              </Button>
            </div>

            {recentCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا يوجد عملاء حديثون
              </div>
            ) : (
              <div className="space-y-4">
                {recentCustomers.map((customer) => (
                  <div key={customer.customer_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-600">
                              {customer.phone}
                            </div>
                          </div>
                        </div>
                        <Badge className={customer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {customer.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-600">
                          {customer.city} - {customer.address}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* System Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">حالة النظام</h3>
            <div className="text-green-600">
              <div className="animate-pulse w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              جميع الأنظمة تعمل بشكل طبيعي
            </div>
            <p className="text-sm text-gray-600 mt-2">
              آخر تحديث: {new Date().toLocaleString("ar-SA")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
