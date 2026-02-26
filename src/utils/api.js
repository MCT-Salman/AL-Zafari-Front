// src/utils/api.js
export const getApiData = (response, fallback = null) => {
  if (response === null || response === undefined) return fallback;
  if (response.data !== undefined) return response.data;
  return response;
};

export const getApiMessage = (response, fallback = "") => {
  return response?.message || fallback;
};

export const getApiSuccess = (response) => {
  return Boolean(response?.success);
};
