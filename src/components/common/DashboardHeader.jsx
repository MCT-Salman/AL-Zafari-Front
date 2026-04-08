// src/components/common/DashboardHeader.jsx
import { useLocation, useNavigate } from "react-router-dom";
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
  Receipt,
  ChevronUp,
  ChevronDown
} from "lucide-react";

/**
 * Shared header used on sales/production dashboards.
 *
 * Props:
 * - leftContent: React node(s) displayed on the left side (e.g. create/history buttons)
 * - isHeaderVisible, setIsHeaderVisible: control visibility toggle
 * - hideCustomersAndInvoices: hide customers and invoices buttons (for order preparer page)
 * - hideOrderPreparer: hide order preparer button on pages that should only show cashier navigation
 * - customersLabel, invoicesLabel: optional button label overrides
 */
export default function DashboardHeader({
  leftContent = null,
  isHeaderVisible,
  setIsHeaderVisible,
  hideCustomersAndInvoices = false,
  hideHeaderToggle = false,
  hideOrderPreparer = false,
  customersLabel = "الزبائن",
  invoicesLabel = "الفواتير"
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const ROLE_LABELS = {
    admin: "مدير النظام",
    accountant: "محاسب",
    cashier: "كاشير",
    sales: "مبيعات",
    production_manager: "مدير الإنتاج",
    warehouse_keeper: "أمين المستودع",
    order_preparer: "طلب انتاج",
    production: "الإنتاج"
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const getNavButtonClass = (isActive = false) =>
    `px-5 py-3 text-base min-w-[100px] touch-manipulation border-2 ${
      isActive
        ? "bg-secondary-s text-white border-secondary-s shadow hover:bg-primary-f hover:border-secondary-s"
        : "bg-white/10 text-white border-white/30 hover:bg-primary-f hover:border-secondary-s"
    }`;

  return (
    <div className="relative flex-shrink-0">
      <div className={isHeaderVisible ? "h-[88px]" : "h-[36px]"} />

      {!hideHeaderToggle && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            isHeaderVisible ? "top-[60px]" : "top-2"
          }`}
        >
        <Button
          type="button"
          onClick={() => setIsHeaderVisible((prev) => !prev)}
          className="h-10 w-10 rounded-full border-2 border-t-secondary-f bg-primary-f text-white shadow-[0_16px_40px_rgba(16,185,129,0.38)] transition-all duration-200 hover:scale-105 active:scale-95"
          title={isHeaderVisible ? "إخفاء الهيدر" : "إظهار الهيدر"}
        >
          {isHeaderVisible ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </Button>
        </div>
      )}

      {isHeaderVisible && (
        <div dir="rtl" className="flex flex-wrap items-center justify-between border-b-4 border-secondary-f bg-primary-f text-white gap-4 px-4 py-3 shadow-md fixed top-0 left-0 right-0 z-40">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className={getNavButtonClass(location.pathname === "/dashboard")}
            >
              <Home className="w-5 h-5 ml-2" />
              الرئيسية
            </Button>
            {String(user?.role || "").toLowerCase() === 'cashier' && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/orders")}
                className={getNavButtonClass(location.pathname === "/orders")}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                الطلبات
              </Button>
            )}
            {!hideOrderPreparer && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/order-preparer")}
                className={getNavButtonClass(location.pathname === "/order-preparer")}
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                طلب انتاج
              </Button>
            )}
            {!hideCustomersAndInvoices && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/customers")}
                  className={getNavButtonClass(location.pathname === "/customers")}
                >
                  <Users className="w-5 h-5 ml-2" />
                  {customersLabel}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/invoice")}
                  className={getNavButtonClass(location.pathname === "/invoice")}
                >
                  <Receipt className="w-5 h-5 ml-2" />
                  {invoicesLabel}
                </Button>
              </>
            )}
            <div className="flex flex-wrap gap-3">{leftContent}</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/20 bg-white/10">
              <div className="text-sm font-bold">
                {user?.full_name || user?.username || "-"}
              </div>
              <div className="h-4 w-px bg-white/30" />
              <div className="text-xs font-semibold">
                {ROLE_LABELS[user?.role] || user?.role || "-"}
              </div>
            </div>
            <NotificationsBell />
            <Button
              size="lg"
              variant="outline"
              onClick={handleLogout}
              className="px-4 py-3 text-base min-w-[120px] touch-manipulation border-2 bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      )}

      {!isHeaderVisible && (
        <div className="fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center justify-between gap-1 border-secondary-f border-b-2 bg-primary-f px-4 py-1 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-secondary-s">
                {user?.full_name || user?.username || "-"}
              </div>
            </div>
            <div className="h-10 w-px" />
            <div className="min-w-0 text-right">
              <div className="truncate text-sm font-bold text-secondary-s">
                {ROLE_LABELS[user?.role] || user?.role || "-"}
              </div>
            </div>
          </div>
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
