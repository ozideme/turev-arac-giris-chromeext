# Excel Sütunları

| Sütun              | Açıklama                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Marka              | Excel Marka sütunu                                                                           |
| Model              | Excel Model sütunu                                                                           |
| Vites              | Excel, Türkçeleştirilmiş hali (skillFORM)                                                    |
| Yakıt Türü         | Excel, Türkçeleştirilmiş hali (skillFORM)                                                    |
| Sürücü Yaşı        | Excel                                                                                        |
| Genç Sürücü Yaşı   | Excel                                                                                        |
| Ehliyet Yılı       | Excel                                                                                        |
| Genç Ehliyet Yılı  | Excel                                                                                        |
| Provizyon Ücreti   | Excel                                                                                        |
| Provizyon Döviz    | Her zaman EURO                                                                               |
| Muafiyet Bedeli    | Excel                                                                                        |
| SIPP               | skill SIPP ile hazırlık adımında belirlenir, Excel'e yazılır                                 |
| Web Araç Marka     | Excel Marka sütunu                                                                           |
| Web Araç Tipi      | Excel Model sütunu                                                                           |
| Koltuk Sayısı      | Excel                                                                                        |
| Kapı Sayısı        | Excel                                                                                        |
| Büyük Bagaj        | Excel                                                                                        |
| Küçük Bagaj        | Excel                                                                                        |
| Açıklama           | Zorunlu değil. Excel Model sütunu yazılır                                                    |
| Plaka              | Gerçek plaka değil, aracı tanımak için verilen kod (örnek: `BANGKOK 01`)                     |
| Tip (isteğe bağlı) | Boşsa Model yazılır                                                                          |
| Grup adı           | `MARKA-MODEL-VITES-YAKIT`, tamamı büyük harf (örnek: `AUDI-Q3-OTOMATIK-DIZEL`). skillFORM ile Excel'de üretilir |
| Araç Sayısı        | Eklenti kullanmaz. Her satır için tek araç girilir, adet ayrı panelden yazılır                |

## Notlar

- skillFORM ve skill SIPP eklentiden önce çalışır. Eklenti hazır Excel'i okur ve sadece doldurur.
- Büyük harf kuralı sadece grup adı için geçerli, diğer alanlarda önemli değil.
- Şube eklenti tarafından seçilmez. Sistemde bir kez seçilince yeni kayıtlarda otomatik seçili geliyor.
- Kaydet butonlarına eklenti basmaz. Formu doldurur, kullanıcı kontrol edip kendisi kaydeder.
- Model adları skillFORM'da kısaltılmış gelir (`MU-X` → `MUX`, `MAZDA2 HATCHBACK` → `M2 HATCHBACK`). Eklenti Excel'deki değeri olduğu gibi kullanır, değiştirmez.
- Markalar Türev'de kullanıcı tarafından elle tanımlanır. Eklenti marka tanımlamaz. Listeden seçerken büyük/küçük harf farkını yok sayar (`Nissan` = `NISSAN`). Marka listede yoksa durur ve uyarır.
- Excel'deki bazı değerler kullanıcı tarafından elle doldurulabilir, Aciklama sayfasındaki rapor ile birebir uyuşmayabilir. Eklenti sadece Araclar sayfasını okur.

## Ekranlar ve seçiciler

Seçiciler Playwright codegen kaydından alındı. Sıra: 1. Grup Tanımı → 2. Tip Tanımı → 3. Yeni Araç.

### 1. Araç Grubu Tanımı

Menü: `getByRole('link', { name: ' Tanımlamalar ' })` → `getByRole('link', { name: ' Araç Grubu Tanımı' })`

