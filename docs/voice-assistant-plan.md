# Sesli asistan (AI Chef) — Gemini Live API planı

## Context

Recipely'de yazılı + sesli, kesilebilir bir asistan olacak; kullanıcı konuşurken **asistan
uygulamayı sürecek**: "tarif oluştur" dendiğinde create ekranı açılır, taslak dolar,
kullanıcı ekranı izler. Kararı AI verir — dikte değil: kullanıcının sözünü alana yazmak
yok, AI ne yapılacağına hükmeder ve yapar.

Tasarım kaynağı hazır: Claude Design projesindeki `src/ai-chef-agent.js` + `src/ai-chef.jsx`
(tool listesi, TR/EN kopya, durum makinesi, pill/panel UX). Oradaki transport OpenAI
Realtime şeklinde; Gemini Live şekline çevrilecek, UX ve kopya korunacak.

**Birincil kriter az token.** Bu yüzden mimarinin merkezinde tek bir fikir var: *ses
oturumu tarif metnini hiç taşımaz.* Ses modeli yalnızca emir verir, içeriği backend'in
mevcut üretim hattı yazar, modele tek satır özet döner.

### Verilen kararlar

| Konu | Karar |
|---|---|
| Ses hattı | `react-native-audio-api` (mikrofon PCM + streaming playback, tek bağımlılık iki yön) |
| Bağlantı | Ephemeral token, telefon doğrudan Google'a bağlanır (ses baytı sunucumuza uğramaz) |
| Yıkıcı işlem | Her zaman `ConfirmSheet` |
| Tool şekli | Tek `runAction` + action enum (~200 token kurulum) |
| İçeriği kim yazar | Mevcut backend `/recipes/generate` (ses oturumuna ~15 token döner) |
| Yayınlama | AI eksikleri tamamlar → `ConfirmSheet` → gerçekten yayınlar |
| Bütçe | 600 sn/kullanıcı/gün, 8 sn sessizlikte kapanma, kota 0 → yazılı mod |

## Doğrulanmış gerçekler (planın dayandığı zemin)

