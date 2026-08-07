from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import uvicorn
import logging
from typing import List, Optional

from database import (
    connect_to_mongo,
    close_mongo_connection,
    get_chunk_by_id,
    chunk_collections,
)
from tutor import generate_tutor_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Zad Tutor Engine", version="1.0.0", lifespan=lifespan)

# Add CORS middleware to allow requests from the HTML UI file
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tutor_engine"}


# --- Schemas ---
class ChatMessage(BaseModel):
    role: str
    content: str


class TutorChatRequest(BaseModel):
    chunk_id: str
    message: str
    history: List[ChatMessage] = []


class MindmapRequest(BaseModel):
    text: str


class QuizRequest(BaseModel):
    chunk_id: str
    num_questions: int = 3


class RawTutorChatRequest(BaseModel):
    text: str
    message: str
    history: list = []


from tree_builder import build_library_tree, format_tree_for_flutter
from fastapi.responses import HTMLResponse


@app.get("/ui", response_class=HTMLResponse)
async def get_ui():
    html_content = """
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zad Library Tree UI Test</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
            .header { background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header h1 { color: #38bdf8; margin: 0; font-size: 26px; }
            
            .dashboard { display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; max-width: 1400px; margin: 0 auto; }
            
            .panel { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .panel h2 { margin-top: 0; color: #f1f5f9; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            
            .sidebar { flex: 1; min-width: 300px; max-width: 350px; display: flex; flex-direction: column; gap: 20px; }
            .main-content { flex: 2; min-width: 400px; display: flex; flex-direction: column; gap: 15px; }
            
            .btn { background-color: #0284c7; color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; width: 100%; transition: 0.2s; text-align: center; }
            .btn:hover { background-color: #0369a1; }
            .btn-danger { background-color: #ef4444; }
            .btn-danger:hover { background-color: #dc2626; }
            .btn-warning { background-color: #f59e0b; color: #fff; }
            .btn-warning:hover { background-color: #d97706; }
            .btn-success { background-color: #10b981; }
            .btn-success:hover { background-color: #059669; }
            
            .form-group { margin-bottom: 15px; }
            .form-group label { display: block; margin-bottom: 6px; color: #cbd5e1; font-size: 14px; }
            .form-group select { width: 100%; padding: 10px; border-radius: 8px; background-color: #0f172a; border: 1px solid #334155; color: white; font-family: inherit; font-size: 14px; outline: none; box-sizing: border-box; }
            .form-group select[multiple] { height: 140px; }
            
            ul { list-style-type: none; padding-right: 20px; margin: 0; }
            li { margin: 6px 0; position: relative; }
            .caret { cursor: pointer; user-select: none; font-weight: bold; padding: 6px 8px; border-radius: 6px; display: inline-block; transition: background 0.2s; color: #e2e8f0; }
            .caret::before { content: "\\25C0"; color: #38bdf8; display: inline-block; margin-left: 8px; transition: transform 0.3s; font-size: 12px; }
            .caret-down::before { transform: rotate(-90deg); }
            .nested { display: none; margin-top: 5px; border-right: 1px solid #334155; padding-right: 15px; margin-right: 10px; }
            .active { display: block; }
            .chunk { color: #34d399; font-weight: normal; font-size: 0.95em; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.2s; display: inline-block; }
            .chunk:hover { background-color: #334155; text-decoration: none; }
            .caret:hover { background-color: #334155; }
            
            #tree-container { background: #0f172a; padding: 20px; border-radius: 8px; border: 1px solid #334155; min-height: 400px; max-height: 70vh; overflow-y: auto; }
            #loading { text-align: center; display: none; font-size: 1.1em; color: #fcd34d; margin-bottom: 10px; }
            
            /* Chat Modal Styles */
            .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.85); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(4px); }
            .chat-modal { background: #1e293b; width: 700px; max-width: 95%; height: 85vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; }
            .chat-header { background: #0f172a; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
            .chat-title { font-weight: bold; font-size: 18px; color: #38bdf8; }
            .close-btn { background: none; border: none; color: #ef4444; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
            .chat-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #0f172a; }
            .chunk-preview { background: #1e293b; padding: 15px; font-size: 14px; color: #cbd5e1; border-bottom: 1px solid #334155; border-right: 4px solid #10b981; line-height: 1.6; flex-shrink: 0; }
            .chat-messages { padding: 20px; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }
            .msg { max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 15px; line-height: 1.5; }
            .msg.user { background: #0284c7; color: white; align-self: flex-start; border-top-right-radius: 0; }
            .msg.tutor { background: #334155; color: #f8fafc; align-self: flex-end; border-top-left-radius: 0; }
            .msg.loading { background: transparent; color: #94a3b8; font-style: italic; align-self: flex-end; }
            .chat-input-area { padding: 15px; background: #1e293b; display: flex; gap: 10px; border-top: 1px solid #334155; }
            .chat-input { flex: 1; padding: 12px 15px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; outline: none; font-size: 15px; font-family: inherit; }
            .chat-input:focus { border-color: #38bdf8; }
            .chat-send-btn { background: #10b981; color: white; border: none; padding: 0 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s; }
            .chat-send-btn:hover { background: #059669; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>لوحة تحكم زاد (Zad Dashboard) 📚</h1>
        </div>
        
        <div class="dashboard">
            <!-- Sidebar / Admin Controls -->
            <div class="sidebar">
                <div class="panel">
                    <h2>⚙️ أدوات النظام</h2>
                    <button class="btn btn-warning" style="margin-bottom: 10px;" onclick="buildCache('')">بناء جميع الفهارس (Full Build)</button>
                    <button class="btn btn-danger" style="margin-bottom: 10px;" onclick="buildCache('بدائع الصنائع في ترتيب الشرائع')">تحديث كتاب "بدائع الصنائع"</button>
                    <button id="cancelBtn" class="btn btn-danger" style="display: none;" onclick="cancelBuild()">🛑 إيقاف البناء فوراً</button>
                </div>
                
                <div class="panel">
                    <h2>🛠️ بناء مخصص</h2>
                    <div class="form-group">
                        <label>المجال:</label>
                        <select id="domainSelect" onchange="updateMadhhabs()">
                            <option value="">جاري التحميل...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>المذهب:</label>
                        <select id="madhhabSelect" onchange="updateBooks()">
                            <option value="">-- اختر المجال أولاً --</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>الكتب (اضغط Ctrl للتعدد):</label>
                        <select id="customBooks" multiple>
                            <option value="">-- اختر المذهب أولاً --</option>
                        </select>
                    </div>
                    
                    <button class="btn" onclick="buildCustomBooks()">تنفيذ البناء المخصص</button>
                </div>
            </div>
            
            <!-- Main Content / Tree Viewer -->
            <div class="main-content">
                <div class="panel" style="flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 style="margin: 0; border: none; padding: 0;">📖 تصفح الفهارس والدروس</h2>
                        <button class="btn btn-success" style="width: auto; padding: 8px 15px;" onclick="loadTree('')">تحديث الفهرس من الكاش 🔄</button>
                    </div>
                    <div id="loading">جاري تحميل الفهرس، يرجى الانتظار...</div>
                    <div id="tree-container">
                        <div style="text-align: center; padding: 40px; color: #64748b;">
                            اضغط على "تحديث الفهرس من الكاش" لعرض المكتبة.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <!-- Chat Modal -->
        <div class="modal-overlay" id="chatOverlay">
            <div class="chat-modal">
                <div class="chat-header">
                    <div class="chat-title">المعلم زاد 🤖</div>
                    <button class="close-btn" onclick="closeChat()">×</button>
                </div>
                <div class="chat-body" id="chatBody">
                    <div class="chunk-preview" id="chunkPreview">جاري تحميل النص الأساسي...</div>
                    
                    <div style="text-align: center; margin: 15px 0; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0;">
                        <button id="mindmapBtn" onclick="generateMindmapFromChat()" style="background-color: #f50057; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; display: none;">توليد الخريطة الذهنية لهذا الدرس 🧠</button>
                        <button id="quizBtn" onclick="generateQuizFromChat()" style="background-color: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; display: none;">اختبر فهمك (توليد أسئلة) 📝</button>
                    </div>
                    <div id="mindmapContainer" style="background-color: #1e1e1e; padding: 15px; border-radius: 4px; display: none; margin: 0 15px 15px 15px; border: 1px solid #444; flex-shrink: 0;"></div>
                    <div id="quizContainer" style="background-color: #1e293b; padding: 15px; border-radius: 4px; display: none; margin: 0 15px 15px 15px; border: 1px solid #334155; flex-shrink: 0;"></div>
                    
                    <div class="chat-messages" id="chatMessages">
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="اسأل المعلم عن هذا الدرس..." onkeypress="handleEnter(event)">
                    <button class="chat-send-btn" onclick="sendMessage()">إرسال</button>
                </div>
            </div>
        </div>

        <script>
            let booksHierarchy = {};

            async function loadBooksList() {
                try {
                    const res = await fetch('/api/v1/admin/books');
                    const data = await res.json();
                    booksHierarchy = data.hierarchy;
                    
                    const domainSelect = document.getElementById('domainSelect');
                    domainSelect.innerHTML = '<option value="">-- جميع المجالات --</option>';
                    
                    for (const domain in booksHierarchy) {
                        const opt = document.createElement('option');
                        opt.value = domain;
                        opt.innerText = domain;
                        domainSelect.appendChild(opt);
                    }
                    updateMadhhabs();
                } catch(e) {
                    document.getElementById('domainSelect').innerHTML = '<option value="">فشل التحميل</option>';
                }
            }

            function updateMadhhabs() {
                const domain = document.getElementById('domainSelect').value;
                const madhhabSelect = document.getElementById('madhhabSelect');
                madhhabSelect.innerHTML = '<option value="">-- جميع المذاهب --</option>';
                
                if (domain && booksHierarchy[domain]) {
                    for (const madhhab in booksHierarchy[domain]) {
                        const opt = document.createElement('option');
                        opt.value = madhhab;
                        opt.innerText = madhhab;
                        madhhabSelect.appendChild(opt);
                    }
                } else if (!domain) {
                    // If no domain selected, show ALL madhhabs across all domains
                    const allMadhhabs = new Set();
                    for (const d in booksHierarchy) {
                        for (const m in booksHierarchy[d]) allMadhhabs.add(m);
                    }
                    allMadhhabs.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m;
                        opt.innerText = m;
                        madhhabSelect.appendChild(opt);
                    });
                }
                updateBooks();
            }

            function updateBooks() {
                const domain = document.getElementById('domainSelect').value;
                const madhhab = document.getElementById('madhhabSelect').value;
                const booksSelect = document.getElementById('customBooks');
                booksSelect.innerHTML = '';
                
                let booksToShow = new Set();
                
                for (const d in booksHierarchy) {
                    if (domain && d !== domain) continue;
                    for (const m in booksHierarchy[d]) {
                        if (madhhab && m !== madhhab) continue;
                        booksHierarchy[d][m].forEach(b => booksToShow.add(b));
                    }
                }
                
                Array.from(booksToShow).sort().forEach(book => {
                    const opt = document.createElement('option');
                    opt.value = book;
                    opt.innerText = book;
                    booksSelect.appendChild(opt);
                });
            }

            window.onload = loadBooksList;

            async function cancelBuild() {
                try {
                    await fetch('/api/v1/admin/build-cancel', {method: 'POST'});
                    document.getElementById('loading').innerText = 'تم إرسال أمر الإيقاف... جاري الإيقاف...';
                    document.getElementById('cancelBtn').style.display = 'none';
                } catch(e) {}
            }

            function buildCustomBooks() {
                const select = document.getElementById('customBooks');
                const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
                
                if (selectedOptions.length === 0) return alert("يرجى اختيار كتاب واحد على الأقل");
                
                const input = selectedOptions.join(',');
                buildCache(input);
            }

            async function buildCache(bookNames) {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('cancelBtn').style.display = 'inline-block';
                document.getElementById('loading').innerText = 'جاري التهيئة لبناء الكاش...';
                let url = '/api/v1/admin/build-tree';
                
                if (bookNames) {
                    // Split by comma and append each as a separate book_names parameter
                    const names = bookNames.split(',').map(n => n.trim()).filter(n => n);
                    url += '?' + names.map(n => 'book_names=' + encodeURIComponent(n)).join('&');
                }
                
                // Start polling status
                const interval = setInterval(async () => {
                    try {
                        let res = await fetch('/api/v1/admin/build-status');
                        let status = await res.json();
                        if (status.is_building) {
                            let text = `جاري معالجة كتاب: ${status.current_book}<br>`;
                            if (status.total_expected > 0) {
                                let percent = Math.round((status.chunks_processed / status.total_expected) * 100);
                                text += `التقدم: ${status.chunks_processed} / ${status.total_expected} درس (${percent}%)`;
                            } else {
                                text += `تمت معالجة ${status.chunks_processed} درس حتى الآن...`;
                            }
                            document.getElementById('loading').innerHTML = text;
                        }
                    } catch(e) {}
                }, 1000);
                
                try {
                    const response = await fetch(url, {method: 'POST'});
                    const data = await response.json();
                    clearInterval(interval);
                    document.getElementById('cancelBtn').style.display = 'none';
                    
                    if (data.success) {
                        document.getElementById('loading').innerHTML = '✅ <b>تم بناء الكاش بنجاح! جاري عرض الفهرس...</b>';
                        setTimeout(() => {
                            loadTree(bookNames);
                        }, 1000);
                    } else {
                        document.getElementById('loading').innerText = '❌ ' + (data.message || 'فشل البناء!');
                    }
                } catch (err) {
                    clearInterval(interval);
                    document.getElementById('cancelBtn').style.display = 'none';
                    document.getElementById('loading').innerText = 'حدث خطأ!';
                    console.error(err);
                }
            }

            async function loadTree(bookName) {
                document.getElementById('tree-container').innerHTML = '';
                document.getElementById('loading').style.display = 'block';
                
                let url = '/api/v1/library/trees';
                if (bookName) {
                    url += '?book_names=' + encodeURIComponent(bookName);
                }
                
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    document.getElementById('loading').style.display = 'none';
                    if (data.success && data.tree) {
                        const ul = createTree(data.tree);
                        document.getElementById('tree-container').appendChild(ul);
                        attachListeners();
                    }
                } catch (err) {
                    document.getElementById('loading').innerText = 'حدث خطأ أثناء التحميل!';
                    console.error(err);
                }
            }

            function createTree(nodes) {
                const ul = document.createElement('ul');
                nodes.forEach(node => {
                    const li = document.createElement('li');
                    
                    let newBadge = '';
                    if (node.is_new) {
                        newBadge = ' <span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px;">جديد</span>';
                    }
                    
                    if (node.children && node.children.length > 0) {
                        const span = document.createElement('span');
                        span.className = 'caret';
                        span.innerHTML = node.title + newBadge;
                        li.appendChild(span);
                        
                        const childrenUl = createTree(node.children);
                        childrenUl.className = 'nested';
                        li.appendChild(childrenUl);
                    } else {
                        const span = document.createElement('span');
                        span.className = 'chunk';
                        span.innerHTML = "📄 " + node.title + newBadge;
                        span.onclick = () => openChat(node.chunk_id);
                        li.appendChild(span);
                    }
                    ul.appendChild(li);
                });
                return ul;
            }

            function attachListeners() {
                var toggler = document.getElementsByClassName("caret");
                for (var i = 0; i < toggler.length; i++) {
                    toggler[i].addEventListener("click", function() {
                        this.parentElement.querySelector(".nested").classList.toggle("active");
                        this.classList.toggle("caret-down");
                    });
                }
            }
            
            // --- Chat Modal Logic ---
            let currentChunkId = null;
            let chatHistory = [];

            async function openChat(chunkId) {
                currentChunkId = chunkId;
                chatHistory = []; // Reset history
                
                document.getElementById('chatOverlay').style.display = 'flex';
                document.getElementById('chatMessages').innerHTML = '';
                document.getElementById('chunkPreview').innerText = 'جاري تحميل النص الأساسي...';
                document.getElementById('chatInput').value = '';
                document.getElementById('mindmapBtn').style.display = 'none';
                document.getElementById('mindmapBtn').innerText = 'توليد الخريطة الذهنية لهذا الدرس 🧠';
                document.getElementById('mindmapContainer').style.display = 'none';
                document.getElementById('mindmapContainer').innerHTML = '';
                document.getElementById('quizBtn').style.display = 'none';
                document.getElementById('quizBtn').innerText = 'اختبر فهمك (توليد أسئلة) 📝';
                document.getElementById('quizContainer').style.display = 'none';
                document.getElementById('quizContainer').innerHTML = '';
                
                // Fetch chunk info
                try {
                    const res = await fetch('/api/v1/library/chunks/' + chunkId);
                    if (res.ok) {
                        const chunkData = await res.json();
                        document.getElementById('chunkPreview').innerText = chunkData.text;
                        document.getElementById('mindmapBtn').style.display = 'inline-block';
                        document.getElementById('quizBtn').style.display = 'inline-block';
                    } else {
                        document.getElementById('chunkPreview').innerText = 'فشل تحميل نص الدرس.';
                    }
                } catch(e) {
                    console.error(e);
                }
                
                // Send initial auto-message to kickstart the tutor
                const initMsg = "مرحباً يا زاد، أنا مستعد لبدء دراسة هذا الدرس، هل يمكنك وضع خطة والبدء بالشرح؟";
                addMessageToUI(initMsg, 'user');
                await sendToTutor(initMsg);
            }

            function closeChat() {
                document.getElementById('chatOverlay').style.display = 'none';
                currentChunkId = null;
            }

            async function generateMindmapFromChat() {
                const mindmapBtn = document.getElementById('mindmapBtn');
                const mindmapContainer = document.getElementById('mindmapContainer');
                mindmapBtn.disabled = true;
                mindmapBtn.innerText = 'جاري بناء الخريطة... ⏳';
                mindmapContainer.style.display = 'block';
                mindmapContainer.innerHTML = '<span style="color: #888;">جاري التواصل مع الذكاء الاصطناعي...</span>';
                
                try {
                    const chunkText = document.getElementById('chunkPreview').innerText;
                    const res = await fetch('/api/v1/tutor/mindmap/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: chunkText })
                    });
                    const data = await res.json();
                    
                    mindmapContainer.innerHTML = '';
                    if (data.tree) {
                        const nodesToRender = Array.isArray(data.tree) ? data.tree : [data.tree];
                        if (nodesToRender.length > 0 && Object.keys(nodesToRender[0]).length > 0) {
                            const treeUl = createMindmapTree(nodesToRender);
                            mindmapContainer.appendChild(treeUl);
                        } else {
                            mindmapContainer.innerText = 'عذراً، الشجرة المستخرجة فارغة!';
                        }
                    } else {
                        mindmapContainer.innerText = 'فشل في توليد الخريطة.';
                    }
                } catch(e) {
                    mindmapContainer.innerText = 'حدث خطأ!';
                } finally {
                    mindmapBtn.disabled = false;
                    mindmapBtn.innerText = 'إعادة توليد الخريطة 🔄';
                }
            }

            async function generateQuizFromChat() {
                const quizBtn = document.getElementById('quizBtn');
                const quizContainer = document.getElementById('quizContainer');
                quizBtn.disabled = true;
                quizBtn.innerText = 'جاري توليد الأسئلة... ⏳';
                quizContainer.style.display = 'block';
                quizContainer.innerHTML = '<span style="color: #888;">جاري استخراج الأسئلة من الدرس...</span>';
                
                try {
                    const res = await fetch('/api/v1/tutor/quiz/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chunk_id: currentChunkId, num_questions: 3 })
                    });
                    const data = await res.json();
                    
                    if (data.success && data.quiz && data.quiz.questions) {
                        renderQuiz(data.quiz.questions, quizContainer);
                    } else {
                        quizContainer.innerText = 'فشل في توليد الأسئلة.';
                    }
                } catch(e) {
                    quizContainer.innerText = 'حدث خطأ أثناء التوليد!';
                } finally {
                    quizBtn.disabled = false;
                    quizBtn.innerText = 'إعادة توليد أسئلة 🔄';
                }
            }

            function renderQuiz(questions, container) {
                container.innerHTML = '';
                questions.forEach((q, qIndex) => {
                    const qDiv = document.createElement('div');
                    qDiv.style.marginBottom = '20px';
                    qDiv.style.padding = '15px';
                    qDiv.style.backgroundColor = '#0f172a';
                    qDiv.style.borderRadius = '8px';
                    
                    const qTitle = document.createElement('h4');
                    qTitle.style.marginTop = '0';
                    qTitle.style.color = '#38bdf8';
                    qTitle.innerText = `${qIndex + 1}. ${q.question}`;
                    qDiv.appendChild(qTitle);
                    
                    const optsDiv = document.createElement('div');
                    optsDiv.style.display = 'flex';
                    optsDiv.style.flexDirection = 'column';
                    optsDiv.style.gap = '8px';
                    
                    const resultDiv = document.createElement('div');
                    resultDiv.style.marginTop = '15px';
                    resultDiv.style.display = 'none';
                    
                    q.options.forEach((opt, optIndex) => {
                        const optBtn = document.createElement('button');
                        optBtn.innerText = opt;
                        optBtn.style.padding = '10px';
                        optBtn.style.textAlign = 'right';
                        optBtn.style.backgroundColor = '#1e293b';
                        optBtn.style.color = '#fff';
                        optBtn.style.border = '1px solid #334155';
                        optBtn.style.borderRadius = '6px';
                        optBtn.style.cursor = 'pointer';
                        
                        optBtn.onclick = () => {
                            // Disable all options
                            Array.from(optsDiv.children).forEach(b => b.disabled = true);
                            
                            if (optIndex === q.correct_answer_index) {
                                optBtn.style.backgroundColor = '#10b981'; // Green
                                resultDiv.innerHTML = `<span style="color:#10b981; font-weight:bold;">✅ إجابة صحيحة!</span><br><br><span style="color:#cbd5e1; font-size: 0.95em;">السبب: ${q.explanation}</span>`;
                            } else {
                                optBtn.style.backgroundColor = '#ef4444'; // Red
                                optsDiv.children[q.correct_answer_index].style.backgroundColor = '#10b981'; // highlight correct
                                resultDiv.innerHTML = `<span style="color:#ef4444; font-weight:bold;">❌ إجابة خاطئة!</span><br><br><span style="color:#cbd5e1; font-size: 0.95em;">السبب: ${q.explanation}</span><br><br>`;
                                
                                const discussBtn = document.createElement('button');
                                discussBtn.innerText = 'ناقش المعلم في هذا السؤال 💬';
                                discussBtn.style.backgroundColor = '#0284c7';
                                discussBtn.style.color = 'white';
                                discussBtn.style.border = 'none';
                                discussBtn.style.padding = '8px 12px';
                                discussBtn.style.borderRadius = '6px';
                                discussBtn.style.cursor = 'pointer';
                                discussBtn.style.marginTop = '10px';
                                
                                discussBtn.onclick = async () => {
                                    const hiddenMsg = `أنا كطالب أواجه صعوبة في فهم هذا السؤال: "${q.question}". لقد اخترت الإجابة "${opt}" ولكن التطبيق أخبرني أن الإجابة الصحيحة هي "${q.options[q.correct_answer_index]}" والسبب هو "${q.explanation}". هل يمكنك أن تبسط لي الأمر وتتناقش معي فيه؟`;
                                    
                                    addMessageToUI(hiddenMsg, 'user');
                                    await sendToTutor(hiddenMsg);
                                    
                                    // Scroll to chat
                                    const chatBody = document.getElementById('chatBody');
                                    chatBody.scrollTop = chatBody.scrollHeight;
                                };
                                resultDiv.appendChild(discussBtn);
                            }
                            resultDiv.style.display = 'block';
                        };
                        
                        optsDiv.appendChild(optBtn);
                    });
                    
                    qDiv.appendChild(optsDiv);
                    qDiv.appendChild(resultDiv);
                    container.appendChild(qDiv);
                });
            }

            function createMindmapTree(nodes) {
                const ul = document.createElement('ul');
                ul.style.listStyleType = 'none';
                ul.style.paddingRight = '20px';
                
                nodes.forEach(node => {
                    const li = document.createElement('li');
                    li.style.margin = '5px 0';
                    
                    const isContent = node.type === 'content';
                    const displayText = isContent ? (node.content || 'بدون محتوى') : (node.label || 'بدون عنوان');
                    
                    if (node.children && node.children.length > 0) {
                        const details = document.createElement('details');
                        details.open = true;
                        
                        const summary = document.createElement('summary');
                        summary.style.cursor = 'pointer';
                        summary.style.fontWeight = isContent ? 'normal' : 'bold';
                        summary.style.color = isContent ? '#aaa' : '#fff';
                        summary.innerHTML = displayText;
                        details.appendChild(summary);
                        
                        details.appendChild(createMindmapTree(node.children));
                        li.appendChild(details);
                    } else {
                        const leaf = document.createElement('div');
                        leaf.style.color = isContent ? '#aaa' : '#fff';
                        leaf.style.fontWeight = isContent ? 'normal' : 'bold';
                        leaf.style.fontStyle = isContent ? 'italic' : 'normal';
                        leaf.innerText = displayText;
                        li.appendChild(leaf);
                    }
                    ul.appendChild(li);
                });
                return ul;
            }

            function addMessageToUI(text, role) {
                const msgsDiv = document.getElementById('chatMessages');
                const msgDiv = document.createElement('div');
                msgDiv.className = `msg ${role}`;
                // Format text: replace newlines with <br> for HTML display
                msgDiv.innerHTML = text.replace(/\\n/g, '<br>');
                msgsDiv.appendChild(msgDiv);
                
                const chatBody = document.getElementById('chatBody');
                chatBody.scrollTop = chatBody.scrollHeight;
                
                return msgDiv;
            }

            function handleEnter(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            }

            async function sendMessage() {
                const input = document.getElementById('chatInput');
                const text = input.value.trim();
                if (!text || !currentChunkId) return;
                
                input.value = '';
                addMessageToUI(text, 'user');
                await sendToTutor(text);
            }

            async function sendToTutor(message) {
                // Show loading indicator
                const loadingDiv = addMessageToUI('جاري التفكير...', 'loading');
                
                try {
                    const res = await fetch('/api/v1/tutor/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            chunk_id: currentChunkId,
                            message: message,
                            history: chatHistory
                        })
                    });
                    
                    const data = await res.json();
                    loadingDiv.remove(); // Remove loading text
                    
                    if (data.success) {
                        addMessageToUI(data.reply, 'tutor');
                        
                        // Update history exactly how backend expects it (role, content)
                        chatHistory.push({role: 'user', content: message});
                        chatHistory.push({role: 'assistant', content: data.reply});
                    } else {
                        addMessageToUI('❌ خطأ: ' + data.detail, 'tutor');
                    }
                } catch(e) {
                    loadingDiv.remove();
                    addMessageToUI('❌ فشل الاتصال بالسيرفر.', 'tutor');
                    console.error(e);
                }
            }

        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


from tree_builder import (
    build_library_tree,
    format_tree_for_flutter,
    get_tree_from_cache,
    save_tree_to_cache,
    build_status,
)


@app.get("/api/v1/admin/build-status")
async def admin_build_status():
    """Returns the live progress of the library tree caching task."""
    return build_status


@app.post("/api/v1/admin/build-cancel")
async def admin_cancel_build():
    build_status["cancel_requested"] = True
    return {"success": True}


@app.post("/api/v1/admin/build-tree")
async def admin_build_tree(book_names: Optional[List[str]] = Query(None)):
    """
    Admin endpoint to build the tree in the background and save to MongoDB cache.
    """
    # 1. Build raw tree from chunks
    raw_tree = await build_library_tree(force_refresh=True, book_names=book_names)

    if raw_tree is None:
        return {"success": False, "message": "تم إيقاف عملية البناء بنجاح."}

    # 2. Format for flutter
    flutter_tree = format_tree_for_flutter(raw_tree)

    # 3. Save to MongoDB system_cache
    success = await save_tree_to_cache(flutter_tree, book_names=book_names)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save tree to cache.")

    return {"success": True, "message": "Tree built and cached successfully."}


@app.get("/api/v1/admin/books")
async def admin_get_books():
    """Returns a hierarchical list of domains -> madhhabs -> books."""
    import database

    hierarchy = {}
    for col in database.chunk_collections:
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": {
                            "domain": "$metadata.domain",
                            "madhhab": "$metadata.madhhab",
                            "book": "$metadata.book_title",
                        }
                    }
                }
            ]
            async for doc in col.aggregate(pipeline):
                domain = doc["_id"].get("domain") or "غير محدد"
                madhhab = doc["_id"].get("madhhab") or "غير محدد"
                book = doc["_id"].get("book")

                if not book or book == "كتاب غير معروف":
                    continue

                if domain not in hierarchy:
                    hierarchy[domain] = {}
                if madhhab not in hierarchy[domain]:
                    hierarchy[domain][madhhab] = set()
                hierarchy[domain][madhhab].add(book)
        except Exception as e:
            pass

    # Convert sets to sorted lists
    for d in hierarchy:
        for m in hierarchy[d]:
            hierarchy[d][m] = sorted(list(hierarchy[d][m]))

    return {"hierarchy": hierarchy}


@app.get("/api/v1/library/trees")
async def get_library_tree(
    force_refresh: bool = False, book_names: Optional[List[str]] = Query(None)
):
    """
    Production Phase: Fetches the pre-computed tree from MongoDB system_cache.
    Instantly returns the tree for Flutter to save locally.
    """
    # If not forcing refresh, try to get from cache first
    if not force_refresh:
        cached_tree = await get_tree_from_cache(book_names=book_names)
        if cached_tree:
            return {"success": True, "tree": cached_tree}

    # If forced or cache miss, build it on the fly (mostly for development)
    raw_tree = await build_library_tree(
        force_refresh=force_refresh, book_names=book_names
    )
    flutter_tree = format_tree_for_flutter(raw_tree)

    return {"success": True, "tree": flutter_tree}


@app.get("/api/v1/library/chunks/{chunk_id}")
async def fetch_chunk(chunk_id: str):
    doc = await get_chunk_by_id(chunk_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Chunk not found")

    # Return basic info needed for UI
    text_content = doc.get("text", doc.get("content", doc.get("page_content", "")))
    return {
        "id": str(doc.get("_id", chunk_id)),
        "path": doc.get("path", []),
        "text": text_content,
    }


@app.post("/api/v1/tutor/chat")
async def tutor_chat(request: TutorChatRequest):
    # 1. Fetch chunk text
    doc = await get_chunk_by_id(request.chunk_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Chunk not found")

    chunk_text = doc.get("text", doc.get("content", doc.get("page_content", "")))
    if not chunk_text:
        raise HTTPException(status_code=400, detail="Chunk has no text")

    metadata = doc.get("metadata", {})

    # 2. Call LLM
    try:
        response_text = await generate_tutor_response(
            chunk_text=chunk_text,
            metadata=metadata,
            user_message=request.message,
            history=[msg.model_dump() for msg in request.history],
        )
        return {"success": True, "reply": response_text}
    except Exception as e:
        logger.error(f"Error in tutor chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/tutor/chat/raw")
async def raw_tutor_chat(request: RawTutorChatRequest):
    """Testing endpoint to chat over raw text without DB chunk_id"""
    try:
        response_text = await generate_tutor_response(
            chunk_text=request.text,
            metadata={"book_title": "نص تجريبي", "domain": "فقه", "madhhab": "عام"},
            user_message=request.message,
            history=request.history,
        )
        return {"success": True, "reply": response_text}
    except Exception as e:
        logger.error(f"Error in raw tutor chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from mindmap_generator import generate_mindmap_json


@app.post("/api/v1/tutor/mindmap/generate")
async def generate_mindmap_endpoint(req: MindmapRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        tree = await generate_mindmap_json(req.text)
        return {"success": True, "tree": tree}
    except Exception as e:
        logger.error(f"Error generating mindmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from quiz_generator import generate_quiz_json

@app.post("/api/v1/tutor/quiz/generate")
async def generate_quiz_endpoint(req: QuizRequest):
    doc = await get_chunk_by_id(req.chunk_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Chunk not found")

    chunk_text = doc.get("text", doc.get("content", doc.get("page_content", "")))
    if not chunk_text.strip():
        raise HTTPException(status_code=400, detail="Chunk text is empty")
        
    metadata = doc.get("metadata", {})
        
    try:
        quiz_data = await generate_quiz_json(chunk_text, req.num_questions, metadata)
        return {"success": True, "quiz": quiz_data}
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
