// src/components/users/UserDetailDialog.jsx
import { useEffect, useState } from "react";
import { userApi } from "../../api/userApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function UserDetailDialog({ open, onOpenChange, userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && userId) {
      loadUserDetails();
    }
  }, [open, userId]);

  const loadUserDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userApi.getUserById(userId);
      setUser(res.data);
    } catch (err) {
      setError(err.message || "فشل في تحميل بيانات المستخدم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الحساب</DialogTitle>
          <DialogDescription>
            معلومات المستخدم كاملة
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            جاري التحميل...
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {user && !loading && (
          <div className="space-y-6">
            {/* Profile */}
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                معلومات الملف الشخصي
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="الاسم الكامل" value={user.full_name} />
                <Info label="اسم المستخدم" value={user.username} />
                <Info label="رقم الهاتف" value={user.phone} />
                <Info label="البريد الإلكتروني" value={user.email || "غير محدد"} />
              </div>
            </Card>

            {/* Status */}
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                حالة الحساب
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">الدور</p>
                  <Badge>
                    {user.role === "admin" ? "مسؤول" : user.role}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    حالة الحساب
                  </p>
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "نشط" : "معطل"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Dates */}
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                سجل الأنشطة
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Info
                  label="تاريخ الإنشاء"
                  value={
                    user.created_at
                      ? format(new Date(user.created_at), "PPP p", { locale: ar })
                      : "غير محدد"
                  }
                />
                <Info
                  label="آخر تحديث"
                  value={
                    user.updated_at
                      ? format(new Date(user.updated_at), "PPP p", { locale: ar })
                      : "غير محدد"
                  }
                />
              </div>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
