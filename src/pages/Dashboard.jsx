import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import CardWithData from "../components/CardWithData/CardWithData";
import IconCommon from "../components/IconCommon/IconCommon";


const cardData = [
  {
    id: 1,
    title: "الإيرادات • Revenue",
    contentTitle: "$12,345",
    contentDesc: "+12% من الشهر الماضي",
    icon: <IconCommon icon={TrendingUp} />
  },
  {
    id: 2,
    title: "المستخدمون • Users",
    contentTitle: "1,234",
    contentDesc: "+5% من الشهر الماضي",
    icon: <IconCommon icon={Users} className="text-secondary-t" size={40}/>
  },
  {
    id: 3,
    title: "الأرباح • Profit",
    contentTitle: "$8,901",
    contentDesc: "+8% من الشهر الماضي",
    icon: <IconCommon icon={DollarSign} />
  },
  {
    id: 4,
    title: "التنبيهات • Alerts",
    contentTitle: "3",
    contentDesc: "تتطلب اهتمامك",
    icon: <IconCommon icon={AlertCircle} />
  }
]


// Dashboard page | صفحة لوحة التحكم
export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-s rounded-lg p-6 border border-border">
        <h1 className="text-2xl font-bold text-text-strong mb-2">لوحة التحكم • Dashboard</h1>
        <p className="text-text-subtle">مرحباً بك في نظام الإدارة • Welcome to the management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {
          cardData.map((card)=>{
            return(
              <CardWithData key={card.id} title={card.title} contentTitle={card.contentTitle} contentDesc={card.contentDesc} icon={card.icon} />
            )
          })
        }
      </div>

      {/* Recent Activity */}
      <Card className="bg-surface border border-border">
        <CardHeader>
          <CardTitle className="text-text-strong">النشاط الأخير • Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary-alpha rounded-lg">
              <div>
                <p className="font-medium text-text-strong">مستخدم جديد مسجل</p>
                <p className="text-sm text-text-subtle">منذ 5 دقائق</p>
              </div>
              <span className="text-xs bg-secondary-s text-primary-s px-2 py-1 rounded">جديد</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-alpha rounded-lg">
              <div>
                <p className="font-medium text-text-strong">تحديث النظام</p>
                <p className="text-sm text-text-subtle">منذ ساعة</p>
              </div>
              <span className="text-xs bg-primary-s text-text-strong px-2 py-1 rounded">معلومات</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-alpha rounded-lg">
              <div>
                <p className="font-medium text-text-strong">تقرير شهري جاهز</p>
                <p className="text-sm text-text-subtle">منذ 3 ساعات</p>
              </div>
              <Button size="sm" className="bg-secondary-s hover:bg-secondary-f text-primary-s">
                عرض التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
