// src\api\rulerApi.js
import axiosInstance from './axiosConfig';

export const rulerApi = {
  // Rulers CRUD
  getRulers: async () => {
    try {
      const response = await axiosInstance.get('/ruler');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المساطر' };
    }
  },

  getRulerById: async (id) => {
    try {
      const response = await axiosInstance.get(`/ruler/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المسطرة' };
    }
  },

  createRuler: async (data) => {
    try {
      const response = await axiosInstance.post('/ruler', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء المسطرة' };
    }
  },

  updateRuler: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/ruler/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث المسطرة' };
    }
  },

  deleteRuler: async (id) => {
    try {
      const response = await axiosInstance.delete(`/ruler/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف المسطرة' };
    }
  },

  getRulersByMaterial: async (materialId) => {
    try {
      const response = await axiosInstance.get(`/ruler/material/${materialId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المساطر' };
    }
  },

  // Helper functions
  getRulerName: (ruler) => {
    return ruler?.ruler_name || 'غير محدد';
  },

  getMaterialName: (ruler) => {
    return ruler?.material?.material_name || 'غير محدد';
  },

  formatRulerInfo: (ruler) => {
    if (!ruler) return 'غير محدد';
    
    const name = ruler.ruler_name || 'غير محدد';
    const materialName = ruler.material?.material_name || 'غير محدد';
    return `${name} - ${materialName}`;
  }
};
