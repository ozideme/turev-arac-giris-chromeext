/*
 * Ortak yardımcılar. Hem popup'ta hem content script'te yüklenir.
 * IIFE + globalThis.TRV: script iki kez enjekte edilirse "already declared" hatası vermesin diye.
 */
(() => {
  if (globalThis.TRV && globalThis.TRV.common) return;
  const TRV = (globalThis.TRV = globalThis.TRV || {});

  // ---------- Metin normalleştirme ----------
  const TR_MAP = { 'İ': 'I', 'I': 'I', 'ı': 'I', 'i': 'I', 'Ş': 'S', 'ş': 'S', 'Ğ': 'G', 'ğ': 'G',
    'Ü': 'U', 'ü': 'U', 'Ö': 'O', 'ö': 'O', 'Ç': 'C', 'ç': 'C' };

  /** Büyük/küçük harf, Türkçe karakter ve fazla boşluk farkını yok sayar. */
  function norm(value) {
    return String(value ?? '')
      .replace(/[İIıiŞşĞğÜüÖöÇç]/g, (ch) => TR_MAP[ch])
      .toUpperCase()
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Görüntü için Türkçe büyük harf (NISSAN gibi mesajlarda). */
  function upper(value) {
    return String(value ?? '').trim().toLocaleUpperCase('tr-TR');
  }

  // ---------- Excel sütunları ----------
  const COL = {
    MARKA: 'Marka', MODEL: 'Model', VITES: 'Vites', YAKIT: 'Yakıt Türü',
    SURUCU_YAS: 'Sürücü Yaşı', GENC_YAS: 'Genç Sürücü Yaşı',
    EHLIYET: 'Ehliyet Yılı', GENC_EHLIYET: 'Genç Ehliyet Yılı',
    PROVIZYON: 'Provizyon Ücreti', MUAFIYET: 'Muafiyet Bedeli', SIPP: 'SIPP',
    KOLTUK: 'Koltuk Sayısı', KAPI: 'Kapı Sayısı', BUYUK_BAGAJ: 'Büyük Bagaj', KUCUK_BAGAJ: 'Küçük Bagaj',
    PLAKA: 'Plaka', TIP: 'Tip', GRUP: 'Grup Adı', ADET: 'Araç Sayısı',
  };
  /** Boş olamayacak sütunlar. Tip boşsa Model kullanılır, Araç Sayısı okunmaz. */
  const REQUIRED = [COL.MARKA, COL.MODEL, COL.VITES, COL.YAKIT, COL.SURUCU_YAS, COL.GENC_YAS,
    COL.EHLIYET, COL.GENC_EHLIYET, COL.PROVIZYON, COL.MUAFIYET, COL.SIPP, COL.KOLTUK, COL.KAPI,
    COL.BUYUK_BAGAJ, COL.KUCUK_BAGAJ, COL.PLAKA, COL.GRUP];
  const ALL_COLUMNS = Object.values(COL);

  function tipOf(row) {
    return (row[COL.TIP] || '').trim() || (row[COL.MODEL] || '').trim();
  }

  function vehicleLabel(row) {
    return `${row[COL.PLAKA]} – ${row[COL.MARKA]} ${row[COL.MODEL]}`;
  }

  // ---------- Adımlar ----------
  const STEPS = {
    grup: { key: 'grup', name: 'Araç Grubu Tanımı', path: '/arac_grubu.aspx',
      url: 'https://t1.trvcar.com/Arac_Grubu.Aspx', saveId: 'Up_Button1' },
    tip: { key: 'tip', name: 'Tip Tanımı', path: '/arac_tipi_tanimlama.aspx',
      url: 'https://t1.trvcar.com/Arac_Tipi_Tanimlama.Aspx', saveId: 'ContentPlaceHolder1_Button1' },
    arac: { key: 'arac', name: 'Yeni Araç', path: '/arac_kayit.aspx',
      url: 'https://t1.trvcar.com/Arac_Kayit.Aspx', saveId: 'Up_Button1' },
  };
  const HOST = 't1.trvcar.com';

  /** Adres çubuğundaki adrese göre hangi adımın ekranında olunduğunu bulur. */
  function stepFromUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname.toLowerCase() !== HOST) return null;
      const p = u.pathname.toLowerCase();
      return Object.values(STEPS).find((s) => s.path === p)?.key || null;
    } catch {
      return null;
    }
  }

  function wrongScreenMessage(stepKey) {
    return `Şu an yanlış form ekranındasın. Lütfen ${STEPS[stepKey].name} ekranına gir.`;
  }

  // ---------- Hata ----------
  /** Bilerek durdurma. reason "Durduruldu çünkü ..." cümlesinin devamıdır. */
  class StopError extends Error {
    constructor(reason) {
      super(reason);
      this.name = 'StopError';
      this.reason = reason;
    }
  }
  const stopText = (reason) => `Durduruldu çünkü ${reason}`;

  /** Satırdaki zorunlu hücrelerden boş olanı bulur. */
  function checkRow(row) {
    for (const col of REQUIRED) {
      if (!String(row[col] ?? '').trim()) {
        throw new StopError(`${row[COL.PLAKA] || 'seçili'} satırında "${col}" hücresi boş. Excel'i düzeltip dosyayı yeniden seç.`);
      }
    }
  }

  TRV.common = {
    norm, upper, COL, REQUIRED, ALL_COLUMNS, tipOf, vehicleLabel,
    STEPS, HOST, stepFromUrl, wrongScreenMessage, StopError, stopText, checkRow,
  };
})();
