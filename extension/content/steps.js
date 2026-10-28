/*
 * Form doldurma mantığı: Araç Grubu Tanımı, Tip Tanımı, Yeni Araç.
 * Kaydet butonlarına sadece saveStep() basar; o da yalnızca popup'taki Kaydet ile çağrılır.
 */
(() => {
  if (globalThis.TRV && globalThis.TRV.steps) return;
  const TRV = globalThis.TRV;
  const { norm, upper, COL, tipOf, STEPS, StopError, stopText, checkRow } = TRV.common;

  // ---------- Durum bildirimi (popup storage'dan okur) ----------
  async function setStepState(step, value) {
    const { stepState = {} } = await chrome.storage.local.get('stepState');
    stepState[step] = value;
    await chrome.storage.local.set({ stepState });
  }

  async function report(step, kind, text, state) {
    await chrome.storage.local.set({ status: { kind, text, step, at: Date.now() } });
    if (state) await setStepState(step, state);
  }

  // ---------- DOM yardımcıları ----------
  const $ = (id) => document.getElementById(id);

  function need(id, label) {
    const el = $(id);
    if (!el) throw new StopError(`formda ${label || id} alanı (${id}) bulunamadı.`);
    return el;
  }

  function mark(el, color) {
    el.style.outline = `2px solid ${color}`;
    el.style.outlineOffset = '1px';
  }

  function fire(el, ...types) {
    for (const t of types) el.dispatchEvent(new Event(t, { bubbles: true }));
  }

  function setText(id, value) {
    const el = need(id);
    el.focus?.();
    el.value = String(value).trim();
    fire(el, 'input', 'change');
    el.blur?.();
    mark(el, '#22c55e');
  }

  const optText = (o) => (o.textContent || '').replace(/\u00a0/g, ' ').trim();

  /**
   * Excel değerine karşılık gelen <option>'ı bulur.
   * 1) birebir, 2) büyük/küçük harf + Türkçe karakter yok sayılarak. Sonra aynısı takma adlar için.
   * Bulamazsa ya da birden fazla bulursa null + sebep döner; asla tahmin etmez.
   */
  function findOption(select, wanted, aliases = []) {
    const opts = Array.from(select.options);
    for (const cand of [wanted, ...aliases]) {
      const c = String(cand).trim();
      const exact = opts.filter((o) => optText(o) === c);
      if (exact.length === 1) return { option: exact[0] };
      if (exact.length > 1) return { option: null, many: exact.map(optText) };
      const loose = opts.filter((o) => norm(optText(o)) === norm(c));
      if (loose.length === 1) return { option: loose[0] };
      if (loose.length > 1) return { option: null, many: loose.map(optText) };
    }
    return { option: null, many: null };
  }

  /** findOption + anlaşılır durdurma mesajı. */
  function resolveOption(id, wanted, { aliases = [], notFound, label } = {}) {
    const select = need(id, label);
    const r = findOption(select, wanted, aliases);
    if (r.option) return { select, option: r.option };
    if (r.many) {
      throw new StopError(`${label || id} listesinde "${wanted}" ile eşleşen birden fazla seçenek var (${r.many.join(', ')}). Hangisi olduğuna karar veremedim.`);
    }
    throw new StopError(notFound || `${label || id} listesinde "${wanted}" seçeneği yok.`);
  }

  function applyOption(select, option, color = '#22c55e') {
    select.value = option.value;
    option.selected = true;
    fire(select, 'change');
    mark(select, color);
  }

  const isSelected = (select, option) => select.selectedIndex === option.index;

  /** Seçimden sonra sayfa (veya UpdatePanel) yenileniyor mu? */
  const hasPostBack = (el) => /__doPostBack/i.test(el.getAttribute('onchange') || '');

  let unloading = false;
  window.addEventListener('beforeunload', () => { unloading = true; });
  window.addEventListener('pagehide', () => { unloading = true; });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const signature = (id) => {
    const el = $(id);
    return el ? Array.from(el.options || []).map((o) => o.value).join('|') : '';
  };

  /**
   * Bir liste seçildikten sonra sayfa değişikliğini bekler.
   * - Tam yenilemede script ölür, bu fonksiyon hiç dönmez; yeni sayfada router kaldığı yerden devam eder.
   * - Kısmi yenilemede (UpdatePanel) izlenen elemanlar değişince 'changed' döner.
   */
  async function waitForChange(watchIds, timeoutMs) {
    const refs = watchIds.map((id) => [id, $(id), signature(id)]);
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      await sleep(150);
      if (unloading) return new Promise(() => {}); // sayfa gidiyor, yeni sayfa devralacak
      if (refs.some(([id, el, sig]) => $(id) !== el || signature(id) !== sig)) {
        await sleep(300); // DOM'un oturmasını bekle
        return 'changed';
      }
    }
    if (unloading) return new Promise(() => {});
    return 'timeout';
  }

  // ---------- Yakıt ----------
  /** Excel değeri ana veridir. Sadece listede aynısı yoksa eşdeğer yazımı dener. */
  function fuelAliases(fuel) {
    const n = norm(fuel);
    if (n === 'HIBRIT') return ['Hybrid'];
    if (n === 'HYBRID') return ['Hibrit'];
    return [];
  }

  // =====================================================================
  // 1. Araç Grubu Tanımı
  // =====================================================================
  const GRUP_TEXT = [
    ['TextBox2', COL.GRUP], ['TxtSurucu_Yas', COL.SURUCU_YAS], ['TxtGenc_Yas', COL.GENC_YAS],
    ['TxtEhliyet_Yil', COL.EHLIYET], ['TxtGenc_Surucu', COL.GENC_EHLIYET],
    ['Provizyon_Ucreti', COL.PROVIZYON], ['Muafiyet_Bedeli', COL.MUAFIYET], ['TxtSIPP', COL.SIPP],
    ['Marka', COL.MARKA], ['Tipi', COL.MODEL], ['Koltuk_Sayisi', COL.KOLTUK], ['Kapi_Sayisi', COL.KAPI],
    ['Buyuk_Bagaj', COL.BUYUK_BAGAJ], ['Kucuk_Bagaj', COL.KUCUK_BAGAJ], ['TxtAciklama', COL.MODEL],
  ];

  /** Sistemde aynı isimde grup var mı? Hem bu sayfadaki GridView1'e hem de Tip Tanımı listesine bakar. */
  async function existingGroups() {
    const list = new Set();

    // 1. Bu sayfadaki GridView1 tablosunun ilk sütunundaki tüm araç gruplarını topla
    const grid = $('GridView1');
    if (grid) {
      const rows = grid.querySelectorAll('tr');
      for (const tr of rows) {
        const firstTd = tr.querySelector('td');
        if (firstTd) {
          const txt = optText(firstTd);
          if (txt) list.add(txt);
        }
      }
    }

    // 2. Ayrıca Tip Tanımı sayfasındaki tüm grupları arka planda kontrol et
    try {
      const res = await fetch(STEPS.tip.url, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const sel = doc.getElementById('ContentPlaceHolder1_Grubu');
        if (sel) {
          for (const opt of sel.options) {
            const txt = optText(opt);
            if (txt) list.add(txt);
          }
        }
      }
    } catch (e) {
      // GridView1 doluysa fetch hatası olsa bile eldekilerle devam edebilir
      if (list.size === 0) {
        throw new StopError('mevcut araç grupları kontrol edilemedi. Oturumun açık olduğundan emin olup tekrar dene.');
      }
    }

    return Array.from(list);
  }

  async function fillGrup(row) {
    const group = row[COL.GRUP].trim();

    // Önce her şeyi kontrol et, sonra doldur (yarım doldurulmuş form kalmasın).
    for (const [id] of GRUP_TEXT) need(id);
    const plan = [
      resolveOption('Provizyon_Doviz', 'EURO', { label: 'Provizyon Döviz' }),
      resolveOption('Yakit_Turu', row[COL.YAKIT], { label: 'Yakıt Türü', aliases: fuelAliases(row[COL.YAKIT]),
        notFound: `"${row[COL.YAKIT]}" yakıt türü Araç Grubu ekranındaki listede yok.` }),
      resolveOption('Vites', row[COL.VITES], { label: 'Vites',
        notFound: `"${row[COL.VITES]}" vites türü Araç Grubu ekranındaki listede yok.` }),
    ];

    const groups = await existingGroups();
    // Bu sayfada grup tablosu varsa oraya da bak.
    const onPage = Array.from(document.querySelectorAll('table td')).map((td) => td.textContent);
    const dup = [...groups, ...onPage].find((g) => norm(g) === norm(group));
    if (dup) {
      throw new StopError(`aynı isimde başka bir araç grubu var (${dup.trim()}). Lütfen bir şeyleri değiştirip tekrar deneyin.`);
    }

    for (const [id, col] of GRUP_TEXT) setText(id, row[col]);
    for (const { select, option } of plan) applyOption(select, option);
    return `${STEPS.grup.name} dolduruldu: ${group}. Kontrol edip Kaydet'e bas.`;
  }

  // =====================================================================
  // 2. Tip Tanımı
  // =====================================================================
  async function fillTip(row) {
    const marka = row[COL.MARKA];
    const group = row[COL.GRUP].trim();
    // Bu ekranda Benzin yok: Benzin → Kurşunsuz (sadece burada).
    const fuel = norm(row[COL.YAKIT]) === 'BENZIN' ? 'Kurşunsuz' : row[COL.YAKIT];

    need('ContentPlaceHolder1_Arac_Tipi', 'Araç Tipi');
    const plan = [
      resolveOption('ContentPlaceHolder1_Marka', marka, { label: 'Marka',
        notFound: `${upper(marka)} markası listede yok.` }),
      resolveOption('ContentPlaceHolder1_Vites', row[COL.VITES], { label: 'Vites',
        notFound: `"${row[COL.VITES]}" vites türü Tip Tanımı ekranındaki listede yok.` }),
      resolveOption('ContentPlaceHolder1_Grubu', group, { label: 'Araç Grubu',
        notFound: `${group} grubu listede bulunamadı.` }),
      resolveOption('ContentPlaceHolder1_Yakit_Turu', fuel, { label: 'Yakıt Türü', aliases: fuelAliases(fuel),
        notFound: `"${fuel}" yakıt türü Tip Tanımı ekranındaki listede yok.` }),
    ];

    for (const { select, option } of plan) applyOption(select, option);
    setText('ContentPlaceHolder1_Arac_Tipi', tipOf(row));
    return `${STEPS.tip.name} dolduruldu: ${upper(marka)} ${tipOf(row)}. Kontrol edip Kaydet'e bas.`;
  }

  // =====================================================================
  // 3. Yeni Araç (Marka ve Tip seçilince sayfa yenilenir)
  // =====================================================================
  const JOB_KEY = 'aracJob';
  const JOB_FRESH_MS = 60_000;
  const POSTBACK_TIMEOUT_MS = 25_000;
  const MAX_PHASE_RUNS = 3;

  const saveJob = (job) => chrome.storage.local.set({ [JOB_KEY]: { ...job, updatedAt: Date.now() } });
  const clearJob = () => chrome.storage.local.remove(JOB_KEY);
  async function getJob() {
    const { [JOB_KEY]: job } = await chrome.storage.local.get(JOB_KEY);
    return job || null;
  }

  async function startArac(row) {
    for (const id of ['Marka', 'Arac_Tipi', 'Grubu', 'Vites', 'Yakit_Turu', 'Plaka_X']) need(id);
    const job = { row, phase: 'marka', runs: {}, corrections: [], startedAt: Date.now() };
    await saveJob(job);
    return runArac(job);
  }

  /** Aşama makinesi: marka → tip → kontrol → bitti. Her aşama sayfa yenilense de storage'dan devam eder. */
  async function runArac(job) {
    const { row } = job;
    const marka = row[COL.MARKA];
    const tip = tipOf(row);
    const group = row[COL.GRUP].trim();

    job.runs[job.phase] = (job.runs[job.phase] || 0) + 1;
    if (job.runs[job.phase] > MAX_PHASE_RUNS) {
      throw new StopError('Yeni Araç sayfası beklenmedik şekilde tekrar tekrar yenilendi.');
    }
    await saveJob(job);
    await report('arac', 'progress', `Yeni Araç dolduruluyor (${({ marka: 'marka', tip: 'tip', kontrol: 'grup/vites/yakıt' })[job.phase]})…`, 'working');

    if (job.phase === 'marka') {
      const { select, option } = resolveOption('Marka', marka, { label: 'Marka',
        notFound: `${upper(marka)} markası listede yok.` });
      job.phase = 'tip';
      await saveJob(job);
      if (isSelected(select, option) && findOption(need('Arac_Tipi'), tip).option) {
        return runArac(job); // marka zaten seçili, tip listesi dolu
      }
      applyOption(select, option);
      const r = await waitForChange(['Arac_Tipi'], POSTBACK_TIMEOUT_MS);
      if (r === 'timeout') throw new StopError(`${upper(marka)} markası seçildikten sonra Tip listesi dolmadı.`);
      return runArac(job);
    }

    if (job.phase === 'tip') {
      const m = resolveOption('Marka', marka, { label: 'Marka', notFound: `${upper(marka)} markası listede yok.` });
      if (!isSelected(m.select, m.option)) throw new StopError('sayfa yenilendikten sonra marka seçimi kayboldu.');
      const { select, option } = resolveOption('Arac_Tipi', tip, { label: 'Tip',
        notFound: `${tip} tipi ${upper(marka)} markasının tip listesinde yok. Önce Tip Tanımı adımını kaydet.` });
      job.phase = 'kontrol';
      await saveJob(job);
      if (isSelected(select, option)) return runArac(job);
      const expectPostBack = hasPostBack(select);
      applyOption(select, option);
      const r = await waitForChange(['Arac_Tipi', 'Grubu', 'Vites', 'Yakit_Turu'],
        expectPostBack ? POSTBACK_TIMEOUT_MS : 3000);
      if (r === 'timeout' && expectPostBack) throw new StopError(`${tip} tipi seçildikten sonra sayfa yenilenmedi.`);
      return runArac(job);
    }

    if (job.phase === 'kontrol') {
      const t = resolveOption('Arac_Tipi', tip, { label: 'Tip' });
      if (!isSelected(t.select, t.option)) throw new StopError('sayfa yenilendikten sonra tip seçimi kayboldu.');

      const checks = [
        ['Grubu', 'Araç Grubu', group, [], `${group} grubu listede bulunamadı.`],
        ['Vites', 'Vites', row[COL.VITES], [], `"${row[COL.VITES]}" vites türü Yeni Araç ekranındaki listede yok.`],
        ['Yakit_Turu', 'Yakıt Türü', row[COL.YAKIT], fuelAliases(row[COL.YAKIT]),
          `"${row[COL.YAKIT]}" yakıt türü Yeni Araç ekranındaki listede yok.`],
      ];
      // Önce hepsini çöz: eşleşmeyen varsa hiçbirine dokunmadan dur.
      const resolved = checks.map(([id, label, wanted, aliases, notFound]) =>
        ({ label, ...resolveOption(id, wanted, { label, aliases, notFound }) }));

      for (const { label, select, option } of resolved) {
        if (isSelected(select, option)) continue;
        const before = select.selectedIndex >= 0 ? optText(select.options[select.selectedIndex]) : '';
        job.corrections.push(`${label}: "${before || 'boş'}" → "${optText(option)}"`);
        await saveJob(job);
        const expectPostBack = hasPostBack(select);
        applyOption(select, option, '#f59e0b');
        if (expectPostBack) {
          const r = await waitForChange(['Grubu', 'Vites', 'Yakit_Turu'], POSTBACK_TIMEOUT_MS);
          if (r === 'timeout') throw new StopError(`${label} düzeltildikten sonra sayfa yenilenmedi.`);
          return runArac(job); // aynı aşamayı yeniden kontrol et
        }
      }

      setText('Plaka_X', row[COL.PLAKA]); // en son: yenilemeden etkilenmesin
      await clearJob();
      const fix = job.corrections.length ? ` Düzeltilenler: ${job.corrections.join('; ')}.` : '';
      return `${STEPS.arac.name} dolduruldu: ${row[COL.PLAKA]}.${fix} Kontrol edip Kaydet'e bas.`;
    }

    throw new StopError('Yeni Araç doldurma işinin durumu anlaşılamadı.');
  }

  /** Yeni Araç sayfası yüklenince yarım kalan iş varsa devam eder. */
  async function resumeArac() {
    const job = await getJob();
    if (!job) return;
    const age = Date.now() - (job.updatedAt || 0);
    if (age > JOB_FRESH_MS) {
      await clearJob();
      if (age < 10 * 60_000) {
        await report('arac', 'error', stopText('Yeni Araç sayfası zamanında yenilenmedi, doldurma yarım kaldı. Tekrar Doldur\'a bas.'), 'error');
      }
      return;
    }
    await runStep('arac', () => runArac(job));
  }

  // =====================================================================
  // Ortak çalıştırıcılar
  // =====================================================================
  async function runStep(step, fn) {
    try {
      const msg = await fn();
      await report(step, 'ok', msg, 'filled');
    } catch (err) {
      if (step === 'arac') await clearJob();
      const reason = err instanceof StopError ? err.reason : `beklenmeyen bir hata oluştu: ${err?.message || err}`;
      await report(step, 'error', stopText(reason), 'error');
      if (!(err instanceof StopError)) console.error('[Türev Araç Girişi]', err);
    }
  }

  function fillStep(step, row) {
    return runStep(step, async () => {
      checkRow(row);
      if (step === 'grup') return fillGrup(row);
      if (step === 'tip') return fillTip(row);
      if (step === 'arac') return startArac(row);
      throw new StopError('bilinmeyen adım.');
    });
  }

  async function saveStep(step) {
    try {
      if (step === 'arac') {
        const job = await getJob();
        if (job && Date.now() - (job.updatedAt || 0) <= JOB_FRESH_MS) {
          throw new StopError('Yeni Araç formu henüz doldurulmayı bitirmedi. Biraz bekleyip tekrar dene.');
        }
      }
      const id = STEPS[step].saveId;
      const btn = $(id);
      if (!btn) throw new StopError(`Kaydet butonu (${id}) bu sayfada bulunamadı.`);
      await report(step, 'ok', `${STEPS[step].name} için Kaydet'e basıldı. Sonucu sayfada kontrol et.`, 'saved');
      btn.click();
    } catch (err) {
      const reason = err instanceof StopError ? err.reason : `beklenmeyen bir hata oluştu: ${err?.message || err}`;
      await report(step, 'error', stopText(reason), 'error');
    }
  }

  TRV.steps = { fillStep, saveStep, resumeArac, findOption, fuelAliases };
})();
