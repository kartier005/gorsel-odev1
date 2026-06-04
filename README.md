# 📝 OfficeHub - Web Tabanlı Office Uygulaması

Web tarayıcısı üzerinde çalışan, Word / Excel / PowerPoint editörleri içeren ve verileri **MySQL veritabanına JSON formatında** kaydeden Office uygulaması.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

---

## 📋 Proje Hakkında

**OfficeHub**, [office.ziziyi.com](https://office.ziziyi.com/) referans alınarak geliştirilmiş web tabanlı bir Office uygulamasıdır. Kullanıcılar tarayıcı üzerinden Word belgesi, Excel tablosu veya PowerPoint sunumu oluşturabilir ve **Kaydet** butonuna basarak tüm veriyi JSON formatında MySQL veritabanına kaydedebilirler.

### 🔗 Referans Kaynaklar

- **GitHub**: [https://github.com/nihattunali/office-website](https://github.com/nihattunali/office-website)
- **Canlı Örnek**: [https://office.ziziyi.com/](https://office.ziziyi.com/)

### ✨ Özellikler

- 📄 **Word Editörü** — Zengin metin editörü (bold, italic, font, renk, hizalama, listeler)
- 📊 **Excel Editörü** — 50 satır × 26 sütunluk hesap tablosu, formül çubuğu
- 📽️ **PowerPoint Editörü** — Çoklu slayt, arkaplan rengi, serbest düzenleme
- 💾 **Kaydet Butonu** — Tüm veri JSON formatında MySQL'e kaydedilir
- 📂 **Kayıtlı Belgeler** — Veritabanındaki belgeleri listeleme, görüntüleme, yükleme
- 🗑️ **Silme** — Belgeleri veritabanından silme
- 🐳 **Docker Compose** — 3 container (MySQL + Backend + Frontend)

---

## 🗃️ Veritabanı Yapısı (MySQL)

İstenilen Tablo Yapısı

```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data JSON NOT NULL
);
```

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | INT AUTO_INCREMENT | Benzersiz belge ID'si |
| `datetime` | DATETIME | Kayıt tarihi ve saati |
| `data` | JSON | Belgenin tüm verisi (JSON formatında) |

### Kaydedilen JSON Veri Örneği

**Word belgesi:**
```json
{
    "type": "word",
    "content": "<h1>Başlık</h1><p>İçerik...</p>",
    "textContent": "Başlık\nİçerik..."
}
```

**Excel tablosu:**
```json
{
    "type": "excel",
    "cells": {"0_0": "Ad", "0_1": "Soyad", "1_0": "Ali", "1_1": "Yılmaz"},
    "rows": 50,
    "cols": 26
}
```

**PowerPoint sunumu:**
```json
{
    "type": "powerpoint",
    "slides": [
        {"content": "<h1>Başlık</h1>", "bg": "#ffffff"},
        {"content": "<h2>İkinci Slayt</h2>", "bg": "#2B579A"}
    ],
    "currentSlide": 0
}
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | HTML5, CSS3, Vanilla JS | Word/Excel/PPT editörleri |
| **Backend** | FastAPI (Python 3.11) | REST API, MySQL bağlantısı |
| **Veritabanı** | MySQL 8.0 | JSON veri saklama |
| **Web Sunucu** | Nginx | Statik dosya & reverse proxy |
| **Container** | Docker & Docker Compose | 3 servis orkestrasyonu |

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Çalıştırma

```bash
# Projeyi klonlayın
git clone https://github.com/KULLANICI_ADI/officehub.git
cd officehub

# Docker ile çalıştırın (ilk seferde build süresi ~2-3 dk)
docker-compose up --build
```

### Servisler

| Servis | URL | Açıklama |
|--------|-----|----------|
| 🌐 **Web Uygulaması** | [http://localhost:3000](http://localhost:3000) | Office editörü |
| 🔌 **Backend API** | [http://localhost:8000](http://localhost:8000) | REST API |
| 📄 **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| 🗄️ **MySQL** | `localhost:3306` | Veritabanı |

### Durdurma

```bash
docker-compose down

# Veritabanı verilerini de silmek için:
docker-compose down -v
```

---

## 📖 Kullanım

### 1. Yeni Belge Oluşturma
- Ana sayfada **Word / Excel / PowerPoint** kartlarından birine tıklayın
- İlgili editör açılır

### 2. Belge Düzenleme
- **Word**: Toolbar ile metin biçimlendirme (kalın, italik, font, renk, hizalama)
- **Excel**: Hücrelere veri girişi, formül çubuğu
- **PowerPoint**: Slayt ekleme/silme, arkaplan rengi, serbest metin

### 3. Kaydetme (MySQL'e)
- **💾 Kaydet** butonuna basın veya **Ctrl+S** kısayolunu kullanın
- Tüm veri JSON formatında MySQL `documents` tablosuna kaydedilir

### 4. Kayıtlı Belgeleri Görme
- Ana sayfadaki **Kayıtlı Belgeler** bölümünden belgeleri görüntüleyin
- 📝 butonu ile editörde açın, 🗑️ ile silin

---

## 📁 Proje Yapısı

```
officehub/
├── docker-compose.yml          # 3 servis: db, backend, frontend
├── README.md
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt        # FastAPI + MySQL connector
│   └── main.py                 # API: CRUD + MySQL bağlantısı
└── frontend/
    ├── Dockerfile
    ├── nginx.conf              # Reverse proxy
    ├── index.html              # Dashboard + editörler
    ├── style.css               # Dark mode arayüz
    └── app.js                  # Editör mantığı + API iletişimi
```

---

## 🔌 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/documents` | **Kaydet** — JSON veriyi MySQL'e kaydet |
| `GET` | `/api/documents` | Tüm belgeleri listele |
| `GET` | `/api/documents/{id}` | Belirli belgeyi getir |
| `PUT` | `/api/documents/{id}` | Belgeyi güncelle |
| `DELETE` | `/api/documents/{id}` | Belgeyi sil |

### Örnek Kaydetme İsteği

```bash
curl -X POST http://localhost:8000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "word",
      "content": "<h1>Merhaba</h1><p>Bu bir test belgesidir.</p>",
      "textContent": "Merhaba\nBu bir test belgesidir."
    }
  }'
```

**Yanıt:**
```json
{
    "message": "Belge başarıyla kaydedildi!",
    "id": 1,
    "datetime": "2026-06-04 23:30:00"
}
```

---

## 🏗️ Mimari

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐       ┌──────────┐
│   Tarayıcı  │ HTTP  │    Nginx     │ Proxy │   FastAPI   │  SQL  │  MySQL   │
│  (Word/     │──────>│  (Frontend)  │──────>│  (Backend)  │──────>│   8.0    │
│  Excel/PPT) │       │  Port: 3000  │ /api/ │  Port: 8000 │       │ Port:3306│
└─────────────┘       └──────────────┘       └─────────────┘       └──────────┘
```

### Kaydetme Akışı
1. Kullanıcı editörde belge oluşturur/düzenler
2. **Kaydet** butonuna basar
3. JavaScript, editör verisini JSON'a çevirir
4. `POST /api/documents` ile backend'e gönderir
5. FastAPI, JSON veriyi MySQL `documents` tablosuna `INSERT` eder
6. Kullanıcıya başarılı kayıt bildirimi gösterilir
