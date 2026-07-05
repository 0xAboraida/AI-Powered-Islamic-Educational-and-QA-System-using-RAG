class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = 'https://abourida-zad-backend.hf.space/';

  // static const String chatbotBaseUrl = 'https://abourida-zad-rag.hf.space/';

  static const String _authBase = '/api/auth';
  static const String register = '$_authBase/register';
  static const String login = '$_authBase/login';

}
