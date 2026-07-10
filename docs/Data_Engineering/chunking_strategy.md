<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> 🧩 Chunking Strategy: The Parent-Child Architecture</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        In modern Retrieval-Augmented Generation (RAG) systems, chunking is often treated as an afterthought—simply slicing text every 500 tokens. However, in Zad-AI, where classical Islamic texts feature highly complex legal arguments spanning multiple pages, standard sliding-window chunking destroys semantic context. To solve this, Zad-AI employs a sophisticated Parent-Child Chunking Strategy implemented in `chunker.py`.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Core Philosophy

The problem with standard chunking:
* **If chunks are too small (e.g., 200 words):** The vector database finds the exact match perfectly, but the LLM receives an incomplete paragraph and fails to understand the full Fiqh ruling.
* **If chunks are too large (e.g., 2000 words):** The LLM gets the full context, but the vector database struggles to find the chunk because the specific answer is buried inside too much noise, diluting the mathematical embedding.

**The Solution:** 
We split every extracted Fiqh issue (which we merged intelligently during the extraction phase) into two distinct entities:
1. **The Parent Document:** The entire, unbroken issue/chapter.
2. **The Child Chunks:** Small, overlapping segments derived from the Parent.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The Algorithmic Implementation

When `chunker.py` receives a cleaned document, it executes the following logic:

#### 2.1. The Margin-Aware Splitter
The default target for a Child chunk is `400 words` with a `50-word` overlap. 
To prevent the creation of tiny, useless "orphan" chunks (e.g., a chapter with 410 words being split into a 400-word chunk and a 10-word chunk), the engine uses a `1.2x` margin multiplier.
* If the total document is `<= 480 words`, it creates exactly **one** Child chunk containing the entire text.
* If the document is `> 480 words`, it iteratively slides a 400-word window with a 50-word overlap until the document is fully consumed.

#### 2.2. Dual Content Proportional Mapping
Because Zad-AI uses a **Dual Representation System** (as explained in the Preprocessing Guide), the chunker must split both the stripped `content` and the fully diacritized `original_content`.

Since removing Tashkeel and normalizations can slightly alter the word count between the two versions, the chunker uses a mathematical **Proportional Mapping Formula**:

```python
orig_start = int(start * (len(original_words) / max(1, len(words))))
orig_end = int(end * (len(original_words) / max(1, len(words))))
```

This ensures that the diacritized chunk remains perfectly aligned with the stripped chunk, without causing array out-of-bounds errors.

#### 2.3. Hierarchical Metadata Structuring
Every chunk generated is injected with rich metadata. The chunker transforms the flat hierarchy list into a structured JSON object:

```json
{
  "kitab": "كتاب الطهارة",
  "sections": ["باب المياه", "فصل في الماء النجس"]
}
```

This structured approach allows the vector database to filter queries specifically by "Kitab" or deeper sections.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. The Storage Split

Once the chunker returns the array of `[Parent, Child_1, Child_2, ...]`, the Data Pipeline routes them to different storage engines:

* **Child Chunks ➡️ Qdrant (Vector DB):** 
  Their `content` (stripped) is embedded using `BGE-M3`. Because they are small (400 words), they yield highly accurate mathematical matches during user searches.
* **Parent Documents ➡️ MongoDB Atlas (Document DB):** 
  Their `original_content` (with Tashkeel) is saved in MongoDB. 

**At Query Time:** When a user asks a question, Qdrant returns `Child_2`. The system looks at `Child_2.parent_id`, instantly fetches the massive Parent Document from MongoDB, and sends the *entire* Fiqh issue to the LLM. 
This guarantees pinpoint search accuracy while providing the LLM with maximum, unbroken context.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 4. Examples in Practice

To visualize the Parent-Child architecture, consider this Fiqh text from *Al-Mabsut* by Al-Sarakhsi.

#### 4.1. The Parent Chunk (MongoDB)
This chunk contains the full, unbroken context and is completely retrieved for LLM generation.

```json
{
  "chunk_id": "parent_4836_132_2",
  "chunk_type": "parent",
  "content": "[الْأَذَانُ قَاعِدًا] قَالَ (وَيُكْرَهُ الْأَذَانُ قَاعِدًا) لِأَنَّهُ فِي حَدِيثِ الرُّؤْيَا قَالَ: فَقَامَ الْمَلَكُ عَلَى جِذْمِ حَائِطٍ، وَلِأَنَّ الْمَقْصُودَ الْإِعْلَامُ وَتَمَامُهُ فِي حَالَةِ الْقِيَامِ وَلَكِنَّهُ يُجْزِئُهُ لِأَنَّ أَصْلَ الْمَقْصُودِ حَاصِلٌ قَالَ (وَلَا بَأْسَ بِأَنْ يُؤَذِّنَ وَاحِدٌ وَيُقِيمَ آخَرُ) لِمَا رُوِيَ أَنَّ «عَبْدَ اللَّهِ بْنَ زَيْدٍ - رَضِيَ اللَّهُ عَنْهُ - سَأَلَ رَسُولَ اللَّهِ - صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ - أَنْ يَكُونَ لَهُ فِي الْأَذَانِ نَصِيبٌ فَأَمَرَ بِأَنْ يُؤَذِّنَ بِلَالٌ وَيُقِيمَ» هُوَ وَلِأَنَّ كُلَّ وَاحِدٍ مِنْهُمَا ذِكْرٌ مَقْصُودٌ فَلَا بَأْسَ بِأَنْ يَأْتِيَ بِكُلِّ وَاحِدٍ مِنْهُمَا رَجُلٌ آخَرُ... (تكملة النص الأصلي)",
  "metadata": {
    "book_id": 4836,
    "book_title": "المبسوط للسرخسي",
    "author": "السرخسي",
    "domain": "فقه",
    "madhhab": "حنفي",
    "part": "1",
    "page_id": 130,
    "hierarchy": {
      "kitab": "كتاب الصلاة",
      "sections": ["باب الأذان", "الأذان قاعدا"]
    },
    "source_url": "https://ketabonline.com/ar/books/4836/read?part=1&page=132",
    "child_chunks": [
      "child_4836_132_2_1",
      "child_4836_132_2_2"
    ]
  }
}
```

#### 4.2. The Child Chunks (Qdrant)
This represents the first overlapping child chunk derived from the parent above. Notice how it is much shorter, allowing for highly focused mathematical search, while keeping a strict reference to its `parent_id`.

```json
{
  "chunk_id": "child_4836_132_2_1",
  "chunk_type": "child",
  "parent_id": "parent_4836_132_2",
  "content": "[الْأَذَانُ قَاعِدًا] قَالَ (وَيُكْرَهُ الْأَذَانُ قَاعِدًا) لِأَنَّهُ فِي حَدِيثِ الرُّؤْيَا قَالَ: فَقَامَ الْمَلَكُ عَلَى جِذْمِ حَائِطٍ، وَلِأَنَّ الْمَقْصُودَ الْإِعْلَامُ وَتَمَامُهُ فِي حَالَةِ الْقِيَامِ وَلَكِنَّهُ يُجْزِئُهُ لِأَنَّ أَصْلَ الْمَقْصُودِ حَاصِلٌ.",
  "metadata": {
    "book_title": "المبسوط للسرخسي",
    "domain": "فقه",
    "madhhab": "حنفي",
    "hierarchy": {
      "kitab": "كتاب الصلاة",
      "sections": ["باب الأذان", "الأذان قاعدا"]
    }
  }
}
```

</div>
