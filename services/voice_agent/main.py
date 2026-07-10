import os
import uu
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from livekit import api

load_dotenv()

app = FastAPI()

# Enable CORS for Flutter development (especially Flutter Web and local testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")


@app.get("/create-session")
def create_session(user_id: str, room_name: str | None = None):

    # Use provided room_name or generate a random one (useful for reconnecting to the same room)
    if not room_name:
        room_name = f"assistant-{uuid.uuid4().hex[:8]}"


    token = (
        api.AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET
        )
        .with_identity(user_id)
        .with_name(user_id)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,

                # allow microphone
                can_publish=True,

                # allow receiving agent audio
                can_subscribe=True,
            )
        )
    )


    return {
        "server_url": LIVEKIT_URL,
        "room": room_name,
        "token": token.to_jwt()
    }



