import { NavLink } from "react-router-dom";
import { sideData } from "@/data/sidebarData";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Sidebar | الشريط الجانبي ثابت مع عناصر متجاوبة
// - شعار ثابت بالأعلى
// - قائمة قابلة للتمرير في الوسط
// - زر خروج ثابت بالأسفل
const Sidebar = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  return (
    <div className=" bg-primary-s text-text-strong h-full w-64 shadow-lg flex flex-col">
      {/* Logo Section */}
      <div className="logo h-20 border-b border-border flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-primary-f">AL-Zafari</div>
          <div className="text-sm text-text-muted mt-1">Management System</div>
        </div>
      </div>

      {/* Links Section (scrollable) */}
      <div className="flex-1 min-h-0 py-4">
        <div className="h-full overflow-y-auto">
          {sideData.map((item) => (
            <NavLink
              key={item.id}
              to={item.link}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-5 py-3 mx-3 mb-1 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-secondary-s text-primary-s' 
                    : 'hover:bg-primary-alpha'
                }`
              }
            >
              {/* Icon */}
              <div className={`icon transition-transform group-hover:scale-110 `}>
                {item.logo && <item.logo size={20} strokeWidth={1.75} />} 
              </div>

              {/* Title */}
              <div className="title font-medium flex-1">{item.title}</div>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom Section - Logout */}
      <div className="border-t border-border p-3 bg-white-alpha-80 backdrop-blur-sm">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-200 cursor-pointer bg-secondary-s/70 text-primary-s hover:bg-secondary-s w-full"
        >
          {/* Icon */}
          <div className="icon transition-transform group-hover:scale-110 text-primary-s">
            <LogOut size={20} strokeWidth={1.75} />
          </div>

          {/* Title */}
          <div className="title font-medium flex-1">تسجيل الخروج</div>
        </button>
      </div>

    </div>
  )
}

export default Sidebar