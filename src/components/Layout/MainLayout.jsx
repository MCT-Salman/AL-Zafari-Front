import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

// Main layout with fixed Header and Sidebar
// تخطيط رئيسي يحتوي على هيدر ثابت وسايدبار ثابت مع محتوى قابل للتمرير
function MainLayout() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Mobile sidebar state
  // حالة السايدبار على الشاشات الصغيرة
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-surface text-text-strong">
      {/* Fixed Header - هيدر ثابت أعلى الصفحة */}
      <Header onToggleSidebar={toggleSidebar} />

      {/* Page Shell under header - غلاف الصفحة أسفل الهيدر */}
      <div className="pt-20">
        {/* Mobile overlay when sidebar open - طبقة تغطية على الجوال */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar container - حاوية السايدبار */}
        <aside
          className={`fixed top-20 bottom-0 right-0 z-40 w-64 overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Keep the sidebar fixed and scroll its middle section only */}
          <Sidebar />
        </aside>

        {/* Main content area - منطقة المحتوى الرئيسية */}
        <main className="relative h-[calc(100vh-80px)] overflow-y-auto p-4 md:mr-64">
          {/* Nested routes will render here - سيتم عرض الصفحات الداخلية هنا */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
