# 📄 Zad-AI Engine API Contract

This document outlines the API specifications for the Zad-AI Python Engine. It is intended for the C# Backend and Flutter developers to integrate with the RAG pipeline.

## 🔌 Base Endpoint
```http
POST /api/v1/chat/stream
```
*Note: The engine should be hosted on a production server. Replace `localhost:8000` with the actual server IP/Domain once deployed.*

---

## 📥 Request Schema (JSON)

The endpoint expects a `POST` request with the following JSON body:

```json
{
  "query": "ما حكم الصلاة في الجماعة؟",
  "domain": "فقه",
  "session_id": "user-123",
  "conversation_history": [
    {"role": "user", "content": "ما حكم الصلاة في الجماعة؟"},
    {"role": "assistant", "content": "الصلاة في الجماعة واجبة عند بعض المذاهب..."}
  ]
}
```

### Fields Description:

| Field | Type | Required? | Description |
|---|---|---|---|
| `query` | `string` | ✅ Yes | The user's current question. |
| `domain` | `string` | ✅ Yes | The Islamic domain. Allowed values: `فقه`, `العقيدة`, `السيرة`, `التفسير`, `الحديث`, `النحو والصرف`, `التاريخ` |
| `session_id` | `string` | ❌ No | Optional session identifier. |
| `conversation_history` | `array` | ❌ No | Array of previous messages for context memory. **(Managed by the C# Backend)**. |

---

## 📤 Response Schema (Server-Sent Events / SSE)

The response is a **Stream** of events (`text/event-stream`). The C# Backend should consume this stream and relay it to the Flutter app.

### 1. Token Event (`event: token`)
This event is emitted continuously as the LLM generates the answer.

```text
event: token
data: {"text": "بسم"}

event: token
data: {"text": " الله"}
```

### 2. Citations Event (`event: citations`)
This event is emitted **once** at the very end of the stream. It contains the metadata for the sources actually used to generate the answer.

```text
event: citations
data: {"citations": [{"id": 1, "domain": "فقه", "madhhab": "شافعي", "book_title": "الأم", "author": "الشافعي", "source_url": "...", "original_content": "..."}]}
```

### 3. Error Event (`event: error`)
If an exception occurs during generation.
```text
event: error
data: {"text": "حدث خطأ أثناء توليد الإجابة."}
```

---

## 🧠 Memory Management (C# Responsibility)

The Python AI Engine is **Stateless**. It does not save conversations to a database.
1. The Flutter App sends a message to the C# Backend.
2. The C# Backend retrieves the user's `conversation_history` from its database.
3. The C# Backend calls this Python endpoint, passing both the new `query` and the `conversation_history`.
4. The Python Engine streams the generated response.
5. The C# Backend saves the new assistant response to its database and relays the stream to Flutter.
