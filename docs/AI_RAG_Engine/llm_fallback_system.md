<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">


<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> LLM Fallback Architecture</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The final stage of the RAG pipeline is generating the answer. However, relying on a single API provider in a production environment is a critical point of failure. Zad-AI implements an automated Primary-Secondary Fallback system to guarantee 100% uptime.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Vulnerability of Single Providers

Zad-AI utilizes **Google Gemini (Gemini Pro/Flash)** as its primary generator due to its massive context window and exceptional Arabic capabilities. 
However, APIs often experience:
- **Rate Limits (429):** Exceeding Requests Per Minute (RPM).
- **Service Unavailability (503):** Global server stress during peak hours.

Without a fallback, a `503` error would crash the pipeline and leave the user without an answer after the entire search process was successfully completed.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The Smart Fallback Logic

The RAG engine is wrapped in an `LLMFallbackManager`. When the final prompt payload is ready, the execution follows this tree:

1. **Attempt Primary (Gemini):** Dispatches request. If successful, stream to client.
2. **Catch Exceptions:** If an API Error, Timeout, or Rate Limit is raised, the manager intercepts the error instantly.
3. **Trigger Secondary (Groq/Llama-3):** The exact same prompt payload is immediately re-routed to Groq. 
   * *Why Groq?* It utilizes custom LPUs offering inference speeds exceeding 800 tokens/second, ensuring the user barely notices the fallback delay. The `Llama-3-70B` model is used as a highly capable Arabic alternative.
4. **Trigger Tertiary (OpenAI):** In the extreme event both fail, OpenAI (GPT-4o-mini) serves as the ultimate reliability backstop.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Seamless User Experience

This entire fallback routing happens server-side within milliseconds. The user's websocket or HTTP stream remains open, and the text begins streaming smoothly regardless of which LLM ultimately answered the request. 

This architecture transforms Zad-AI from a fragile academic prototype into a highly resilient, enterprise-grade application.

</div>
<div>