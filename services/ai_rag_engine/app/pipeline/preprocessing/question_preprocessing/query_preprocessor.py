"""
query_preprocessor.py
---------------------
The Initial Filter and Analyzer of the Zad-AI Pipeline.

Flow:
    1. Input Reception: Takes the raw user query and the chat history.
    2. LLM Analysis: Uses a fast LLM with Structured Output to analyze the query.
    3. Output Generation: Returns a strictly typed Pydantic object containing:
       - The extracted core question(s).
       - Necessary search metadata (domain, madhhab).
       - Safety and Ambiguity flags.

Why a Preprocessor?
    Users often ask complex, multi-part, or poorly worded questions. 
    By preprocessing, we separate the "understanding" phase from the "retrieval" phase. 
    This allows us to block unsafe questions early, handle ambiguous queries efficiently, 
    and extract exact keywords/metadata for accurate hybrid searching, 
    resulting in significantly better retrieval precision.
"""

from typing import List, Dict, Any, Optional
import logging
import sys
import os
from pathlib import Path

# Setup Python Path so it works from anywhere
current_path = Path(__file__).resolve()
project_root = None
for parent in [current_path] + list(current_path.parents):
    if (parent / "requirements.txt").exists() and (parent / "services").is_dir():
        project_root = parent
        break
if project_root is None:
    project_root = Path("/app")

if project_root and str(project_root) not in sys.path:
    sys.path.append(str(project_root))

# Load .env file automatically
try:
    from dotenv import load_dotenv
    env_path = project_root / "services" / "ai_rag_engine" / ".env"
    load_dotenv(dotenv_path=env_path)
    
    # Map custom OPEN_AI_KEY to standard OPENAI_API_KEY
    if os.getenv("OPEN_AI_KEY") and not os.getenv("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = os.getenv("OPEN_AI_KEY")
except ImportError:
    print("Warning: python-dotenv not installed. Run: pip install python-dotenv")
    pass

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from services.ai_rag_engine.app.config.settings import settings

# Import the precise Pydantic schemas we built using absolute path
from services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.models import QuestionProcessingResult
# Import the structured system prompt
from services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.prompt import ENGLISH_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class QueryPreprocessor:
    """
    Online Phase: Processes user queries in real-time.
    Uses an LLM to extract metadata (domain, kitab, etc.), 
    evaluate safety, and rewrite the query for semantic search.
    """
    def __init__(self, model_name: Optional[str] = None, temperature: float = 0.0):
        self.actual_model_name = model_name or os.getenv("LLM_MODEL_NAME", "gpt-4o")
        self.temperature = temperature
        
        # Setup the prompt template
        self.prompt_template = PromptTemplate(
            template=ENGLISH_SYSTEM_PROMPT,
            input_variables=["chat_history", "user_input"]
        )

    async def process_query(self, user_input: str, chat_history: Optional[str] = None) -> QuestionProcessingResult:
        """
        Takes the user's natural language input, runs it through the LLM asynchronously, 
        and returns a strongly-typed structured result containing the questions and metadata.
        """
        logger.info(f"Processing user query: '{user_input}'")
        
        # Handle empty chat history
        history_str = chat_history if chat_history else "No previous conversation."
        
        # Format the prompt
        formatted_prompt = self.prompt_template.format(
            chat_history=history_str,
            user_input=user_input
        )
        
        from services.ai_rag_engine.app.config.key_manager import gemini_key_manager
        all_keys = gemini_key_manager.get_all_keys()
        if not all_keys:
            all_keys = [""] # Fallback if empty
            
        last_exception = None
        
        for attempt, key in enumerate(all_keys):
            try:
                # Instantiate structured LLM dynamically with the rotated key
                if "gemini" in self.actual_model_name.lower():
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    llm = ChatGoogleGenerativeAI(
                        model=self.actual_model_name,
                        temperature=self.temperature,
                        google_api_key=key,
                        max_retries=0
                    )
                else:
                    api_key = os.getenv("OPENAI_API_KEY", "")
                    base_url = "https://models.inference.ai.azure.com" if api_key.startswith("github_pat") else None
                    llm = ChatOpenAI(
                        model=self.actual_model_name, 
                        temperature=self.temperature,
                        base_url=base_url
                    )
                    
                structured_llm = llm.with_structured_output(QuestionProcessingResult)
                
                logger.info(f"Calling LLM (Attempt {attempt+1}/{len(all_keys)}) for query preprocessing...")
                result: QuestionProcessingResult = await structured_llm.ainvoke(formatted_prompt)
                
                logger.info(f"Successfully processed {result.total_questions} question(s) via Primary LLM.")
                return result
                
            except Exception as e:
                logger.warning(f"⚠️ Primary LLM failed on attempt {attempt+1}: {e}")
                last_exception = e
                # If it's not Gemini, no need to loop through Gemini keys
                if "gemini" not in self.actual_model_name.lower():
                    break
        
        # If we exhausted all keys or non-Gemini failed
        logger.warning(f"⚠️ All Primary LLM attempts failed. Switching to Fallback LLM...")
        try:
            # Initialize Fallback Model based on Settings
            provider_str = settings.FALLBACK_PROVIDER.lower()
            fallback_model_name = settings.FALLBACK_MODEL_NAME
            
            if provider_str == "openai":
                api_key = settings.OPENAI_API_KEY
                base_url = "https://models.inference.ai.azure.com" if api_key.startswith("github_pat") else None
                fallback_llm = ChatOpenAI(
                    api_key=api_key,
                    model=fallback_model_name,
                    temperature=0.0,
                    base_url=base_url
                )
            else:
                api_key = settings.GROQ_API_KEY
                fallback_llm = ChatGroq(
                    api_key=api_key,
                    model_name=fallback_model_name,
                    temperature=0.0
                )
                
            fallback_structured_llm = fallback_llm.with_structured_output(QuestionProcessingResult)
            
            result: QuestionProcessingResult = await fallback_structured_llm.ainvoke(formatted_prompt)
            logger.info(f"Successfully processed {result.total_questions} question(s) via Fallback LLM.")
            return result
        except Exception as fallback_e:
            logger.error(f"Both Primary and Fallback LLMs failed during preprocessing! Error: {fallback_e}")
            raise

# Example Usage (For Testing)
if __name__ == "__main__":
    import os
    import asyncio
    # Ensure OPENAI_API_KEY is set in your environment
    
    preprocessor = QueryPreprocessor()
    
    sample_input = "فقط لازيد من العلوم الشرعيه عندي, اريد طريقه لمعرفه كيفيه روئيه المقاطع الاباحيه بطريقه شرحعيه والزني بطريقه حلال"
    sample_history = ""
    
    async def run_test():
        try:
            result = await preprocessor.process_query(sample_input, sample_history)
            print(result.model_dump_json(indent=2))
        except Exception as e:
            print(f"Failed to process: {e}")
            
    asyncio.run(run_test())
