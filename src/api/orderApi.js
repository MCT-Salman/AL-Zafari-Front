// src/api/orderApi.js
import axiosInstance from "./axiosConfig";

export const orderApi = {
  // Get all orders
  getOrders: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/order/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الطلبات' };
    }
  },

  // Get order by ID
  getOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/order/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الطلب' };
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post('/order/', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء الطلب' };
    }
  },

  // Update order
  updateOrder: async (id, orderData) => {
    try {
      const response = await axiosInstance.put(`/order/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث الطلب' };
    }
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/order/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث حالة الطلب' };
    }
  },

  // Add item to order
  addOrderItem: async (orderId, itemData) => {
    try {
      const response = await axiosInstance.post(`/order/${orderId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إضافة العنصر' };
    }
  },

  // Update order item
  updateOrderItem: async (orderId, itemId, itemData) => {
    try {
      const response = await axiosInstance.put(`/order/${orderId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث عنصر الطلب' };
    }
  },

  // Delete order item
  deleteOrderItem: async (orderId, itemId) => {
    try {
      const response = await axiosInstance.delete(`/order/${orderId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف عنصر الطلب' };
    }
  },

  // Helper functions
  getOrderStatus: (order) => {
    return order?.status || 'غير محدد';
  },

  getCustomerName: (order) => {
    return order?.customer?.name || 'غير محدد';
  },

  getCustomerPhone: (order) => {
    return order?.customer?.phone || 'غير محدد';
  },

  getCustomerCity: (order) => {
    return order?.customer?.city || 'غير محدد';
  },

  getCustomerAddress: (order) => {
    return order?.customer?.address || 'غير محدد';
  },

  getSalesUserName: (order) => {
    return order?.sales?.full_name || order?.sales?.username || 'غير محدد';
  },

  getTotalAmount: (order) => {
    return order?.total_amount || '0';
  },

  getItemCount: (order) => {
    return order?.count_items || 0;
  },

  getFormattedDate: (order) => {
    if (!order?.created_at) return 'غير محدد';
    return new Date(order.created_at).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatOrderInfo: (order) => {
    if (!order) return 'غير محدد';
    
    const orderId = order.order_id || 'غير محدد';
    const customerName = order.customer?.name || 'غير محدد';
    const status = order.status || 'غير محدد';
    const total = order.total_amount || '0';
    return `طلب #${orderId} - ${customerName} - ${status} - ${total}`;
  },

  formatCustomerInfo: (order) => {
    if (!order?.customer) return 'غير محدد';
    
    const name = order.customer.name || 'غير محدد';
    const phone = order.customer.phone || 'غير محدد';
    const city = order.customer.city || 'غير محدد';
    const address = order.customer.address || 'غير محدد';
    return `${name} - ${phone} - ${city} - ${address}`;
  },

  getStatusBadge: (status) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: 'قيد التحضير', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'مكتمل', className: 'bg-green-100 text-green-800' },
      canceled: { label: 'ملغي', className: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  },

  // Calculate order totals from items
  calculateOrderTotal: (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      return total + subtotal;
    }, 0);
  },

  // Format currency - always display in ل.س
  formatCurrency: (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
    return `${formatted} ل.س`;
  }
};
