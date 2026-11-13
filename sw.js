self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // Mantém o app elegível para instalação nativa
});
