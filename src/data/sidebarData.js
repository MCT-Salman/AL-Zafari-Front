// src\data\sidebarData.js
import { Home, Settings, Users, User, Sliders, Layers, ShoppingCart, Receipt, Package, Factory } from "lucide-react";

export const sideData = [
    { id: 1, title: 'الرئيسية', link: '/dashboard', logo: Home },
    { id: 3, title: 'المستخدمون', link: '/users', logo: Users, role: 'admin' },
    { id: 4, title: 'إدارة الثوابت', link: '/constants', logo: Layers, role: 'admin' },
    { id: 7, title: 'إدارة الإعدادات', link: '/settings-management', logo: Settings, role: 'admin' },
    { id: 12, title: 'سجل الفواتير', link: '/invoice-history', logo: Receipt, role: 'admin' },
    { id: 2, title: 'الملف الشخصي', link: '/profile', role: 'admin', logo: User },
    // Sales & Cashier common items
    { id: 20, title: 'طلبات المبيعات', link: '/sales', logo: ShoppingCart, role: 'cashier' },
    { id: 21, title: 'الزبائن', link: '/customers', logo: Users, role: 'cashier' },
    { id: 22, title: 'الفواتير', link: '/invoice', logo: Receipt, role: 'cashier' },
    // Sales only items - Order Preparer only sees dashboard and order preparer
    // { id: 16, title: 'لوحة التحكم', link: '/order-preparer-dashboard', logo: Home, role: 'sales' },
    { id: 15, title: 'مجهز الطلبات', link: '/order-preparer', logo: ShoppingCart, role: 'sales' },
    { id: 10, title: 'مدير الإنتاج', link: '/production', logo: User, role: 'production_manager' },
    { id: 13, title: 'إدارة المستودع', link: '/warehouse', logo: Package, role: 'Warehouse_Keeper' },
]
