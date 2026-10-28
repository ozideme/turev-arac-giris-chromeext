/*
 * popup.js - Türev Araç Girişi Popup Mantığı
 */
document.addEventListener('DOMContentLoaded', async () => {
  const { STEPS, vehicleLabel, checkRow, StopError, stopText, stepFromUrl, wrongScreenMessage, COL } = TRV.common;

  // DOM Elemanları
  const fileInput = document.getElementById('fileInput');
  const fileNameEl = document.getElementById('fileName');
  const fileInfoEl = document.getElementById('fileInfo');
  const vehicleSelect = document.getElementById('vehicleSelect');
  const vehicleCountEl = document.getElementById('vehicleCount');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const activeScreenBadge = document.getElementById('activeScreenBadge');
  const statusBox = document.getElementById('statusBox');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');

  // Adım kartları ve butonları
  const stepCards = {
    grup: document.getElementById('card-grup'),
    tip: document.getElementById('card-tip'),
    arac: document.getElementById('card-arac'),
  };
  const stepBadges = {
    grup: document.getElementById('badge-grup'),
    tip: document.getElementById('badge-tip'),
    arac: document.getElementById('badge-arac'),
  };
  const fillButtons = document.querySelectorAll('.fill-btn');
  const saveButtons = document.querySelectorAll('.save-btn');

  // Uygulama Durumu (State)
  let state = {
    vehicles: [],      // Okunan ve sıralanan araç satırları
    selectedIndex: -1, // Seçili araç indeksi
    fileName: '',      // Yüklenen dosya adı
    stepState: {},     // grup/tip/arac: 'idle' | 'working' | 'filled' | 'saved' | 'error'
    currentScreen: null // Aktif sekmedeki sayfanın adımı ('grup' | 'tip' | 'arac' | null)
  };

  // ---------- Durum Mesajı Güncelleme ----------
  function setStatus(kind, text) {
    statusBox.className = `status-box status-${kind}`;
    if (kind === 'error') {
      statusIcon.textContent = '⛔';
    } else if (kind === 'ok') {
      statusIcon.textContent = '✅';
    } else if (kind === 'progress') {
      statusIcon.textContent = '⏳';
    } else {
      statusIcon.textContent = 'ℹ️';
    }
    statusText.textContent = text;
  }

  // ---------- Adım Rozetleri Güncelleme ----------
  function updateBadges() {
    const labels = {
      idle: 'Bekliyor',
      working: 'İşleniyor...',
      filled: 'Dolduruldu',
      saved: 'Kaydedildi',
      error: 'Durduruldu'
    };

    ['grup', 'tip', 'arac'].forEach((step) => {
      const s = state.stepState[step] || 'idle';
      const badge = stepBadges[step];
      badge.className = `badge badge-${s}`;
      badge.textContent = labels[s] || 'Bekliyor';
    });
  }

  // ---------- Buton Durumları ----------
  function updateButtons() {
    const hasVehicles = state.vehicles.length > 0 && state.selectedIndex >= 0;
    vehicleSelect.disabled = state.vehicles.length === 0;
    prevBtn.disabled = !hasVehicles || state.selectedIndex <= 0;
    nextBtn.disabled = !hasVehicles || state.selectedIndex >= state.vehicles.length - 1;

    fillButtons.forEach((btn) => {
      btn.disabled = !hasVehicles;
    });
    saveButtons.forEach((btn) => {
      btn.disabled = !hasVehicles;
    });

    if (hasVehicles) {
      vehicleCountEl.textContent = `${state.selectedIndex + 1} / ${state.vehicles.length}`;
    } else {
      vehicleCountEl.textContent = '0 / 0';
    }

    populateEditor();
  }

  // ---------- Araç Bilgileri Editörü ----------
  const editorInputs = {
    [COL.GRUP]: document.getElementById('edit_Grup'),
    [COL.MARKA]: document.getElementById('edit_Marka'),
    [COL.MODEL]: document.getElementById('edit_Model'),
    [COL.TIP]: document.getElementById('edit_Tip'),
    [COL.PLAKA]: document.getElementById('edit_Plaka'),
    [COL.VITES]: document.getElementById('edit_Vites'),
    [COL.YAKIT]: document.getElementById('edit_Yakit'),
    [COL.SIPP]: document.getElementById('edit_SIPP'),
    [COL.PROVIZYON]: document.getElementById('edit_Provizyon'),
    [COL.MUAFIYET]: document.getElementById('edit_Muafiyet'),
    [COL.SURUCU_YAS]: document.getElementById('edit_SurucuYas'),
    [COL.GENC_YAS]: document.getElementById('edit_GencYas'),
    [COL.EHLIYET]: document.getElementById('edit_Ehliyet'),
    [COL.KOLTUK]: document.getElementById('edit_Koltuk'),
    [COL.KAPI]: document.getElementById('edit_Kapi'),
    [COL.BUYUK_BAGAJ]: document.getElementById('edit_BuyukBagaj'),
    [COL.KUCUK_BAGAJ]: document.getElementById('edit_KucukBagaj'),
  };

  function populateEditor() {
    const cur = state.vehicles[state.selectedIndex];
    const disabled = !cur;

    Object.entries(editorInputs).forEach(([colKey, inputEl]) => {
      if (!inputEl) return;
      inputEl.disabled = disabled;
      if (cur) {
        inputEl.value = cur[colKey] ?? '';
      } else {
        inputEl.value = '';
      }
    });
  }

  // Inputlardaki değişiklikleri anında seçili araca ve storage'a yansıt
  Object.entries(editorInputs).forEach(([colKey, inputEl]) => {
    if (!inputEl) return;
    inputEl.addEventListener('input', () => {
      const cur = state.vehicles[state.selectedIndex];
      if (!cur) return;

      cur[colKey] = inputEl.value;

      // Eğer Plaka, Marka veya Model değiştiyse dropdown etiketini güncelle
      if (colKey === COL.PLAKA || colKey === COL.MARKA || colKey === COL.MODEL) {
        const opt = vehicleSelect.options[state.selectedIndex];
        if (opt) opt.textContent = vehicleLabel(cur);
      }

      // Değişiklik yapıldığında adım durumlarını sıfırla ki kullanıcı tekrar deneyebilsin
      state.stepState = { grup: 'idle', tip: 'idle', arac: 'idle' };
      updateBadges();
      setStatus('idle', `Veri güncellendi (${colKey}: "${inputEl.value}"). Tekrar Doldur'a basabilirsiniz.`);

      persistState();
    });
  });

  // Editor Açma / Kapama (Toggle)
  const toggleEditor = document.getElementById('toggleEditor');
  const editorBody = document.getElementById('editorBody');
  const editorToggleIcon = document.getElementById('editorToggleIcon');
  if (toggleEditor && editorBody) {
    toggleEditor.addEventListener('click', () => {
      const isHidden = editorBody.style.display === 'none';
      editorBody.style.display = isHidden ? 'flex' : 'none';
      editorToggleIcon.textContent = isHidden ? '▼' : '▶';
    });
  }

  // Detay Alanları Açma / Kapama (Toggle Details)
  const toggleDetails = document.getElementById('toggleDetails');
  const detailsBody = document.getElementById('detailsBody');
  const detailsToggleIcon = document.getElementById('detailsToggleIcon');
  if (toggleDetails && detailsBody) {
    toggleDetails.addEventListener('click', () => {
      const isHidden = detailsBody.style.display === 'none';
      detailsBody.style.display = isHidden ? 'flex' : 'none';
      detailsToggleIcon.textContent = isHidden ? '▼' : '▸';
    });
  }

  // ---------- Aktif Ekran Kontrolü ----------
  async function checkActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        state.currentScreen = null;
        activeScreenBadge.textContent = 'Bağlantı yok';
        activeScreenBadge.className = 'screen-badge';
        return;
      }

      const stepKey = stepFromUrl(tab.url);
      state.currentScreen = stepKey;

      // Kart vurgulama
      Object.keys(stepCards).forEach((k) => {
        if (k === stepKey) {
          stepCards[k].classList.add('active-screen');
        } else {
          stepCards[k].classList.remove('active-screen');
        }
      });

      if (stepKey) {
        activeScreenBadge.textContent = STEPS[stepKey].name;
        activeScreenBadge.className = 'screen-badge matched';
      } else {
        activeScreenBadge.textContent = 'Türev Dışı';
        activeScreenBadge.className = 'screen-badge mismatched';
      }
    } catch (e) {
      console.warn('Sekme kontrol hatası:', e);
    }
  }

  // ---------- Durumu Kaydet (Storage) ----------
  async function persistState() {
    await chrome.storage.local.set({
      appState: {
        vehicles: state.vehicles,
        selectedIndex: state.selectedIndex,
        fileName: state.fileName,
        stepState: state.stepState
      }
    });
  }

  // ---------- Durumu Geri Yükle (Restore) ----------
  async function restoreState() {
    const { appState, status } = await chrome.storage.local.get(['appState', 'status']);
    if (appState && appState.vehicles && appState.vehicles.length > 0) {
      state.vehicles = appState.vehicles;
      state.selectedIndex = appState.selectedIndex >= 0 ? appState.selectedIndex : 0;
      state.fileName = appState.fileName || '';
      state.stepState = appState.stepState || {};

      fileNameEl.textContent = state.fileName || 'Kayıtlı Excel';
      fileInfoEl.textContent = `${state.vehicles.length} araç yüklü`;

      populateVehicleSelect();
      vehicleSelect.value = state.selectedIndex;
      updateButtons();
      updateBadges();

      if (status && status.text) {
        setStatus(status.kind || 'idle', status.text);
      } else {
        const cur = state.vehicles[state.selectedIndex];
        setStatus('idle', `Seçili araç: ${vehicleLabel(cur)}`);
      }
    }
    await checkActiveTab();
  }

  // ---------- Araç Select Menüsünü Doldur ----------
  function populateVehicleSelect() {
    vehicleSelect.innerHTML = '';
    if (state.vehicles.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Önce Excel dosyası seçin';
      vehicleSelect.appendChild(opt);
      return;
    }

    state.vehicles.forEach((row, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = vehicleLabel(row);
      vehicleSelect.appendChild(opt);
    });
  }

  // ---------- Excel Okuma (SheetJS) ----------
  async function handleExcelFile(file) {
    if (!file) return;
    setStatus('progress', 'Excel okunuyor...');

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });

      // Araclar sayfası kontrolü
      const sheetName = wb.SheetNames.find((s) => s.trim().toLowerCase() === 'araclar');
      if (!sheetName) {
        throw new StopError("Excel dosyasında 'Araclar' sayfası bulunamadı. Lütfen doğru şablonu seçin.");
      }

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

      if (!rows || rows.length === 0) {
        throw new StopError("'Araclar' sayfasında hiçbir veri satırı bulunamadı.");
      }

      // Her satırın zorunlu alanlarını doğrula
      for (const row of rows) {
        // String olarak temizle
        Object.keys(row).forEach((k) => {
          row[k] = String(row[k] ?? '').trim();
        });
        checkRow(row);
      }

      // Plaka sütununa göre doğal sıralama (BANGKOK 01, BANGKOK 02, BANGKOK 10)
      rows.sort((a, b) => {
        const pA = a[COL.PLAKA] || '';
        const pB = b[COL.PLAKA] || '';
        return pA.localeCompare(pB, 'tr', { numeric: true, sensitivity: 'base' });
      });

      state.vehicles = rows;
      state.selectedIndex = 0;
      state.fileName = file.name;
      state.stepState = { grup: 'idle', tip: 'idle', arac: 'idle' };

      fileNameEl.textContent = file.name;
      fileInfoEl.textContent = `${rows.length} araç başarıyla yüklendi`;

      populateVehicleSelect();
      vehicleSelect.value = 0;
      updateButtons();
      updateBadges();

      const firstCar = rows[0];
      const msg = `Excel başarıyla yüklendi. İlk araç: ${vehicleLabel(firstCar)}`;
      setStatus('ok', msg);
      await chrome.storage.local.set({ status: { kind: 'ok', text: msg, at: Date.now() } });
      await persistState();

    } catch (err) {
      console.error('Excel okuma hatası:', err);
      const reason = err instanceof StopError ? err.reason : `dosya okunurken bir hata oluştu: ${err.message || err}`;
      const errText = stopText(reason);
      setStatus('error', errText);
      await chrome.storage.local.set({ status: { kind: 'error', text: errText, at: Date.now() } });
    }
  }

  // ---------- Sekme ve Mesaj İletişimi ----------
  async function executeAction(actionType, step) {
    await checkActiveTab();

    // 1. Ekran doğrulama: Açık olan sayfa bu adımın ekranı mı?
    if (state.currentScreen !== step) {
      const errText = wrongScreenMessage(step);
      setStatus('error', errText);
      state.stepState[step] = 'error';
      updateBadges();
      await chrome.storage.local.set({
        status: { kind: 'error', text: errText, step, at: Date.now() },
        stepState: state.stepState
      });
      return;
    }

    const curVehicle = state.vehicles[state.selectedIndex];
    if (!curVehicle) {
      setStatus('error', stopText('listeden seçili bir araç bulunamadı.'));
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      setStatus('error', stopText('aktif tarayıcı sekmesi bulunamadı.'));
      return;
    }

    // Durumu 'working' yap
    state.stepState[step] = 'working';
    updateBadges();
    setStatus('progress', `${STEPS[step].name} işlemi yapılıyor...`);

    try {
      // Content script'in yüklü olduğundan emin olmak için önce ping at
      let isReady = false;
      try {
        const pong = await chrome.tabs.sendMessage(tab.id, { action: 'checkScreen' });
        if (pong) isReady = true;
      } catch (e) {
        // Enjekte edilmemişse sayfayı yenilemeden scripting ile inject edebiliriz
      }

      if (!isReady) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/common.js', 'content/steps.js', 'content/router.js']
        });
        await new Promise((r) => setTimeout(r, 150));
      }

      // Mesajı ilet
      chrome.tabs.sendMessage(tab.id, {
        action: actionType,
        step,
        row: curVehicle,
        currentState: state.stepState
      }, (response) => {
        if (chrome.runtime.lastError) {
          const reason = chrome.runtime.lastError.message || 'sekme ile iletişim kurulamadı.';
          const txt = stopText(reason);
          setStatus('error', txt);
          state.stepState[step] = 'error';
          updateBadges();
        }
      });

    } catch (err) {
      const reason = err instanceof StopError ? err.reason : (err.message || 'işlem sırasında hata oluştu.');
      const txt = stopText(reason);
      setStatus('error', txt);
      state.stepState[step] = 'error';
      updateBadges();
    }
  }

  // ---------- Olay Dinleyicileri (Event Listeners) ----------

  // Dosya seçimi
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleExcelFile(file);
  });

  // Araç seçimi değiştiğinde
  vehicleSelect.addEventListener('change', async (e) => {
    state.selectedIndex = parseInt(e.target.value, 10);
    state.stepState = { grup: 'idle', tip: 'idle', arac: 'idle' };
    updateButtons();
    updateBadges();
    const cur = state.vehicles[state.selectedIndex];
    if (cur) {
      const msg = `Seçili araç: ${vehicleLabel(cur)}`;
      setStatus('idle', msg);
    }
    await persistState();
  });

  // İleri / Geri Butonları
  prevBtn.addEventListener('click', async () => {
    if (state.selectedIndex > 0) {
      state.selectedIndex--;
      vehicleSelect.value = state.selectedIndex;
      state.stepState = { grup: 'idle', tip: 'idle', arac: 'idle' };
      updateButtons();
      updateBadges();
      const cur = state.vehicles[state.selectedIndex];
      setStatus('idle', `Seçili araç: ${vehicleLabel(cur)}`);
      await persistState();
    }
  });

  nextBtn.addEventListener('click', async () => {
    if (state.selectedIndex < state.vehicles.length - 1) {
      state.selectedIndex++;
      vehicleSelect.value = state.selectedIndex;
      state.stepState = { grup: 'idle', tip: 'idle', arac: 'idle' };
      updateButtons();
      updateBadges();
      const cur = state.vehicles[state.selectedIndex];
      setStatus('idle', `Seçili araç: ${vehicleLabel(cur)}`);
      await persistState();
    }
  });

  // Form linkleri (Araç Grubu, Tip Tanımı, Yeni Araç)
  ['grup', 'tip', 'arac'].forEach((step) => {
    const link = document.getElementById(`link-${step}`);
    if (link) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          await chrome.tabs.update(tab.id, { url: STEPS[step].url });
          // Linke tıklandıktan sonra sekmeyi bekle
          setTimeout(checkActiveTab, 500);
        }
      });
    }
  });

  // Doldur Butonları
  fillButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = btn.getAttribute('data-step');
      executeAction('fillStep', step);
    });
  });

  // Kaydet Butonları
  saveButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = btn.getAttribute('data-step');
      executeAction('saveStep', step);
    });
  });

  // Storage değişikliklerini dinle (Content script'ten gelen raporlar için)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.status && changes.status.newValue) {
      const s = changes.status.newValue;
      setStatus(s.kind || 'idle', s.text || '');
    }

    if (changes.stepState && changes.stepState.newValue) {
      state.stepState = { ...state.stepState, ...changes.stepState.newValue };
      updateBadges();
      persistState();
    }
  });

  // Yan panel açıkken sekme değişimlerini ve URL güncellemelerini dinle
  chrome.tabs.onActivated.addListener(() => {
    checkActiveTab();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      checkActiveTab();
    }
  });

  // İlk açılışta başlat
  await restoreState();
});
