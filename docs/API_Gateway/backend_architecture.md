<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> ASP.NET Core Backend Architecture</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The Zad-AI backend (`Zad-Backend`) serves as the primary API Gateway and orchestration layer for the entire platform. It is built using .NET 8.0 following strict Clean Architecture principles to ensure scalability, maintainability, and separation of concerns.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Clean Architecture Layers

The solution is divided into four distinct projects:

*   **`Zad.Domain`**: The core of the system. Contains all the entities (e.g., User, ChatSession, Question) and domain interfaces. It has zero external dependencies.
*   **`Zad.Application`**: Contains the business logic, Use Cases, and CQRS handlers (Command Query Responsibility Segregation). This layer coordinates tasks without knowing how data is stored.
*   **`Zad.Infrastructure`**: Implements the interfaces defined in the Domain and Application layers. This is where Entity Framework Core contexts (`ZadDbContext`), database migrations, and external API integrations reside.
*   **`Zad.API`**: The Presentation layer. Contains the Controllers (`AuthController`, `ChatController`, `QuestionController`), Swagger configuration, and middleware.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The Gateway Responsibility

While the Python FastAPI microservice handles the heavy AI/RAG computations, the .NET backend acts as the secure entry point (API Gateway) for all client requests (Flutter Web/Mobile). 

It is responsible for:
1. Validating incoming requests.
2. Authenticating users via JWT.
3. Managing user sessions and database records in SQL Server.
4. Routing specific AI requests to the internal Python RAG engine.

This separation of concerns ensures that the AI engine is protected from public internet traffic and can focus entirely on vector math and LLM generation.

</div>

</div>
