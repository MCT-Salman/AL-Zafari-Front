// src\data\sidebarData.js
import { Home, Settings, Users, User, Sliders, Layers } from "lucide-react";

export const sideData = [
    { id: 1, title: 'الرئيسية', link: '/dashboard', logo: Home },
    { id: 2, title: 'الملف الشخصي', link: '/profile', logo: User },
    { id: 3, title: 'المستخدمون', link: '/users', logo: Users },
    { id: 4, title: 'إدارة الثوابت', link: '/constants', logo: Layers },
    { id: 5, title: 'الإعدادات', link: '/settings', logo: Settings },
    { id: 6, title: 'إدارة الإعدادات', link: '/settings-management', logo: Sliders },
]