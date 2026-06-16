from typing import List, Dict, Any, Optional
import logging
import sys
import os
from pathlib import Path

# Setup Python Path so it works from anywhere
current_path = Path(__file__).resolve()
project_root = None
for parent in [current_path] + list(current_path.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break

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
        actual_model_name = model_name or os.getenv("LLM_MODEL_NAME", "gpt-4o")
        
        if "gemini" in actual_model_name.lower():
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model=actual_model_name,
                temperature=temperature,
                google_api_key=os.getenv("GOOGLE_API_KEY", "")
            )
        else:
            api_key = os.getenv("OPENAI_API_KEY", "")
            base_url = "https://models.inference.ai.azure.com" if api_key.startswith("github_pat") else None
            self.llm = ChatOpenAI(
                model=actual_model_name, 
                temperature=temperature,
                base_url=base_url
            )
        
        # Enforce the LLM to output our exact Pydantic model structure
        self.structured_llm = self.llm.with_structured_output(QuestionProcessingResult)
        
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
        
        try:
            # Call the LLM to process and extract data asynchronously
            logger.info("Calling LLM for query preprocessing and metadata extraction...")
            result: QuestionProcessingResult = await self.structured_llm.ainvoke(formatted_prompt)
            
            # Additional safety/fallback logic can be added here if needed
            logger.info(f"Successfully processed {result.total_questions} question(s).")
            return result
            
        except Exception as e:
            logger.error(f"Error during query preprocessing: {e}")
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
