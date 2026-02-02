
import { Search, Bell, User } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const Header = () => {
  return (
    <header className="bg-primary-s border-b border-border h-[80px] fixed left-0 right-64 top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle" size={18} />
            <Input
              type="text"
              placeholder="بحث..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-border focus:border-secondary-t focus:outline-none text-text-strong placeholder-text-subtle"
            />
          </div>
        </div>

        {/* Icons & User */}
        <div className="flex items-center gap-4">
          <Button className="relative p-2 bg-primary-s">
            <Bell size={20} className="text-text-muted" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-s text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button >
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-f to-secondary-s flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div>
              <div className="font-medium text-text-strong text-sm">Admin User</div>
              <div className="text-xs text-text-subtle">Online</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header