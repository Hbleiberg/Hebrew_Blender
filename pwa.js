/* IvritSuite PWA bootstrap: registers the service worker and shows a
   dismissable mobile install banner (Android beforeinstallprompt + iOS fallback).
   Self-contained — included via a single <script> tag on every page. */
(function () {
  'use strict';

  /* ---------- Service worker registration ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (err) {
        console.warn('[pwa] service worker registration failed:', err);
      });
    });
  }

  /* ---------- Install banner ---------- */
  var DISMISS_KEY = 'hebrewBlender_pwaDismissed'; // matches the site's hebrewBlender_ prefix
  var deferredPrompt = null;
  var bannerEl = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           navigator.standalone === true;
  }

  // iOS Safari has no beforeinstallprompt. Detect iPhone/iPad/iPod (incl. iPadOS
  // which reports as Mac) AND that we're in a browser tab (navigator.standalone === false).
  function isIOSSafari() {
    var ua = navigator.userAgent || '';
    var iOS = /iphone|ipad|ipod/i.test(ua) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return iOS && navigator.standalone === false;
  }

  function isDismissed() {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function rememberDismissed() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('pwaBannerStyles')) return;
    var s = document.createElement('style');
    s.id = 'pwaBannerStyles';
    s.textContent = [
      '#pwaInstallBanner{',
        'position:fixed;left:12px;right:12px;',
        'bottom:calc(12px + env(safe-area-inset-bottom, 0px));',
        'z-index:2147483000;display:flex;align-items:center;gap:12px;',
        'padding:10px 12px;border-radius:14px;',
        'background:linear-gradient(135deg,#1a2744,#0d1220);',
        'border:1px solid #c9922a;color:#fff;',
        'box-shadow:0 8px 28px rgba(0,0,0,0.38);',
        "font-family:'Libre Baskerville',-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;",
        'transform:translateY(160%);opacity:0;',
        'transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .34s;',
        'cursor:pointer;',
      '}',
      '#pwaInstallBanner.pwa-show{transform:translateY(0);opacity:1;}',
      '#pwaInstallBanner .pwa-banner-icon{',
        'width:42px;height:42px;border-radius:10px;flex-shrink:0;background:#fff;',
        'box-shadow:0 1px 4px rgba(0,0,0,0.3);',
      '}',
      '#pwaInstallBanner .pwa-banner-text{',
        'flex:1;text-align:center;font-size:0.92rem;font-weight:700;',
        'line-height:1.3;letter-spacing:0.01em;color:#fff;',
      '}',
      '#pwaInstallBanner .pwa-banner-close{',
        'flex-shrink:0;width:30px;height:30px;padding:0;border:none;border-radius:50%;',
        'background:rgba(255,255,255,0.16);color:#fff;font-size:1.3rem;line-height:1;',
        'display:flex;align-items:center;justify-content:center;cursor:pointer;',
        '-webkit-tap-highlight-color:transparent;transition:background .15s,transform .1s;',
      '}',
      '#pwaInstallBanner .pwa-banner-close:hover{background:rgba(255,255,255,0.28);}',
      '#pwaInstallBanner .pwa-banner-close:active{transform:scale(0.9);}',
      // Mobile only — hide on desktop regardless of how the banner was triggered.
      '@media (min-width:768px){#pwaInstallBanner{display:none !important;}}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildBanner(mode) {
    if (bannerEl || isDismissed() || isStandalone()) return;
    injectStyles();

    var text = mode === 'ios'
      ? 'Install Web App: Tap Share → Add to Home Screen'
      : 'Install web app?';

    var banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install IvritSuite');
    banner.innerHTML =
      '<img class="pwa-banner-icon" src="/icons/icon-192.png" alt="" width="42" height="42">' +
      '<span class="pwa-banner-text"></span>' +
      '<button class="pwa-banner-close" type="button" aria-label="Dismiss">×</button>';
    banner.querySelector('.pwa-banner-text').textContent = text;
    document.body.appendChild(banner);
    bannerEl = banner;

    banner.querySelector('.pwa-banner-close').addEventListener('click', function (e) {
      e.stopPropagation();
      hideBanner();
      rememberDismissed();
    });

    if (mode === 'android') {
      banner.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          hideBanner();
        });
      });
    } else {
      // iOS banner is informational; only the × dismisses it.
      banner.style.cursor = 'default';
    }

    requestAnimationFrame(function () { banner.classList.add('pwa-show'); });
  }

  function hideBanner() {
    if (!bannerEl) return;
    var el = bannerEl;
    bannerEl = null;
    el.classList.remove('pwa-show');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 340);
  }

  function whenReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Android / Chromium: capture the prompt and surface our own banner.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    whenReady(function () { buildBanner('android'); });
  });

  window.addEventListener('appinstalled', function () {
    rememberDismissed();
    hideBanner();
  });

  // iOS Safari: no beforeinstallprompt — show the instructional variant.
  if (isIOSSafari()) {
    whenReady(function () { buildBanner('ios'); });
  }
})();
