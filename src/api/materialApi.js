// src\api\materialApi.js
import axiosInstance from './axiosConfig';

export const materialApi = {
  // Materials CRUD
  getMaterials: async () => {
    try {
      const response = await axiosInstance.get('/material');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المواد' };
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await axiosInstance.get(`/material/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المادة' };
    }
  },

  createMaterial: async (data) => {
    try {
      const response = await axiosInstance.post('/material', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء المادة' };
    }
  },

  updateMaterial: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/material/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث المادة' };
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await axiosInstance.delete(`/material/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف المادة' };
    }
  },

  // Helper function to get constant values for dropdowns
  getConstantValuesByType: async (typeId) => {
    try {
      const response = await axiosInstance.get(`/constant-value/by-type/${typeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب القيم الثابتة' };
    }
  },

  // Helper function to format material dimensions
  formatDimensions: (material) => {
    if (!material.height || !material.width || !material.thickness) {
      return 'غير متوفر';
    }
    
    const height = material.height.label || material.height.value;
    const width = material.width.label || material.width.value;
    const thickness = material.thickness.label || material.thickness.value;
    
    return `${height} × ${width} × ${thickness}`;
  },

  // Helper function to get material display name
  getMaterialDisplayName: (material) => {
    return material.material_name || 'غير محدد';
  },

  // Helper function to get material type display
  getMaterialTypeDisplay: (material) => {
    return material.type || 'غير محدد';
  },

  // Helper function to get colors count
  getColorsCount: (material) => {
    return material.colors?.length || 0;
  },

  // Helper function to get batches count
  getBatchesCount: (material) => {
    return material.batches?.length || 0;
  }
};
