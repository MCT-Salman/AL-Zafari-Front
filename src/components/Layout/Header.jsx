// src\components\Layout\Header.jsx
// import { Search, Bell, User, Menu, LogOut } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/context/AuthContext";

// // Header | مكون الهيدر (ثابت ومتجاوب)
// // - Fixed at top
// // - Contains hamburger to toggle sidebar on small screens
// // - يحتوي على زر لفتح/إغلاق السايدبار على الشاشات الصغيرة
// const Header = ({ onToggleSidebar }) => {
//   const { logout } = useAuth();

//   return (
//     <header className="bg-primary-s border-b border-border h-[80px] lg:w-[calc(100%-16rem)] fixed lg:left-0  top-0 z-50 sm:w-full">
//       <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
//         {/* Mobile toggle | زر السايدبار للجوال */}
//         <div className="md:hidden">
//           <Button
//             variant="ghost"
//             size="icon"
//             aria-label="Toggle sidebar"
//             onClick={onToggleSidebar}
//             className="bg-transparent hover:bg-primary-alpha"
//           >
//             <Menu className="text-text-strong" size={22} />
//           </Button>
//         </div>

//         {/* Search | حقل البحث */}
//         {/* <div className="flex-1 max-w-2xl">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle" size={18} />
//             <Input
//               type="text"
//               placeholder="بحث..."
//               className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-border focus:border-secondary-t focus:outline-none text-text-strong placeholder-text-subtle"
//             />
//           </div>
//         </div> */}

//         {/* Icons & User | الأيقونات والمستخدم */}
//         <div className="flex items-center gap-4">
//           <Button className="relative p-2 bg-primary-s">
//             <Bell size={20} className="text-text-muted" />
//             <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-s text-white text-xs rounded-full flex items-center justify-center">
//               3
//             </span>
//           </Button>

//           {/* <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-f to-secondary-s flex items-center justify-center text-white font-semibold">
//               A
//             </div>
//             <div>
//               <div className="font-medium text-text-strong text-sm">Admin User</div>
//               <div className="text-xs text-text-subtle">Online</div>
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={logout}
//               className="ml-2"
//               title="Logout"
//             >
//               <LogOut size={18} className="text-text-subtle" />
//             </Button>
//           </div> */}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;


// src/components/Layout/Header.jsx
import { Menu, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayout } from "./LayoutContext";
import { cn } from "@/lib/utils";

const Header = ({ children, className }) => {
  const { collapsed, setCollapsed, setMobileMenuOpen } = useLayout();

  return (
    <header 
      className={cn(
        "h-20 fixed top-0 left-0 right-0 z-30 bg-primary-f border-b-2 border-secondary-f transition-all duration-300",
        // Desktop handling: adjust width based on sidebar
        "md:mr-64", 
        collapsed && "md:mr-20",
        className
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "إظهار القائمة الجانبية" : "إخفاء القائمة الجانبية"}
            className="hidden md:flex h-11 w-11 rounded-none border-l border-secondary-f/35 text-primary-s hover:bg-secondary-f/15"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="فتح القائمة الجانبية"
            className="md:hidden h-11 w-11 rounded-none border-l border-secondary-f/35 text-text-strong hover:bg-secondary-f/15" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6 text-primary-s " />
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end">
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;
