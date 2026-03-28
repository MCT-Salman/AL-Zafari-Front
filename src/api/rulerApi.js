// src\api\rulerApi.js
import axiosInstance from './axiosConfig';
import { handleApiError } from "../utils/errorHandler";

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
      throw error.response?.data || { message: 'حدث خطأ في جلب مساطر المادة' };
    }
  },

  // Helper functions
  getRulerType: (ruler) => {
    return ruler?.ruler_type || 'غير محدد';
  },

  getMaterialName: (ruler) => {
    return ruler?.material?.material_name || 'غير محدد';
  },

  getColorName: (ruler) => {
    return ruler?.color?.color_name || 'غير محدد';
  },

  getColorCode: (ruler) => {
    return ruler?.color?.color_code || 'غير محدد';
  },

  formatMaterialDimensions: (ruler) => {
    if (!ruler?.material) return 'غير متوفر';
    
    const material = ruler.material;
    const height = material.height?.label || material.height?.value;
    const width = material.width?.label || material.width?.value;
    const thickness = material.thickness?.label || material.thickness?.value;
    
    if (!height || !width || !thickness) return 'غير متوفر';
    
    return `${height} × ${width} × ${thickness}`;
  },

  formatRulerInfo: (ruler) => {
    if (!ruler) return 'غير محدد';
    
    const type = ruler.ruler_type || 'غير محدد';
    const materialName = ruler.material?.material_name || 'غير محدد';
    const colorName = ruler.color?.color_name || 'غير محدد';
    const colorCode = ruler.color?.color_code || 'غير محدد';
    return `${type} - ${materialName} - ${colorName} (${colorCode})`;
  }
};
