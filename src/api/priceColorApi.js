// src\api\priceColorApi.js
import axiosInstance from './axiosConfig';

export const priceColorApi = {
  // Price Colors CRUD
  getPriceColors: async () => {
    try {
      const response = await axiosInstance.get('/price-color');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب أسعار الألوان' };
    }
  },

  getPriceColorById: async (id) => {
    try {
      const response = await axiosInstance.get(`/price-color/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب سعر اللون' };
    }
  },

  createPriceColor: async (data) => {
    try {
      const response = await axiosInstance.post('/price-color', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء سعر اللون' };
    }
  },

  updatePriceColor: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/price-color/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث سعر اللون' };
    }
  },

  deletePriceColor: async (id) => {
    try {
      const response = await axiosInstance.delete(`/price-color/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف سعر اللون' };
    }
  },

  // Helper functions
  getColorName: (priceColor) => {
    return priceColor?.color?.color_name || 'غير محدد';
  },

  getColorCode: (priceColor) => {
    return priceColor?.color?.color_code || 'غير محدد';
  },

  getMaterialName: (priceColor) => {
    return priceColor?.color?.material?.material_name || 'غير محدد';
  },

  getConstantValue: (priceColor) => {
    return priceColor?.constant_value?.value || 'غير محدد';
  },

  getConstantValueType: (priceColor) => {
    return priceColor?.constant_value?.type?.constants_Type_name || 'غير محدد';
  },

  formatPriceInfo: (priceColor) => {
    if (!priceColor) return 'غير محدد';
    
    const colorName = priceColor.color?.color_name || 'غير محدد';
    const materialName = priceColor.color?.material?.material_name || 'غير محدد';
    const constantValue = priceColor.constant_value?.value || 'غير محدد';
    const price = priceColor.price_per_meter || '0';
    return `${colorName} - ${materialName} - ${constantValue}: ${price}`;
  },

  formatPriceDisplay: (priceColor) => {
    if (!priceColor) return '0 لكل غير محدد';
    
    const price = priceColor.price_per_meter || '0';
    const constantValue = priceColor.constant_value?.value || 'غير محدد';
    return `${price} لكل ${constantValue}`;
  }
};
