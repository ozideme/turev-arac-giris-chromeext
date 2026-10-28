# Form Eşleme: Excel → Türev

Bu dosya, eklentiyi yazacak modelin formların yapısını anlaması için hazırlandı. Seçiciler Türev'in canlı sayfalarından (27.10.2026) okunmuş gerçek `id` değerleridir.

## Genel kurallar

- Kaynak: Excel'in `Araclar` sayfası. 1. satır başlık, her satır bir araç.
- Sıra: 1. Araç Grubu Tanımı → 2. Tip Tanımı → 3. Yeni Araç. Her adım aynı Excel satırını kullanır.
- Eklenti formu doldurur, **Kaydet / Ekle butonlarına basmaz**. Kullanıcı kontrol edip kendisi kaydeder.
- **metin** alanına değer olduğu gibi yazılır, sonra `input` ve `change` olayları tetiklenir.
- **liste** (`<select>`) alanında seçenek metni Excel değeriyle eşleştirilir:
  1. Önce birebir eşleşme aranır.
  2. Yoksa büyük/küçük harf ve Türkçe karakter farkı yok sayılarak aranır (`İ→I`, `Ş→S`, `Ğ→G`, `Ü→U`, `Ö→O`, `Ç→C`, `ı→i`).
  3. Hâlâ yoksa ya da birden fazla seçenek eşleşiyorsa tahmin edilmez. Alan kırmızı işaretlenir, kullanıcı uyarılır.
- **Yakıt kuralı:** Yakıt alanına Excel'deki `Yakıt Türü` (grup adındaki yakıtla aynı) olduğu gibi seçilir. Kaynakta `Gasoline` geçiyorsa `Benzin`, `Petrol` geçiyorsa `Kurşunsuz` olur. Bu çeviriyi skillFORM yapar, eklenti değiştirmez. Tek istisna Tip Tanımı ekranı (aşağıya bak).
- Türev'deki grup adları karışık yazılmış (`AUDI-A4-OTOMATİK-DİZEL` ve `AUDI-Q3-OTOMATIK-DIZEL` aynı listede). Bu yüzden 2. kural grup listesi için özellikle gerekli.

## 1. Araç Grubu Tanımı

URL: `https://t1.trvcar.com/Arac_Grubu.Aspx`. Listeler birbirine bağlı değil, sayfa yenilenmez.

| Excel sütunu | Form alanı | id | Tip |
|---|---|---|---|
| Grup Adı | Grup Bilgisi | `TextBox2` | metin |
| Sürücü Yaşı | Sürücü Yaşı | `TxtSurucu_Yas` | metin |
| Genç Sürücü Yaşı | Genç Sürücü Yaşı | `TxtGenc_Yas` | metin |
| Ehliyet Yılı | Ehliyet Yılı | `TxtEhliyet_Yil` | metin |
| Genç Ehliyet Yılı | Genç Ehliyet Yılı | `TxtGenc_Surucu` | metin |
| Provizyon Ücreti | Provizyon Ücreti | `Provizyon_Ucreti` | metin |
| *(sabit)* `EURO` | Provizyon Döviz | `Provizyon_Doviz` | liste (TL, EURO) |
| Muafiyet Bedeli | Muafiyet Ücreti | `Muafiyet_Bedeli` | metin |
| SIPP | SIPP | `TxtSIPP` | metin |
| Marka | Web Araç Marka | `Marka` | metin |
| Model | Web Araç Tipi | `Tipi` | metin |
| Koltuk Sayısı | Koltuk Sayısı | `Koltuk_Sayisi` | metin |
| Kapı Sayısı | Kapı Sayısı | `Kapi_Sayisi` | metin |
| Büyük Bagaj | Büyük Bagaj | `Buyuk_Bagaj` | metin |
| Küçük Bagaj | Küçük Bagaj | `Kucuk_Bagaj` | metin |
| Model | Açıklama | `TxtAciklama` | metin |
| Yakıt Türü | Yakıt Türü | `Yakit_Turu` | liste (Dizel, Benzin, LPG, Elektrik, Hibrit, LPG-Benzin, Tanımsız) |
| Vites | Vites | `Vites` | liste (Otomatik, Düz) |
| – | Kaydet | `Up_Button1` (üst), `Button1` (alt) | buton, **basılmaz** |

Dokunulmayacak benzer alanlar: `Provizyon2_Ucreti`, `Provizyon2_Doviz`, `Muafiyet_Bedeli2` (ikinci muafiyet), `Yakit_Fiyati`, `Gunluk_KM`, `Max_KM`, `Km_Birim`, `Entegrasyon_Kod1`, `Web_Sira`. `Marka` ve `Tipi` bu sayfada metin kutusudur, Yeni Araç sayfasındaki `Marka` listesiyle karıştırılmamalı.

## 2. Tip Tanımı

URL: `https://t1.trvcar.com/Arac_Tipi_Tanimlama.Aspx`. Listeler birbirine bağlı değil, sayfa yenilenmez.

