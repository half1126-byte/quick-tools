/* 급할때.tools — 공통 스크립트 (테마 · PWA설치 · 최근도구 · 애니메이션 · 복사)
   전역 네임스페이스 QT 로 노출. 각 도구 페이지가 함께 불러 씀. */
(function(){
  const QT = window.QT = {};

  /* ---- 숫자 포맷 ---- */
  QT.won = function(n){ return (Math.round(n) || 0).toLocaleString("ko-KR"); };

  /* ---- 값 변할 때 살짝 튀는 효과 ---- */
  QT.flash = function(el){
    if(!el) return; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  };

  /* ---- 숫자 카운트업 (예시 넣기 등 한 번씩) ---- */
  QT.countUp = function(el, to, suffix){
    suffix = suffix || ""; const dur=450, t0=performance.now(), from=0;
    function step(now){
      const p = Math.min((now-t0)/dur, 1);
      const ease = 1-Math.pow(1-p,3);
      el.textContent = QT.won(from + (to-from)*ease) + suffix;
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  /* ---- 토스트 ---- */
  QT.toast = function(msg){
    let t = document.querySelector(".toast");
    if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(QT._tt); QT._tt = setTimeout(()=>t.classList.remove("show"), 1600);
  };

  /* ---- 복사 ---- */
  QT.copy = function(text, okMsg){
    const done = ()=>QT.toast(okMsg || "복사했어요 ✓");
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(()=>fallback(text,done));
    } else fallback(text, done);
  };
  function fallback(text, done){
    const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); }catch(e){}
    document.body.removeChild(ta); done&&done();
  }

  /* ---- 테마(다크모드) ---- */
  QT.applyTheme = function(mode){
    document.documentElement.dataset.theme = mode;
    try{ localStorage.setItem("qt-theme", mode); }catch(e){}
    const b = document.getElementById("themeToggle");
    if(b){ b.textContent = mode==="dark" ? "☀️" : "🌙"; b.setAttribute("aria-label", mode==="dark"?"밝은 테마로":"어두운 테마로"); }
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content", mode==="dark" ? "#0e1220" : "#3b6ef5");
  };
  QT.initTheme = function(){
    let m; try{ m = localStorage.getItem("qt-theme"); }catch(e){}
    if(!m) m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    QT.applyTheme(m);
    const b = document.getElementById("themeToggle");
    if(b) b.addEventListener("click", ()=>QT.applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  };

  /* ---- 최근 쓴 도구 (홈에서 표시) ---- */
  QT.recordRecent = function(tool){ // {slug,name,emoji,url}
    try{
      let list = JSON.parse(localStorage.getItem("qt-recent")||"[]");
      list = list.filter(t=>t.slug!==tool.slug); list.unshift(tool);
      localStorage.setItem("qt-recent", JSON.stringify(list.slice(0,5)));
    }catch(e){}
  };
  QT.renderRecent = function(sel){
    const box = document.querySelector(sel); if(!box) return;
    let list=[]; try{ list = JSON.parse(localStorage.getItem("qt-recent")||"[]"); }catch(e){}
    const card = box.closest(".card");
    if(!list.length){ if(card) card.style.display="none"; return; }
    box.innerHTML = list.map(t=>`<a href="${t.url}">${t.emoji} ${t.name}</a>`).join("");
  };

  /* ---- PWA: 서비스워커 + 설치 프롬프트 ---- */
  QT.initPWA = function(){
    if("serviceWorker" in navigator){
      window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
    }
    let deferred = null;
    const headBtn = document.getElementById("installBtn");
    const banner = document.getElementById("installBanner");
    const dismissed = (()=>{ try{return localStorage.getItem("qt-install-dismiss")==="1";}catch(e){return false;} })();

    window.addEventListener("beforeinstallprompt", (e)=>{
      e.preventDefault(); deferred = e;
      if(headBtn) headBtn.classList.add("show");
      if(banner && !dismissed) banner.classList.add("show");
    });
    async function doInstall(){
      if(!deferred){ QT.toast("브라우저 메뉴에서 '홈 화면에 추가'를 눌러보세요"); return; }
      deferred.prompt(); await deferred.userChoice; deferred=null;
      banner && banner.classList.remove("show"); headBtn && headBtn.classList.remove("show");
    }
    headBtn && headBtn.addEventListener("click", doInstall);
    const ib = document.getElementById("ibInstall"), ix = document.getElementById("ibClose");
    ib && ib.addEventListener("click", doInstall);
    ix && ix.addEventListener("click", ()=>{ banner.classList.remove("show"); try{localStorage.setItem("qt-install-dismiss","1");}catch(e){} });
    window.addEventListener("appinstalled", ()=>{ headBtn&&headBtn.classList.remove("show"); banner&&banner.classList.remove("show"); QT.toast("설치 완료! 홈 화면에서 열어보세요 🎉"); });
  };

  /* ---- 즐겨찾기 안내 ---- */
  QT.bookmarkHint = function(){
    const isMac = /Mac/i.test(navigator.platform);
    QT.toast((isMac?"⌘+D":"Ctrl+D")+" 로 즐겨찾기에 추가하세요 ⭐");
  };

  /* ---- 공통 초기화 ---- */
  document.addEventListener("DOMContentLoaded", function(){
    const y=document.getElementById("year"); if(y) y.textContent=new Date().getFullYear();
    QT.initTheme(); QT.initPWA();
    const bm=document.getElementById("bookmarkBtn"); bm && bm.addEventListener("click", QT.bookmarkHint);
  });
})();