1. **Live API free tier'da ücretsiz.** Pricing tablosu `Gemini 2.5 Flash Native Audio
   (Live API)` ve `Gemini 3.1 Flash Live Preview` için free tier'da "Free of charge"
   diyor. Paid: audio in $3/1M (~$0.005/dk), audio out $12/1M (~$0.018/dk).
2. **Native audio modelleri yalnızca `AUDIO` response modality destekliyor.** Ekrandaki
   metin `outputAudioTranscription` / `inputAudioTranscription` ile gelecek.
3. **Tool listesi oturum kurulurken bir kez bildirilir**, ekran değişince değiştirilemez.
   Asistan ekranlar arasında dolaşacağı için tek `runAction` şart — aksi halde her
   navigasyonda yeniden bağlanmak gerekirdi.
4. **`expo-audio 55.0.16` (bu repoda kurulu olan) mikrofon PCM akışı sunmuyor.** Yalnızca
   dosyaya kayıt + `useAudioSampleListener` (playback için). Docs'taki `useAudioStream`
   daha yeni bir SDK'ya ait, burada yok. Ham PCM *çalma* da yok. Yani `react-native-audio-api`
   iki yönü de üstleniyor: `AudioRecorder.onAudioReady` (float32 PCM, `sampleRate` ayarlı)
   + `AudioContext`/`AudioBufferSourceNode`.
5. **`react-native-audio-api@0.13.3`**, peer `react-native-worklets >= 0.6.0` — repoda
   `0.7.4` var, uyumlu. Web'de recorder belgelenmemiş → web'de tarayıcının kendi
   `getUserMedia` + `AudioContext`'i kullanılacak (`*.web.ts` çifti, rule 13).
6. **Mikrofon izni şu an KAPALI**: `app.json` → `expo-audio` plugin'i
   `microphonePermission: false`, `recordAudioAndroid: false`. Açmak
   `NSMicrophoneUsageDescription` + `RECORD_AUDIO` ekler.
7. **Ephemeral token** yalnızca Live API ile çalışır, `v1beta` ister; `uses`,
   `expireTime`, `newSessionExpireTime`, `liveConnectConstraints` alanları var. Token
   client'ta bir bearer credential olduğu için `liveConnectConstraints` ile model + config
   kilitlenecek.
8. **Oturum sınırları**: audio-only 15 dk, bağlantı ~10 dk'da düşer;
   `contextWindowCompression.slidingWindow` + `sessionResumption.handle` ile aşılır.
   `GoAway` mesajı `timeLeft` veriyor. Native audio context window 128k.

### Doğrulanmamış — Faz 0'da kanıtlanacak

- **Free tier Live API concurrent session / RPD limiti dokümante değil.** AI Studio
  panelinden okunacak. Plan zaten sunucu tarafı frenle bunu tolere ediyor.
- **Model id'si**: `gemini-2.5-flash-native-audio-preview-12-2025` ve
  `gemini-3.1-flash-live-preview` dokümanda listeli. *Listelenen ≠ kullanılabilir* —
  `ListModels` ile canlı doğrulanacak, model id'si backend'den dönecek (client'ta sabit
  değil), böylece model değişince uygulama güncellemesi gerekmez.
- **Free tier'da içerik Google tarafından ürün geliştirmede kullanılır.** Gizlilik
  politikasına eklenmesi ve ilk kullanımda sesli mod için açık onay alınması gerekiyor.

## Token ekonomisi — tasarımın kendisi

Ses pahalı: ~28 token/sn dinleme, ~25 token/sn konuşma. Yani **1 dk mikrofon ≈ 1.7k
token**. Tasarruf modelden değil, *oturumun kısalığından ve bağlama giren metnin
azlığından* gelir.

1. **Socket yalnızca dokununca açılır**, ortam dinlemesi yok. 8 sn sessizlik → kapanır.
2. **Tek tool tanımı** (~200 token) — 16 ayrı tool ~1.5–2k olurdu.
3. **Sistem talimatı ≤ ~120 token**, kullanıcının dilinde, örnek listesi yok.
4. **Ekran bağlamı ayrı tur harcamaz**: her tool sonucunun içine tek alan olarak eklenir
   (`ctx:'screen=createRecipe draft=8/6'`, ~15 token). Ayrı bir `realtimeInput.text`
   göndermek yeni bir model turu tetiklerdi.
5. **Tool sonuçları özet**: asla tarif nesnesi değil — `{ok:true, title:'Fırın Tavuğu',
   n:{ing:8,step:6}, ctx:'…'}`.
6. **İçerik üretimi backend'de**: `runAction('generateRecipe', {prompt})` → mevcut
   `POST /recipes/generate` → taslak ekranı dolar → modele ~15 token döner. Tarifin 800
   token'lık metni ses bağlamına hiç girmez (ve sonraki turlarda geçmişte taşınmaz).
7. **`contextWindowCompression: { slidingWindow: {} }`** + `triggerTokens` → uzun
   oturumda geçmiş yeniden gönderilmez.
8. **`sessionResumption`** handle'ı saklanır → `GoAway` sonrası setup + bağlam yeniden
   ödenmeden devam.
9. **Yazılı mod socket açmaz**: `POST /assistant/message` tek `generateContent` çağrısı,
   aynı tool şeması, sistem talimatı prompt cache'li. Sadece metin token'ı.
10. **Kesme**: `serverContent.interrupted === true` → playback kuyruğu anında boşaltılır;
    üretilen ama çalınmayan audio için token ödenmiş olsa da kullanıcı beklemez.

**Bütçe:** 600 sn/gün/kullanıcı ≈ 10 dk ≈ ~17k input + ~10k output token. Free tier
250k TPM / 1.5k RPD sınırlarının çok altında; bağlayıcı limit muhtemelen eşzamanlı oturum
sayısı olacak, onu sunucu freni yönetir.

## Mimari

### Yeni "island": transport, uygulamadan bağımsız

**Kütüphane sorusuna cevap:** şimdi ayrı paket YAPMA, ama ayrılabilir yaz.
`src/infrastructure/assistant/live/` yalnızca `@core/*`'a bakacak — Recipely'nin
domain'ine, store'larına, i18n'ine tek import yok. Böylece ileride
`packages/gemini-live/` altına tek satır değiştirmeden taşınır. Birinci günde ayrı paket
yapmak, zaten native riski olan bir işin üstüne Metro/workspace çözümleme riski ekler.
Toplam ~50 yeni dosya (mevcut 851'in yanında sınırlı), 14c alt klasörlerle karşılanıyor.

### domain/assistant/ — sözleşmeler
- `assistant-session-interface.ts` — transport portu: `connect/sendText/sendAudio/interrupt/close` + event akışı (rule 17, 21).
- `assistant-session-event.ts` — union: `transcript | audio | toolCall | interrupted | status | goAway`.
- `assistant-action-type.ts` — **action sözlüğü tek yerde** (rule 5 / rule P). Enum hem tool şemasını hem client dispatcher'ı besler.
- `assistant-token-repository-interface.ts` — ephemeral token + bütçe.
- `voice-budget.ts` — kalan saniye value object'i (`BaseValueObject`, `create(): Result`).

### application/assistant/
- `session/` — `assistant-session-store.ts` (+ `-state`), `start-voice-session-use-case.ts`, `end-voice-session-use-case.ts`, `send-assistant-message-use-case.ts` (yazılı mod).
- `actions/` — `assistant-action-registry.ts` + gruplara ayrılmış handler'lar; her biri **mevcut** use case'i çağırır:
  - `recipes/` → `ListRecipesUseCase`, `GetRecipeUseCase`, `GenerateRecipeUseCase`, `CreateRecipeUseCase`, `DeleteRecipeUseCase`
  - `library/` → `AddFavoriteUseCase`, `RemoveFavoriteUseCase`, `LikeRecipeUseCase`, `UnlikeRecipeUseCase`
  - `profile/` → `UpdateProfileUseCase`
  - `drafts/` → `UpsertDraftUseCase`, `GetLatestDraftUseCase`
  Yeni use case yazılmıyor; asistan mevcut hattı sürüyor.
- `di/tokens.ts` + `di/register.ts` — `AssistantSession`, `AssistantTokenRepository`, `AssistantActionRegistry`, use case token'ları.
- `clearSessionCaches` (register.ts) → asistan store'u da sıfırlanmalı (kullanıcıya bağlı).

### infrastructure/assistant/
- `live/gemini-live-session.ts` — portun implementasyonu: WS yaşam döngüsü, setup, VAD, `interrupted`, `sessionResumption`, `GoAway`.
- `live/live-setup-request-mapper.ts` — setup mesajı (`RequestMapper` sözleşmesi).
- `live/dtos/` — `live-server-message-dto.ts`, `live-tool-call-dto.ts`, `live-usage-dto.ts`.
- `live/live-message-mapper.ts` — DTO → domain event.
- `live/pcm-codec.ts` — float32 ⇄ int16 ⇄ base64 (saf fonksiyon, rule 2).
- `live/microphone-stream.ts` + `.web.ts`, `live/pcm-player.ts` + `.web.ts` — ortak tipler tek dosyada (rule 13).
- `token/assistant-token-repository.ts` + `dtos/` — `POST /assistant/session`.
- `constants/api/api-routes.ts` → `assistant: { session, message, heartbeat }`.

### presentation/
- `base/widgets/assistant/` — global shell chrome (rule 14, root `_layout.tsx`'e mount):
  `assistant-pill.tsx` (küçültülmüş, ekranlar görünür kalır), `assistant-panel.tsx`,
  `assistant-transcript.tsx`, `assistant-mic-orb.tsx`, `assistant-action-chip.tsx`.
- `base/hooks/assistant/` — `use-assistant-session.ts`, `use-assistant-ui-actions.ts`
  (navigate / setField / photo picker / confirm gibi UI action'larını registry'ye kaydeder),
  `use-assistant-context.ts` (tek satır ekran bağlamı).
- `base/assistant/model/` — durum sözlüğü (`AssistantStatus` const object), ölçüler theme token'larına.
- Yeni route yok: asistan overlay. Ekranı sürmesi görünürlük gerektiriyor, tam ekran sheet bunu bozar.
- i18n: **14 locale dosyası** (`locales/*.ts`) — `catalogue-parity.test.ts` hepsini zorunlu kılıyor. Kopya prototipteki `AI_CHEF_COPY`'den TR/EN olarak alınır, diğerleri çevrilir.

### Backend (recipely-backend — ayrı repo, ÖNCE onun PR'ı)
- `POST /api/v1/assistant/session` — Google `authTokens.create`: `uses:1`,
  `expireTime:+2dk`, `newSessionExpireTime:+1dk`, `liveConnectConstraints` ile model +
  `responseModalities` + systemInstruction + tools kilitli. Dönüş:
  `{ token, model, wsUrl, expiresAt, budgetRemainingSec }`.
- `POST /api/v1/assistant/heartbeat` — oturum saniyesi düşer; sunucu otorite.
- `POST /api/v1/assistant/message` — yazılı mod: tek `generateContent`, aynı tool şeması.
- `assistant_usage(userId, day, seconds, sessions)` + **global günlük tavan** → aşılırsa
  herkes yazılı moda düşer (free tier tek anahtar).
- `users.deletedAt` filtresi ve `EnsureAccountActive` yeni rotalara da uygulanmalı.
- Mevcut `/recipes/generate`, `/recipes/with-media`, `/recipes/{id}`, `/me/profile`,
  `/recipes/{id}/like|favorite` yeniden kullanılır — yeni action endpoint'i yok.

## Action seti (tek `runAction` enum'u)

```
navigate(screen)            openRecipe(query|id)      search(query, filters)
save(recipeId?)             like(recipeId?)           unsave / unlike
generateRecipe(prompt)      setDraftField(field,value) addIngredient / removeIngredient
addStep / removeStep        attachPhoto(source)       publishDraft
deleteRecipe(recipeId)      addComment(text)          writeBio(tone)
updateProfile(field,value)  startTimer(min,label)     readStep(index)
repeat / stop
```

Yıkıcı olanlar (`deleteRecipe`, `publishDraft`, `updateProfile`, `unsave`) `ConfirmSheet`
açar ve tool sonucu `{status:'awaiting_confirmation'}` döner; onaydan sonra ikinci sonuç
gönderilir. `attachPhoto` galeriyi açar, seçimi kullanıcı yapar.

## Ship riskleri (senin onayını gerektiren, CLAUDE.md Exceptions)

1. **Yeni native bağımlılık** `react-native-audio-api` → yeni dev build, RN 0.83 / New
   Architecture uyumu Faz 0'da kanıtlanacak.
2. **Mikrofon izni açılıyor** → `NSMicrophoneUsageDescription` + `RECORD_AUDIO`. iOS'ta
   App Review bu izne bakar (build 321 geçmişi), Play'de hassas izin beyanı gerekir.
3. **Rule 23c tuzağı**: `react-native-audio-api`'nin iOS plugin'i background audio
   (`UIBackgroundModes: audio`) açabilir — App Review bu yüzden iki build reddetti.
   Kapalı kalacak; `check:structure` **rule N bu plugin'in opsiyonlarını da kapsayacak
   şekilde genişletilecek** ve CI'daki üretilmiş Info.plist assert'i zaten koruyor.
4. **Gizlilik**: free tier içeriği Google ürün geliştirmede kullanıyor → politika metni +
   ilk kullanımda sesli mod onayı.

## Fazlar

**Faz 0 — spike (UI'dan önce, her şeyi de-riske eder).** Dev build + throwaway ekran:
16k PCM mikrofon → WS → Gemini Live → 24k PCM playback; kesme çalışıyor mu, `ListModels`
ile model id doğru mu, `usageMetadata.totalTokenCount` ile dakika başına gerçek token
kaç. AI Studio'dan free tier concurrent limitini oku. Çıktı: ölçülmüş sayılar + gerçek
model id. Bu faz kırmızı dönerse plan (özellikle ses hattı kararı) revize edilir.

**Faz 1 — backend PR**: session mint + bütçe + heartbeat + `message`. Frontend'den önce.

**Faz 2 — transport**: domain portu + `infrastructure/assistant/live/*` + codec + mapper,
fake WS sunucusuna karşı Jest testleri.

**Faz 3 — action registry**: enum, registry, handler'lar mevcut use case'lere bağlanır;
UI handler'ları presentation'dan kaydedilir. Her handler için birim test.

**Faz 4 — UI**: pill + panel + transkript + action chip'leri, prototipin UX'i; 14 locale.

**Faz 5 — kapanış**: 4 gate + `code-reviewer` + `docs/regressions.md` satırları +
`npm run map`.

Faz 2–4 arası paralelleştirilebilir; token ekonomisi gereği Faz 2 ve 3 tek implementer'a
verilir (bağlam aynı), UI ayrı.

## Doğrulama

- **Birim (Jest)**: `pcm-codec` round-trip; `live-message-mapper` (interrupted, toolCall,
  transcript, usage); setup mapper'ın compression + resumption + tek tool ürettiği;
  registry'nin bilinmeyen action'da `Result` failure döndürdüğü; bütçe value object'i.
- **State machine**: fake WS ile connect → setup → toolCall → toolResponse → interrupted →
  goAway → resume akışı.
- **Cihazda uçtan uca senaryo** (fiziksel cihaz, ekran kaydı — Apple için de gerekiyor):
  1. "Tavuk ve yoğurt var, tarif yap" → create ekranı açılır, taslak dolar.
  2. Model konuşurken araya gir → ses anında kesilir.
  3. "Yayınla" → foto istenir → ConfirmSheet → tarif yayında.
  4. "Bu tarifi kaydet" / "beğen" → feed'de durum değişir.
  5. "Profilime açıklama yaz" → biyografi üretilir, onayla güncellenir.
  6. Kotayı tüket → yazılı moda düşer, socket açılmaz.
- **Gate'ler**: `npm run lint`, `npx tsc --noEmit`, `npx jest`, `npm run check:structure`
  (+ genişletilmiş rule N), `npm run map`.
- **Token ölçümü**: her oturum sonunda `usageMetadata` loglanır (`__DEV__` arkasında,
  rule 22) — hedef: 30 sn'lik "tarif oluştur" akışı ≤ 3k token.
