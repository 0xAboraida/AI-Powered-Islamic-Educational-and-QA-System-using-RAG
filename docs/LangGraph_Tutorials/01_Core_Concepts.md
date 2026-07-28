<div dir="rtl" style="text-align: right;">

# شرح المفاهيم الأساسية لـ LangGraph وكيفية تطبيقها في مشروع Zad-AI

أهلاً بك! بما أننا اتفقنا على التعلم خطوة بخطوة، فهذا الملف سيكون بمثابة مرجعك الأول لفهم كيف نفكر، وكيف سنبني معمارية Agentic RAG باستخدام LangGraph. كل شيء سيتم شرحه وتوثيقه هنا لتتمكن من العودة إليه في أي وقت.

## 1. ما هو LangGraph وكيف يختلف عن LangChain؟
في LangChain العادي، نحن نبني **سلاسل (Chains)**: خطوة 1 ثم خطوة 2 ثم خطوة 3 وتنتهي العملية. هذا ممتاز للمهام البسيطة (مثل الـ `StandardPipeline` لديك).
ولكن عندما نحتاج إلى تفكير عميق (مثل الـ `ExpertPipeline` والـ `Gap Analyzer`)، فنحن نحتاج إلى **حلقات (Loops)** و**شروط (Conditions)**؛ بمعنى: يسأل النظام نفسه "هل المعلومات المسترجعة كافية للإجابة؟" 
- إذا كان الجواب "لا"، يجب أن يعود للبحث مرة أخرى.
- إذا كان "نعم"، يذهب لتوليد الإجابة.

هنا يلمع نجم **LangGraph**: فهو مصمم لعمل **State Machines (آلات حالة)** باستخدام فكرة الرسوم البيانية (Graphs) للسماح بمسارات العمل الدائرية والمعقدة.

---

## 2. المفاهيم الثلاثة الأساسية (الثالوث) 
تخيل LangGraph كلعبة لوحية تتحرك فيها ورقة (الـ State) بين عدة محطات (Nodes) عبر طرق محددة (Edges).

### أولاً: State (الحالة - الذاكرة)
- **المفهوم:** هي "الذاكرة" أو "صندوق البيانات" الخاص بطلب المستخدم. هذا الصندوق يتنقل بين الوكلاء، وكل وكيل يقرأ منه معلومات ويضيف إليه معلومات جديدة.
- **في مشروعنا:** الـ State ستحتوي على: `السؤال الأصلي`، `نية المستخدم (Intent)`، `استراتيجية البحث`، `النصوص المسترجعة (Context)`، `ملاحظات الـ Gap Analyzer`، وعدد `المحاولات (Iterations)`.
- **في الكود:** نمثلها عادةً بـ `TypedDict` في لغة بايثون لنحدد شكل البيانات التي نحملها ونتأكد من صحتها.

### ثانياً: Nodes (العُقد أو المحطات)
- **المفهوم:** هي الوكلاء أنفسهم (Agents) أو الدوال (Functions) التي تقوم بالعمل الفعلي داخل مسار العمل.
- **في مشروعنا:** سيكون لدينا Nodes مثل: 
  - `intent_classifier_node` (لتحديد نية السؤال)
  - `domain_planner_node` (لوضع استراتيجية البحث)
  - `retrieval_node` (للبحث في قاعدة البيانات)
  - `gap_analyzer_node` (لمعرفة الفجوات المعرفية)
  - `generator_node` (لتوليد الإجابة النهائية)
- **في الكود:** كل Node هي مجرد دالة بايثون بسيطة جداً، تأخذ الـ State الحالية كمُدخل، تفعل شيئاً (مثل استدعاء LLM)، ثم تُرجع التحديثات التي تريد إضافتها للـ State.

### ثالثاً: Edges (الروابط أو الطرق)
- **المفهوم:** هي القواعد التي تحدد "أين نذهب بعد هذه المحطة؟". هناك روابط عادية (ننتقل من أ إلى ب دائماً)، وهناك **روابط شرطية (Conditional Edges)** (نقرر أين نذهب بناءً على حالة معينة).
- **في مشروعنا:** 
  - **رابط عادي:** ننتقل من الـ `domain_planner` إلى الـ `retrieval_node` دائماً.
  - **رابط شرطي (Router):** في البداية، هل نذهب إلى `StandardPipeline` أم `ExpertPipeline`؟
  - **رابط شرطي (Loop):** بعد الـ `gap_analyzer_node`، هل نعود إلى الـ `retrieval_node` (لأن المعلومات ناقصة) أم نكمل إلى الـ `generator_node`؟

---

## 3. كيف نفكر كمهندسين عند بناء الـ Graph؟ (Thought Process)

