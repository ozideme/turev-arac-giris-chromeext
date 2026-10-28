// service-worker.js - Türev Araç Girişi Yan Panel (Side Panel) Yönetimi

// Eklenti simgesine tıklandığında popup yerine Yan Paneli (Side Panel) aç
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Side panel davranışı ayarlanamadı:', error));

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel davranışı ayarlanamadı:', error));
});
