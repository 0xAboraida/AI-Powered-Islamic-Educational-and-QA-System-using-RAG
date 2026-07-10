<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Local Environment Setup</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Welcome to the Zad-AI development team! This guide will walk you through setting up the AI RAG Engine locally on your machine for development and testing.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Prerequisites

Before writing any code, ensure your system has the following installed:
- **Python 3.11+**: The core language for the AI engine.
- **Git**: For version control.
- **Docker Desktop**: Required if you want to run the full stack (Redis, Backend, LiveKit) locally.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Python Virtual Environment

We strongly recommend isolating project dependencies using a virtual environment (`.venv`).

**Step 1: Create the Virtual Environment**
Open your terminal in the root directory and run:
`python -m venv .venv`

**Step 2: Activate it (Windows PowerShell)**
`.\.venv\Scripts\Activate.ps1`

**Step 3: Install Dependencies**
`pip install -r requirements.txt`

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Environment Variables

The RAG Engine relies heavily on API keys and database URLs.
1. Locate the `.env.example` file in the root directory.
2. Copy it and rename the copy to `.env`.
3. Fill in your development credentials:
   - `QDRANT_API_KEY_A` / `QDRANT_URL_A`
   - `MONGO_URI_HANAFI`
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`

*Note: Never commit your `.env` file to version control.*

</div>

</div>
