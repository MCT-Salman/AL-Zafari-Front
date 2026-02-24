// src\api\colorApi.js
import axiosInstance from './axiosConfig';

export const colorApi = {
  // Colors CRUD
  getColors: async () => {
    try {
      const response = await axiosInstance.get('/color');
      // The API returns { success: true, message: "...", data: [...], total: X }
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

  getColorsByRuler: async (rulerId) => {
    try {
      const response = await axiosInstance.get(`/color/ruler/${rulerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب ألوان المسطرة' };
    }
  },

  createColor: async (data) => {
    try {
      // Data is FormData
      const response = await axiosInstance.post('/color', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء اللون' };
    }
  },

  updateColor: async (id, data) => {
    try {
      // Data is FormData
      const response = await axiosInstance.put(`/color/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
    // New structure: color.ruler.material.material_name
    return color?.ruler?.material?.material_name || color?.material?.material_name || 'غير محدد';
  },

  getRulerName: (color) => {
    return color?.ruler?.ruler_name || 'غير محدد';
  },

  getPricesCount: (color) => {
    return color?.prices?.length || 0;
  },

  getRulersCount: (color) => {
    // Colors are now linked to one ruler
    return color?.ruler ? 1 : 0;
  },

  formatColorInfo: (color) => {
    if (!color) return 'غير محدد';

    const name = color.color_name || 'غير محدد';
    const code = color.color_code || 'غير محدد';
    const ruler = color.ruler?.ruler_name || 'غير محدد';
    return `${name} (${code}) - ${ruler}`;
  }
};
