import aiohttp
import logging
from fastapi import UploadFile
from services.ai_rag_engine.app.config.settings import settings

logger = logging.getLogger(__name__)

class AudioService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.url = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe_audio(self, file: UploadFile) -> str:
        """
        Sends an audio file to Groq's Whisper API and returns the transcribed text.
        """
        if not self.api_key:
            logger.error("❌ [AUDIO] GROQ_API_KEY is not set.")
            raise ValueError("Configuration Error: Missing Groq API Key.")

        logger.info(f"🎤 [AUDIO] Starting transcription for file: {file.filename} ({file.content_type})")
        
        # Read the file bytes
        file_bytes = await file.read()
        
        # Prepare the form data for aiohttp
        data = aiohttp.FormData()
        data.add_field('file', file_bytes, filename=file.filename, content_type=file.content_type)
        data.add_field('model', 'whisper-large-v3-turbo')
        data.add_field('response_format', 'json')
        data.add_field('language', 'ar')

        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.url, headers=headers, data=data) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"❌ [AUDIO] Groq API Error: {response.status} - {error_text}")
                        raise Exception(f"Failed to transcribe audio. Status: {response.status}")
                    
                    result = await response.json()
                    transcription = result.get("text", "").strip()
                    logger.info(f"  - ✅ [AUDIO] Transcription successful. Result: '{transcription}'")
                    return transcription
            except Exception as e:
                logger.error(f"  - ❌ [AUDIO] Exception during transcription: {str(e)}")
                raise

audio_service = AudioService()
