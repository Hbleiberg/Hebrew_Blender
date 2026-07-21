/* IvritSuite Advanced TTS — shared UI layer (window.AdvTtsUI).
 *
 * Lazy-loaded together with tts/phonemizer.js + tts/tts-engine.js by the per-page
 * adv-tts loader block ONLY once the user turns the "Enable Advanced TTS" toggle on
 * (or had it on previously) — pristine visitors make zero TTS-related requests.
 *
 * Provides: the one-time download/enable card (with progress + explicit ~size warning),
 * the "Voice credits" modal (a Hebrew-model license requirement — see CREDITS.md),
 * toast + speaking-state wiring, and the AdvTtsUI.speak() router the pages call from
 * their existing speak functions.
 *
 * Self-contained: injects its own CSS (dark-mode aware via body.dark, reduced-motion
 * neutralized, print-hidden). Strings go through I18n when the page has it; the
 * built-in English text is the fallback for the bare test harness.
 */
(function (root) {
  'use strict';

  var EN = {
    'shared.tts.card_title': 'Download the Hebrew voice?',
    'shared.tts.card_body': 'High-quality Hebrew speech that runs fully on your device. One-time download of about {mb} MB — works offline afterward.',
    'shared.tts.card_credit': 'Voice: Kokoro / SASPEECH — the voice of Shaul Amsterdamski. Non-commercial use only.',
    'shared.tts.download_btn': 'Download & enable',
    'shared.tts.cancel_btn': 'Not now',
    'shared.tts.progress_of': 'Downloading Hebrew voice… {done} / {total} MB',
    'shared.tts.progress_alone': 'Downloading Hebrew voice… {done} MB',
    'shared.tts.preparing': 'Preparing voice…',
    'shared.tts.ready_toast': 'Hebrew voice ready',
    'shared.tts.error_toast': 'Advanced TTS failed: {msg}',
    'shared.tts.error_retry': "Couldn't start the Hebrew voice ({msg}). Tap Retry to try again.",
    'shared.tts.retry_btn': 'Retry',
    'shared.tts.optimizing': 'Optimizing voice…',
    'shared.tts.fallback_toast': "Using the browser's Hebrew voice instead (lower quality).",
    'shared.tts.credits_link': 'Voice credits',
    'shared.tts.credits_title': 'Voice & Audio Credits',
    'shared.tts.credits_p1': 'Voice: Kokoro-82M (Apache 2.0), Hebrew fine-tune trained on the SASPEECH corpus — the voice of Shaul Amsterdamski.',
    'shared.tts.credits_p2': 'Non-commercial use only.',
    'shared.tts.credits_more': 'Full license details (CREDITS.md)',
    'shared.tts.close': 'Close'
  };
  var CREDITS_URL = 'https://github.com/hbleiberg/hebrew_blender/blob/main/CREDITS.md';

  function t(key, params) {
    var s = null;
    if (root.I18n && root.I18n.t) { s = root.I18n.t(key, params); if (s === key) s = null; }
    if (s === null) {
      s = EN[key] || key;
      if (params) Object.keys(params).forEach(function (k) { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]); });
    }
    return s;
  }

  function toast(msg) {
    if (typeof root.showAppToast === 'function') { root.showAppToast(msg); return; }
    var el = document.getElementById('advTtsToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'advTtsToast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  var CSS = [
    '#advTtsCard{position:fixed;inset-inline-end:16px;bottom:16px;z-index:9998;max-width:340px;width:calc(100vw - 32px);',
    ' background:var(--white,#fff);color:var(--text,#1a2744);border:1px solid var(--border,#c8bfa8);border-radius:10px;',
    ' box-shadow:0 6px 24px rgba(0,0,0,0.25);padding:16px;font-size:0.85rem;line-height:1.5;}',
    '#advTtsCard h3{font-size:0.95rem;margin:0 0 8px;color:var(--navy,#1a2744);}',
    'body.dark #advTtsCard h3{color:var(--gold-light,#f5d97a);}',
    '#advTtsCard .adv-tts-credit{font-size:0.72rem;color:var(--muted,#6b6050);margin-top:8px;}',
    '#advTtsCard .adv-tts-btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}',
    '#advTtsCard button{font-family:inherit;font-size:0.8rem;padding:7px 12px;border-radius:6px;cursor:pointer;border:1px solid var(--border,#c8bfa8);background:var(--white,#fff);color:var(--text,#1a2744);}',
    '#advTtsCard button.primary{background:var(--navy,#1a2744);border-color:var(--navy,#1a2744);color:#fff;font-weight:700;}',
    '#advTtsCard button:hover{filter:brightness(1.08);}',
    '#advTtsBarWrap{display:none;margin-top:12px;}',
    '#advTtsBar{height:8px;border-radius:4px;background:var(--warm-gray,#e8e0d0);overflow:hidden;}',
    '#advTtsBarFill{height:100%;width:0%;background:var(--gold,#c9922a);transition:width 0.2s;}',
    '#advTtsBarLabel{font-size:0.72rem;color:var(--muted,#6b6050);margin-top:5px;}',
    '#advTtsBarLabel.adv-tts-err{color:#c0392b;font-weight:600;}',
    '#advTtsCreditsOverlay{position:fixed;inset:0;background:rgba(13,18,32,0.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;}',
    '#advTtsCreditsOverlay.open{display:flex;}',
    '#advTtsCreditsModal{background:var(--white,#fff);color:var(--text,#1a2744);border:1px solid var(--border,#c8bfa8);border-radius:10px;max-width:420px;width:100%;padding:18px;font-size:0.85rem;line-height:1.6;}',
    '#advTtsCreditsModal h3{font-size:1rem;margin:0 0 10px;color:var(--navy,#1a2744);}',
    'body.dark #advTtsCreditsModal h3{color:var(--gold-light,#f5d97a);}',
    '#advTtsCreditsModal a{color:var(--gold,#c9922a);}',
    '#advTtsCreditsModal .adv-tts-btns{display:flex;justify-content:flex-end;margin-top:12px;}',
    '#advTtsCreditsModal button{font-family:inherit;font-size:0.8rem;padding:7px 12px;border-radius:6px;cursor:pointer;border:1px solid var(--border,#c8bfa8);background:var(--white,#fff);color:var(--text,#1a2744);}',
    '#advTtsToast{position:fixed;bottom:18px;inset-inline-start:50%;transform:translateX(-50%);background:var(--navy,#1a2744);color:#fff;',
    ' padding:9px 16px;border-radius:8px;font-size:0.82rem;z-index:9999;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '#advTtsToast.show{opacity:1;}',
    '.tts-speaking{outline:2px solid var(--gold,#c9922a);outline-offset:1px;border-radius:4px;}',
    '@media print{#advTtsCard,#advTtsCreditsOverlay,#advTtsToast{display:none !important;}}',
    '@media (prefers-reduced-motion: reduce){#advTtsBarFill,#advTtsToast{transition:none !important;}}'
  ].join('\n');

  var cardEl = null, creditsEl = null, prevFocus = null;

  function injectCss() {
    if (document.getElementById('advTtsStyles')) return;
    var st = document.createElement('style');
    st.id = 'advTtsStyles';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function getRate() {
    var slider = document.getElementById('ttsRateSlider');
    var v = slider ? parseFloat(slider.value) : NaN;
    return isNaN(v) ? 1.0 : v;
  }

  // ── enable/download card ───────────────────────────────────────────────────
  function buildCard(onCancel) {
    removeCard();
    var mb = root.HebrewTTS.CONFIG.MODEL_SIZE_HINT_MB;
    cardEl = document.createElement('div');
    cardEl.id = 'advTtsCard';
    cardEl.setAttribute('role', 'dialog');
    cardEl.setAttribute('aria-label', t('shared.tts.card_title'));

    var h = document.createElement('h3'); h.textContent = t('shared.tts.card_title');
    var p = document.createElement('p'); p.textContent = t('shared.tts.card_body', { mb: mb });
    var credit = document.createElement('div'); credit.className = 'adv-tts-credit'; credit.textContent = t('shared.tts.card_credit');
    var creditLink = document.createElement('a'); creditLink.href = '#'; creditLink.textContent = ' ' + t('shared.tts.credits_link');
    creditLink.addEventListener('click', function (e) { e.preventDefault(); AdvTtsUI.openCredits(); });
    credit.appendChild(creditLink);

    var btns = document.createElement('div'); btns.className = 'adv-tts-btns';
    var dl = document.createElement('button'); dl.className = 'primary'; dl.textContent = t('shared.tts.download_btn');
    var cancel = document.createElement('button'); cancel.textContent = t('shared.tts.cancel_btn');
    btns.appendChild(dl); btns.appendChild(cancel);

    var barWrap = document.createElement('div'); barWrap.id = 'advTtsBarWrap';
    var bar = document.createElement('div'); bar.id = 'advTtsBar';
    var fill = document.createElement('div'); fill.id = 'advTtsBarFill'; bar.appendChild(fill);
    var label = document.createElement('div'); label.id = 'advTtsBarLabel'; label.setAttribute('role', 'status');
    barWrap.appendChild(bar); barWrap.appendChild(label);

    cardEl.appendChild(h); cardEl.appendChild(p); cardEl.appendChild(credit);
    cardEl.appendChild(btns); cardEl.appendChild(barWrap);
    document.body.appendChild(cardEl);

    cancel.addEventListener('click', function () { removeCard(); if (onCancel) onCancel(); });

    // Download/enable, with an inline error + Retry state on failure so the card never
    // spins forever (the field bug) and a transient failure is recoverable in place.
    function startDownload() {
      dl.disabled = true; cancel.disabled = true;
      label.classList.remove('adv-tts-err');
      barWrap.style.display = 'block';
      var fillEl = document.getElementById('advTtsBarFill'); if (fillEl) fillEl.style.width = '0%';
      label.textContent = t('shared.tts.preparing');
      root.HebrewTTS.enable().then(function () {
        removeCard();
        toast(t('shared.tts.ready_toast'));
      }).catch(function (err) {
        if (root.HebrewTTS.getState() === 'webspeech') {
          // Engine already fell back to the browser voice — inform and dismiss.
          removeCard();
          toast(t('shared.tts.fallback_toast'));
        } else {
          // No fallback available — surface the error and offer Retry in place.
          var f = document.getElementById('advTtsBarFill'); if (f) f.style.width = '0%';
          label.textContent = t('shared.tts.error_retry', { msg: err.message });
          label.classList.add('adv-tts-err');
          dl.disabled = false; cancel.disabled = false;
          dl.textContent = t('shared.tts.retry_btn');
          dl.focus();
        }
      });
    }
    dl.addEventListener('click', startDownload);
    dl.focus();
  }
  function removeCard() { if (cardEl) { cardEl.remove(); cardEl = null; } }

  function onProgress(p) {
    var fill = document.getElementById('advTtsBarFill');
    var label = document.getElementById('advTtsBarLabel');
    if (!label) return;
    var doneMb = Math.round(p.loaded / 1048576);
    if (p.total) {
      var totalMb = Math.round(p.total / 1048576);
      if (fill) fill.style.width = Math.min(100, Math.round(100 * p.loaded / p.total)) + '%';
      label.textContent = t('shared.tts.progress_of', { done: doneMb, total: totalMb });
    } else {
      if (fill) fill.style.width = '100%';
      label.textContent = t('shared.tts.progress_alone', { done: doneMb });
    }
  }

  // ── credits modal ──────────────────────────────────────────────────────────
  function buildCredits() {
    if (creditsEl) return creditsEl;
    creditsEl = document.createElement('div');
    creditsEl.id = 'advTtsCreditsOverlay';
    var modal = document.createElement('div');
    modal.id = 'advTtsCreditsModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'advTtsCreditsTitle');
    var h = document.createElement('h3'); h.id = 'advTtsCreditsTitle'; h.textContent = t('shared.tts.credits_title');
    var p1 = document.createElement('p'); p1.textContent = t('shared.tts.credits_p1');
    var p2 = document.createElement('p'); p2.textContent = t('shared.tts.credits_p2'); p2.style.fontWeight = '700';
    var more = document.createElement('p');
    var a = document.createElement('a'); a.href = CREDITS_URL; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = t('shared.tts.credits_more');
    more.appendChild(a);
    var btns = document.createElement('div'); btns.className = 'adv-tts-btns';
    var close = document.createElement('button'); close.textContent = t('shared.tts.close');
    btns.appendChild(close);
    modal.appendChild(h); modal.appendChild(p1); modal.appendChild(p2); modal.appendChild(more); modal.appendChild(btns);
    creditsEl.appendChild(modal);
    document.body.appendChild(creditsEl);
    function doClose() { AdvTtsUI.closeCredits(); }
    close.addEventListener('click', doClose);
    creditsEl.addEventListener('click', function (e) { if (e.target === creditsEl) doClose(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && creditsEl.classList.contains('open')) doClose(); });
    return creditsEl;
  }

  // ── public API ─────────────────────────────────────────────────────────────
  var AdvTtsUI = {
    init: function () {
      injectCss();
      root.HebrewTTS.on('progress', onProgress);
      root.HebrewTTS.on('phase', function () {
        // Download done, session-create/warm-up under way — keep the card informative
        // (and its bar full) instead of looking stalled during the compile step.
        var label = document.getElementById('advTtsBarLabel');
        var fill = document.getElementById('advTtsBarFill');
        if (fill) fill.style.width = '100%';
        if (label && !label.classList.contains('adv-tts-err')) label.textContent = t('shared.tts.optimizing');
      });
      root.HebrewTTS.on('speakstart', function (d) { if (d.el) d.el.classList.add('tts-speaking'); });
      root.HebrewTTS.on('speakend', function (d) { if (d.el) d.el.classList.remove('tts-speaking'); });
      root.HebrewTTS.on('state', function (d) {
        if (d.state === 'webspeech') toast(t('shared.tts.fallback_toast'));
      });
      // Surface runtime speak/synth errors (e.g. a silent-output failure) so a silent
      // Web-Speech fallback on a device with no Hebrew voice is never fully invisible.
      root.HebrewTTS.on('error', function (d) {
        toast(t('shared.tts.error_toast', { msg: (d && d.message) || '' }));
      });
    },

    /* Page toggle changed. onCancel reverts the page's toggle if the user dismisses
     * the download card without downloading. */
    onToggle: function (on, onCancel) {
      if (!on) { root.HebrewTTS.stop(); removeCard(); return; }
      if (!root.HebrewTTS.isEnabledOnDevice()) buildCard(onCancel);
    },

    /* Speak router used by the pages' existing speak functions. Returns a Promise.
     * If the model was never downloaded on this device, shows the download card
     * instead (the tap that got us here is the required user gesture). */
    speak: function (text, el, onCancel) {
      if (!root.HebrewTTS.isEnabledOnDevice() &&
          root.HebrewTTS.getState() !== 'webspeech') {
        buildCard(onCancel);
        return Promise.resolve(false);
      }
      return root.HebrewTTS.speak(text, { el: el, speed: getRate() });
    },

    prefetch: function (texts) {
      if (!root.HebrewTTS.isEnabledOnDevice() || !root.HebrewTTS.isReady()) return function () {};
      return root.HebrewTTS.prefetch(texts, { speed: getRate() });
    },

    openCredits: function () {
      prevFocus = document.activeElement;
      buildCredits().classList.add('open');
      var btn = creditsEl.querySelector('button');
      if (btn) btn.focus();
    },
    closeCredits: function () {
      if (creditsEl) creditsEl.classList.remove('open');
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} prevFocus = null; }
    }
  };

  root.AdvTtsUI = AdvTtsUI;
})(typeof self !== 'undefined' ? self : this);
