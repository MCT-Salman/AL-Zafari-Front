// src\pages\Dashboard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertCircle, 
  Package, 
  ShoppingCart, 
  Calendar, 
  Leaf, 
  Factory, 
  Scissors, 
  Recycle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  FileText,
  Box
} from "lucide-react";
import CardWithData from "../components/CardWithData/CardWithData";
import IconCommon from "../components/IconCommon/IconCommon";
import { cn } from "@/lib/utils";

// الألوان المتاحة فقط
const colors = {
  primaryF: "#004563",
  primaryS: "#F6F6F6",
  secondaryF: "#F7A823",
  secondaryS: "#67122F",
  secondaryT: "#0FAEDD",
  secondaryFo: "#878787"
};

// بيانات الإحصائيات الرئيسية من متطلبات الصورة
const mainStats = [
  {
    id: 1,
    title: "مجمل المبيعات اليومية",
    value: "45,250",
    unit: "ر.س",
    change: "+12%",
    trend: "up",
    icon: Wallet,
    iconColor: colors.secondaryF,
    bgColor: "bg-[#F6F6F6]",
    borderColor: "border-[#F7A823]"
  },
  {
    id: 2,
    title: "سعر تصريف الدولار اليوم",
    value: "3.75",
    unit: "ر.س",
    change: "+0.02",
    trend: "up",
    icon: DollarSign,
    iconColor: colors.primaryF,
    bgColor: "bg-[#F6F6F6]",
    borderColor: "border-[#004563]"
  },
  {
    id: 3,
    title: "عدد الطلبات",
    value: "128",
    unit: "طلب",
    change: "+8",
    trend: "up",
    icon: ShoppingCart,
    iconColor: colors.secondaryT,
    bgColor: "bg-[#F6F6F6]",
    borderColor: "border-[#0FAEDD]"
  },
  {
    id: 4,
    title: "عدد الفواتير",
    value: "96",
    unit: "فاتورة",
    change: "+5",
    trend: "up",
    icon: FileText,
    iconColor: colors.secondaryS,
    bgColor: "bg-[#F6F6F6]",
    borderColor: "border-[#67122F]"
  }
];

// بيانات العمليات حسب نوع الهوية
const operationStats = [
  { id: 1, label: "المستودع الخام", value: "24", icon: Package, color: colors.primaryF },
  { id: 2, label: "التشريح", value: "18", icon: Scissors, color: colors.secondaryS },
  { id: 3, label: "القص", value: "32", icon: Factory, color: colors.secondaryF },
  { id: 4, label: "التغريز", value: "15", icon: ArrowUpRight, color: colors.secondaryT },
  { id: 5, label: "البترولي", value: "21", icon: Recycle, color: "#059669" },
  { id: 6, label: "برتقالي", value: "12", icon: Leaf, color: colors.secondaryF },
  { id: 7, label: "رمادي", value: "28", icon: Box, color: colors.secondaryFo },
  { id: 8, label: "أحمر", value: "9", icon: AlertCircle, color: "#DC2626" },
];

// بيانات طلبات الإنتاج
const productionOrders = [
  { id: 1, label: "طلبات قيد الانتظار", value: "14", borderColor: "border-[#F7A823]", bgColor: "bg-[#F7A823]", textColor: "text-white" },
  { id: 2, label: "طلبات قيد التنفيذ", value: "8", borderColor: "border-[#0FAEDD]", bgColor: "bg-[#0FAEDD]", textColor: "text-white" },
  { id: 3, label: "طلبات مكتملة", value: "45", borderColor: "border-[#004563]", bgColor: "bg-[#004563]", textColor: "text-white" },
];

