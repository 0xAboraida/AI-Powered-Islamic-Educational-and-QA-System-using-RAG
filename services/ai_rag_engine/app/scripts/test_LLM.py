from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key="YOUR_API_KEY",
)

response = llm.invoke("السلام عليكم")

print(response.content)