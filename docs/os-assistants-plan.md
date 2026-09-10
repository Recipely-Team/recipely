# İşletim sistemi asistanları — Siri (iOS) + kısayollar/Gemini (Android)

Uygulama içi sesli asistanın **50 action**'lık vocabulary'sini telefonun kendi
asistanına açar. Plan `~/.claude/plans/i-erideki-sesli-asistan-yapt-k-warm-heron.md`;
bu dosya **ilerleme durumudur** — oturum kapanırsa buradan devam edilir.

## Durum panosu

| Faz | İş | Durum | PR |
|-----|----|-------|-----|
| 0 | Ölçüm ve karar kapısı | 🟡 devam ediyor | — |
| 1 | Modül iskeleti + paylaşılan depo | ⬜ başlanmadı | — |
| 2 | Headless yol | ⬜ başlanmadı — **koşulsuz**, aşağıdaki D2'ye bak | — |
| 3 | iOS App Intents | ⬜ başlanmadı | — |
| 4 | Android kısayollar + AppFunctions | ⬜ başlanmadı | — |
| 5 | Gate'ler ve belgeler | ⬜ başlanmadı | — |

Branch: `feat/os-assistants-spike`

---

## Faz 0 — Ölçüm ve karar kapısı

Amaç: Faz 2'nin gerekip gerekmediğini ve Swift dosyalarının nereye konacağını
ölçümle belirlemek. **Merge edilmez**, bulgular aşağıya yazılır.

- [x] `feat/os-assistants-spike` branch'i açıldı
- [x] `modules/recipely-assistant-kit/` iskeleti (expo-module.config.json, package.json)
- [x] TS ortak tipler (dört ayrı dosya) + web no-op yarısı
- [x] **Araştırma turu** — üç kabul yanlış çıktı, aşağıya bak
- [ ] TS native yarısı + `index.ts`
- [ ] iOS: Swift modül sınıfı + tek kanıt App Intent
- [ ] Android: Kotlin modül sınıfı + `shortcuts.xml`
- [ ] `plugins/withAssistantKit.js` + testi
- [ ] **Ölçüm 1** — plugin'in app target'a enjekte ettiği Swift App Intent `prebuild --clean`'i sağ atlatıyor ve Siri onu görüyor mu? (fork değil, **doğrulama** — D3'e bak)
- [x] ~~**Ölçüm 2**~~ — araştırmayla cevaplandı, cihazda ölçmeye gerek yok (D2)
- [ ] **Ölçüm 3** — plugin'le eklenen Kotlin, Kotlin 2.2.0 tavanı altında derleniyor mu; `shortcuts.xml` üretilen manifest'e giriyor mu?
- [ ] Bulgular bu dosyaya yazıldı, kararlar sabitlendi

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

#### D6 — ESLint kural 1'i `modules/` içinde de uyguluyor
`check:structure` yalnızca `src/<katman>`'ı geziyor ama `recipely/one-declaration-per-file`
ESLint kuralı repo genelinde. Kural 13'ün "ortak tipler tek dosyada"sı burada
"tek dosyada, tip başına bir dosya" olarak uygulanıyor: dört tip, dört dosya.

---

## Faz 1 — Modül iskeleti + paylaşılan depo

- [ ] Paylaşılan depo: iOS App Group `UserDefaults` + Keychain
- [ ] Paylaşılan depo: Android `EncryptedSharedPreferences`
- [ ] App Group kimliği varyanttan türetiliyor (`group.net.recipely.app` / `.dev`), sabit yazılmıyor
- [ ] Port: `src/domain/assistant/os/os-assistant-interface.ts`
- [ ] Katalog: `src/domain/assistant/os/os-intent-catalogue.ts`
- [ ] Impl + web no-op: `src/infrastructure/assistant/os/os-assistant-bridge{,.web}.ts`
- [ ] DI token `OsAssistant` + register
- [ ] Deep link `recipely://assistant/run?action=&arg=` → `+native-intent.tsx`
- [ ] `use-os-assistant-invocations.ts` (soğuk açılışta bekleyenleri registry'ye akıtır)
- [ ] Testler: deep-link yönlendirme, soğuk açılış, katalog↔`AssistantAction` parity

## Faz 2 — Headless yol *(D2 gereği koşulsuz)*

- [ ] Backend PR: `POST /assistant/intent-token` (dar kapsam, ~30 gün)
- [ ] Ortak AES-GCM test vektörü fixture'ı
- [ ] Swift `Envelope.swift` (CryptoKit) + XCTest parity
- [ ] Kotlin `Envelope.kt` (javax.crypto) + JUnit parity
- [ ] `EXPO_PUBLIC_API_AES_KEY` prebuild'de native sabite yazılıyor

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