// مكون بطاقة إحصائية محسّن
const StatCard = ({ title, value, unit, change, trend, icon: Icon, iconColor, bgColor, borderColor }) => (
  <Card className={cn(
    "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
    bgColor,
    borderColor
  )}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-bold" style={{ color: colors.secondaryFo }}>{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: colors.primaryF }}>{value}</span>
            <span className="text-sm font-semibold" style={{ color: colors.secondaryFo }}>{unit}</span>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            trend === "up" ? "bg-[#004563] text-white" : "bg-[#67122F] text-white"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm border" style={{ borderColor: iconColor }}>
          <Icon className="w-7 h-7" style={{ color: iconColor }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// مكون دائرة إحصائية بسيطة
const StatCircle = ({ value, label, icon: Icon, color }) => (
  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[#F6F6F6] border-2 border-[#E5E5E5] hover:border-[#004563] hover:shadow-md transition-all duration-300 group">
    <div 
      className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 shadow-sm group-hover:scale-110 transition-transform duration-300"
      style={{ borderColor: color }}
    >
      <Icon className="w-7 h-7" style={{ color: color }} />
    </div>
    <div className="text-center">
      <span className="block text-2xl font-black" style={{ color: colors.primaryF }}>{value}</span>
      <span className="text-xs font-bold" style={{ color: colors.secondaryFo }}>{label}</span>
    </div>
  </div>
);

// Dashboard page | صفحة لوحة التحكم المحدثة
export default function Dashboard() {
  return (
    <div className="space-y-8 p-2 bg-[#F6F6F6] min-h-screen">
      {/* Header */}
      <div className="rounded-3xl p-8 text-white shadow-xl" style={{ backgroundColor: colors.primaryF }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">لوحة التحكم الرئيسية</h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              نظرة عامة على أداء المبيعات والعمليات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold border border-white/30">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية - 4 بطاقات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {mainStats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* قسم العمليات حسب الهوية */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2" style={{ color: colors.primaryF }}>
            <Factory className="w-6 h-6" style={{ color: colors.secondaryF }} />
            العمليات حسب الهوية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {operationStats.map((op) => (
              <StatCircle 
                key={op.id} 
                value={op.value} 
                label={op.label} 
                icon={op.icon} 
                color={op.color} 
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* قسم طلبات الإنتاج والنشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* طلبات الإنتاج */}
        <Card className="lg:col-span-1 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-[#F6F6F6]">
            <CardTitle className="text-lg font-black flex items-center gap-2" style={{ color: colors.primaryF }}>
              <Package className="w-5 h-5" style={{ color: colors.secondaryF }} />
              طلبات الإنتاج
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {productionOrders.map((order) => (
              <div 
                key={order.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-md",
                  "bg-[#F6F6F6]"
                )}
                style={{ borderColor: order.borderColor.replace('border-[', '').replace(']', '') }}
              >
                <span className="font-bold" style={{ color: colors.primaryF }}>{order.label}</span>
                <span className={cn("px-4 py-1.5 rounded-full text-sm font-black text-white", order.bgColor)}>
                  {order.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* النشاط الأخير */}
        <Card className="lg:col-span-2 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-[#F6F6F6] flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center gap-2" style={{ color: colors.primaryF }}>
              <Clock className="w-5 h-5" style={{ color: colors.secondaryF }} />
              النشاط الأخير
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full font-bold border-2 hover:bg-[#F6F6F6]"
              style={{ borderColor: colors.primaryF, color: colors.primaryF }}
            >
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { title: "تم إضافة طلب إنتاج جديد", desc: "طلب تصنيع ألواح PVC - كمية 500 م²", time: "منذ 5 دقائق", type: "new" },
                { title: "تحديث حالة الطلب #1234", desc: "تم الانتقال من التشريح إلى القص", time: "منذ 15 دقيقة", type: "update" },
                { title: "تنبيه: مخزون خام منخفض", desc: "مادة PVC نوع A - الكمية أقل من 1000 م²", time: "منذ ساعة", type: "alert" },
                { title: "تم إكمال طلب الإنتاج #1200", desc: "جاهز للتسليم إلى العميل أحمد محمد", time: "منذ 3 ساعات", type: "completed" },
              ].map((activity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-4 p-4 rounded-2xl bg-[#F6F6F6] border-2 border-[#E5E5E5] hover:border-[#004563] transition-colors group"
                >
                  <div 
                    className="w-3 h-3 mt-2 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: 
                        activity.type === "new" ? colors.secondaryF :
                        activity.type === "update" ? colors.secondaryT :
                        activity.type === "alert" ? colors.secondaryS : colors.primaryF
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-black mb-1 group-hover:text-[#004563] transition-colors" style={{ color: colors.primaryF }}>{activity.title}</p>
                    <p className="text-sm font-medium mb-1" style={{ color: colors.secondaryFo }}>{activity.desc}</p>
                    <p className="text-xs font-bold flex items-center gap-1" style={{ color: colors.secondaryFo }}>
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full font-bold"
                    style={{ color: colors.primaryF }}
                  >
                    التفاصيل
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}