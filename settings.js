(function () {
  'use strict';
  const form = document.getElementById('settings-panel');
  const status = document.getElementById('settings-status');
  const downloadButton = document.getElementById('download-settings');
  const gate = document.getElementById('admin-gate');
  const gateForm = document.getElementById('admin-gate-form');
  const gateCode = document.getElementById('admin-gate-code');
  const gateError = document.getElementById('gate-error');
  const names = ['whatsapp', 'telegram', 'facebookUrl', 'morningCash', 'morningInstapay', 'morningInstapayLink', 'eveningCash', 'eveningInstapay', 'eveningInstapayLink', 'address', 'mapQuery', 'wifiSSID', 'wifiPassword'];
  const accessKey = 'trustCenterSettingsAccess';

  function unlockSettings() {
    gate.hidden = true;
    form.hidden = false;
    try { sessionStorage.setItem(accessKey, 'granted'); } catch (error) { /* The current page remains unlocked until it is closed. */ }
  }
  try { if (sessionStorage.getItem(accessKey) === 'granted') unlockSettings(); } catch (error) { /* Direct visits can use the visible code form. */ }
  gateForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (gateCode.value === '0000') {
      gateError.hidden = true;
      gateCode.value = '';
      unlockSettings();
    } else {
      gateError.hidden = false;
      gateCode.select();
    }
  });

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }
  function fillForm(settings) {
    names.forEach(function (name) {
      const input = form.elements.namedItem(name);
      if (input) input.value = settings[name] == null ? '' : settings[name];
    });
  }
  function normalizeDigits(value) {
    return String(value).replace(/[٠-٩]/g, function (digit) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)); })
      .replace(/[۰-۹]/g, function (digit) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)); });
  }
  function readForm() {
    const next = {};
    names.forEach(function (name) {
      const input = form.elements.namedItem(name);
      next[name] = input ? input.value.trim() : '';
    });
    ['whatsapp', 'telegram', 'morningCash', 'morningInstapay', 'eveningCash', 'eveningInstapay'].forEach(function (name) {
      next[name] = normalizeDigits(next[name]);
      const count = next[name].replace(/\D/g, '').length;
      if (count < 8 || count > 15) throw new Error('راجع رقم الهاتف في الحقل: ' + name);
    });
    ['morningInstapayLink', 'eveningInstapayLink'].forEach(function (name) {
      const parsed = new URL(next[name]);
      if (parsed.protocol !== 'https:') throw new Error('يجب أن يبدأ رابط InstaPay بـ https://');
      next[name] = parsed.href;
    });
    if (next.facebookUrl) {
      const parsed = new URL(next.facebookUrl);
      if (parsed.protocol !== 'https:') throw new Error('يجب أن يبدأ رابط Facebook بـ https://');
      next.facebookUrl = parsed.href;
    }
    if (!next.mapQuery) next.mapQuery = next.address;
    if (!next.address || !next.mapQuery) throw new Error('أكمل العنوان وكلمات البحث للخريطة.');
    if (!next.wifiSSID || next.wifiSSID.length > 32) throw new Error('اسم شبكة Wi-Fi مطلوب وبحد أقصى 32 حرفًا.');
    if (next.wifiPassword.length < 8 || next.wifiPassword.length > 128) throw new Error('كلمة مرور Wi-Fi يجب أن تكون بين 8 و128 حرفًا.');
    return next;
  }
  function downloadSettings(settings) {
    const blob = new Blob([JSON.stringify(settings, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'site-settings.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  fetch('site-settings.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('تعذّر تحميل site-settings.json. افتح الصفحة من موقع مستضاف.');
      return response.json();
    })
    .then(fillForm)
    .catch(function (error) { setStatus(error.message || 'تعذّر تحميل الإعدادات.', true); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      const settings = readForm();
      downloadSettings(settings);
      setStatus('تم تنزيل site-settings.json. استبدل به الملف الموجود في مستودع GitHub ثم اعمل Commit/Push وأعد النشر ليشاهد جميع الزوار التغيير.', false);
    } catch (error) {
      setStatus(error.message || 'راجع القيم المدخلة وحاول مرة أخرى.', true);
    }
  });
  form.addEventListener('change', function () { if (status.classList.contains('is-error')) setStatus('', false); });
  downloadButton.addEventListener('click', function () { setStatus('', false); });
}());
