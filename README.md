# Yapay Zeka Destekli CV Oluşturucu

Bu proje, Google Gemini API'sinin gücünü kullanarak kullanıcıların profesyonel ve etkileyici CV'ler oluşturmasına yardımcı olan modern bir web uygulamasıdır. Kullanıcı dostu arayüzü sayesinde, CV'nizi kolayca oluşturabilir, düzenleyebilir ve yapay zeka destekli özelliklerle içeriğinizi zenginleştirebilirsiniz.

**Yazar:** [Gökhan Taylan](https://github.com/gkhantyln/)

---

## ✨ Özellikler

- **Yapay Zeka ile İçerik İyileştirme**: Tek bir tıklama ile profesyonel özet, iş tanımı ve proje açıklamaları gibi metinleri daha etkili ve profesyonel hale getirin.
- **Yapay Zeka ile Metin Çevirisi**: Oluşturulan veya mevcut metinleri doğrudan arayüz üzerinden Türkçeye çevirin.
- **Metin Dosyasından CV Bilgisi Çıkarma**: `.txt` formatındaki mevcut bir CV'nizi yükleyin ve yapay zekanın form alanlarını otomatik olarak doldurmasını izleyin.
- **Çoklu Dil Desteği**: Hem İngilizce hem de Türkçe arayüz seçenekleri.
- **Gerçek Zamanlı Önizleme**: Formu doldururken CV'nizin son halini anında görüntüleyin.
- **Fotoğraf Yükleme**: CV'nize kişisel bir dokunuş katmak için profil fotoğrafı ekleyin.
- **Gelişmiş İçe/Dışa Aktarma Seçenekleri**:
  - **PDF**: CV'nizi çok sayfalı, yüksek kaliteli bir PDF dosyası olarak indirin.
  - **JSON**: Tüm CV verilerinizi yedeklemek veya daha sonra düzenlemek üzere JSON formatında kaydedin ve tekrar yükleyin.
  - **TXT**: CV'nizin düz metin sürümünü indirin.
- **Tarayıcıda Otomatik Kayıt**: Yaptığınız tüm değişiklikler, siz sayfayı kapatsanız bile tarayıcınızın yerel depolama alanında (`localStorage`) güvende tutulur.
- **Modern ve Duyarlı Tasarım**: React ve Tailwind CSS ile oluşturulmuş, her cihazda harika görünen modern bir arayüz.

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: React, TypeScript, Tailwind CSS
- **Yapay Zeka API**: Google Gemini (`@google/genai`)
- **PDF Oluşturma**: `jsPDF`, `html2canvas`

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üstü)
- [npm](https://www.npmjs.com/) veya [yarn](https://yarnpkg.com/)

### Adımlar

1.  **Projeyi Klonlayın**:
    ```bash
    git clone https://github.com/gkhantyln/ai-cv-builder.git
    cd ai-cv-builder
    ```
    *(Not: Depo adını kendi projenizin adına göre güncelleyebilirsiniz.)*

2.  **Bağımlılıkları Yükleyin**:
    ```bash
    npm install
    ```
    veya
    ```bash
    yarn install
    ```

3.  **Ortam Değişkenlerini Ayarlayın**:
    - Projenin ana dizininde `.env` adında yeni bir dosya oluşturun.
    - `.env.example` dosyasını kopyalayarak başlayabilirsiniz.
    - Google Gemini API anahtarınızı bu dosyaya ekleyin:

    ```
    # .env dosyasının içeriği
    API_KEY=YOUR_GEMINI_API_KEY
    ```
    
    > **Not**: Google Gemini API anahtarınızı [Google AI Studio](https://aistudio.google.com/app/apikey) üzerinden ücretsiz olarak alabilirsiniz.

4.  **Geliştirme Sunucusunu Başlatın**:
    ```bash
    npm start
    ```
    veya
    ```bash
    yarn start
    ```

5.  Uygulamayı tarayıcınızda görüntülemek için `http://localhost:3000` (veya terminalde belirtilen başka bir port) adresini ziyaret edin.

## 🤝 Katkıda Bulunma

Katkılarınız projeyi daha iyi hale getirmemize yardımcı olur! Pull request'ler ve issue bildirimleri her zaman açıktır. Lütfen katkıda bulunmadan önce mevcut issue'ları ve pull request'leri inceleyin.

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakınız.
