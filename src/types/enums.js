// src\types\enums.js
export const UserRole = {
    admin: 'admin',
    accountant: 'accountant',
    cashier: 'cashier',
    sales: 'sales',
    production_manager: 'production_manager',
    Warehouse_Keeper: 'Warehouse_Keeper',
    Warehouse_Products: 'Warehouse_Products',
    Dissection_Technician: 'Dissection_Technician',
    Cutting_Technician: 'Cutting_Technician',
    Gluing_Technician: 'Gluing_Technician'
};

export const TypeItem = {
    Presser: 'Presser',
    Machine: 'Machine'
};

export const CustomerType = {
    Branch: 'Branch',
    agent: 'agent',
    customer: 'customer'
};

export const ActivityAction = {
    SEARCH: 'SEARCH',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW:    'VIEW',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT'
};

export const NotificationType = {
    GENERAL: 'GENERAL',
    COURSE_NEW: 'COURSE_NEW',
    COURSE_UPDATE: 'COURSE_UPDATE',
    LESSON_NEW: 'LESSON_NEW',
    QUIZ_AVAILABLE: 'QUIZ_AVAILABLE',
    SYSTEM: 'SYSTEM'
};

export const PriceColorBy = {
    isByMeter22: 'isByMeter22',
    isByMeter44: 'isByMeter44',
    isByMeter66: 'isByMeter66',
    isByBlanck: 'isByBlanck'
};

export const ConstantTypeEnum = {
    width: 'width',
    height: 'height',
    thickness: 'thickness',
    type_order: 'type_order',
    source_order: 'source_order'
};

export const OrderStatus = {
    pending: 'pending',
    preparing: 'preparing',
    outofwarehouse: 'outofwarehouse',
    canceled: 'canceled',
    completed: 'completed'
};

export const ProductionType = {
    orderproduction: 'orderproduction',
    warehouse: 'warehouse',
    slitting: 'slitting',
    cutting: 'cutting',
    gluing: 'gluing'
};

export const ProductionStatus = {
    pending: 'pending',
    preparing: 'preparing',
    canceled: 'canceled',
    completed: 'completed'
};

export const MovementDestination = {
    slitting: 'slitting',
    cutting: 'cutting',
    gluing: 'gluing',
    production: 'production'
};

export const ProcessSource = {
    warehouse: 'warehouse',
    slitting: 'slitting',
    cutting: 'cutting',
    production: 'production'
};
