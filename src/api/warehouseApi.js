// src\api\warehouseApi.js
/**
 * Warehouse Movement API
 * Handles warehouse movement operations for warehouse keepers
 */

import { getApiData } from "../utils/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

class WarehouseApi {
  // Get all warehouse movements
  async getWarehouseMovements(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);

      const url = `${API_BASE_URL}/warehouse-movement${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch warehouse movements');
      }

      return data;
    } catch (error) {
      console.error('Error fetching warehouse movements:', error);
      throw error;
    }
  }

  // Get warehouse movement by ID
  async getWarehouseMovementById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/warehouse-movement/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch warehouse movement');
      }

      return data;
    } catch (error) {
      console.error('Error fetching warehouse movement:', error);
      throw error;
    }
  }

  // Create new warehouse movement
  async createWarehouseMovement(movementData) {
    try {
      const response = await fetch(`${API_BASE_URL}/warehouse-movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(movementData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create warehouse movement');
      }

      return data;
    } catch (error) {
      console.error('Error creating warehouse movement:', error);
      throw error;
    }
  }

  // Update warehouse movement
  async updateWarehouseMovement(id, movementData) {
    try {
      const response = await fetch(`${API_BASE_URL}/warehouse-movement/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(movementData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update warehouse movement');
      }

      return data;
    } catch (error) {
      console.error('Error updating warehouse movement:', error);
      throw error;
    }
  }

  // Delete warehouse movements
  async deleteWarehouseMovements(ids) {
    try {
      const response = await fetch(`${API_BASE_URL}/warehouse-movement/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ ids })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete warehouse movements');
      }

      return data;
    } catch (error) {
      console.error('Error deleting warehouse movements:', error);
      throw error;
    }
  }

  // Get pending/completed orders for warehouse input
  async getWarehouseOrders(params = {}) {
    try {
      return {
        success: true,
        message: "لا يوجد endpoint للطلبات في هذا السيرفر (تم الاعتماد على السوكيت)",
        data: []
      };
    } catch (error) {
      console.error('Error fetching warehouse orders:', error);
      throw error;
    }
  }

  // Get production order items for warehouse processing
  async getProductionOrderItems(orderId) {
    try {
      // مطابق للـ endpoint: GET {{autolocal}}/production-orders/:id/items
      const response = await fetch(`${API_BASE_URL}/production-orders/${orderId}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch production order items');
      }

      return data;
    } catch (error) {
      console.error('Error fetching production order items:', error);
      throw error;
    }
  }
}

export const warehouseApi = new WarehouseApi();