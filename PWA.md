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
