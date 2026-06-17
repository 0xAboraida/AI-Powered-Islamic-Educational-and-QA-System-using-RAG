# 🐛 Bug Report: Citation URL مش بيفتح المكان الصحيح في الكتاب

**التاريخ:** 2026-06-15  
**الملف المتأثر:** `services/ai_rag_engine/app/pipeline/extraction/html_processor.py`  
**الحالة:** ✅ تم الإصلاح

---

## 📌 وصف المشكلة

عند الضغط على زر **"فتح المصدر الأصلي"** في الـ UI، كان الموقع يفتح **أول صفحة في الكتاب** بدلاً من الصفحة التي تحتوي على النص المُستشهد به.

---

## 🔍 السبب الجذري

### أين كانت المشكلة؟

في دالة `create_chunk()` داخل `html_processor.py` السطر 63، كان الـ `source_url` يُبنى هكذا:

```python
# ❌ الكود القديم الخاطئ
"source_url": f"https://ketabonline.com/ar/books/{book_meta['id']}/read"
              f"?part={page_data.get('part', {}).get('name', '1')}"
              f"&page={page_num}"
```

### لماذا كان هذا خاطئاً؟

فيه متغيران بيشوفهم الكود في كل صفحة:

| المتغير | القيمة | المعنى |
|---------|--------|--------|
| `page_num` | `"٤٢"` أو `42` | رقم الصفحة **المطبوعة** في الكتاب |
| `db_page_id` | `198473` | الـ ID الداخلي للصفحة في قاعدة بيانات ketabonline |

الكود كان يستخدم `page_num` (رقم الصفحة المطبوعة) في الـ URL، لكن موقع **ketabonline.com يتجاهل تماماً** الـ `?page=` query parameter ويفتح الكتاب من أول صفحة.

الموقع يفهم فقط الـ **URL format** الذي يستخدم الـ `/pages/{db_page_id}` path segment.

### مثال توضيحي

```
# ❌ URL قديم — يفتح أول صفحة في الكتاب دائماً
https://ketabonline.com/ar/books/2130/read?part=1&page=42

# ✅ URL صحيح — يفتح مباشرةً صفحة الحديث
https://ketabonline.com/ar/books/2130/pages/198473
```

---

## 🛠️ الإصلاح المُطبَّق

```python
# ✅ الكود الجديد الصحيح
direct_page_url = (
    f"https://ketabonline.com/ar/books/{book_meta['id']}/pages/{db_page_id}"
)
chunk = {
    ...
    "page_id": db_page_id,       # ID الصفحة الداخلي (للـ URL)
    "printed_page": page_num,    # رقم الصفحة المطبوعة (للعرض في الـ UI)
    "source_url": direct_page_url,
}
```

**الفرق الجوهري:**
- `db_page_id` = `page_data.get('id')` ← الـ ID الداخلي لـ ketabonline
- `page_num` = `page_data.get('page')` ← رقم الصفحة في الكتاب المطبوع

---

## ⚠️ تأثير الإصلاح على البيانات الموجودة

> [!WARNING]
> هذا الإصلاح يعمل تلقائياً فقط على **الكتب الجديدة** التي ستُعاد استخراجها.
> البيانات الموجودة حالياً في MongoDB تحتوي على الـ URLs القديمة الخاطئة.

### خياران للتعامل مع البيانات الموجودة:

**الخيار 1 — Migration Script (الأسرع):**  
كتابة script يُحدِّث حقل `metadata.source_url` لكل document في MongoDB بناءً على `metadata.page_id` الموجود:
```python
# لكل document في MongoDB:
new_url = f"https://ketabonline.com/ar/books/{doc['metadata']['book_id']}/pages/{doc['metadata']['page_id']}"
collection.update_one({"_id": doc["_id"]}, {"$set": {"metadata.source_url": new_url}})
```

**الخيار 2 — إعادة الاستخراج الكاملة (الأدق):**  
إعادة تشغيل `run_extraction.py` لكل الكتب لإعادة بناء البيانات من الـ API. يضمن صحة كل الـ metadata لكنه أبطأ.

---

## 📁 الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `extraction/html_processor.py` | ✅ تم تعديل `create_chunk()` لاستخدام `db_page_id` |
| MongoDB collections (البيانات الموجودة) | ⚠️ تحتاج migration أو إعادة استخراج |

---

## 🔗 الملفات ذات الصلة

- [`html_processor.py`](../services/ai_rag_engine/app/pipeline/extraction/html_processor.py) — الإصلاح الفعلي
- [`citations.py`](../services/ai_rag_engine/app/pipeline/generation/citations.py) — يقرأ `source_url` من MongoDB ويبعثه للـ UI
- [`extractor.py`](../services/ai_rag_engine/app/pipeline/extraction/extractor.py) — يستدعي `html_processor.process_page()`
