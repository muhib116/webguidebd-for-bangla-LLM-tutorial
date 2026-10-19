/* WebGuideBD AI Academy service worker — placeholders replaced by PHP. */
/* eslint-disable no-restricted-globals */
(function () {
  'use strict';

  var CACHE = 'wgba-shell-__WGBA_CACHE_VERSION__';
  var OFFLINE = '__WGBA_OFFLINE_URL__';
  var PRECACHE = __WGBA_PRECACHE__;

  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(CACHE).then(function (cache) {
        return cache.addAll(PRECACHE).catch(function () {
          // Partial precache is fine — runtime will fill gaps.
          return Promise.all(
            PRECACHE.map(function (url) {
              return cache.add(url).catch(function () { return null; });
            })
          );
        });
      }).then(function () {
        return self.skipWaiting();
      })
    );
  });

  self.addEventListener('activate', function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key.indexOf('wgba-') === 0 && key !== CACHE) {
              return caches.delete(key);
            }
            return null;
          })
        );
      }).then(function () {
        return self.clients.claim();
      })
    );
  });

  function isBypass(url) {
    if (url.searchParams.has('wgba_bypass_sw')) return true;
    var path = url.pathname;
    if (path.indexOf('/wp-admin') === 0) return true;
    if (path.indexOf('/wp-login.php') === 0) return true;
    if (path.indexOf('/wp-json/') === 0) return true;
    if (path.indexOf('/wp-cron.php') === 0) return true;
    if (path.indexOf('admin-ajax.php') !== -1) return true;
    return false;
  }

  function isStaticAsset(url) {
    return /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)(?:\?|$)/i.test(url.pathname + url.search)
      || url.pathname.indexOf('/wp-content/plugins/webguidebd-ai-academy/') !== -1;
  }

  self.addEventListener('fetch', function (event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url;
    try {
      url = new URL(req.url);
    } catch (e) {
      return;
    }
    if (url.origin !== self.location.origin) return;
    if (isBypass(url)) return;

    // Navigations: network-first, offline fallback.
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req)
          .then(function (res) {
            if (res && res.ok) {
              var copy = res.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(req, copy);
              });
            }
            return res;
          })
          .catch(function () {
            return caches.match(req).then(function (cached) {
              return cached || caches.match(OFFLINE);
            });
          })
      );
      return;
    }

    // Same-origin academy assets: stale-while-revalidate.
    if (isStaticAsset(url)) {
      event.respondWith(
        caches.open(CACHE).then(function (cache) {
          return cache.match(req).then(function (cached) {
            var network = fetch(req).then(function (res) {
              if (res && res.ok) {
                cache.put(req, res.clone());
              }
              return res;
            }).catch(function () {
              return cached;
            });
            return cached || network;
          });
        })
      );
    }
  });

  self.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'WGBA_SKIP_WAITING') {
      self.skipWaiting();
    }
  });
})();
