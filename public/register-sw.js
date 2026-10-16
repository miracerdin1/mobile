// Registered on localhost too so Web Push can be tried in dev; sw.js itself
// skips caching there so a restarting Metro server is never masked by an old bundle.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker kaydedilemedi:", error);
    });
  });
}
