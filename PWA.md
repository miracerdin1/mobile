# LinkFlow PWA

Mobile ve PWA aynı Expo kodunu kullanır. `ios` ve `android` komutları native
uygulamayı; `web` ve `export:web` komutları PWA sürümünü çalıştırır.

## Yerel önizleme

```powershell
npm run web
```

Pano erişimi yalnızca HTTPS adreslerinde veya `localhost` üzerinde çalışır.

## Yayınlama

`mobile/.env` dosyasındaki `EXPO_PUBLIC_API_URL` yerel geliştirme için
`localhost` adresine ayarlıdır. Yayın build'i alırken production sunucu
adresini komut satırından **mutlaka** ezmeniz gerekir, aksi halde PWA
`localhost`'a bağlanmaya çalışır ve giriş/API istekleri başarısız olur:

```powershell
$env:EXPO_PUBLIC_API_URL="https://linkflow-server-uask.onrender.com"
npx expo export --platform web --clear
npx eas-cli@latest deploy --prod
```

`--clear` bayrağı önemlidir: Metro önbelleği, `EXPO_PUBLIC_API_URL`
değişmiş olsa bile eski bundle'ı yeniden kullanabilir.

Yayın adresini sunucunun `CORS_ORIGINS` ortam değişkenine ekleyin. Birden fazla
adres virgülle ayrılır.

## iPhone'a kurma

1. Yayın adresini Safari'de açın.
2. **Paylaş** düğmesine dokunun.
3. **Ana Ekrana Ekle** seçeneğini kullanın.
4. LinkFlow'u ana ekrandaki ikonundan açıp giriş yapın.

## Bildirimler (Web Push)

Tarayıcı, telefona "şu saatte bildirim göster" diye zamanlanmış bildirim
bırakamaz. Bu yüzden PWA'da hatırlatıcıların zamanını sunucu tutar ve vakti
gelince Web Push gönderir. Gelen push'u `public/sw.js` bildirim olarak gösterir.

- **iPhone:** iOS 16.4 veya üstü gerekir ve yalnızca **Ana Ekrana Ekle** ile
  kurulmuş uygulamada çalışır. Safari sekmesinde bildirim izni istenemez.
- İzin, bir hatırlatıcı kurulurken, akıllı hatırlatıcı açılırken veya haftalık
  özetin son sayfasındaki "Her pazar akşamı hatırlat" butonuna basılınca istenir.
- Çıkış yapınca o cihazın aboneliği silinir.

### Sunucu ayarları (Render → Environment)

VAPID anahtarlarını bir kere üretin (`server` klasöründe):

```powershell
npm run vapid
```

| Değişken            | Değer                                               |
| ------------------- | --------------------------------------------------- |
| `VAPID_PUBLIC_KEY`  | Komutun verdiği Public Key                          |
| `VAPID_PRIVATE_KEY` | Komutun verdiği Private Key (gizli tutun)           |
| `VAPID_SUBJECT`     | `mailto:sizin@adresiniz` veya bir `https://` adresi |
| `CRON_SECRET`       | Uzun, rastgele bir metin                            |

Anahtarları sonradan değiştirirseniz mevcut abonelikler geçersiz olur ve
kullanıcıların bildirimleri yeniden açması gerekir.

### Ücretsiz Render planı: sunucuyu uyanık tutma

Ücretsiz plandaki sunucu 15 dakika istek gelmezse uyur. Uyuyan sunucu bildirim
gönderemez. Bunun için [cron-job.org](https://cron-job.org) üzerinde ücretsiz
bir iş oluşturun:

- **URL:** `https://linkflow-server-uask.onrender.com/api/push/dispatch`
- **Yöntem:** `POST`
- **Header:** `Authorization: Bearer <CRON_SECRET>`
- **Sıklık:** 10 dakikada bir

Her istek sunucuyu uyanık tutar ve vakti gelen bildirimleri gönderir. Sunucu
uyanıkken bildirimleri ayrıca her dakika kendisi kontrol eder, yani gecikme
en fazla bir dakika olur. Sürekli uyanık bir servis ayda yaklaşık 744 saat
kullanır; Render'ın ücretsiz kotası 750 saattir, yani başka bir ücretsiz
servisiniz yoksa sığar.

## “LinkFlow'a Ekle” kestirmesi

1. Kestirmeler uygulamasında yeni bir kestirme oluşturun.
2. Ayrıntılardan **Paylaşım Sayfasında Göster** seçeneğini açın ve yalnızca
   URL girişini kabul edin.
3. Bir **URL** eylemi ekleyin ve değerini aşağıdaki gibi ayarlayın:

   `https://PWA-ADRESI/add?url=Kestirme Girdisi`

   `Kestirme Girdisi` bölümünü yazmak yerine değişkenler listesinden seçin.

4. Sonuna **URL'leri Aç** eylemini ekleyin.
5. Kestirmenin adını **LinkFlow'a Ekle** olarak değiştirin.

Safari, X, Instagram, TikTok ve YouTube'da bir içerik bağlantısı paylaşılırken
bu kestirme seçildiğinde LinkFlow ekleme ekranı URL alanı dolu olarak açılır.
