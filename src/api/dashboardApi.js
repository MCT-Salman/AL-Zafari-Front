import axiosInstance from "./axiosConfig";
import { handleApiError } from "../utils/errorHandler";

export const dashboardApi = {
  getStats: async (period = "month") => {
    try {
      const response = await axiosInstance.get(`/dashboard/stats?period=${period}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "فشل في تحميل إحصائيات لوحة التحكم");
    }
  },

  getMaterialColorStats: async (materialId, period = "month") => {
    try {
      const response = await axiosInstance.get(`/dashboard/stats/material/${materialId}?period=${period}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "فشل في تحميل إحصائيات الألوان حسب المادة");
    }
  },
};

