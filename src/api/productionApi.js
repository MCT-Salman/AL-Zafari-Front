// src/api/productionApi.js
import axiosInstance from "./axiosConfig";
import { ProductionStatus, ProductionType, MovementDestination, ProcessSource } from "../types/enums";

export const productionApi = {
  // Get all production orders
  getProductionOrders: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/production-order/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب طلبات الإنتاج' };
    }
  },

  // Get production order by ID
  getProductionOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/production-order/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب طلب الإنتاج' };
    }
  },

  // Create production order
  createProductionOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post('/production-order/', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء طلب الإنتاج' };
    }
  },

  // Update production order
  updateProductionOrder: async (id, orderData) => {
    try {
      const response = await axiosInstance.put(`/production-order/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث طلب الإنتاج' };
    }
  },

  // Delete production order
  deleteProductionOrder: async (id) => {
    try {
      const response = await axiosInstance.delete(`/production-order/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف طلب الإنتاج' };
    }
  },

  // Update production order status
  updateProductionOrderStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/production-order/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث حالة طلب الإنتاج' };
    }
  },

  // Get production order items
  getProductionOrderItems: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/production-order/${orderId}/items`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب عناصر الطلب' };
    }
  },

  // Get production item by ID
  getProductionItemById: async (itemId) => {
    try {
      const response = await axiosInstance.get(`/production-order/item/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب عنصر الطلب' };
    }
  },

  // Update production item
  updateProductionItem: async (itemId, itemData) => {
    try {
      const response = await axiosInstance.put(`/production-order/item/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث عنصر الطلب' };
    }
  },

  // Update production item status
  updateProductionItemStatus: async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(`/production-order/item/${itemId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث حالة العنصر' };
    }
  },

  // Delete production item
  deleteProductionItem: async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/production-order/item/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف عنصر الطلب' };
    }
  },

  // Helper functions
  getStatusBadge: (status) => {
    const statusMap = {
      [ProductionStatus.pending]: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      [ProductionStatus.preparing]: { label: 'قيد التحضير', className: 'bg-blue-100 text-blue-800' },
      [ProductionStatus.completed]: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
      [ProductionStatus.canceled]: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'غير محدد', className: 'bg-gray-100 text-gray-800' };
  },

  getProductionTypeLabel: (type) => {
    const typeMap = {
      [ProductionType.warehouse]: 'مستودع',
      [ProductionType.slitting]: 'تقطيع',
      [ProductionType.cutting]: 'قص',
      [ProductionType.gluing]: 'لصق',
      [ProductionType.orderproduction]: 'إنتاج'
    };
    return typeMap[type] || type || 'غير محدد';
  },

  getMovementDestinationLabel: (destination) => {
    const destMap = {
      [MovementDestination.slitting]: 'تقطيع',
      [MovementDestination.cutting]: 'قص',
      [MovementDestination.gluing]: 'لصق',
      [MovementDestination.production]: 'إنتاج'
    };
    return destMap[destination] || destination || 'غير محدد';
  },

  getProcessSourceLabel: (source) => {
    const sourceMap = {
      [ProcessSource.warehouse]: 'مستودع',
      [ProcessSource.slitting]: 'تقطيع',
      [ProcessSource.cutting]: 'قص',
      [ProcessSource.production]: 'إنتاج'
    };
    return sourceMap[source] || source || 'غير محدد';
  },

  getFormattedDate: (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  formatIssuedBy: (issuedBy) => {
    if (!issuedBy) return 'غير محدد';
    return issuedBy.full_name || issuedBy.username || 'غير محدد';
  }
};