// src/pages/Sales/SalesHome.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../api/orderApi";
import { customerApi } from "../../api/customerApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import DashboardHeader from "../../components/common/DashboardHeader";
import PageHeader from "../../components/common/PageHeader";
import MessageAlert from "../../components/common/MessageAlert";
import LoadingState from "../../components/common/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { getApiData } from "../../utils/api";
import { ClipboardList, User, ShoppingCart, Plus } from "lucide-react";

export default function SalesHome() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersRes, customersRes] = await Promise.all([
          orderApi.getOrders({ limit: 10 }),
          customerApi.getCustomers(),
        ]);
        setOrders(getApiData(ordersRes, []) || []);
        setCustomers(getApiData(customersRes, []) || []);
      } catch (err) {
        setError(err.message || "فشل في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="جارٍ تحميل الصفحة..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <PageHeader
        title="لوحة تحكم المبيعات"
        subtitle="واجهة لمس مبسطة للعمليات اليومية"
      />

      {error && (
        <MessageAlert
          type="error"
          message={error}
          dismissable={true}
          onDismiss={() => setError("")}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="p-6 flex flex-col gap-4">
          <div className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            أوامر اليوم
          </div>
          <div className="text-4xl font-black text-secondary-f">
            {orders.length}
          </div>
          <Button
            className="h-12 text-lg"
            onClick={() => navigate("/orders")}
          >
            فتح شاشة الطلبات
          </Button>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            العملاء
          </div>
          <div className="text-4xl font-black text-secondary-f">
            {customers.length}
          </div>
          <Button
            variant="outline"
            className="h-12 text-lg"
            onClick={() => navigate("/customers")}
          >
            إدارة العملاء
          </Button>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            طلب جديد سريع
          </div>
          <div className="text-sm text-gray-500">
            أنشئ طلبًا جديدًا بواجهة لمس
          </div>
          <Button
            className="h-12 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/orders")}
          >
            <Plus className="w-5 h-5 ml-2" />
            إنشاء طلب
          </Button>
        </Card>
      </div>
    </div>
  );
}
