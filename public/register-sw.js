// Skip on localhost: the SW's cache-on-fetch-failure fallback otherwise masks a
// broken/restarting Metro dev server by silently serving yesterday's bundle,
// making code changes look like they never landed.
var isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);

if ("serviceWorker" in navigator && !isLocalDev) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker kaydedilemedi:", error);
    });
  });
} else if ("serviceWorker" in navigator && isLocalDev) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