| Excel sütunu | Form alanı | id | Tip |
|---|---|---|---|
| Marka | Marka | `ContentPlaceHolder1_Marka` | liste (büyük harfli markalar) |
| Vites | Vites | `ContentPlaceHolder1_Vites` | liste (Otomatik, Düz) |
| Grup Adı | Araç Grubu | `ContentPlaceHolder1_Grubu` | liste (~880 grup) |
| Tip (boşsa Model) | Araç Tipi (Model) | `ContentPlaceHolder1_Arac_Tipi` | metin |
| Yakıt Türü | Yakıt Türü | `ContentPlaceHolder1_Yakit_Turu` | liste (Dizel, Kurşunsuz, LPG, Elektrik, Hibrit) |
| – | Ekle (formun altındaki ana buton) | `ContentPlaceHolder1_Button1` | buton, **basılmaz** |

**Dikkat:** Bu sayfadaki yakıt listesinde `Benzin` yok. Excel'de `Benzin` yazıyorsa bu ekranda `Kurşunsuz` seçilir. Diğer iki ekranda Excel'deki değer olduğu gibi kalır.

Dokunulmayacaklar: `ContentPlaceHolder1_Ek_Button1` (Araç Tipi kutusunun yanındaki küçük Ekle), `ContentPlaceHolder1_Button3` (Değiştir), `ContentPlaceHolder1_Button2` (Araç Bilgilerini Sistemden Çek), `ContentPlaceHolder1_Marka_Lst` (tablo filtresi).

## 3. Yeni Araç

URL: `https://t1.trvcar.com/Arac_Kayit.Aspx`

**Bu sayfada listeler bağlı ve sayfa yenileniyor (ASP.NET postback):**
- `Marka` değişince sayfa yenilenir, `Arac_Tipi` listesi o markanın tipleriyle dolar. Sayfa ilk açıldığında `Arac_Tipi` boştur.
- `Arac_Tipi` değişince sayfa yine yenilenir. Grup, vites ve yakıtı tipe göre kendisi dolduruyor olabilir.
- Sayfa yenilendiğinde content script yeniden yüklenir. Eklenti hangi satırı doldurduğunu ve hangi adımda kaldığını `chrome.storage` içinde tutmalı, sayfa yüklenince oradan devam etmeli.

Doldurma sırası:

1. `Marka` seç → sayfanın yenilenmesini bekle
2. `Arac_Tipi` seç → sayfanın yenilenmesini bekle
3. `Grubu`, `Vites`, `Yakit_Turu` alanlarına bak. Excel'le aynıysa dokunma, farklıysa düzelt ve kullanıcıya göster. Yakıt, Excel'deki değerle birebir seçilir (`Benzin` → `Benzin`, `Kurşunsuz` → `Kurşunsuz`).
4. `Plaka_X` doldur (en son, yenilemeden etkilenmesin diye)

| Excel sütunu | Form alanı | id | Tip |
|---|---|---|---|
| Marka | Marka | `Marka` | liste, postback |
| Tip (boşsa Model) | Tip | `Arac_Tipi` | liste, postback, markaya bağlı |
| Grup Adı | Araç Grubu | `Grubu` | liste |
| Vites | Vites | `Vites` | liste (Otomatik, Düz) |
| Yakıt Türü | Yakıt Türü | `Yakit_Turu` | liste (Dizel, Benzin, Kurşunsuz, LPG, Elektrik, Hybrid, LPG-Benzin) |
| Plaka | Plaka | `Plaka_X` | metin |
| – | Şube | `Islem_Sube` | liste, **dokunulmaz** (otomatik seçili gelir) |
| – | Kaydet | `Up_Button1` (üst), `Button1` (alt) | buton, **basılmaz** |

Dokunulmayacaklar: `Kabis_Etiket`, `Konum`, `Arac_Durumu`, `Pasif_Sebep`, `Model` (model yılı, Excel'deki Model değil), `Renk`, `KM`, `Yakit` (son yakıt seviyesi), `Web_Rez_Kapat`, `Ofis_Rez_Kapat`.

## Kullanılmayan sütunlar

- **Araç Sayısı:** eklenti okumaz. Her satır için tek araç girilir.

## Örnek satır

```json
{
  "Marka": "Nissan", "Model": "MARCH", "Vites": "Otomatik", "Yakıt Türü": "Benzin",
  "Sürücü Yaşı": 21, "Genç Sürücü Yaşı": 18, "Ehliyet Yılı": 3, "Genç Ehliyet Yılı": 3,
  "Provizyon Ücreti": 400, "Muafiyet Bedeli": 132, "SIPP": "EDAR",
  "Koltuk Sayısı": 5, "Kapı Sayısı": 5, "Büyük Bagaj": 2, "Küçük Bagaj": 3,
  "Plaka": "BANGKOK 01", "Tip": "MARCH", "Grup Adı": "NISSAN-MARCH-OTOMATIK-BENZIN", "Araç Sayısı": 1
}
```
