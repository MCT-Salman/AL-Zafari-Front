// import { useState } from "react";
// import { Outlet } from "react-router-dom";
// import Header from "@/components/Layout/Header";
// import Sidebar from "@/components/Layout/Sidebar";
// import { useAuth } from "@/context/AuthContext";
// import { Navigate } from "react-router-dom";

// // Main layout with fixed Header and Sidebar
// // تخطيط رئيسي يحتوي على هيدر ثابت وسايدبار ثابت مع محتوى قابل للتمرير
// function MainLayout() {
//   const { user, loading } = useAuth();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
//   if (loading) {
//     return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
//   }
  
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
//   // Mobile sidebar state
//   // حالة السايدبار على الشاشات الصغيرة

//   const toggleSidebar = () => setIsSidebarOpen((v) => !v);
//   const closeSidebar = () => setIsSidebarOpen(false);

//   return (
//     <div className="min-h-screen bg-surface text-text-strong">
//       {/* Fixed Header - هيدر ثابت أعلى الصفحة */}
//       <Header onToggleSidebar={toggleSidebar} />

//       {/* Page Shell under header - غلاف الصفحة أسفل الهيدر */}
//       <div className="pt-20">
//         {/* Mobile overlay when sidebar open - طبقة تغطية على الجوال */}
//         {isSidebarOpen && (
//           <div
//             className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden"
//             onClick={closeSidebar}
//           />
//         )}

//         {/* Sidebar container - حاوية السايدبار */}
//         <aside
//           className={`fixed top-20 bottom-0 right-0 z-40 w-64 overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${
//             isSidebarOpen ? "translate-x-0" : "translate-x-full"
//           }`}
//         >
//           {/* Keep the sidebar fixed and scroll its middle section only */}
//           <Sidebar />
//         </aside>

//         {/* Main content area - منطقة المحتوى الرئيسية */}
//         <main className="relative h-[calc(100vh-80px)] overflow-y-auto p-4 md:mr-64">
//           {/* Nested routes will render here - سيتم عرض الصفحات الداخلية هنا */}
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default MainLayout;


// src/components/Layout/MainLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutProvider, useLayout } from "./LayoutContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { sideData } from "@/data/sidebarData"; // بياناتك القديمة
import IconCommon from "../IconCommon/IconCommon"; // أيقوناتك القديمة
import { LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 1. مكون داخلي للمحتوى (لأننا نحتاج لاستخدام useLayout داخله)
const LayoutContent = () => {
  const { collapsed } = useLayout();
  const { logout } = useAuth();

  // تحويل بيانات الـ Sidebar الخاصة بك لتناسب المكون الجديد
  const navItems = sideData.map(item => ({
    title: item.title,
    href: item.link,
    // خدعة: نمرر الأيقونة كمكون (Function Component)
    icon: (props) => <IconCommon icon={item.logo} size={20} {...props} /> 
  }));

  // زر الخروج
  const LogoutBtn = (
    <button
      onClick={logout}
      className={cn(
        "group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer w-full",
        "bg-secondary-s/10 text-primary-s hover:bg-secondary-s hover:text-white"
      )}
    >
      <LogOut size={20} className={cn("flex-shrink-0", collapsed ? "mx-auto" : "")} />
      {!collapsed && <span className="font-medium">تسجيل الخروج</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-surface text-text-strong" dir="rtl">
      {/* تمرير البيانات للمكونات النظيفة */}
      <Sidebar 
        title="AL-Zafari" 
        items={navItems} 
        footerItem={LogoutBtn}
      />

      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          "md:mr-64", // الهامش الافتراضي
          collapsed && "md:mr-20" // الهامش عند التصغير
        )}
      >
        <Header>
           {/* محتوى الهيدر الخاص بك */}
           <Button className="relative cursor-pointer p-2 bg-primary-s border-none shadow-none hover:bg-primary-alpha">
            <Bell size={20} className="text-text-muted" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary-s"></span>
          </Button>
          
          {/* <div className="flex items-center gap-3 mr-4">
             <div className="w-9 h-9 rounded-full bg-secondary-s flex items-center justify-center text-white font-bold shadow-sm">
               A
             </div>
             <div className="hidden sm:block text-right">
               <div className="text-sm font-bold text-text-strong">Admin User</div>
               <div className="text-[10px] text-text-muted">Online</div>
             </div>
          </div> */}
        </Header>
        
        {/* منطقة المحتوى المتغير */}
        <main className="flex-1 p-4 md:p-6 mt-20 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// 2. المكون الرئيسي الذي يغلف كل شيء بالـ Context
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