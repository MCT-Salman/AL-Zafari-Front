import { Home, Settings, Users, User, Sliders, Layers, ShoppingCart } from "lucide-react";

export const sideData = [
    { id: 1, title: 'الرئيسية', link: '/dashboard', logo: Home },
    { id: 3, title: 'المستخدمون', link: '/users', logo: Users, role: 'admin' },
    { id: 4, title: 'إدارة الثوابت', link: '/constants', logo: Layers, role: 'admin' },
    { id: 7, title: 'إدارة الإعدادات', link: '/settings-management', logo: Settings, role: 'admin' },
    // { id: 8, title: 'إرسال OTP', link: '/admin/password-reset', logo: Sliders, role: 'admin' },
    { id: 2, title: 'الملف الشخصي', link: '/profile', role: 'admin', logo: User },
    { id: 5, title: 'الزبائن', link: '/customers', logo: User, role: 'sales' },
    { id: 6, title: 'الطلبات', link: '/orders', logo: ShoppingCart, role: 'sales' },
    // { id: 9, title: 'ملف المبيعات', link: '/sales/profile', logo: User, role: 'sales' },
    { id: 10, title: 'مدير الإنتاج', link: '/production', logo: User, role: 'production_manager' },
    { id: 11, title: 'إدارة الفواتير', link: '/invoice', logo: User, role: 'sales' },
]
