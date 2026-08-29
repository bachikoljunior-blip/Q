'use strict';

(async () => {
  for (const src of ['./app-core.js', './app-audit.js', './app-ui.js']) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
})().catch(error => {
  console.error(error);
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = '監査機能を読み込めませんでした。再読み込みしてください。';
    toast.classList.add('show');
  }
});
