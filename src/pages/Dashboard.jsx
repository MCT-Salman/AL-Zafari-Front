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
import PageHeader from "../components/common/PageHeader";
import StatCircle from "../components/common/StatCircle";
import StatsCard from "../components/common/StatsCard";

// الألوان المتاحة فقط
const colors = {
  primaryF: "#004563",
  primaryS: "#F6F6F6",
  secondaryF: "#F7A823",
  secondaryS: "#e94e1b",
  secondaryT: "#0FAEDD",
  secondaryFo: "#878787"
};

// بيانات الإحصائيات الرئيسية من متطلبات الصورة
const mainStats = [
  {
    id: 1,
    title: "مجمل المبيعات اليومية",
    value: "45,250",
    unit: "ل.س",
    icon: Wallet,
    iconColor: "text-secondary-f",
    bgColor: "bg-primary-s",
    borderColor: "border-secondary-f"
  },
  {
    id: 2,
    title: "سعر تصريف الدولار اليوم",
    value: "3.75",
    unit: "ل.س",
    icon: DollarSign,
    iconColor: "text-primary-f",
    bgColor: "bg-primary-s",
    borderColor: "border-primary-f"
  },
  {
    id: 3,
    title: "عدد الطلبات",
    value: "128",
    unit: "طلب",
    icon: ShoppingCart,
    iconColor: "text-secondary-t",
    bgColor: "bg-primary-s",
    borderColor: "border-secondary-t"
  },
  {
    id: 4,
    title: "عدد الفواتير",
    value: "96",
    unit: "فاتورة",
    icon: FileText,
    iconColor: "text-secondary-s",
    bgColor: "bg-primary-s",
    borderColor: "border-secondary-s"
  }
];

// بيانات العمليات حسب نوع الهوية
const operationStats = [
  { id: 1, label: "المستودع الخام", value: "24", icon: Package, icon_color: "text-primary-f",num_color:"text-primary-f", subtitle_color: "text-secondary-fo" },
  { id: 2, label: "التشريح", value: "18", icon:  Factory, icon_color: "text-secondary-s" ,num_color:"text-secondary-s", subtitle_color: "text-secondary-fo" },
  { id: 3, label: "القص", value: "32", icon: Scissors, icon_color: "text-secondary-f" ,num_color:"text-secondary-f", subtitle_color: "text-secondary-fo" },
  { id: 4, label: "التغرية", value: "15", icon: ArrowUpRight, icon_color: "text-secondary-t" ,num_color:"text-secondary-t", subtitle_color: "text-secondary-fo" },
];

// بيانات طلبات الإنتاج
const productionOrders = [
  { id: 1, label: "طلبات قيد الانتظار", value: "14", borderColor: "border-secondary-f", bgColor: "bg-secondary-f", textColor: "text-white" },
  { id: 2, label: "طلبات قيد التنفيذ", value: "8", borderColor: "border-secondary-t", bgColor: "bg-secondary-t", textColor: "text-white" },
  { id: 3, label: "طلبات مكتملة", value: "45", borderColor: "border-primary-f", bgColor: "bg-primary-f", textColor: "text-white" },
];


// Dashboard page | صفحة لوحة التحكم المحدثة
export default function Dashboard() {
  return (
    <div className="space-y-8 p-2 bg-primary-s min-h-screen">
      {/* Header */}
       <PageHeader
          title="لوحة التحكم الرئيسية"
          subtitle={` نظرة عامة على أداء المبيعات والعمليات`}
        />

      {/* الإحصائيات الرئيسية - 4 بطاقات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {mainStats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* قسم العمليات حسب الهوية */}
      <Card className="border-2 border-[#E5E5E5] shadow-lg bg-white overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.secondaryF }} />
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black flex items-center gap-2 text-primary-f" >
            <Factory className="w-6 h-6 text-secondary-f"  />
            العمليات  
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

      {/* قسم طلبات الإنتاج والنشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* طلبات الإنتاج */}
        <Card className="lg:col-span-1 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-primary-s">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-primary-f">
              <Package className="w-5 h-5 text-secondary-f" />
              طلبات الإنتاج
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

        {/* النشاط الأخير */}
        <Card className="lg:col-span-2 border-2 border-[#E5E5E5] shadow-lg bg-white">
          <CardHeader className="border-b-2 border-primary-s flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-primary-f">
              <Clock className="w-5 h-5 text-secondary-f" />
              النشاط الأخير
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full font-bold border-2 hover:bg-primary-s"
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
                  className="flex items-start gap-4 p-4 rounded-2xl bg-primary-s border-2 border-[#E5E5E5] hover:border-primary-f transition-colors group"
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
                    <p className="font-black mb-1 group-hover:text-primary-f transition-colors" style={{ color: colors.primaryF }}>{activity.title}</p>
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