// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:dio/dio.dart' as _i361;
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;
import 'package:zaad/core/api/api_client.dart' as _i881;
import 'package:zaad/features/auth/data/api/auth_api_client.dart' as _i730;
import 'package:zaad/features/auth/data/repos/auth_repository.dart' as _i394;
import 'package:zaad/features/auth/data/repos/auth_repository_impl.dart'
    as _i564;
import 'package:zaad/features/auth/presentation/cubit/auth_cubit.dart' as _i744;
import 'package:zaad/features/chatbot/data/api/chat_api.dart' as _i715;
import 'package:zaad/features/chatbot/data/api/chat_session_api.dart' as _i75;
import 'package:zaad/features/chatbot/data/repos/chat_repository.dart' as _i155;
import 'package:zaad/features/chatbot/data/repos/chat_repository_impl.dart'
    as _i1062;
import 'package:zaad/features/chatbot/presentation/cubit/chatbot_cubit.dart'
    as _i8;

extension GetItInjectableX on _i174.GetIt {
// initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(
      this,
      environment,
      environmentFilter,
    );
    final apiClientModule = _$ApiClientModule();
    gh.singleton<_i361.Dio>(() => apiClientModule.dio);
    gh.singleton<String>(
      () => apiClientModule.baseUrl,
      instanceName: 'baseUrl',
    );
    gh.singleton<_i730.AuthApiClient>(
        () => _i730.AuthApiClient(gh<_i361.Dio>()));
    gh.singleton<_i715.ChatApiClient>(
        () => _i715.ChatApiClient(gh<_i361.Dio>()));
    gh.singleton<_i75.ChatSessionApiClient>(
        () => _i75.ChatSessionApiClient(gh<_i361.Dio>()));
    gh.lazySingleton<_i394.AuthRepository>(
        () => _i564.AuthRepositoryImpl(gh<_i730.AuthApiClient>()));
    gh.factory<_i744.AuthCubit>(
        () => _i744.AuthCubit(gh<_i394.AuthRepository>()));
    gh.lazySingleton<_i155.ChatRepository>(() => _i1062.ChatRepositoryImpl(
          gh<_i715.ChatApiClient>(),
          gh<_i75.ChatSessionApiClient>(),
        ));
    gh.factory<_i8.ChatbotCubit>(
        () => _i8.ChatbotCubit(gh<_i155.ChatRepository>()));
    return this;
  }
}

class _$ApiClientModule extends _i881.ApiClientModule {}
