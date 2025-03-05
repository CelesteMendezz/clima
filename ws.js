const CACHE_NAME = 'mi-cache-v1';
const API_CACHE_NAME = 'clima-cache'; 

self.addEventListener('install', event => {
    console.log('Service Worker: Instalado');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                "./",
                "./index.html",
                "./404.html",
                "./js/app.js",
                "./css/style.css",
                "./manifest.json",
                "./images/cap1.png",
                "./images/cap2.png",
                "./images/icon1.png",
                "./images/icon2.png",
                "./images/cargando.png",
                "./images/clouds.png",
                "./images/fog.png",
                "./images/mapa.png",
                "./images/rainy.png",
                "./images/snow.png",
                "./images/storm.png",
                "./images/sun.png",
                "./images/wind.png",
                "./ws.js"
            ]);
        })
    );
});


self.addEventListener('activate', event => {
    console.log('Service Worker: Activado');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});


self.addEventListener('fetch', event => {
    const url = event.request.url;

    if (url.includes('api.openweathermap.org')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    return caches.open(API_CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => caches.match(event.request)) 
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
                .catch(() => caches.match('/404.html'))
        );
    }
});


self.addEventListener ('sync',event => {
    if (event.tag === 'sincronizar-datos') 
    {
      event.waitUntil(
        console.log('Service Worker: Sincronizando datos')
      );
    }
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification("Clima App", {
            body: "Actualiza el clima en tu ciudad",
            icon: "./images/icon1.png"
        });
    }
});