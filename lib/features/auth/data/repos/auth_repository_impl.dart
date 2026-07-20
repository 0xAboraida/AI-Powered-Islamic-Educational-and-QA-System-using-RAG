import 'package:injectable/injectable.dart';
import '../../../../core/services/shared_prefs_service.dart';
import '../../../../core/services/shared_prefs.dart';
import '../api/auth_api_client.dart';
import '../models/auth_response.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';
import 'auth_repository.dart';

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthApiClient _apiClient;

  AuthRepositoryImpl(this._apiClient);

  @override
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.login(
      LoginRequest(email: email, password: password),
    );
    await SharedPrefsService.saveToken(response.token);
    await SharedPrefs.setString('user_name', response.user.name);
    await SharedPrefs.setString('user_email', response.user.email);
    await SharedPrefs.setString('last_login_email', email);
    await SharedPrefs.setString('last_login_password', password);
    return response;
  }

  @override
  Future<AuthResponse> register({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    final response = await _apiClient.register(
      RegisterRequest(
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      ),
    );
    await SharedPrefsService.saveToken(response.token);
    await SharedPrefs.setString('user_name', response.user.name);
    await SharedPrefs.setString('user_email', response.user.email);
    await SharedPrefs.setString('last_login_email', email);
    await SharedPrefs.setString('last_login_password', password);
    return response;
  }
}