| Alan | Seçici | Tip | Kaynak |
|---|---|---|---|
| Grup Bilgisi | `getByRole('textbox', { name: 'Grup Bilgisi (Örneğin: FIAT-' })` | metin | Grup adı |
| Sürücü Yaşı | `getByRole('textbox', { name: 'Sürücü Yaşı', exact: true })` | metin | Sürücü Yaşı |
| Genç Sürücü Yaşı | `getByRole('textbox', { name: 'Genç Sürücü Yaşı' })` | metin | Genç Sürücü Yaşı |
| Ehliyet Yılı | `getByRole('textbox', { name: 'Ehliyet Yılı', exact: true })` | metin | Ehliyet Yılı |
| Genç Ehliyet Yılı | `getByRole('textbox', { name: 'Genç Ehliyet Yılı' })` | metin | Genç Ehliyet Yılı |
| Provizyon Ücreti | `getByRole('textbox', { name: 'Provizyon Ücreti' })` | metin | Provizyon Ücreti |
| Provizyon Döviz | `#Provizyon_Doviz` | liste | sabit `EURO` |
| Muafiyet Bedeli | `#Muafiyet_Bedeli` | metin | Muafiyet Bedeli |
| SIPP | `getByRole('textbox', { name: 'SIPP' })` | metin | SIPP |
| Web Araç Marka | `getByRole('textbox', { name: 'Web Araç Marka' })` | metin | Marka |
| Web Araç Tipi | `getByRole('textbox', { name: 'Web Araç Tipi' })` | metin | Model |
| Koltuk Sayısı | `getByRole('textbox', { name: 'Koltuk Sayısı' })` | metin | Koltuk Sayısı |
| Kapı Sayısı | `getByRole('textbox', { name: 'Kapı Sayısı' })` | metin | Kapı Sayısı |
| Büyük Bagaj | `getByRole('textbox', { name: 'Büyük Bagaj' })` | metin | Büyük Bagaj |
| Küçük Bagaj | `getByRole('textbox', { name: 'Küçük Bagaj' })` | metin | Küçük Bagaj |
| Açıklama | `getByRole('textbox', { name: 'Açıklama (Örneğin: Ekonomik,' })` | metin | Model |
| Yakıt Türü | `#Yakit_Turu` | liste | Yakıt Türü |
| Vites | `#Vites` | liste | Vites |
| Kaydet | `#Button1` | buton | eklenti basmaz |

### 2. Tip Tanımı

Menü: `getByRole('link', { name: ' Tanımlamalar ' })` → `getByRole('link', { name: ' Tip Tanımı' })`

| Alan | Seçici | Tip | Kaynak |
|---|---|---|---|
| Marka | `#ContentPlaceHolder1_Marka` | liste | Marka |
| Vites | `#ContentPlaceHolder1_Vites` | liste | Vites |
| Grubu | `#ContentPlaceHolder1_Grubu` | liste | Grup adı (listede yoksa dur ve uyar) |
| Araç Tipi | `getByRole('textbox', { name: 'Araç Tipi Yazınız!' })` | metin | Tip, boşsa Model |
| Yakıt Türü | `#ContentPlaceHolder1_Yakit_Turu` | liste | Yakıt Türü |
| Kaydet | seçici eksik | buton | eklenti basmaz |

Listeler birbirine bağlı değil, seçimler elle yapılıyor.

### 3. Yeni Araç

Menü: `getByRole('link', { name: ' Araçlar ' })` → `getByRole('link', { name: ' Yeni Araç' })`

| Alan | Seçici | Tip | Kaynak |
|---|---|---|---|
| Plaka | `getByPlaceholder(' ', { exact: true })` (zayıf, id ile değiştirilecek) | metin | Plaka |
| Marka | `#Marka` | liste | Marka |
| Şube | `#Islem_Sube` | liste | eklenti dokunmaz, otomatik seçili gelir |
| Tip | seçici eksik | liste | Tip, boşsa Model |
| Araç Grubu | seçici eksik | liste | Grup adı |
| Vites | seçici eksik | liste | Vites |
| Yakıt Türü | seçici eksik | liste | Yakıt Türü |
| Kaydet | `getByRole('button', { name: 'Kaydet' })` | buton | eklenti basmaz |
