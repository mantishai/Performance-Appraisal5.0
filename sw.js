const CACHE_NAME = `hrms-cache-v1.0.0-${new Date().toISOString().split('T')[0]}`;
const APP_VERSION = '1.0.0';

const CDN_ASSETS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] 缓存首页');
        return cache.add('/index.html');
      })
      .then(() => {
        console.log('[ServiceWorker] 安装完成');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] 激活中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('hrms-cache')) {
            console.log('[ServiceWorker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] 激活完成');
      return self.clients.claim();
    })
  );
});

const CACHE_STRATEGIES = {
  networkFirst(request) {
    return fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('网络错误', { status: 408 });
        });
      });
  },
  
  cacheFirst(request) {
    return caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      });
      
      return cachedResponse || fetchPromise;
    });
  },
  
  networkOnly(request) {
    return fetch(request);
  },
  
  cacheOnly(request) {
    return caches.match(request);
  }
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  if (!request.url.startsWith('http')) {
    return;
  }

  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    event.respondWith(
      fetch(request).catch(async (error) => {
        console.log('[ServiceWorker] 网络失败，存储离线数据');
        await storeOfflineData({
          id: Date.now().toString(),
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: await request.clone().text(),
          timestamp: Date.now()
        });
        
        return new Response(JSON.stringify({ 
          code: 202, 
          message: '操作已缓存，将在网络恢复后同步' 
        }), { status: 202 });
      })
    );
    return;
  }
  
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  if (CDN_ASSETS.some(domain => url.origin.includes(domain))) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }
  
  if (request.destination === 'document') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  if (request.destination === 'script') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  if (['style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  event.respondWith(CACHE_STRATEGIES.networkFirst(request));
});

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: APP_VERSION });
      break;
    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'SYNC_OFFLINE':
      event.waitUntil(syncOfflineData());
      break;
  }
});

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] 收到推送通知');
  
  const options = {
    body: event.data?.text() || '新消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/'
    },
    actions: [
      { action: 'open', title: '查看' },
      { action: 'dismiss', title: '关闭' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HRMS 通知', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] 通知被点击:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] 后台同步:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  console.log('[ServiceWorker] 同步离线数据中...');
  
  try {
    const db = await openIndexedDB();
    const offlineData = await getOfflineData(db);
    
    for (const data of offlineData) {
      try {
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        if (response.ok) {
          await removeOfflineData(db, data.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] 同步失败:', error);
      }
    }
    
    console.log('[ServiceWorker] 离线数据同步完成');
  } catch (error) {
    console.error('[ServiceWorker] 同步出错:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HRMS-Offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id' });
      }
    };
  });
}

function getOfflineData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offline-data', 'readonly');
    const store = transaction.objectStore('offline-data');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function removeOfflineData(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offline-data', 'readwrite');
    const store = transaction.objectStore('offline-data');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function storeOfflineData(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HRMS-Offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('offline-data', 'readwrite');
      const store = transaction.objectStore('offline-data');
      const putRequest = store.put(data);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id' });
      }
    };
  });
}