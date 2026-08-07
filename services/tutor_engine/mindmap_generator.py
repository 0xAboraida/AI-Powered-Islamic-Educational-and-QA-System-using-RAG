import os
import json
import logging
import itertools
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Parse multiple keys separated by commas
keys_str = os.getenv("GEMINI_API_KEYS", "")
GEMINI_API_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]

if GEMINI_API_KEYS:
    api_key_cycle = itertools.cycle(GEMINI_API_KEYS)
else:
    api_key_cycle = None

def build_nested_tree(flat_nodes: list) -> dict:
    if not flat_nodes:
        return {}
        
    # Initialize all nodes with an empty children list
    nodes_map = {}
    for node in flat_nodes:
        node_id = str(node["id"])
        nodes_map[node_id] = {
            "id": node_id,
            "type": node.get("type", "label"),
            "label": node.get("label", ""),
            "content": node.get("content", ""),
            "children": []
        }
    
    root_nodes = []
    
    for node in flat_nodes:
        parent_id = node.get("parent")
        current_node = nodes_map[str(node["id"])]
        
        # If no parent or parent doesn't exist in our map, it's a root
        if parent_id is None or str(parent_id) not in nodes_map:
            root_nodes.append(current_node)
        else:
            nodes_map[str(parent_id)]["children"].append(current_node)
            
    # Return the main root node (or a wrapper if multiple roots exist)
    if len(root_nodes) == 1:
        return root_nodes[0]
    return {"id": "root", "label": "الخريطة الذهنية", "children": root_nodes}

MINDMAP_SYSTEM_PROMPT = """
أنت خبير في استخراج الخرائط الذهنية من النصوص.
الهدف: قراءة النص واستخراج خريطة ذهنية (شجرة معرفية) منه.

القواعد:
1. لا تؤلف أي معلومات من عندك، بل اشرح كلام المؤلف ووضحه.
2. لست ملزماً بترتيب المؤلف، يمكنك تبديل الأفكار وإعادة ترتيبها لتكوين شجرة منطقية مترابطة.
3. العقدة (Node) إما أن تكون عنواناً أو شرحاً:
   - إذا كانت العقدة عنواناً، استخدم "type": "label" وحقل "label".
   - إذا كانت العقدة عبارة عن شرح أو تفصيل، استخدم "type": "content" وحقل "content".
4. أخرج النتيجة كـ JSON Array فقط، ولا تضف أي نص أو Markdown خارج الـ JSON.
5. تجنب التقطيع المفرط (Over-segmentation): ادمج الأفكار المترابطة (مثل المسألة وحكمها، أو الشرط وجوابه) في عقدة واحدة مفيدة، ولا تفتت الجملة الواحدة إلى عدة عقد صغيرة.
شكل المخرجات (Output JSON):
[
  {
    "id": "1",
    "type": "label",
    "label": "عنوان العقدة",
    "parent": null
  },
  {
    "id": "2",
    "type": "content",
    "content": "الشرح التفصيلي هنا",
    "parent": "1"
  }
]
"""

async def generate_mindmap_json(chunk_text: str) -> list:
    if not api_key_cycle:
        raise ValueError("GEMINI_API_KEYS is not configured in .env")

    # Fetch the next API key in the cycle and configure it
    current_key = next(api_key_cycle)
    client = genai.Client(api_key=current_key)

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"النص المطلوب استخراج خريطته الذهنية:\n\n{chunk_text}\n\nتذكر: أخرج النتيجة بصيغة JSON Array مليئة بالعقد ولا تخرج مصفوفة فارغة أبداً.",
            config=types.GenerateContentConfig(
                system_instruction=MINDMAP_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        print("=" * 50)
        print("Chunk length:", len(chunk_text))
        print(chunk_text[:1000])
        print("=" * 50)
        
        raw_content = response.text.strip()
        
        # Clean up any potential markdown backticks that Gemini might accidentally add
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:]
            
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
            
        raw_content = raw_content.strip()
        # Parse the JSON and build the nested tree
        print(f"Raw Content from Gemini:\n{raw_content}")
        flat_nodes = json.loads(raw_content)
        nested_tree = build_nested_tree(flat_nodes)
        return nested_tree
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Gemini: {e}")
        logger.error(f"Raw Output: {raw_content}")
        raise ValueError("الذكاء الاصطناعي لم يقم بتوليد JSON صالح.")
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        raise e
