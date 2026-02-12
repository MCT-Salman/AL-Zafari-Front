// src\api\colorApi.js
import axiosInstance from './axiosConfig';

export const colorApi = {
  // Colors CRUD
  getColors: async () => {
    try {
      const response = await axiosInstance.get('/color');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الألوان' };
    }
  },

  getColorById: async (id) => {
    try {
      const response = await axiosInstance.get(`/color/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب اللون' };
    }
  },

  createColor: async (data) => {
    try {
      const response = await axiosInstance.post('/color', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء اللون' };
    }
  },

  updateColor: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/color/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث اللون' };
    }
  },

  deleteColor: async (id) => {
    try {
      const response = await axiosInstance.delete(`/color/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف اللون' };
    }
  },

  // Helper functions
  getColorDisplayName: (color) => {
    return color?.color_name || 'غير محدد';
  },

  getColorCode: (color) => {
    return color?.color_code || 'غير محدد';
  },

  getMaterialName: (color) => {
    return color?.material?.material_name || 'غير محدد';
  },

  getPricesCount: (color) => {
    return color?.prices?.length || 0;
  },

  getRulersCount: (color) => {
    return color?.rulers?.length || 0;
  },

  formatColorInfo: (color) => {
    if (!color) return 'غير محدد';
    
    const name = color.color_name || 'غير محدد';
    const code = color.color_code || 'غير محدد';
    const material = color.material?.material_name || 'غير محدد';
    return `${name} (${code}) - ${material}`;
  }
};
