import { Home, Settings, Users, User, Sliders } from "lucide-react";

export const sideData = [
    { id: 1, title: 'الرئيسية', link: '/dashboard', logo: Home },
    { id: 2, title: 'الملف الشخصي', link: '/profile', logo: User },
    { id: 3, title: 'المستخدمون', link: '/users', logo: Users },
    { id: 4, title: 'الإعدادات', link: '/settings', logo: Settings },
    { id: 5, title: 'إدارة الإعدادات', link: '/settings-management', logo: Sliders },
]