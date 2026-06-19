// Service Worker 註冊 (客戶端)
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✓ SW registered:', registration.scope);

        // 檢查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              console.log('✓ New version available');
            }
          });
        });
      })
      .catch((error) => {
        console.error('✗ SW registration failed:', error);
      });
  });
}
