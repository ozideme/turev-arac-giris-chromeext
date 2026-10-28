/*
 * content/router.js
 * Popup ile content script arasındaki mesajlaşmayı yönetir ve sayfa yüklendiğinde
 * Yeni Araç postback'i varsa kaldığı yerden devam eder (resumeArac).
 */
(() => {
  const TRV = globalThis.TRV;
  if (!TRV || !TRV.common || !TRV.steps) {
    console.error('[Türev Eklentisi] common veya steps yüklenemedi.');
    return;
  }

  const { stepFromUrl, wrongScreenMessage, StopError, stopText } = TRV.common;
  const { fillStep, saveStep, resumeArac } = TRV.steps;

  // Sayfa yüklendiğinde Yeni Araç sayfası ise ve yarım kalan iş varsa devam et
  const currentStep = stepFromUrl(window.location.href);
  if (currentStep === 'arac') {
    // DOM'un tam hazır olması için kısa bir gecikmeyle devam et
    setTimeout(() => {
      resumeArac().catch((err) => console.error('[Türev Eklentisi] resumeArac hatası:', err));
    }, 200);
  }

  // Popup'tan gelen mesajları dinle
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) return false;

    const activeStep = stepFromUrl(window.location.href);

    // 1. Ekran kontrolü sorgusu
    if (message.action === 'checkScreen') {
      sendResponse({ currentStep: activeStep, url: window.location.href });
      return false;
    }

    // 2. Doldur komutu
    if (message.action === 'fillStep') {
      const { step, row } = message;
      if (activeStep !== step) {
        const errText = wrongScreenMessage(step);
        chrome.storage.local.set({
          status: { kind: 'error', text: errText, step, at: Date.now() },
          stepState: { ...(message.currentState || {}), [step]: 'error' }
        });
        sendResponse({ success: false, error: errText });
        return false;
      }

      fillStep(step, row)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // Asenkron yanıt için kanalı açık tut
    }

    // 3. Kaydet komutu
    if (message.action === 'saveStep') {
      const { step } = message;
      if (activeStep !== step) {
        const errText = wrongScreenMessage(step);
        chrome.storage.local.set({
          status: { kind: 'error', text: errText, step, at: Date.now() },
          stepState: { ...(message.currentState || {}), [step]: 'error' }
        });
        sendResponse({ success: false, error: errText });
        return false;
      }

      saveStep(step)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    return false;
  });
})();
