// Replace with your computer's local IP address if running on a physical device
// e.g., 'http://192.168.1.35:3000'
// For Android Emulator, use 'http://10.0.2.2:3000'
// For iOS Simulator, 'http://localhost:3000' works using localhost

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://linkflow-server-uask.onrender.com";

export default {
  API_URL,
};
