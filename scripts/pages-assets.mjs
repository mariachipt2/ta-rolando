import fs from "node:fs";
fs.cpSync("public/icons", "dist-pages/icons", { recursive: true });
fs.copyFileSync("public/offline.html", "dist-pages/offline.html");
fs.writeFileSync("dist-pages/.nojekyll", "");
fs.copyFileSync("dist-pages/index.html", "dist-pages/404.html");
fs.writeFileSync(
  "dist-pages/manifest.webmanifest",
  JSON.stringify({
    name: "Tá Rolando — Ipatinga",
    short_name: "Tá Rolando",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#0B0B12",
    theme_color: "#0B0B12",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }),
);
fs.writeFileSync(
  "dist-pages/sw.js",
  `const CACHE='ta-rolando-pages-v2';self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./offline.html','./icons/icon-192.png'])));self.skipWaiting()});self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ta-rolando-pages-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET')return;if(u.pathname.includes('/assets/')||u.pathname.includes('/icons/')){e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request);if(cached)return cached;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}));return}if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match('./offline.html')))});`,
);
