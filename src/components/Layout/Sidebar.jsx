// src\components\Layout\Sidebar.jsx
// import { sideData } from "@/data/sidebarData";
// import { LogOut } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import IconCommon from "../IconCommon/IconCommon";

// // Sidebar | الشريط الجانبي ثابت مع عناصر متجاوبة
// // - شعار ثابت بالأعلى
// // - قائمة قابلة للتمرير في الوسط
// // - زر خروج ثابت بالأسفل
// const Sidebar = () => {
//   const { logout } = useAuth();

//   const handleLogout = () => {
//     logout();
//   };
//   return (
//     <div className=" bg-primary-s text-text-strong h-[calc(100vh-80px)] w-64 shadow-lg flex flex-col">
//       {/* Logo Section */}
//       <div className="logo h-20 border-b border-border flex items-center justify-center">
//         <div className="flex flex-col items-center">
//           <div className="text-xl font-bold text-primary-f">AL-Zafari</div>
//           <div className="text-sm text-text-muted mt-1">Management System</div>
//         </div>
//       </div>

//       {/* Links Section (scrollable) */}
//       <div className="flex-1 min-h-0 py-4">
//         <div className="h-full overflow-y-auto">
//           {sideData.map((item) => (
//             <NavLink
//               key={item.id}
//               to={item.link}
//               className={({ isActive }) =>
//                 `group flex items-center gap-3 px-5 py-3 mx-3 mb-1 rounded-lg transition-all duration-200 cursor-pointer ${isActive
//                   ? 'bg-secondary-s text-primary-s'
//                   : 'hover:bg-primary-alpha'
//                 }`
//               }
//             >
//               {({ isActive }) => (
//                 <>
//                   {/* Icon */}
//                   <div className={`icon transition-transform group-hover:scale-110`}>
//                     {item.logo && (
//                       <IconCommon
//                         icon={item.logo}
//                         className={isActive ? 'text-primary-s' : ''}
//                         size={20}
//                       />
//                     )}
//                   </div>
//                   {/* Title */}
//                   <div className="title font-medium flex-1">{item.title}</div>
//                 </>
//               )}
//             </NavLink>
//           ))}
//         </div>
//       </div>

//       {/* Bottom Section - Logout */}
//       <div className="border-t border-border p-3 bg-white-alpha-80 backdrop-blur-sm">
//         <button
//           onClick={handleLogout}
//           className="group flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-200 cursor-pointer bg-secondary-s/70 text-primary-s hover:bg-secondary-s w-full"
//         >
//           {/* Icon */}
//           <div className="icon transition-transform group-hover:scale-110 text-primary-s">
//             <LogOut size={20} strokeWidth={1.75} />
//           </div>

//           {/* Title */}
//           <div className="title font-medium flex-1">تسجيل الخروج</div>
//         </button>
//       </div>

//     </div>
//   )
// }

// export default Sidebar


// src/components/Layout/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils"; // تأكد من وجود مسار utils لديك
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayout } from "./LayoutContext";

const Sidebar = ({ items = [], footerItem }) => {
  const { collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary-s border-l-2 border-secondary-f transition-all duration-300">
      {/* Header */}
      <div className={cn("h-20 flex items-center border-b-2 border-secondary-f px-4", collapsed ? "justify-center" : "justify-between")}>
        {/* اللوغو يظهر دائماً ويمكن النقر عليه للتبديل */}
        <div
          className="flex flex-col items-center  w-full  cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="text-xl font-bold  text-primary-f">
            <img
              src="/logo_alzafari/1-8.png"
              alt="Alzafari logo"
              width={collapsed ? 40 : 60}
              height={collapsed ? 40 : 60}
              decoding="async"
              className="transition-all duration-300"
            />
          </div>
          {/* النص يظهر فقط عندما لا يكون مطوياً */}
          
        </div>

        {/* إلغاء زر السهم تماماً */}
        {/* <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="hidden md:flex text-text-muted cursor-pointer hover:bg-primary/10">
     {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
  </Button> */}

        <Button variant="ghost" size="icon" aria-label="إغلاق القائمة الجانبية" onClick={() => setMobileMenuOpen(false)} className="md:hidden text-text-strong hover:bg-secondary-f">
          <X className="w-5 h-5 text-primary-s" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item, index) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium",
                isActive
                  ? "bg-secondary-f text-primary-f text-lg"
                  : "text-text-strong hover:bg-primary-alpha",
                collapsed && "justify-center px-2"
              )}
            >
              {/* هنا نستدعي الأيقونة كمكون */}
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary-f font-bold" : "")} />

              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer (Logout) */}
      {footerItem && (
        <div className="p-4 border-t-2 border-secondary-f bg-white/50 backdrop-blur-sm">
          {footerItem}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block fixed top-0 right-0 h-screen transition-all duration-300 z-40 bg-surface shadow-lg",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-64 bg-surface animate-in slide-in-from-right shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
