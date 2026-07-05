import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/api/api_endpoints.dart';
import '../models/auth_response.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';

part 'auth_api_client.g.dart';

@RestApi()
@singleton
@injectable
abstract class AuthApiClient {
  @factoryMethod
  factory AuthApiClient(Dio dio) = _AuthApiClient;

  @POST("api/Auth/register")
  Future<AuthResponse> register(@Body() RegisterRequest body);

  @POST("api/Auth/login")
  Future<AuthResponse> login(@Body() LoginRequest body);
}
