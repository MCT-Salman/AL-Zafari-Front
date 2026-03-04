// src/api/customerApi.js
import axiosInstance from "./axiosConfig";

export const customerApi = {
  // Get all customers
  getCustomers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/customer', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب العملاء' };
    }
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    try {
      const response = await axiosInstance.get(`/customer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب العميل' };
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post('/customer', customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء العميل' };
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    try {
      const response = await axiosInstance.put(`/customer/${id}`, customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث العميل' };
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      const response = await axiosInstance.delete(`/customer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف العميل' };
    }
  },

  // Helper functions
  getCustomerName: (customer) => {
    return customer?.name || 'غير محدد';
  },

  getCustomerPhone: (customer) => {
    return customer?.phone || 'غير محدد';
  },

  getCustomerCity: (customer) => {
    return customer?.city || 'غير محدد';
  },

  getCustomerAddress: (customer) => {
    return customer?.address || 'غير محدد';
  },

  formatPhoneNumber(phone) {
    if (!phone || phone === 'غير محدد') return 'غير محدد';
    // استخدام حرف التحكم في الاتجاه بدلاً من HTML
    return `\u202A${phone}\u202C`; // يخفي الوسوم ويعرض الرقم فقط
  },

  formatCustomerInfo: (customer) => {
    if (!customer) return 'غير محدد';
    
    const name = customer.name || 'غير محدد';
    const phone = customer.phone || 'غير محدد';
    const city = customer.city || 'غير محدد';
    const formattedPhone = phone !== 'غير محدد' ? customerApi.formatPhoneNumber(phone) : phone;
    return `${name} - ${formattedPhone} (${city})`;
  },

  formatCustomerDisplay: (customer) => {
    if (!customer) return 'غير محدد';
    
    const name = customer.name || 'غير محدد';
    const phone = customer.phone || 'غير محدد';
    const formattedPhone = phone !== 'غير محدد' ? customerApi.formatPhoneNumber(phone) : phone;
    return `${name} (${formattedPhone})`;
  }
};
