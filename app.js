(function () {
  'use strict';

  const FALLBACK = {
    whatsapp: '01557245185', telegram: '01030436906',
    facebookUrl: 'https://www.facebook.com/trustcentermansoura?rdid=lbHoqqUXk5zdMgPv&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ZBpG7rTEk%2F#',
    morningCash: '01030436906', morningInstapay: '01030436906',
    morningInstapayLink: 'https://ipn.eg/S/ahmedmosbah28289/instapay/0xe0kB',
    eveningCash: '01099433936', eveningInstapay: '01099433936',
    eveningInstapayLink: 'https://ipn.eg/S/ahmedmosbah28289/instapay/0xe0kB',
    wifiSSID: 'C.T', wifiPassword: 'Trust@89',
    address: 'المنصورة، شارع الغزالي، أمام مستشفى الجامعة الرئيسي',
    mapQuery: 'المنصورة شارع الغزالي أمام مستشفى الجامعة الرئيسي'
  };
  let currentSettings = { ...FALLBACK };

  function westernDigits(value) {
    return String(value == null ? '' : value)
      .replace(/[٠-٩]/g, function (digit) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)); })
      .replace(/[۰-۹]/g, function (digit) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)); });
  }
  function phoneDigits(value) { return westernDigits(value).replace(/\D/g, ''); }
  function egyptInternational(value) {
    let number = phoneDigits(value);
    if (number.startsWith('00')) number = number.slice(2);
    if (number.startsWith('20')) return number;
    if (number.startsWith('0')) return '20' + number.slice(1);
    return number ? '20' + number : '';
  }
  function safeHttpsUrl(value, fallback) {
    try {
      const parsed = new URL(String(value || ''));
      return parsed.protocol === 'https:' ? parsed.href : fallback;
    } catch (error) { return fallback; }
  }
  function toast(message) {
    const el = document.getElementById('site-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 4200);
  }
  function fallbackCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
    field.remove();
    return copied;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function escapeWifi(value) { return String(value).replace(/[\\;,:\"]/g, '\\$&'); }
  function renderWifiQr(settings) {
    const target = document.getElementById('wifi-qr');
    if (!target) return;
    target.textContent = '';
    if (!window.qrcode) { target.textContent = 'تعذّر تجهيز رمز الشبكة. جرّب تحديث الصفحة.'; return; }
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData('WIFI:T:WPA;S:' + escapeWifi(settings.wifiSSID) + ';P:' + escapeWifi(settings.wifiPassword) + ';;');
      qr.make();
      target.innerHTML = qr.createSvgTag(5, 3);
      const svg = target.querySelector('svg');
      if (svg) {
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'رمز شبكة Wi-Fi، امسحه بالكاميرا للاتصال');
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
    } catch (error) { target.textContent = 'تعذّر تجهيز رمز الشبكة. راجع بيانات Wi-Fi من الإعدادات.'; }
  }
  function updatePage(settings) {
    const wa = document.getElementById('whatsapp-link');
    if (wa) {
      const number = egyptInternational(settings.whatsapp);
      const message = 'السلام عليكم، عايز أبعت ملف للطباعة.';
      if (number) wa.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
    }
    const telegram = document.getElementById('telegram-link');
    if (telegram) {
      const number = egyptInternational(settings.telegram);
      if (number) telegram.href = 'https://t.me/+' + number;
    }
    const facebook = document.getElementById('facebook-link');
    if (facebook) facebook.href = safeHttpsUrl(settings.facebookUrl, FALLBACK.facebookUrl);
    document.querySelectorAll('[data-recipient="morning-cash"]').forEach(function (el) { el.textContent = settings.morningCash; });
    document.querySelectorAll('[data-recipient="morning-instapay"]').forEach(function (el) { el.textContent = settings.morningInstapay; });
    document.querySelectorAll('[data-recipient="evening-cash"]').forEach(function (el) { el.textContent = settings.eveningCash; });
    document.querySelectorAll('[data-recipient="evening-instapay"]').forEach(function (el) { el.textContent = settings.eveningInstapay; });
    const map = document.getElementById('map-link');
    const address = document.getElementById('address-text');
    if (address) address.textContent = settings.address;
    if (map) map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(settings.mapQuery || settings.address);
    const wifiName = document.getElementById('wifi-name');
    const modalWifiName = document.getElementById('wifi-modal-ssid');
    if (wifiName) wifiName.textContent = settings.wifiSSID;
    if (modalWifiName) modalWifiName.textContent = settings.wifiSSID;
    const year = document.getElementById('current-year');
    if (year) year.textContent = String(new Date().getFullYear());
  }
  function loadSettings() {
    return fetch('site-settings.json', { cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('static settings unavailable'); return response.json(); })
      .catch(function () { return FALLBACK; });
  }
  function amountFor(period) {
    const input = document.getElementById('amount-' + period);
    if (!input) return null;
    const raw = westernDigits(input.value).trim().replace(/[ ,٬]/g, '');
    if (!/^\d+$/.test(raw)) { toast('اكتب مبلغ صحيح بالجنيه الأول.'); input.focus(); return null; }
    const amount = Number(raw);
    if (!Number.isSafeInteger(amount) || amount < 5 || amount > 60000) {
      toast('المبلغ يكون من 5 لحد 60,000 جنيه.'); input.focus(); return null;
    }
    return amount;
  }
  function recipientFor(provider, period) {
    const key = period === 'morning'
      ? (provider === 'vodafone' ? 'morningCash' : 'morningInstapay')
      : (provider === 'vodafone' ? 'eveningCash' : 'eveningInstapay');
    return phoneDigits(currentSettings[key]);
  }
  function openVodafone(period) {
    const amount = amountFor(period);
    if (amount === null) return;
    const recipient = recipientFor('vodafone', period);
    if (!recipient) { toast('رقم فودافون كاش مش مضبوط؛ راجعه من الإعدادات.'); return; }
    const code = '*9*7*' + recipient + '*' + amount + '#';
    const okay = window.confirm('هنفتح شاشة الاتصال بكود فودافون كاش للرقم ' + recipient + ' بمبلغ ' + amount + ' جنيه. اتأكد إنك بتستخدم شريحة فودافون، وبعدها راجع تفاصيل التحويل قبل تأكيده. نكمل؟');
    if (okay) window.location.href = 'tel:' + encodeURIComponent(code);
  }
  function openInstapay(period) {
    const amount = amountFor(period);
    if (amount === null) return;
    const recipient = recipientFor('instapay', period);
    if (!recipient) { toast('رقم InstaPay مش مضبوط؛ راجعه من الإعدادات.'); return; }
    const linkKey = period === 'morning' ? 'morningInstapayLink' : 'eveningInstapayLink';
    const paymentLink = safeHttpsUrl(currentSettings[linkKey], 'https://www.instapay.eg/?lang=ar');
    window.open(paymentLink, '_blank', 'noopener,noreferrer');
    copyText(recipient).then(function (copied) {
      const copiedText = copied ? 'نسخنا رقم المستلم ' + recipient + '. ' : 'رقم المستلم: ' + recipient + '. ';
      toast(copiedText + 'أدخل مبلغ ' + amount + ' جنيه داخل تطبيق InstaPay وراجع بيانات التحويل قبل التأكيد.');
    });
  }
  function bindPaymentButtons() {
    document.querySelectorAll('[data-provider][data-period]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.dataset.provider === 'vodafone') openVodafone(button.dataset.period);
        if (button.dataset.provider === 'instapay') openInstapay(button.dataset.period);
      });
    });
  }
  function bindWifi() {
    const openButton = document.getElementById('show-wifi');
    const modal = document.getElementById('wifi-modal');
    if (!openButton || !modal) return;
    openButton.addEventListener('click', function () {
      renderWifiQr(currentSettings);
      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');
    });
    ['close-wifi', 'close-wifi-secondary'].forEach(function (id) {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', function () { if (typeof modal.close === 'function') modal.close(); else modal.removeAttribute('open'); });
    });
    modal.addEventListener('click', function (event) { if (event.target === modal && typeof modal.close === 'function') modal.close(); });
  }
  function bindAdminShortcut() {
    if (!window.matchMedia('(min-width: 700px) and (pointer: fine)').matches) return;
    let sequence = '';
    let lastKeyAt = 0;
    document.addEventListener('keydown', function (event) {
      const target = event.target;
      if (target && target.closest && target.closest('input,textarea,select,[contenteditable="true"]')) { sequence = ''; return; }
      if (event.key !== '0' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) { sequence = ''; return; }
      const now = Date.now();
      if (now - lastKeyAt > 1800) sequence = '';
      sequence += '0';
      lastKeyAt = now;
      if (sequence.length >= 4) {
        sequence = '';
        try { sessionStorage.setItem('trustCenterSettingsAccess', 'granted'); } catch (error) { /* The settings page can ask for the code directly. */ }
        window.location.assign('settings.html');
      }
    });
  }
  window.TrustCenter = { defaults: { ...FALLBACK }, getSettings: function () { return { ...currentSettings }; }, phoneDigits: phoneDigits };
  document.addEventListener('DOMContentLoaded', function () {
    bindAdminShortcut();
    loadSettings().then(function (settings) {
      currentSettings = { ...FALLBACK, ...(settings || {}) };
      updatePage(currentSettings);
      bindPaymentButtons();
      bindWifi();
    });
  });
}());
