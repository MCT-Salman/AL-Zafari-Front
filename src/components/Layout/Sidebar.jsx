import { NavLink } from "react-router-dom";
import { sideData } from "@/data/sidebarData";
import { LogOut } from "lucide-react";

const Sidebar = () => {
  return (
    <div className=" bg-primary-s text-text-strong h-screen w-64 shadow-lg">
      {/* Logo Section */}
      <div className="logo h-20 border-b border-border">
        <div className="content flex justify-center items-center h-full">
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold text-primary-f">AL-Zafari</div>
            <div className="text-sm text-text-muted mt-1">Management System</div>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="links py-4 h-[calc(100vh-80px)] flex flex-col justify-between">
        <div className="content h-[calc(100vh-80px)] relative">
          {sideData.map((item) => {
            return (
              <NavLink
                key={item.id}
                to={item.link}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-5 py-3 mx-3 mb-1 rounded-lg transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-secondary-f text-white shadow-md'
                    : 'hover:bg-primary-alpha hover:text-primary-f text-text-muted'
                  }`
                }
              >
                {/* Icon */}
                <div className={`icon transition-transform group-hover:scale-110 ${item.logo ? 'text-secondary-s' : ''}`}>
                  {item.logo && <item.logo size={20} strokeWidth={1.75} />}
                </div>

                {/* Title */}
                <div className="title font-medium flex-1">{item.title}</div>

                {/* Active Indicator */}
                <div className={({ isActive }) =>
                  `w-1.5 h-6 rounded-full transition-all duration-200
                  ${isActive ? 'bg-secondary-t opacity-100' : 'bg-transparent group-hover:bg-secondary-fo opacity-0 group-hover:opacity-30'}`
                } />
              </NavLink>
            );
          })}
          {/* Bottom Section - User Profile */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-white-alpha-80 backdrop-blur-sm">
            <NavLink
              to='/login'
              className={`group flex items-center gap-3 px-5 py-3 mx-3 mb-1 rounded-lg transition-all duration-200 cursor-pointer bg-secondary-s/70 text-primary-s hover:bg-secondary-s`}
            >
              {/* Icon */}
              <div className={`icon transition-transform group-hover:scale-110 text-primary-s`}>
                <LogOut size={20} strokeWidth={1.75} />
              </div>

              {/* Title */}
              <div className="title font-medium flex-1">تسجيل الخروج</div>

            </NavLink>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Sidebar