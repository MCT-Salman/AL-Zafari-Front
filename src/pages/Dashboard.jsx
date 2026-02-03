import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

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
        <Card className="bg-surface border border-border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-text-strong">
              <TrendingUp className="text-secondary-f" size={20} />
              الإيرادات • Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-strong">$12,345</div>
            <p className="text-sm text-text-subtle mt-1">+12% من الشهر الماضي</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border border-border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-text-strong">
              <Users className="text-secondary-f" size={20} />
              المستخدمون • Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-strong">1,234</div>
            <p className="text-sm text-text-subtle mt-1">+5% من الشهر الماضي</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border border-border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-text-strong">
              <DollarSign className="text-secondary-f" size={20} />
              الأرباح • Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-strong">$8,901</div>
            <p className="text-sm text-text-subtle mt-1">+8% من الشهر الماضي</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border border-border hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-text-strong">
              <AlertCircle className="text-secondary-f" size={20} />
              التنبيهات • Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-strong">3</div>
            <p className="text-sm text-text-subtle mt-1">تتطلب اهتمامك</p>
          </CardContent>
        </Card>
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
