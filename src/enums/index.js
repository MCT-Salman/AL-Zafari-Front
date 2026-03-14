/**
 * ===================== ENUMS =====================
 * Centralized enums for the application
 */

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
  Gluing_Technician: 'Gluing_Technician',
};

export const UserRoleLabels = {
  [UserRole.admin]: 'مسؤول',
  [UserRole.accountant]: 'محاسب',
  [UserRole.cashier]: 'أمين الصندوق',
  [UserRole.sales]: 'مبيعات',
  [UserRole.production_manager]: 'مدير الإنتاج',
  [UserRole.Warehouse_Keeper]: 'أمين مستودع',
  [UserRole.Warehouse_Products]: 'منتجات المستودع',
  [UserRole.Dissection_Technician]: 'فني التشريح',
  [UserRole.Cutting_Technician]: 'فني القطع',
  [UserRole.Gluing_Technician]: 'فني اللصق',
};

export const CustomerType = {
  Branch: 'Branch',
  agent: 'agent',
  customer: 'customer',
};

export const MaterialType = {
  Role: 'Role',
  Blanck: 'Blanck',
};

export const RulerType = {
  old: 'old',
  new: 'new',
};

export const ActivityAction = {
  SEARCH: 'SEARCH',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
};

export const NotificationType = {
  GENERAL: 'GENERAL',
  COURSE_NEW: 'COURSE_NEW',
  COURSE_UPDATE: 'COURSE_UPDATE',
  LESSON_NEW: 'LESSON_NEW',
  QUIZ_AVAILABLE: 'QUIZ_AVAILABLE',
  SYSTEM: 'SYSTEM',
};

export const PriceColorBy = {
  isByMeter22: 'isByMeter22',
  isByMeter44: 'isByMeter44',
  isByMeter66: 'isByMeter66',
  isByBlanck: 'isByBlanck',
};

export const ConstantTypeEnum = {
  width: 'width',
  height: 'height',
  thickness: 'thickness',
  type_order: 'type_order',
  source_order: 'source_order',
};

export const ConstantTypeLabels = {
  [ConstantTypeEnum.width]: 'العرض',
  [ConstantTypeEnum.height]: 'طول',
  [ConstantTypeEnum.thickness]: 'السماكة',
  [ConstantTypeEnum.type_order]: 'ترتيب النوع',
  [ConstantTypeEnum.source_order]: 'ترتيب المصدر',
};

export const OrderStatus = {
  pending: 'pending',
  preparing: 'preparing',
  canceled: 'canceled',
  completed: 'completed',
};

export const OrderStatusLabels = {
  [OrderStatus.pending]: 'قيد الانتظار',
  [OrderStatus.preparing]: 'قيد التحضير',
  [OrderStatus.canceled]: 'ملغي',
  [OrderStatus.completed]: 'مكتمل',
};

export const ProductionType = {
  orderproduction: 'orderproduction',
  warehouse: 'warehouse',
  slitting: 'slitting',
  cutting: 'cutting',
  gluing: 'gluing',
};

export const ProductionTypeLabels = {
  [ProductionType.orderproduction]: 'الإنتاج بالطلب',
  [ProductionType.warehouse]: 'المستودع',
  [ProductionType.slitting]: 'التشريح',
  [ProductionType.cutting]: 'القص',
  [ProductionType.gluing]: 'التغرية',
};

export const ProductionStatus = {
  pending: 'pending',
  preparing: 'preparing',
  canceled: 'canceled',
  completed: 'completed',
};

export const ProductionStatusLabels = {
  [ProductionStatus.pending]: 'قيد الانتظار',
  [ProductionStatus.preparing]: 'قيد التحضير',
  [ProductionStatus.canceled]: 'ملغي',
  [ProductionStatus.completed]: 'مكتمل',
};

export const MovementDestination = {
  slitting: 'slitting',
  cutting: 'cutting',
  production: 'production',
};

export const MovementDestinationLabels = {
  [MovementDestination.slitting]: 'التشريح',
  [MovementDestination.cutting]: 'القص',
  [MovementDestination.production]: 'الإنتاج',
};

export const ProcessSource = {
  warehouse: 'warehouse',
  slitting: 'slitting',
  cutting: 'cutting',
  production: 'production',
};

export const ProcessSourceLabels = {
  [ProcessSource.warehouse]: 'المستودع',
  [ProcessSource.slitting]: 'التشريح',
  [ProcessSource.cutting]: 'القص',
  [ProcessSource.production]: 'الإنتاج',
};
