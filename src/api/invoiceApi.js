// src/api/invoiceApi.js
import axiosInstance from "./axiosConfig";

export const invoiceApi = {
  // Get all invoices
  getInvoices: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/invoice', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الفواتير' };
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    try {
      const response = await axiosInstance.get(`/invoice/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الفاتورة' };
    }
  },

  // Get invoices by customer ID
  getInvoicesByCustomerId: async (customerId, params = {}) => {
    try {
      const response = await axiosInstance.get(`/invoice/customer/${customerId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب فواتير العميل' };
    }
  },

  // Get invoices by order ID
  getInvoicesByOrderId: async (orderId, params = {}) => {
    try {
      const response = await axiosInstance.get(`/invoice/order/${orderId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب فواتير الطلب' };
    }
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    try {
      const response = await axiosInstance.post('/invoice', invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء الفاتورة' };
    }
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    try {
      const response = await axiosInstance.put(`/invoice/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث الفاتورة' };
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    try {
      const response = await axiosInstance.delete(`/invoice/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف الفاتورة' };
    }
  },

  // Add payment to invoice
  addPayment: async (id, paymentData) => {
    try {
      const response = await axiosInstance.post(`/invoice/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إضافة الدفعة' };
    }
  },

  // Helper functions
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

  formatCurrency: (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
    return `${formatted} ل.س`;
  },

  getPaymentStatus: (total, paid) => {
    const totalNum = parseFloat(total) || 0;
    const paidNum = parseFloat(paid) || 0;
    
    if (totalNum === 0) return { label: 'غير محدد', className: 'bg-gray-100 text-gray-800' };
    if (paidNum >= totalNum) return { label: 'مدفوع بالكامل', className: 'bg-green-100 text-green-800' };
    if (paidNum === 0) return { label: 'غير مدفوع', className: 'bg-red-100 text-red-800' };
    return { label: 'مدفوع جزئياً', className: 'bg-yellow-100 text-yellow-800' };
  },

  getPaymentProgress: (total, paid) => {
    const totalNum = parseFloat(total) || 0;
    const paidNum = parseFloat(paid) || 0;
    if (totalNum === 0) return 0;
    return Math.min((paidNum / totalNum) * 100, 100);
  },

  formatCustomerInfo: (customer) => {
    if (!customer) return 'غير محدد';
    const name = customer.name || 'غير محدد';
    const phone = customer.phone || 'غير محدد';
    return `${name} - ${phone}`;
  },

  formatUserInfo: (user) => {
    if (!user) return 'غير محدد';
    return user.full_name || user.username || 'غير محدد';
  }
};