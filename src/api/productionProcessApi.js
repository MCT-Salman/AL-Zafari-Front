// src/api/productionProcessApi.js
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

class ProductionProcessApi {
  async getProcesses(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);
      const url = `${API_BASE_URL}/production-process${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch production processes");
      }
      return data;
    } catch (error) {
      console.error("Error fetching production processes:", error);
      throw error;
    }
  }

  async getProcessesByType(type, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);
      const url = `${API_BASE_URL}/production-process/type/${type}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch production processes");
      }
      return data;
    } catch (error) {
      console.error("Error fetching production processes by type:", error);
      throw error;
    }
  }

  async createProcess(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/production-process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create process");
      }
      return data;
    } catch (error) {
      console.error("Error creating process:", error);
      throw error;
    }
  }

  async updateProcess(id, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/production-process/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update process");
      }
      return data;
    } catch (error) {
      console.error("Error updating process:", error);
      throw error;
    }
  }

  async deleteProcess(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/production-process/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete process");
      }
      return data;
    } catch (error) {
      console.error("Error deleting process:", error);
      throw error;
    }
  }

  async deleteProcesses(ids = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/production-process/all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ ids })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete processes");
      }
      return data;
    } catch (error) {
      console.error("Error deleting processes:", error);
      throw error;
    }
  }
}

export const productionProcessApi = new ProductionProcessApi();
