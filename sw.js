/* 급할때.tools 서비스워커 — 정적 파일 캐싱(오프라인 동작) */
const CACHE = "qt-v7";
const ASSETS = [
  "index.html", "char-counter.html", "age-calculator.html", "salary-calculator.html",
  "area-converter.html", "bmi-calculator.html", "password-generator.html",
  "image-tool.html", "pdf-tool.html", "pdf-lib.min.js",
  "unit-converter.html", "percent-calculator.html", "dutchpay-calculator.html", "lotto-generator.html",
  "blog.html", "blog-salary.html", "blog-pyeong.html", "blog-image.html",
  "about.html", "privacy.html", "style.css", "common.js", "ads.js", "manifest.json",
  "favicon.svg", "icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("index.html"))
    )
  );
});
