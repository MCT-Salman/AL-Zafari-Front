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

  // Get price for material
  getMaterialPrice: async (priceData) => {
    try {
      const response = await axiosInstance.post('/invoice/price-material', priceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب سعر المادة' };
    }
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    try {
      // Coerce numeric fields to proper types to avoid backend validation errors
      const payload = {
        ...invoiceData,
        order_id: invoiceData.order_id ? Number(invoiceData.order_id) : null,
        customer_id: invoiceData.customer_id ? Number(invoiceData.customer_id) : null,
        total_amount: invoiceData.total_amount !== undefined ? Number(invoiceData.total_amount) : undefined,
        discount: invoiceData.discount !== undefined ? Number(invoiceData.discount) : undefined,
        paid_amount: invoiceData.paid_amount !== undefined ? Number(invoiceData.paid_amount) : undefined,
        items: (invoiceData.items || []).map((it) => ({
          ...it,
          color_id: it.color_id ? Number(it.color_id) : null,
          batch_id: it.batch_id ? Number(it.batch_id) : null,
          width: it.width !== undefined ? Number(it.width) : 0,
          length: it.length !== undefined ? Number(it.length) : 0,
          thickness: it.thickness !== undefined ? Number(it.thickness) : 0,
          quantity: it.quantity !== undefined ? Number(it.quantity) : 0,
          unit_price: it.unit_price !== undefined ? Number(it.unit_price) : 0,
          subtotal: it.subtotal !== undefined ? Number(it.subtotal) : 0,
        }))
      };

      // Remove nullable fields that are explicitly null to avoid strict backend validation
      if (payload.order_id === null) delete payload.order_id;
      if (payload.customer_id === null) delete payload.customer_id;

      const response = await axiosInstance.post('/invoice', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء الفاتورة' };
    }
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    try {
      // Coerce numeric fields and strip nulls
      const payload = {
        ...invoiceData,
        order_id: invoiceData.order_id ? Number(invoiceData.order_id) : null,
        customer_id: invoiceData.customer_id ? Number(invoiceData.customer_id) : null,
        total_amount: invoiceData.total_amount !== undefined ? Number(invoiceData.total_amount) : undefined,
        discount: invoiceData.discount !== undefined ? Number(invoiceData.discount) : undefined,
        paid_amount: invoiceData.paid_amount !== undefined ? Number(invoiceData.paid_amount) : undefined,
        items: (invoiceData.items || []).map((it) => ({
          ...it,
          color_id: it.color_id ? Number(it.color_id) : null,
          batch_id: it.batch_id ? Number(it.batch_id) : null,
          width: it.width !== undefined ? Number(it.width) : 0,
          length: it.length !== undefined ? Number(it.length) : 0,
          thickness: it.thickness !== undefined ? Number(it.thickness) : 0,
          quantity: it.quantity !== undefined ? Number(it.quantity) : 0,
          unit_price: it.unit_price !== undefined ? Number(it.unit_price) : 0,
          subtotal: it.subtotal !== undefined ? Number(it.subtotal) : 0,
        }))
      };

      // Remove nullable fields that are explicitly null to avoid strict backend validation
      if (payload.order_id === null) delete payload.order_id;
      if (payload.customer_id === null) delete payload.customer_id;

      const response = await axiosInstance.put(`/invoice/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث الفاتورة' };
    }
  },

  // Delete invoice
  deleteInvoice: async (id, deleteData = {}) => {
    try {
      const response = await axiosInstance.delete(`/invoice/${id}`, { data: deleteData });
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
  },

  // Helper function to extract invoice items
  getInvoiceItems: (invoice) => {
    return invoice?.invoiceItems || [];
  },

  // Helper function to get customer from invoice
  getCustomerFromInvoice: (invoice) => {
    return invoice?.customer || null;
  },

  // Helper function to get user from invoice
  getUserFromInvoice: (invoice) => {
    return invoice?.user || null;
  },

  // Helper function to get batch details
  getBatchDetails: (invoiceItem) => {
    return invoiceItem?.batch || null;
  },

  // Helper function to get color details
  getColorDetails: (invoiceItem) => {
    return invoiceItem?.color || null;
  },

  // Helper function to get ruler details from color
  getRulerFromColor: (color) => {
    return color?.ruler || null;
  },

  // Helper function to get material details from ruler
  getMaterialFromRuler: (ruler) => {
    return ruler?.material || null;
  }
};