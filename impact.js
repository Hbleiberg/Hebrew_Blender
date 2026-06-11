/* IvritSuite impact metrics — privacy-first usage counts.
   Counts events, never people: increments an on-device personal tally and
   queues an anonymous, batched beacon to the metrics Worker. No cookies, no
   identifiers, no IP. Honors an opt-out flag and is a silent no-op when the
   backend is unreachable. Self-contained; one <script defer> on every page.
   Public API:  window.IvritImpact.count(event, n = 1). */
(function () {
  'use strict';

  var ENDPOINT = 'https://api.ivritsuite.com/event';
  var BLOB_KEY = 'ivritsuite-impact-v1';
  var OPTOUT_KEY = 'ivritsuite-impact-optout';
  var FLUSH_MS = 30000;

  var pending = {};   // { event: summedN } accumulated since the last flush
  var lastFlush = 0;
  var bound = false;

  function optedOut() {
    try { return localStorage.getItem(OPTOUT_KEY) === '1'; } catch (e) { return false; }
  }

  // On-device personal tally — updated on EVERY count, even offline / opted out.
  function bumpPersonal(event, n) {
    try {
      var blob;
      try { blob = JSON.parse(localStorage.getItem(BLOB_KEY)) || {}; } catch (e) { blob = {}; }
      if (!blob.first) blob.first = new Date().toISOString();
      if (!blob.events) blob.events = {};
      blob.events[event] = (blob.events[event] || 0) + n;
      localStorage.setItem(BLOB_KEY, JSON.stringify(blob));
    } catch (e) { /* storage full / disabled — personal stats are best-effort */ }
  }

  function flush() {
    // Read opt-out fresh so toggling it in "My stats" takes effect immediately.
    if (optedOut() || !navigator.sendBeacon) { pending = {}; return; }
    for (var ev in pending) {
      if (!Object.prototype.hasOwnProperty.call(pending, ev) || !pending[ev]) continue;
      var body = JSON.stringify({ event: ev, n: pending[ev] });
      // text/plain = a CORS "simple request" → no preflight → the beacon fires
      // during pagehide/visibilitychange. The Worker parses the body as text.
      try { navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' })); }
      catch (e) { /* drop silently — never retry, never block the UI */ }
    }
    pending = {};
    lastFlush = Date.now();
  }

  function bindFlush() {
    if (bound) return;
    bound = true;
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
  }

  function count(event, n) {
    if (!event) return;
    n = (n == null) ? 1 : (n | 0);
    if (n < 1) return;
    bumpPersonal(event, n);
    if (optedOut()) return;                 // personal stats only; no network
    pending[event] = (pending[event] || 0) + n;
    bindFlush();
    var now = Date.now();
    if (!lastFlush) { lastFlush = now; return; } // first event starts the 30s window
    if (now - lastFlush >= FLUSH_MS) flush();
  }

  window.IvritImpact = { count: count };
})();
