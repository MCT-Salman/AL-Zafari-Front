// src\api\batchApi.js
import axiosInstance from './axiosConfig';

export const batchApi = {
  // Batches CRUD
  getBatches: async () => {
    try {
      const response = await axiosInstance.get('/batch');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الطبخات' };
    }
  },

  getBatchById: async (id) => {
    try {
      const response = await axiosInstance.get(`/batch/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب الطبخة' };
    }
  },

  createBatch: async (data) => {
    try {
      const response = await axiosInstance.post('/batch', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء الطبخة' };
    }
  },

  updateBatch: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/batch/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث الطبخة' };
    }
  },

  deleteBatch: async (id) => {
    try {
      const response = await axiosInstance.delete(`/batch/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف الطبخة' };
    }
  },

  // Helper functions
  getBatchNumber: (batch) => {
    return batch?.batch_number || 'غير محدد';
  },

  getMaterialName: (batch) => {
    return batch?.material?.material_name || 'غير محدد';
  },

  getMaterialType: (batch) => {
    return batch?.material?.constant_value_unit || 'غير محدد';
  },

  formatEntryDate: (batch) => {
    if (!batch?.entry_date) return 'غير محدد';
    return new Date(batch.entry_date).toLocaleDateString('en-US', {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  formatMaterialDimensions: (batch) => {
    if (!batch?.material) return 'غير متوفر';

    const material = batch.material;
    const height = material.height?.label || material.height?.value;
    const width = material.width?.label || material.width?.value;
    const thickness = material.thickness?.label || material.thickness?.value;

    if (!height || !width || !thickness) return 'غير متوفر';

    return `${height} × ${width} × ${thickness}`;
  },

  formatBatchInfo: (batch) => {
    if (!batch) return 'غير محدد';

    const batchNumber = batch.batch_number || 'غير محدد';
    const materialName = batch.material?.material_name || 'غير محدد';
    const entryDate = batch.entry_date ? new Date(batch.entry_date).toLocaleDateString('ar-SA') : 'غير محدد';
    return `${batchNumber} - ${materialName} - ${entryDate}`;
  },

  generateBatchNumber: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}-${random}`;
  }
};
