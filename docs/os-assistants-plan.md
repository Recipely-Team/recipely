# İşletim sistemi asistanları — Siri (iOS) + kısayollar/Gemini (Android)

Uygulama içi sesli asistanın **50 action**'lık vocabulary'sini telefonun kendi
asistanına açar. Plan `~/.claude/plans/i-erideki-sesli-asistan-yapt-k-warm-heron.md`;
bu dosya **ilerleme durumudur** — oturum kapanırsa buradan devam edilir.

## Durum panosu

| Faz | İş | Durum | PR |
|-----|----|-------|-----|
| 0 | Ölçüm ve karar kapısı | ✅ **bitti** (cihaz üstü Siri denemesi hariç) | — |
| 1 | Modül iskeleti + paylaşılan depo | ✅ **bitti** | [#423](https://github.com/Recipely-Team/recipely/pull/423) |
| 2 | Headless yol | ⬜ başlanmadı — **koşulsuz**, aşağıdaki D2'ye bak | — |
| 3 | iOS App Intents | ⬜ başlanmadı | — |
| 4 | Android kısayollar + AppFunctions | ⬜ başlanmadı | — |
| 5 | Gate'ler ve belgeler | 🟡 rule W + X kondu, kalanı Faz 3/4 sonrası | — |

Branch: `feat/os-assistants-spike`

---

## Faz 0 — Ölçüm ve karar kapısı

Amaç: Faz 2'nin gerekip gerekmediğini ve Swift dosyalarının nereye konacağını
ölçümle belirlemek. **Merge edilmez**, bulgular aşağıya yazılır.

- [x] `feat/os-assistants-spike` branch'i açıldı
- [x] `modules/recipely-assistant-kit/` iskeleti (expo-module.config.json, package.json)
- [x] TS ortak tipler (dört ayrı dosya) + web no-op yarısı
- [x] **Araştırma turu** — üç kabul yanlış çıktı, aşağıya bak
- [x] TS native yarısı + `index.ts`
- [x] iOS: Swift modül sınıfı (`RecipelyAssistantStore`, `RecipelyAssistantKitModule`) + kanıt intent (`RecipelySearchIntent`)
- [x] Android: Kotlin modül sınıfı + store + `RecipelyShortcutPublisher` + `RecipelyAssistantConfig`
- [x] `plugins/withAssistantKit.js` + 10 test
- [x] **Ölçüm 1a** — `prebuild --clean` iki platformda da geçiyor; Swift app target'a kopyalanıp pbxproj'a kaydediliyor, entitlement/Info.plist/manifest doğru (D7, D8)
- [x] **Ölçüm 1b** — `pod install` + `xcodebuild` **BUILD SUCCEEDED**; intent app target'ta derleniyor ve **`Metadata.appintents` içine çıkarılıyor** (`isDiscoverable: true`) — D12, D13
- [ ] Cihaz üstü: Siri gerçekten çağırıyor mu, TR ve EN'de (**senin işin**, fiziksel cihaz gerek)
- [x] ~~**Ölçüm 2**~~ — araştırmayla cevaplandı, cihazda ölçmeye gerek yok (D2)
- [x] **Ölçüm 3** — `:recipely-assistant-kit:compileDebugKotlin` ve **tam `:app:assembleDebug` yeşil** (3dk 7sn); autolinking modülü buluyor, manifest meta-data'sı doğru (D9)
- [x] Bulgular bu dosyaya yazıldı, kararlar sabitlendi

### Faz 0 bulguları

Sesli asistan planının deseni: **bu bölüm plan metnini geçersiz kılar.**

#### D1 — Siri, cümlenin içinde serbest metin parametresi KABUL ETMİYOR
Planın manşeti `"Recipely'e sor \(\.$question)"` şeklinde tek turluk bir cümleydi.
Çalışmıyor: Siri app shortcut cümlelerinde freeform parametre desteklemiyor, ilkel
değerler (String, Int) cümle içine gömüldüğünde tanınmıyor — cihaz üstü dil modeli
sonlu bir değer kümesi bekliyor. Cümlede yalnızca `AppEnum` / `AppEntity` çalışıyor.

**Yerine iki kanal:**
1. **`.system.searchInApp` şeması** (iOS 17'de `.system.search`, iOS 26'da yeniden
   adlandırıldı) — Apple'ın kendi şeması ve **Siri aradığı dizgeyi ham haliyle
   intent'e veriyor**. "Recipely'de mercimek çorbası göster" tek turda, serbest
   metinle çalışıyor. Serbest metnin desteklenen tek tek-tur yolu bu.
2. **`AskRecipely`** — cümlede parametre YOK ("Recipely'e sor"), sonra
   `$question.requestValue("Ne sormak istersin?")` Siri'ye soruyu sordurur ve
   kullanıcının serbest cevabını yakalar. İki tur, ama sınırsız metin.

#### D2 — `openAppWhenRun = false` iken JavaScript ÇALIŞMIYOR → Faz 2 koşulsuz
Sistem intent için uygulamayı arka planda başlatıyor ama scene yaratmıyor; React
Native bridge ayağa kalkmıyor, dolayısıyla JS'ten ne ağ çağrısı ne de action
dispatch mümkün. Headless cevap **zorunlu olarak** native HTTP + native AES-GCM
demek. Faz 2 artık koşullu değil; Faz 0'ın 2. ölçümü düştü.

#### D3 — App Intents Swift'i pod'a değil, **app target'a** girmeli
Static framework/SPM içindeki App Intents'i Xcode'un
`AppIntentsMetadataProcessor`'ı güvenilir biçimde çıkaramıyor; iki modülün de
`AppIntentsPackage`'a uyması gerekiyor ve `useFrameworks: "static"` bunun en kırılgan
hali. Expo'nun kendi `expo-app-intents` modülü de aynı sonuca varmış: intent
bildirimlerini "Apple'ın derleme-zamanı metadata çıkarımı bulabilsin diye satır içi
Swift modüllerinde" tutuyor. **Karar:** kaynak kütüphanede durur, `plugins/withAssistantKit.js`
onu app target'a kopyalayıp pbxproj'a kaydeder. Ölçüm 1 artık bir fork değil, doğrulama.

#### D4 — `expo-app-intents` iOS-only ve Swift'i yine sen yazıyorsun
npm'de sadece `0.1.0-canary` (stabil `0.0.1` bir yer tutucu), **Android yok**, iOS 16.4+.
Kendisi intent üretmiyor — Swift'i sen yazıyorsun, o yalnızca JS teslimat/kuyruk
katmanını veriyor. Bizim modülümüz onun **API yüzeyini birebir taklit ediyor**
(`useAppIntents`, `getPendingInvocationsAsync`, `removePendingInvocationAsync`,
`clearPendingInvocationsAsync`, `addAppIntentListener`, `setEntityCatalogAsync(kind, entities)`,
`refreshShortcutsAsync`) ki iOS yarısı ileride takas edilebilsin. Android tamamen bizim.

#### D5 — Android: minSdk **24**, targetSdk **36**
`@RequiresApi(36)` olan AppFunctions kullanıcı tabanının çok küçük bir dilimine
ulaşıyor; stratejik bir sap olarak kalıyor, bugünkü yüzey değil. Dinamik kısayolların
Google yüzeylerine (Assistant dahil) çıkması için `androidx.core:core-google-shortcuts`
bağımlılığı gerekiyor — Faz 4'te doğrulanacak.

#### D13 — Metadata çıkarımı ÇALIŞIYOR, yaklaşım doğrulandı
`RecipelyDev.app/Metadata.appintents/extract.actionsdata` içinde:
`"RecipelySearchIntent"`, `isDiscoverable: true`, `openAppWhenRun: true`,
`systemProtocolMetadata: ["com.apple.link.systemProtocol.ShowInAppStringSearchResults"]`.
Yani plugin'in app target'a enjekte etme yaklaşımı **kanıtlandı** — Siri, Spotlight ve
Shortcuts intent'i görecek. (Derleme sırasındaki *"Metadata extraction skipped. No
AppIntents.framework dependency found"* uyarısı **ShareExtension** hedefine ait ve
beklenen: onun hiç intent'i yok.)

Geriye yalnızca cihaz üstü doğrulama kalıyor: Siri cümleyi gerçekten eşleştiriyor mu.

#### D12 — Bu SDK'da şema `searchInApp` DEĞİL, `ShowInAppSearchResultsIntent`
Xcode 26.6 / iOS 26.5 SDK'da `AssistantSchemas.SystemIntent`'in `searchInApp` üyesi
**yok** — o isim Xcode 27 (iOS 27) ile geliyor, araştırma turu bu noktada ileri bir
sürümü tarif etmiş. Bu SDK'daki karşılığı **`ShowInAppSearchResultsIntent`**
(iOS 17.2+): `criteria: StringSearchCriteria` alıyor, Siri sorguyu **ham haliyle**
`criteria.term`'e koyuyor, `openAppWhenRun` protokolün kendisinde `true`. D1'in
sonucu değişmiyor, yalnızca adı: serbest metnin tek turluk yolu bu.

Ayrıca: `@available` **17.2** olmalı (17.0 değil), ve pod'dan yapılan import
`internal import RecipelyAssistantKit` yazılmalı — Swift 6, hedefte başka yerde
internal olarak import edilen bir modülün örtük erişim seviyesini reddediyor.

#### D11 — Xcode grubu **path'siz** olmalı, yoksa yol iki kere yazılıyor
İlk gerçek derleme *"Build input file cannot be found:
`ios/RecipelyDev/RecipelyAssistant/RecipelyDev/RecipelyAssistant/RecipelySearchIntent.swift`"*
ile düştü. Grup kendi `path`'ini taşıyorsa çocukları ona göreli çözülüyor; bizim
dosya referanslarımız zaten proje-göreli olduğu için Xcode ikisini birleştirdi.
Grup artık **sanal** (`pbxCreateGroup(name)`, path yok). Teste bağlandı.

#### D9 — Kotlin dil sürümü 2.2'nin ALTINDA
`ifEmpty { continue }` derlenmedi: *"break continue in inline lambdas is only
available since language version 2.2"*. Derleyici tavanı 2.2.0 ama kullanılan dil
sürümü daha eski — inline lambda içinde `continue` yok. Dört JS gate'inin hiçbiri
Kotlin derlemediği için bunu **yalnızca gerçek build** yakaladı; modül eklenen her
oturum bir Android build'i istemeli (regressions.md:1040'ın kuralı).

