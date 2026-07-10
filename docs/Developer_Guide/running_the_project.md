<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Running Zad-AI Locally</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Depending on whether you are working purely on the AI logic or testing the entire integration, there are two ways to start the project.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### Method A: Python Uvicorn (For AI Developers)

If you are writing Python code and need hot-reloading (live updates when you save a file), run the FastAPI server directly:

```powershell
# Make sure your .venv is activated!
python -m uvicorn services.ai_rag_engine.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once started, the interactive API documentation (Swagger) will be available at: `http://localhost:8000/docs`

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### Method B: Docker Compose (For Full-Stack Testing)

If you are testing the Flutter frontend or the Voice Agent integration, you need the whole stack (Redis + AI Engine) running together.

```powershell
cd docker-release
docker compose up -d
```
This spins up the containers in the background. To view the logs of the AI engine in real-time, use:
`docker logs zad-ai-engine -f`

To shut everything down cleanly:
`docker compose down`

</div>

</div>
