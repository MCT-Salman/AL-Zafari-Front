// src/api/salesApi.js
import axiosInstance from "./axiosConfig";
import { handleApiError } from "../utils/errorHandler";

export const salesApi = {
  // Get all sales orders
  getSalesOrders: async (params = {}) => {
    try {
      const response = await axiosInstance.get("/sales-order", { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في جلب طلبات المبيعات");
    }
  },

  // Get sales order by ID
  getSalesOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/sales-order/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في جلب طلب المبيعات");
    }
  },

  // Create new sales order
  createSalesOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post("/sales-order", orderData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في إنشاء طلب المبيعات");
    }
  },

  // Update sales order
  updateSalesOrder: async (id, orderData) => {
    try {
      const response = await axiosInstance.put(`/sales-order/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في تحديث طلب المبيعات");
    }
  },

  // Delete sales order
  deleteSalesOrder: async (id) => {
    try {
      const response = await axiosInstance.delete(`/sales-order/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في حذف طلب المبيعات");
    }
  },

  // Delete multiple sales orders
  deleteMultipleSalesOrders: async (orderIds) => {
    try {
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error("يجب تحديد طلب واحد على الأقل");
      }

      const numericIds = orderIds
        .map((id) => parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (numericIds.length === 0) {
        throw new Error("لم يتم العثور على معرفات طلبات صالحة");
      }

      const response = await axiosInstance.delete("/sales-order/all", {
        data: { ids: numericIds }
      });

      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في حذف طلبات المبيعات");
    }
  },

  // Get sales order item by ID
  getSalesOrderItemById: async (itemId) => {
    try {
      const response = await axiosInstance.get(`/sales-order/item/${itemId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في جلب عنصر طلب المبيعات");
    }
  },

  // Add item to sales order
  addSalesOrderItem: async (orderId, itemData) => {
    try {
      const response = await axiosInstance.post(`/sales-order/${orderId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في إضافة عنصر طلب المبيعات");
    }
  },

  // Update sales order item
  updateSalesOrderItem: async (itemId, itemData) => {
    try {
      const response = await axiosInstance.put(`/sales-order/item/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في تحديث عنصر طلب المبيعات");
    }
  },

  // Update sales order item status
  updateSalesOrderItemStatus: async (itemId, status) => {
    try {
      const response = await axiosInstance.patch(`/sales-order/item/${itemId}`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في تحديث حالة عنصر طلب المبيعات");
    }
  },

  // Delete sales order item
  deleteSalesOrderItem: async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/sales-order/item/${itemId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "حدث خطأ في حذف عنصر طلب المبيعات");
    }
  },

  // Helper functions
  getSalesOrderStatus: (order) => {
    return order?.status || "غير محدد";
  },

  getIssuedBy: (order) => {
    return order?.issued_by?.full_name || order?.issued_by?.username || "غير محدد";
  },

  getItemCount: (order) => {
    return order?.items?.length || 0;
  },

  getFormattedDate: (order) => {
    if (!order?.created_at) return "غير محدد";
    return new Date(order.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  formatSalesOrderInfo: (order) => {
    if (!order) return "غير محدد";
    const orderId = order.Sales_order_id || order.sales_order_id || "غير محدد";
    const issuedBy = order.issued_by?.full_name || order.issued_by?.username || "غير محدد";
    const status = order.status || "غير محدد";
    const itemCount = order.items?.length || 0;
    return `طلب #${orderId} - ${issuedBy} - ${status} - عناصر: ${itemCount}`;
  },

  getStatusBadge: (status) => {
    const statusMap = {
      pending: { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" },
      preparing: { label: "قيد التحضير", className: "bg-blue-100 text-blue-800" },
      completed: { label: "مكتمل", className: "bg-green-100 text-green-800" },
      canceled: { label: "ملغي", className: "bg-red-100 text-red-800" }
    };
    return statusMap[status] || { label: status || "غير محدد", className: "bg-gray-100 text-gray-800" };
  },

  // Format item data for QR code
  formatItemForQR: (item) => {
    return {
      colorCode: item.color?.color_code || item.color_code || "",
      colorName: item.color?.color_name || item.color_name || "",
      typeItem: item.type_item || "",
      batchNumber: item.batch?.batch_number || item.batch_number || "",
      quantity: item.quantity || "",
      width: item.width || "",
      thickness: item.thickness || ""
    };
  }
};
