// src\data\sidebarData.js
import { Home, Settings, Users, User, Sliders, Layers } from "lucide-react";

export const sideData = [
    { id: 1, title: 'الرئيسية', link: '/dashboard', logo: Home },
    { id: 3, title: 'المستخدمون', link: '/users', logo: Users },
    { id: 4, title: 'إدارة الثوابت', link: '/constants', logo: Layers },
    { id: 2, title: 'الملف الشخصي', link: '/profile', logo: User },
    // عناصر خاصة برول المبيعات فقط
    { id: 5, title: 'الزبائن', link: '/customers', logo: User, role: 'sales' },
    { id: 6, title: 'الطلبات', link: '/orders', logo: User, role: 'sales' },
    // { id: 7, title: 'الإعدادات', link: '/settings', logo: Settings },
    // { id: 8, title: 'إدارة الإعدادات', link: '/settings-management', logo: Sliders },
]