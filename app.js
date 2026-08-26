const AFFILIATE_ID = '14312450026';

const TRACKING_PARAMS = new Set([
  'spm', 'xptdk', 'xpt', 'sccid', 'smtt', 'uls_trackid', 'uls_click_id',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
  'af_siteid', 'af_click_lookback', 'af_viewthrough_lookback', 'af_reengagement_window',
  'af_sub_siteid', 'af_sub1', 'af_sub2', 'af_sub3', 'af_sub4', 'af_sub5', 'af_prt',
  'af_force_deeplink', 'pid', 'is_retargeting', 'deep_and_deferred',
  'c', 'ctt', 'clickid', 'sub_id', 'share_id', 'referral_code',
]);

function normalize(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  return text.startsWith('http://') || text.startsWith('https://') ? text : 'https://' + text;
}

function classifyAndBuild(raw) {
  const urlText = normalize(raw);
  if (!urlText) return null;

  let url;
  try {
    url = new URL(urlText);
  } catch (e) {
    return { raw: String(raw || '').trim(), type: 'invalid', reason: 'That does not look like a valid URL.' };
  }

  const host = url.hostname.toLowerCase();

  if (host === 'shope.ee' || host.endsWith('.shope.ee')) {
    return {
      raw: urlText,
      type: 'shortlink',
      reason: 'Shortlink detected — open it in your browser, then copy the full shopee.sg URL and paste that here.',
    };
  }

  if (host !== 'shopee.sg' && !host.endsWith('.shopee.sg')) {
    return {
      raw: urlText,
      type: 'invalid',
      reason: 'Only shopee.sg links are supported (got "' + host + '").',
    };
  }

  const path = url.pathname.replace(/\/+$/, '');
  const isProductOrShop =
    /-i\.\d+\.\d+$/i.test(path) ||
    /^\/product\/\d+\/\d+$/i.test(path) ||
    /^\/shop\/\d+$/i.test(path);

  const cleaned = new URL(url);
  if (isProductOrShop) {
    cleaned.search = '';
  } else {
    for (const key of Array.from(cleaned.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        cleaned.searchParams.delete(key);
      }
    }
  }

  const id = AFFILIATE_ID;
  const qs = new URLSearchParams({
    utm_source: 'an_' + id,
    utm_medium: 'affiliates',
    utm_campaign: '-',
    utm_content: '----',
    af_siteid: 'an_' + id,
    pid: 'affiliates',
    af_click_lookback: '7d',
    af_viewthrough_lookback: '1d',
    is_retargeting: 'true',
    af_reengagement_window: '7d',
    af_sub_siteid: '----',
    c: '-',
    deep_and_deferred: '1',
  });

  const sep = cleaned.search ? '&' : '?';
  const finalUrl = cleaned.href + sep + qs.toString();

  return {
    raw: urlText,
    type: 'valid',
    original: cleaned.href,
    url: finalUrl,
  };
}

function parseInput(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => classifyAndBuild(line))
    .filter(Boolean);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AFFILIATE_ID, classifyAndBuild, parseInput };
}

if (typeof document !== 'undefined') {
  init();
}

function init() {
  const $ = (sel) => document.querySelector(sel);
  const textarea = $('#links');
  const convertBtn = $('#convert');
  const resultsEl = $('#results');
  const stickyBar = $('#stickyBar');
  const countEl = $('#count');
  const copyAllBtn = $('#copyAll');
  const toastContainer = $('#toastContainer');

  let validResults = [];

  function showToast(msg, type) {
    const colors =
      type === 'error'
        ? 'bg-red-500 text-white'
        : type === 'warn'
          ? 'bg-amber-500 text-white'
          : 'bg-emerald-500 text-white';
    const el = document.createElement('div');
    el.className = 'toast pointer-events-auto px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg ' + colors;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 200);
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function badgeFor(type) {
    if (type === 'valid') {
      return '<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1">' +
        '<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Converted</span>';
    }
    if (type === 'shortlink') {
      return '<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1">' +
        '<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>Shortlink</span>';
    }
    return '<span class="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1">' +
      '<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>Invalid</span>';
  }

  function render(results) {
    resultsEl.innerHTML = '';
    validResults = results.filter((r) => r.type === 'valid');

    if (!results.length) {
      resultsEl.innerHTML = '<p class="text-center text-gray-400 text-sm py-6">Paste a link above to get started.</p>';
      stickyBar.classList.add('hidden');
      return;
    }

    results.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'result-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4';
      card.style.animationDelay = i * 0.04 + 's';

      if (r.type === 'valid') {
        card.innerHTML =
          '<div class="flex items-start justify-between gap-3 mb-2">' +
          badgeFor('valid') +
          '<button class="copy-btn inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-shopee transition shrink-0" data-copy="' +
          window.btoa(unescape(encodeURIComponent(r.url))) +
          '" title="Copy link">' +
          '<svg class="copy-icon w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>' +
          '<svg class="check-icon w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' +
          'Copy</button>' +
          '</div>' +
          '<a href="' + r.url + '" target="_blank" rel="noopener noreferrer" class="block break-all text-sm font-medium text-shopee hover:text-shopee-dark hover:underline">' +
          r.url +
          '</a>';
      } else {
        card.innerHTML =
          '<div class="flex items-start justify-between gap-3 mb-2">' +
          badgeFor(r.type) +
          '</div>' +
          '<div class="break-all text-sm text-gray-500">' + r.raw + '</div>' +
          '<p class="mt-2 text-xs text-gray-400">' + r.reason + '</p>';
      }

      resultsEl.appendChild(card);
    });

    countEl.textContent = String(validResults.length);
    stickyBar.classList.toggle('hidden', validResults.length === 0);
  }

  function convert() {
    const results = parseInput(textarea.value);
    render(results);
    if (validResults.length) {
      showToast('Converted ' + validResults.length + (validResults.length === 1 ? ' link' : ' links'));
    }
  }

  convertBtn.addEventListener('click', convert);
  textarea.addEventListener('paste', () => setTimeout(convert, 0));

  resultsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    try {
      const url = decodeURIComponent(escape(window.atob(btn.dataset.copy)));
      await copyText(url);
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    } catch (err) {
      showToast('Could not copy — copy manually instead.', 'error');
    }
  });

  copyAllBtn.addEventListener('click', async () => {
    if (!validResults.length) return;
    try {
      await copyText(validResults.map((r) => r.url).join('\n'));
      showToast('Copied ' + validResults.length + (validResults.length === 1 ? ' link' : ' links') + ' to clipboard');
    } catch (err) {
      showToast('Could not copy.', 'error');
    }
  });
}