قبل كتابة سطر كود واحد، نرسم المسار (Flow) في عقلنا أو على ورق. بالنسبة لخطة `Agentic_RAG_Architecture_Plan` التي وضعتها، مسار الـ Expert Pipeline سيسير كالتالي:

1. **البداية (START):** يدخل سؤال المستخدم.
2. **محطة التصنيف (Intent Classification):** نحلل السؤال ونحدد نوعه.
3. **محطة التخطيط (Domain Planning):** نخطط لاستراتيجية البحث المناسبة للمجال.
4. **محطة الاسترجاع (Retrieval):** ننفذ البحث ونجلب النصوص.
5. **محطة التحليل (Gap Analyzer) - هنا العقل المدبر:** نقرأ النصوص ونقارنها بما يحتاجه السؤال. 
   - **(الرابط الشرطي هنا):** هل المعلومات كافية أم وصلنا للحد الأقصى من المحاولات (مثلاً 3)؟ 
     - إذا **لا (غير كافية)**: أضف ملاحظات لما ينقصنا وارجع لمحطة الاسترجاع **Retrieval**.
     - إذا **نعم (كافية أو استنفدنا المحاولات)**: اذهب لمحطة التوليد **Generation**.
6. **محطة التوليد (Generation):** صياغة الإجابة النهائية بناءً على كل ما جمعناه.
7. **النهاية (END).**

---

## 4. الهيكل المبدئي جداً للكود (Skeleton)
هذا مجرد هيكل تقريبي لترى كيف تترجم المفاهيم السابقة إلى كود بايثون نظيف، وسنقوم بكتابة كل جزء بالتفصيل الممل في الملفات الحقيقية:

```python
from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END

# 1. تعريف الـ State (صندوق البيانات)
class AgenticRAGState(TypedDict):
    question: str
    intent: str
    search_strategy: str
    documents: List[str]
    gap_notes: str
    iterations: int

# 2. تعريف الـ Nodes (الدوال أو الوكلاء)
def domain_planner_node(state: AgenticRAGState):
    # هنا نكتب كود الـ LLM الخاص بوضع الاستراتيجية
    # الدالة تُرجع فقط القيم التي تريد تحديثها في الـ State
    return {"search_strategy": "بحث مكثف في الفقه المقارن"}

def retrieval_node(state: AgenticRAGState):
    # هنا كود البحث الفعلي في Qdrant أو غيره بناءً على الاستراتيجية
    return {"documents": ["نص فقهي 1", "نص حديثي 2"], "iterations": state.get("iterations", 0) + 1}

def gap_analyzer_node(state: AgenticRAGState):
    # كود الـ LLM لاكتشاف الفجوات المعرفية
    return {"gap_notes": "ينقصنا رأي الحنابلة في المسألة"}

def generator_node(state: AgenticRAGState):
    # كود التوليد النهائي للإجابة
    return {} # ترجع الإجابة النهائية

# ----------------------------------------------------
# دالة التوجيه الشرطي (Conditional Edge) - صانع القرار
# ----------------------------------------------------
def should_continue_retrieval(state: AgenticRAGState):
    # إذا تجاوزنا 3 محاولات أو قال المحلل أن المعلومات كافية، نذهب للتوليد
    if state["iterations"] >= 3 or state["gap_notes"] == "كافي":
        return "generate"
    
    # غير ذلك، نعود لمحطة البحث
    return "retrieve"

# ====================================================
# 3. بناء الـ Graph وتوصيل القطع ببعضها
# ====================================================
workflow = StateGraph(AgenticRAGState)

# أ. إضافة المحطات (Nodes)
workflow.add_node("planner", domain_planner_node)
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("analyzer", gap_analyzer_node)
workflow.add_node("generator", generator_node)

# ب. إضافة الطرق العادية (Edges)
workflow.add_edge(START, "planner")
workflow.add_edge("planner", "retrieval")
workflow.add_edge("retrieval", "analyzer")

# ج. إضافة الطريق الشرطي (الـ Loop السحرية)
workflow.add_conditional_edges(
    "analyzer",                 # من أين نخرج؟
    should_continue_retrieval,  # من الدالة التي ستقرر؟
    {
        "retrieve": "retrieval", # إذا كان القرار retrieve، اذهب لمحطة retrieval
        "generate": "generator"  # إذا كان القرار generate، اذهب لمحطة generator
    }
)

# د. الطريق النهائي
workflow.add_edge("generator", END)

# هـ. تجميع وتشغيل النظام
app = workflow.compile()
```

هذا الملف سيبقى كمرجع لك، وفي كل خطوة قادمة سنقوم بإنشاء ملفات جديدة لشرح الأكواد الحقيقية التي سنكتبها في مشروعك.

</div>
