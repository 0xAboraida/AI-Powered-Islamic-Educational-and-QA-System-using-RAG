<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Security, JWT & CORS</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        As a public-facing API Gateway, the .NET backend implements robust security measures. It strictly controls who can access the API and from where, utilizing JSON Web Tokens (JWT) and a highly restrictive CORS policy.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. JWT Authentication

The `AuthController` manages user registration and login. Upon successful authentication, the backend issues a cryptographically signed JWT.

*   **Symmetric Encryption:** The token is signed using a highly secure `JwtOptions.Secret`. If a secret is not provided in production, the system generates a secure 48-byte random key on startup to prevent insecure default deployments.
*   **Validation:** Every request to protected endpoints (like the `ChatController`) is intercepted by the `JwtBearer` middleware. It validates the Issuer, Audience, Expiration, and cryptographic signature before allowing the request to proceed to the Application layer.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Advanced CORS Policy

To protect against Cross-Site Request Forgery (CSRF) and unauthorized domain access, the `Program.cs` implements an advanced, dynamic CORS (Cross-Origin Resource Sharing) policy.

*   **Strict Origin Filtering:** It reads `AllowedOrigins` from the configuration. 
*   **Production Safeguards:** If the environment is set to Production, it explicitly rejects any `http://` origin, forcing HTTPS. It also aggressively strips out wildcard (`*`) origins in production, ensuring that only explicitly whitelisted frontend URLs (e.g., the deployed Flutter Web app) can communicate with the API.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Global Exception Handling

A custom `ExceptionHandlingMiddleware` wraps every single HTTP request. If an unhandled error occurs deep within the Application or Infrastructure layers, this middleware catches it, logs it securely via **Serilog**, and returns a standardized, sanitized JSON error response to the client without exposing sensitive stack traces.

</div>

</div>