Sonuç: `:app:assembleDebug` **yeşil**, APK üretiliyor, `core-google-shortcuts`
çözülüyor, R8 için ek keep kuralı gerekmedi (debug; release Faz 4'te doğrulanacak).

#### D10 — `check:structure`'ın tip/çalışma-zamanı kuralında yanlış pozitif vardı
`typeof <const>` türevi union'ları muaf tutan regex `m` bayrağıyla çalışıyordu, yani
`$` satır sonu demekti: iki satıra sarılmış bir alias'ın gövdesi boş okunuyor ve
muafiyet düşüyordu. Prettier 100 karakterde sardığı için uzun türev union'lar
ORTALAMA durum, istisna değil. Regex `\n` ile sabitlendi, `m` kaldırıldı; gerçek
ihlali hâlâ yakaladığı geçici bir dosyayla doğrulandı.

#### D7 — Expo mod'ları TERS sırada koşuyor
`withMod` önce kendi action'ını çalıştırıp sonra **kendinden ÖNCE kayıtlı** mod'u
çağırıyor: `app.json`'daki **son** plugin **ilk** koşuyor. Local plugin'i listenin
sonuna koymak (bariz yer) `withAssistantKit`'in tekilleştirmesini herkesten önce
çalıştırdı ve duplikeyi ondan sonra eklendi. Plugin artık `expo-share-intent`'in
hemen **öncesine** kayıtlı ki ondan **sonra** koşsun.

#### D8 — App Group zaten var: `expo-share-intent` onu kuruyor
`group.net.recipely.app.dev` share extension tarafından çoktan bildiriliyor —
aynı konteyner, aynı sebeple. İlk prebuild entitlement'a grubu **iki kez** yazdı;
tekrarlanan bir entitlement imzalamada doğrulamayı düşürüyor. Plugin artık kendi
girdisini değil **tüm listeyi** tekilleştiriyor. İyi haber: grup Apple tarafında
zaten provision edilmiş, yeni capability başvurusu gerekmiyor.

Ayrıca prebuild iki gerçek hata yakaladı, ikisi de teste bağlandı:
`pbxGroupByName` yok olan grup için `null` döndürüyor (`!== undefined` yanlış dalı
seçip `addSourceFile`'ı gruptan yoksun bıraktı, `xcode` kütüphanesi null path'te
patladı) ve yukarıdaki duplike entitlement.

#### D6 — ESLint kural 1'i `modules/` içinde de uyguluyor
`check:structure` yalnızca `src/<katman>`'ı geziyor ama `recipely/one-declaration-per-file`
ESLint kuralı repo genelinde. Kural 13'ün "ortak tipler tek dosyada"sı burada
"tek dosyada, tip başına bir dosya" olarak uygulanıyor: dört tip, dört dosya.

---

## Faz 1 — Modül iskeleti + paylaşılan depo

- [x] Paylaşılan depo: iOS App Group `UserDefaults` (`RecipelyAssistantStore.swift`)
- [x] Paylaşılan depo: Android `SharedPreferences` — App Group yok, aynı süreç; genişletilecek bir şey yok
- [x] App Group kimliği varyanttan türetiliyor; `expo-share-intent` onu zaten provision etmiş (D8)
- [x] Port: `src/domain/assistant/os/os-assistant-interface.ts`
- [x] Katalog: `src/domain/assistant/os/os-intent-catalogue.ts` (11 giriş) + 6 değişmez testi
- [x] Impl + web no-op: `src/infrastructure/assistant/os/os-assistant-bridge{,.web}.ts`
- [x] DI token `OsAssistant` + infrastructure register + `ApplicationStores.osAssistant`
- [x] Deep link `recipely://assistant/run?action=&arg=` → `os-intent-link.ts` + `pending-os-intent.ts` + `+native-intent.tsx`
- [x] `use-os-assistant-invocations.ts`, pill'de en son mount (efekt sırası = tier sırası)
- [x] Testler: katalog değişmezleri (6), deep-link ayrıştırma (11), bridge sınırı (7), plugin (11)
- [x] `use-os-entity-catalogue-sync.ts` — tarifleri native kataloğa yazar + 6 test (oturum kapanınca boşaltıyor)
- [ ] Oturum kimlik bilgisi senkronu (`publishCredentials`) — Faz 2'ye bağlı

## Faz 2 — Headless yol *(D2 gereği koşulsuz)*

- [ ] Backend PR: `POST /assistant/intent-token` (dar kapsam, ~30 gün)
- [ ] Ortak AES-GCM test vektörü fixture'ı
- [ ] Swift `Envelope.swift` (CryptoKit) + XCTest parity
- [ ] Kotlin `Envelope.kt` (javax.crypto) + JUnit parity
- [ ] `EXPO_PUBLIC_API_AES_KEY` prebuild'de native sabite yazılıyor

## Review'dan çıkan, Faz 3/4'e taşınan borç

- [ ] Rule 5: `arg: 'next'` (`StepCursor.Next`'i tekrarlıyor) ve `arg: 'myRecipes'`
  (`AssistantNavigationTargets` anahtarı, üçüncü kez yazılıyor). Domain
  presentation'ı import edemez → navigasyon hedefi vocabulary'sini `@domain`'e
  ya da `@core/constants`'a taşımak gerekiyor.
- [ ] `'recipe'` entity kind'ı üç dilde ayrı yazılı (TS/Swift/Kotlin) — rule W'nin
  kapsamına alınabilir.
- [ ] `subscribe` iki tarafta da tanımlı ama hiçbir modül `sendEvent` çağırmıyor;
  çalışan-uygulama yolu Faz 3'te açılacak.

## Faz 3 — iOS App Intents

- [ ] `SearchRecipesIntent` — `.system.searchInApp` şeması (serbest metnin tek turluk yolu, D1)
- [ ] `AskRecipelyIntent` — parametresiz cümle + `requestValue` (iki tur, D1) → `/assistant/message`
- [ ] 9 tekil intent (openRecipe, save, like, startTimer, readIngredients, readNextStep, generate, import, myRecipes)
- [ ] `RecipeAppEntity: AppEntity & IndexedEntity` + query
- [ ] `AppShortcutsProvider` + 14 dilin cümleleri i18n'den üretiliyor
- [ ] `CONFIRMED_ACTIONS` beşlisi asla headless değil; Siri `requestConfirmation` soruyor
- [ ] Control Center kontrolü + Action Button
- [ ] Recipe detail'de onscreen entity anotasyonu

## Faz 4 — Android

- [ ] `shortcuts.xml` katalogdan üretiliyor (statik kısayollar)
- [ ] Dinamik kısayollar (`pushDynamicShortcut`) — son/kayıtlı tarifler
- [ ] Quick Settings tile
- [ ] Widget
- [ ] `recipely://assistant/run` intent filter
- [ ] AppFunctions servisi `@RequiresApi(36)` + bayrak arkasında
- [ ] `androidx.core:core-google-shortcuts` (kısayolların Google yüzeylerine çıkması için, D5)
- [ ] Google AppFunctions EAP formuna başvuru
- [ ] R8 keep kuralları (gerekirse)

## Faz 5 — Gate'ler ve belgeler

- [ ] `check:structure` rule W — katalog ↔ Swift/XML drift
- [ ] `check:structure` rule X — üretilen artefaktlar taze
- [ ] `check:structure` rule Y — `CONFIRMED_ACTIONS` headless değil
- [ ] CI: üretilen `Info.plist`'te App Group var, yeni background mode yok
- [ ] CI: üretilen `AndroidManifest.xml`'de `shortcuts.xml` referansı var
- [ ] `docs/regressions.md` sınıf satırları
- [ ] `npm run map`

---

## Oturum kapanırsa

1. `git checkout feat/os-assistants-spike`
2. Bu dosyadaki ilk işaretsiz kutuyu bul.
3. Faz 0 bulguları bölümünü oku — plan metninden **önce** o geçerli.
