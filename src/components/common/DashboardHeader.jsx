// src/components/common/DashboardHeader.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../..//context/AuthContext";
import { Button } from "../ui/button";
import StyledDialog from "../common/StyledDialog";
import NotificationsBell from "./NotificationsBell";
import {
  ShoppingCart,
  Users,
  Home,
  LogOut,
  EyeOff,
  Eye,
  Receipt,
} from "lucide-react";

/**
 * Shared header used on sales/production dashboards.
 *
 * Props:
 * - leftContent: React node(s) displayed on the left side (e.g. create/history buttons)
 * - isHeaderVisible, setIsHeaderVisible: control visibility toggle
 */
export default function DashboardHeader({
  leftContent = null,
  isHeaderVisible,
  setIsHeaderVisible,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  return (
    <div className="relative flex-shrink-0 mb-20">
      {isHeaderVisible ? (
        <div className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-50 ">
          <div className="flex flex-wrap gap-3">{leftContent}</div>

          <div className="flex flex-wrap gap-2">
            <NotificationsBell />
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/orders")}
              className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <ShoppingCart className="w-5 h-5 ml-2" />
              الطلبات
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/customers")}
              className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Users className="w-5 h-5 ml-2" />
              الزبائن
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/invoice")}
              className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Receipt className="w-5 h-5 ml-2" />
              الفواتير
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Home className="w-5 h-5 ml-2" />
              الرئيسية
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLogout}
              className="px-4 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsHeaderVisible(false)}
              className="px-4 py-3 text-base min-w-[60px] touch-manipulation border-2 bg-secondary-s hover:bg-secondary-s/80 text-white border-secondary-s hover:brightness-110"
            >
              <EyeOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="absolute top-2 right-2 z-20">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsHeaderVisible(true)}
            className="px-4 py-2 text-base bg-secondary-f text-white border-secondary-f hover:bg-secondary-f shadow-lg touch-manipulation"
          >
            <Eye className="w-5 h-5 ml-2" />
            إظهار الهيدر
          </Button>
        </div>
      )}

      {/* Logout confirmation dialog */}
      <StyledDialog
        isOpen={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="تسجيل الخروج"
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
        confirmLabel="تسجيل الخروج"
        cancelLabel="إلغاء"
        confirmVariant="destructive"
      />
    </div>
  );
}
