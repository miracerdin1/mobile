// Replace with your computer's local IP address if running on a physical device
// e.g., 'http://192.168.1.35:3000'
// For Android Emulator, use 'http://10.0.2.2:3000'
// For iOS Simulator, 'http://localhost:3000' works using localhost

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://linkflow-server-uask.onrender.com";
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
const REVENUECAT_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "pro";

export default {
  API_URL,
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_IOS_API_KEY,
};
