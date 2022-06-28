'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "ae44cfba99f99e1e9abe262f52af9818",
"index.html": "783c167d8d238028497ab8be528de5a8",
"/": "783c167d8d238028497ab8be528de5a8",
"styles.css": "8bdeefb87ca882d8f48f712db15f3adf",
"main.dart.js": "6f798f957370f408c321140944a07ea4",
"flutter.js": "eb2682e33f25cd8f1fc59011497c35f8",
"favicon.png": "faf5d90a9f58c162fa45f59f5acd8437",
"icons/Icon-192.png": "4675a24bab7248b88be6532c906f8e55",
"icons/Icon-maskable-192.png": "6fcc41fdc6573d1c71d22aa222d71236",
"icons/Icon-maskable-512.png": "7760b7a07a314efbf596e586a9302321",
"icons/Icon-512.png": "c8cf4e79532d11d9d64ff0ccfcf4cc65",
"manifest.json": "b23624951b059bcaa2bdd953d772f8bd",
"assets/images/map.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/waiter.webp": "7faac376dc7cb6cfbd6b899cb9a93626",
"assets/images/spices_map.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/tasty_meal.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/balanced_diet.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/local_restaurant.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/delivery_options.webp": "8217a2158dde05547ba3423d2717a28b",
"assets/images/time.webp": "b6aa1d77602f99cafc443ca1b4920e73",
"assets/images/logo/56x42.png": "04f7da4aca868da9b633c7a20710a411",
"assets/images/logo/96x72.png": "fabc7b8225f3932f4d105f569cff19f9",
"assets/images/rating.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/flour_and_ingredients.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/images/free_delivery.webp": "a176309e2f7eb51bfbb526b264c071ff",
"assets/AssetManifest.json": "27a66b1ad7e908ea005361a44f980cee",
"assets/NOTICES": "07ea92a878a00857724f16099fba1135",
"assets/FontManifest.json": "b3217ceb3e7230769237e634823d50f0",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/fonts/HelveticaNeue.ttf": "573fe5ac42329169d102ff00618e0a0a",
"assets/fonts/Skia.ttf": "7b2932a4b94d625bcdf9a342a45e659d",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/fonts/HelveticaNeue-Bold.ttf": "551d02a9272d5329a9a4409134c064be",
"canvaskit/canvaskit.js": "c2b4e5f3d7a3d82aed024e7249a78487",
"canvaskit/profiling/canvaskit.js": "ae2949af4efc61d28a4a80fffa1db900",
"canvaskit/profiling/canvaskit.wasm": "95e736ab31147d1b2c7b25f11d4c32cd",
"canvaskit/canvaskit.wasm": "4b83d89d9fecbea8ca46f2f760c5a9ba"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
