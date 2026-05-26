import axios from "axios";
import Config from "../constants/Config";

// Create a dedicated Axios instance
const apiClient = axios.create({
  baseURL: Config.API_URL,
});

// We need a way to trigger logout from the interceptor.
// Since interceptor is outside of React context, we can define a callback.
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Variable to prevent multiple logout calls in rapid succession
let isLoggingOut = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        console.log("[Axios Interceptor] 401/403 detected, logging out...");
        if (logoutCallback) {
          logoutCallback();
        }
        // Reset the flag after a short delay in case of multiple parallel failures
        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      }
    }

    // Handle Network Error (Render Cold Start)
    const originalRequest = error.config;
    if (
      !error.response &&
      (error.message === "Network Error" || error.code === "ECONNABORTED")
    ) {
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Retry up to 4 times (Total ~20s delay, enough for Render to wake up)
      if (originalRequest._retryCount < 4) {
        originalRequest._retryCount += 1;
        console.log(
          `[Axios] Sunucu uyaniyor olabilir. Yeniden deneniyor... (${originalRequest._retryCount}/4)`,
        );

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(apiClient(originalRequest));
          }, 5000); // 5 saniye bekle ve tekrar dene
        });
      }
    }

    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

export default apiClient;
