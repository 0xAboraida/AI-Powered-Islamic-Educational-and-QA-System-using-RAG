import 'package:bloc/bloc.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../../data/repos/auth_repository.dart';
import 'auth_state.dart';

@injectable
class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _authRepository;

  AuthCubit(this._authRepository) : super(const AuthInitial());

  Future<void> login({
    required String email,
    required String password,
  }) async {
    emit(const AuthLoading());
    try {
      final response = await _authRepository.login(
        email: email,
        password: password,
      );
      emit(AuthSuccess(response));
    } on DioException catch (e) {
      emit(AuthFailure(_parseDioError(e)));
    } catch (e) {
      emit(AuthFailure('حدث خطأ غير متوقع، حاول مجدداً'));
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    emit(const AuthLoading());
    try {
      final response = await _authRepository.register(
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      );
      emit(AuthSuccess(response));
    } on DioException catch (e) {
      emit(AuthFailure(_parseDioError(e)));
    } catch (e) {
      emit(AuthFailure('حدث خطأ غير متوقع، حاول مجدداً'));
    }
  }

  String _parseDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'انتهت مهلة الاتصال، تحقق من الإنترنت';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'تعذّر الاتصال بالخادم، تحقق من الإنترنت';
    }
    final statusCode = e.response?.statusCode;
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }
    if (statusCode == 400) return 'بيانات غير صحيحة، تحقق من المدخلات';
    if (statusCode == 401) return 'البريد أو كلمة المرور غير صحيحة';
    if (statusCode == 409) return 'البريد الإلكتروني مستخدم من قبل';
    if (statusCode != null) return 'خطأ من الخادم ($statusCode)';
    return 'حدث خطأ غير متوقع، حاول مجدداً';
  }

  void resetState() => emit(const AuthInitial());
}
