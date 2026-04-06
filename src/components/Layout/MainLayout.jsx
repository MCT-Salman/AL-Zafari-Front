import { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { sideData } from "@/data/sidebarData";
import { UserRoleLabels } from "@/enums";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LayoutProvider, useLayout } from "./LayoutContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import IconCommon from "../IconCommon/IconCommon";
import StyledDialog from "../common/StyledDialog";

const LayoutContent = () => {
  const { collapsed } = useLayout();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isOrdersPage = location.pathname === "/orders";
  const filteredSideData = sideData.filter((item) => !item.role || String(item.role).toLowerCase() === String(user?.role || "").toLowerCase());
  const navItems = filteredSideData.map((item) => ({
    title: item.title,
    href: item.link,
    icon: (props) => <IconCommon icon={item.logo} size={20} {...props} />,
  }));

  const LogoutBtn = (
    <button
      onClick={() => setShowLogoutDialog(true)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 cursor-pointer",
        "bg-secondary-s text-primary-s hover:bg-secondary-s/95 hover:text-white"
      )}
    >
      <LogOut size={20} className={cn("flex-shrink-0", collapsed ? "mx-auto" : "")} />
      {!collapsed && <span className="font-medium">تسجيل الخروج</span>}
    </button>
  );

  return (
    <div className="h-screen overflow-hidden bg-surface text-text-strong" dir="rtl">
      <Sidebar title="AL-Zafari" items={navItems} footerItem={LogoutBtn} />

      <div
        className={cn(
          "flex h-screen flex-1 flex-col transition-all duration-300",
          "md:mr-64",
          collapsed && "md:mr-20"
        )}
      >
        <Header>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button className="relative cursor-pointer border-none bg-primary-f p-2 shadow-none hover:bg-secondary-f">
              <Bell size={20} className="text-text-muted" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-primary-s bg-red-500"></span>
            </Button>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-secondary-f/25 bg-white/8 px-2.5 py-2 backdrop-blur-sm sm:px-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-secondary-f/20 bg-gradient-to-br from-primary-f to-primary-f/80 font-bold text-white shadow-md">
                {(user?.username?.[0] || user?.name?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0 text-right leading-tight">
                <div className="truncate text-sm font-bold text-text-strong">
                  {user?.full_name || user?.username || user?.name || "مستخدم"}
                </div>
                <div className="truncate text-[11px] font-bold text-secondary-f">
                  {UserRoleLabels[user?.role] || user?.role || "موظف"}
                </div>
              </div>
            </div>
          </div>
        </Header>

        <main
          className={cn(
            "mt-20 flex-1 min-h-0 p-4 md:p-6",
            isOrdersPage ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          )}
        >
          <Outlet />
        </main>
      </div>

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
};

function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <LayoutProvider>
      <LayoutContent />
    </LayoutProvider>
  );
}

export default MainLayout;
