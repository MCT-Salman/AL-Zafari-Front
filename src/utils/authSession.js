const LOGOUT_FLAG_KEY = "app:isLoggingOut";

export const setLoggingOutFlag = (value) => {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(LOGOUT_FLAG_KEY, "1");
    return;
  }
  window.sessionStorage.removeItem(LOGOUT_FLAG_KEY);
};

export const isLoggingOut = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(LOGOUT_FLAG_KEY) === "1";
};
