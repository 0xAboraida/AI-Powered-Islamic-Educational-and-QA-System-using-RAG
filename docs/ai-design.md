<div dir="rtl" align="right">

# الهيكلة المعمارية النهائية لمشروع Zad-Islamic-AI2

هذا الملف يوضح الهيكلة الشاملة والنهائية للمشروع بناءً على ملف `structure.txt` ومسار العمل (Pipeline) الموضح في `complete_rag_pipeline.svg`.

## 1. مجلد البيانات (`data/`)
تم ترتيبه حسب متطلباتك في `structure.txt` مع إضافات الـ RAG المتقدمة.

```text
data/
├── 1- raw/                    # (موجود) النصوص الإسلامية الخام
├── 2- processed/              # (موجود) النصوص المنظفة والمقسمة لقطع (Chunked)
├── 3- embeddings/             # (موجود) تخزين المتجهات الكثيفة والمتفرقة كنسخة احتياطية
└── 4- graphs/                 # [جديد] لتخزين علاقات (الآيات والأحاديث) للـ Graph Retrieval
```

## 2. مجلد محرك الذكاء الاصطناعي (`services/ai_rag_engine/`)

```text
services/ai_rag_engine/
├── app/
│   ├── api/                   # واجهات الـ FastAPI للاتصال بالخادم الرئيسي
│   │   ├── routes.py
│   │   └── dependencies.py
│   │
│   ├── pipeline/              # [تعديل] المسار المتكامل والمنظم للعمليات
│   │   ├── preprocessing/     # (تغطي Phases 1,2,3)
│   │   │   ├── base.py        # واجهات Abstract Classes
│   │   │   ├── cleaner.py     # تنظيف النص ومعايرته
│   │   │   ├── chunker.py     # تقسيم متقدم مع Overlap وضبط הـ Hierarchy
│   │   │   └── entity_linker.py # استخراج وربط الآيات والأحاديث
│   │   │
│   │   ├── embeddings/        # (تغطي Phase 4) (تم نقل النماذج هنا للتنظيم)
│   │   │   ├── base.py
│   │   │   ├── dense_model.py
│   │   │   ├── sparse_model.py # نموذج BM25
│   │   │   ├── multi_vector.py # إنشاء متجهات متعددة
│   │   │   └── factory.py     # Factory Pattern لاستدعاء النماذج
│   │   │
│   │   ├── retrieval/         # (تغطي Phase 6)
│   │   │   ├── base_retriever.py
│   │   │   ├── dense_retriever.py
│   │   │   ├── sparse_retriever.py
│   │   │   ├── hybrid_search.py
│   │   │   ├── fusion.py      # Reciprocal Rank Fusion
│   │   │   ├── multi_hop.py   # Multi-Hop Retrieval
│   │   │   ├── parent_child.py
│   │   │   └── graph_retrieval.py
│   │   │
│   │   ├── reranking/         # (تغطي Phase 7)
│   │   │   ├── base_reranker.py
│   │   │   ├── cross_encoder.py
│   │   │   └── diversity_scorer.py # إزالة التداخل بين الـ Chunks المتقاربة
│   │   │
│   │   └── generation/        # (تغطي Phases 5,8,9)
│   │       ├── query_rewriter.py # إعادة صياغة السؤال
│   │       ├── prompt_builder.py
│   │       ├── llm_generator.py
│   │       ├── citations.py   # إضافة توثيق دقيق للمصادر
│   │       ├── verifier.py    # فحص الإجابة باستخدام LLM
│   │       └── self_reflection/ # نظام الـ Self-Reflection
│   │           ├── evaluator.py
│   │           └── retry_logic.py
│   │
│   ├── models/                # الكيانات ونماذج البيانات
│   │   ├── document_model.py
│   │   ├── request_model.py
│   │   ├── response_model.py
│   │   └── LLM/               # (موجود) إعدادات نماذج اللغة كـ OpenAI وغيرها
│   │       ├── client.py
│   │       └── providers.py
│   │
│   ├── config/                # إعدادات المشروع
│   │   └── settings.py
│   │
│   └── main.py                # نقطة بدء تشغيل FastAPI
│
├── infrastructure/            # (موجود) البنية التحتية الخاصة بـ AI Service
│   └── vector_db/
│       ├── qdrant_client.py
│       ├── payload_builder.py
│       └── filters.py
│
├── scripts/                   # سكريبتات إدخال البيانات (Ingestion)
├── notebooks/                 # تجارب النماذج
├── tests/                     # اختبارات الوحدة (Unit Tests)
└── requirements.txt
```

</div>
