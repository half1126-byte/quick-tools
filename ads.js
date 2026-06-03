/* 급할때.tools — 수익화 시스템 (애드센스 · 카카오 애드핏 · 쿠팡 파트너스 · 후원)
   ─────────────────────────────────────────────────────────────────────
   · 각 네트워크 승인/가입 후 아래 CONFIG에서 enabled:true + ID만 채우면 전 페이지 자동 적용.
   · 동의(consent) 배너: 광고 네트워크가 켜져 있으면, 사용자가 동의하기 전엔 광고를 부르지 않습니다.
     거부 시 애드센스는 비개인화(NPA) 광고로 게재합니다. (PIPA/GDPR 대비)
   · 광고 슬롯에는 "광고" 라벨을 붙여 콘텐츠와 구분합니다(정책 준수).
   · 지연 로딩: 화면에 보일 때만 광고를 렌더링해 페이지 속도를 지킵니다.
   · 안전장치: localhost·127.0.0.1·file:// (미리보기)에서는 광고를 호출하지 않습니다.            */
(function () {
  var CFG = {
    /* 1) 구글 애드센스 — 승인 후 */
    adsense: {
      enabled: false,
      client: "ca-pub-0000000000000000", // 게시자 ID
      slot:   "0000000000"               // 광고 단위 슬롯 ID (자동광고만 쓰면 비워도 됨)
    },
    /* 2) 카카오 애드핏 — 승인 후 (반응형: 모바일/PC 단위 분리) */
    adfit: {
      enabled: false,
      pc:     { unit: "DAN-0000000000000000", w: 728, h: 90 },
      mobile: { unit: "DAN-0000000000000000", w: 320, h: 100 }
    },
    /* 3) 쿠팡 파트너스 — 가입 후 (대시보드 '배너 만들기'에서 발급) */
    coupang: {
      enabled: false,
      id: 0, template: "carousel", trackingCode: "",
      width: "100%", height: 140, subId: null
    },
    /* 4) 후원 버튼 — 즉시 가능. url 한 줄만 넣으면 전 페이지 푸터에 노출 */
    support: {
      enabled: true,
      label: "☕ 커피 한 잔 후원",
      url: "" // 예) Toss "https://toss.me/내아이디"  ·  BMC "https://buymeacoffee.com/내아이디"
    },
    /* 동의 배너 사용 여부 (한국·EEA 대비 권장) */
    consent: { enabled: true }
  };

  var ORDER = ["adsense", "adfit", "coupang"]; // 슬롯 data-ad 로 개별 지정 가능
  var host = location.hostname;
  var isPreview = host === "localhost" || host === "127.0.0.1" || location.protocol === "file:";

  function anyAdEnabled() { for (var i = 0; i < ORDER.length; i++) if (CFG[ORDER[i]].enabled) return true; return false; }
  function getConsent() { try { return localStorage.getItem("qt-consent"); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem("qt-consent", v); } catch (e) {} }

  function loadScript(src, attrs) {
    if (document.querySelector('script[data-qt="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src; s.async = true; s.dataset.qt = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  function pickNetwork(slot) {
    var want = slot.getAttribute("data-ad");
    if (want && CFG[want] && CFG[want].enabled) return want;
    for (var i = 0; i < ORDER.length; i++) if (CFG[ORDER[i]].enabled) return ORDER[i];
    return null;
  }

  function markFilled(slot) {
    slot.classList.add("filled");
    slot.innerHTML = "";
    var lbl = document.createElement("div");
    lbl.className = "ad-label"; lbl.textContent = "광고";
    slot.appendChild(lbl);
    return slot;
  }

  /* ---- 네트워크별 렌더 ---- */
  var adsenseReady = false;
  function setupAdsense() {
    if (adsenseReady) return;
    adsenseReady = true;
    window.adsbygoogle = window.adsbygoogle || [];
    if (getConsent() === "denied") { try { window.adsbygoogle.requestNonPersonalizedAds = 1; } catch (e) {} }
    if (!document.querySelector('meta[name="google-adsense-account"]')) {
      var meta = document.createElement("meta");
      meta.name = "google-adsense-account"; meta.content = CFG.adsense.client;
      document.head.appendChild(meta);
    }
    loadScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CFG.adsense.client,
               { crossorigin: "anonymous" });
  }
  function renderAdsense(slot) {
    setupAdsense();
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block"; ins.style.width = "100%"; ins.style.minHeight = "90px";
    ins.setAttribute("data-ad-client", CFG.adsense.client);
    if (CFG.adsense.slot) ins.setAttribute("data-ad-slot", CFG.adsense.slot);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    slot.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
  function renderAdfit(slot) {
    var m = window.matchMedia("(max-width:520px)").matches ? CFG.adfit.mobile : CFG.adfit.pc;
    var ins = document.createElement("ins");
    ins.className = "kakao_ad_area"; ins.style.display = "none";
    ins.setAttribute("data-ad-unit", m.unit);
    ins.setAttribute("data-ad-width", m.w);
    ins.setAttribute("data-ad-height", m.h);
    slot.appendChild(ins);
    loadScript("https://t1.daumcdn.net/kas/static/ba.min.js");
  }
  function renderCoupang(slot) {
    var box = document.createElement("div");
    box.id = "coupang-" + Math.floor(Math.random() * 1e9).toString(36);
    slot.appendChild(box);
    var note = document.createElement("div");
    note.className = "hint"; note.style.cssText = "margin-top:6px;text-align:center";
    note.textContent = "쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
    slot.appendChild(note);
    loadScript("https://ads-partners.coupang.com/g.js");
    var tries = 0;
    (function build() {
      if (window.PartnersCoupang && window.PartnersCoupang.G) {
        try {
          new window.PartnersCoupang.G({
            id: CFG.coupang.id, template: CFG.coupang.template,
            trackingCode: CFG.coupang.trackingCode, subId: CFG.coupang.subId,
            width: CFG.coupang.width, height: CFG.coupang.height, container: box.id
          });
        } catch (e) {}
      } else if (tries++ < 50) { setTimeout(build, 150); }
    })();
  }

  function renderSlot(slot) {
    var net = pickNetwork(slot);
    if (!net) return;
    markFilled(slot);
    if (net === "adsense") renderAdsense(slot);
    else if (net === "adfit") renderAdfit(slot);
    else if (net === "coupang") renderCoupang(slot);
  }

  /* ---- 지연 로딩: 화면에 보일 때만 렌더 ---- */
  function startAds() {
    var slots = Array.prototype.slice.call(document.querySelectorAll(".ad-slot:not(.filled)"));
    if (!slots.length) return;
    if (!("IntersectionObserver" in window)) { slots.forEach(renderSlot); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); renderSlot(e.target); } });
    }, { rootMargin: "250px" });
    slots.forEach(function (s) { io.observe(s); });
  }

  /* ---- 동의 배너 ---- */
  function showConsentBanner() {
    if (document.querySelector(".consent")) return;
    var bar = document.createElement("div");
    bar.className = "consent";
    bar.innerHTML =
      '<div class="c-t"><b>쿠키 사용 안내</b>맞춤 광고·분석을 위해 쿠키를 사용할 수 있어요. 자세한 내용은 ' +
      '<a href="privacy.html">개인정보처리방침</a>을 확인하세요.</div>' +
      '<div class="c-act"><button class="ghost" data-c="deny" type="button">거부</button>' +
      '<button data-c="allow" type="button">동의</button></div>';
    document.body.appendChild(bar);
    bar.addEventListener("click", function (e) {
      var c = e.target.getAttribute("data-c");
      if (!c) return;
      setConsent(c === "allow" ? "granted" : "denied");
      bar.remove();
      startAds();
    });
  }

  function initAds() {
    if (isPreview || !anyAdEnabled()) return; // 미리보기·광고 미설정 시 자리표시자 유지
    if (!CFG.consent.enabled) { startAds(); return; }
    var st = getConsent();
    if (st === "granted" || st === "denied") { startAds(); return; }
    showConsentBanner();
  }

  /* ---- 후원 링크 (광고와 무관, 동의 불필요) ---- */
  function injectSupport() {
    if (!CFG.support.enabled || !CFG.support.url) return;
    var foot = document.querySelector("footer.site .foot");
    if (!foot || foot.querySelector(".qt-support")) return;
    var a = document.createElement("a");
    a.className = "qt-support"; a.href = CFG.support.url;
    a.target = "_blank"; a.rel = "noopener"; a.textContent = CFG.support.label;
    var sp = foot.querySelector(".sp");
    if (sp) foot.insertBefore(a, sp); else foot.appendChild(a);
  }

  function run() { injectSupport(); initAds(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
