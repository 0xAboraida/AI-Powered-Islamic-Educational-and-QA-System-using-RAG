# 🐳 Zad-AI Docker & API Contract Plan

## 📐 المعمارية العامة

```
Flutter App
    ↕  Streaming (حرف بحرف)
C# Backend (صديقي)
    ↕  Streaming (حرف بحرف)
Python AI Engine (أنا) ← Docker Container
    ↕
Qdrant Cloud + MongoDB Atlas + Modal Embedding
```

---

## 🔌 الـ Endpoint الوحيد

```
POST /api/v1/chat/stream
GET  /                    ← Health Check
GET  /docs                ← Swagger UI (توثيق تفاعلي)
```

---

## 📥 الـ Request

```json
{
  "query": "ما حكم الصلاة في الجماعة؟",
  "domain": "فقه",
  "session_id": "user-123",
  "conversation_history": [
    {"role": "user", "content": "ما حكم الصلاة في الجماعة؟"},
    {"role": "assistant", "content": "الصلاة في الجماعة واجبة..."}
  ]
}
```

| الحقل | النوع | ضروري؟ | الوصف |
|---|---|---|---|
| `query` | string | ✅ | سؤال المستخدم |
| `domain` | string | ✅ | المجال الإسلامي |
| `session_id` | string | ❌ اختياري | معرّف الجلسة |
| `conversation_history` | array | ❌ اختياري | تاريخ المحادثة |

### قيم `domain` المسموحة:
```
فقه | العقيدة | السيرة | التفسير | الحديث | النحو والصرف | التاريخ
```

---

## 📤 الـ Response (Server-Sent Events)

الرد يصل على شكل **Streaming** بحدثين مختلفين:

### الحدث الأول: `token` (يتكرر طوال الإجابة)
```
event: token
data: {"text": "بسم"}

event: token
data: {"text": " الله"}

event: token
data: {"text": " الرحمن"}
```

### الحدث الثاني: `citations` (يُرسل مرة واحدة في النهاية)
```
event: citations
data: {
  "citations": [
    {
      "domain": "الحديث",
      "madhhab": "شروح الحديث",
      "book_title": "تحفة الأحوذي",
      "author": "عبد الرحمن المباركفوري",
      "author_death": "1353هـ",
      "hijri_century": "القرن 14 الهجري",
      "total_parts": 10,
      "part": "1",
      "page_id": 42,
      "hierarchy": {
        "kitab": "أبواب الطهارة",
        "sections": []
      },
      "source_url": "https://ketabonline.com/ar/books/102859/read?part=1&page=42",
      "original_content": "النص الأصلي الكامل للـ Chunk هنا..."
    }
  ]
}
```

> **ملاحظة للـ Flutter:**
> عند ضغط المستخدم على Citation، يتم عرض `original_content` في شاشة منبثقة (Bottom Sheet أو Modal) فوق الشاشة الحالية، مع إمكانية فتح `source_url` في المتصفح.

---

## 🧠 الذاكرة (Memory)

### القرار المتخذ: الذاكرة مسؤولية الـ C# Backend

**السبب:** Python Engine لا يخزن أي State، مما يجعله:
- ✅ Stateless وقابل للـ Scale بسهولة
- ✅ أبسط في الـ Deployment
- ✅ لا يحتاج Redis أو قاعدة بيانات إضافية

**التدفق:**
1. المستخدم يرسل رسالة من Flutter.
2. C# Backend يُضيف الرسالة لسجل المحادثة ويحفظه.
3. C# Backend يرسل الرسالة + كل تاريخ المحادثة لـ Python Engine.
4. Python Engine يولّد الرد مع السياق الكامل.
5. C# Backend يحفظ الرد ويعيده لـ Flutter.

---

## 📦 مسؤوليات كل طرف

| الطرف | المسؤولية |
|---|---|
| **Python AI Engine (أنا)** | RAG Pipeline + توليد الإجابة + إرسال Streaming |
| **C# Backend (صديقي)** | استقبال الـ stream وإعادة إرساله + تخزين الذاكرة + إدارة المستخدمين |
| **Flutter** | عرض النص تدريجياً + عرض Citations + فتح `original_content` في Modal |

---

## 🐳 الـ Docker

### الملفات المُنشأة:
- `Dockerfile` — وصفة بناء الـ Container
- `docker-compose.yml` — لتشغيله بأمر واحد
- `.dockerignore` — يمنع رفع الـ `.venv` والـ data

### تشغيل محلي (للتجربة):
```bash
docker compose up --build
```

### رفع على Docker Hub:
```bash
docker build -t zad-ai-engine .
docker tag zad-ai-engine yourusername/zad-ai-engine:latest
docker push yourusername/zad-ai-engine:latest
```

### على السيرفر:
```bash
docker pull yourusername/zad-ai-engine:latest
docker run -p 8000:8000 --env-file .env yourusername/zad-ai-engine:latest
```

> **⚠️ تنبيه أمني:** ملف `.env` لا يُرفع داخل Docker Image أبداً.
> يتم تمريره للـ Container عبر `--env-file` أو عبر Environment Variables في منصة الـ Hosting.

---

## ✅ قائمة المهام المتبقية

- [ ] تحديث `schemas.py` بالـ Request/Response الجديد (مع `conversation_history` والـ Citations الكاملة)
- [ ] تحديث الـ Streaming Generator ليُرسل `event: token` و `event: citations` بشكل منفصل
- [ ] اختبار الـ Docker محلياً
- [ ] رفع الـ Image على Docker Hub أو السيرفر
- [ ] إعطاء صديقك رابط الـ API + هذا الملف كـ API Contract
