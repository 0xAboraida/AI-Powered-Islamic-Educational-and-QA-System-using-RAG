import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../domain/models/chat_session.dart';
import '../../domain/models/chat_history.dart';

part 'chat_session_api.g.dart';

@RestApi()
@singleton
@injectable
abstract class ChatSessionApiClient {
  @factoryMethod
  factory ChatSessionApiClient(Dio dio) = _ChatSessionApiClient;

  @POST('api/Chat/sessions')
  Future<ChatSessionDTO> createSession(
    @Body() Map<String, dynamic> body,
  );

  @GET('api/Chat/sessions')
  Future<List<ChatSessionDTO>> getSessions();

  @GET('api/Chat/sessions/{id}')
  Future<ChatHistoryResponseDTO> getSessionHistory(@Path('id') int id);

  @POST('api/Chat/sessions/{id}/messages')
  Future<HistoryMessageDTO> sendMessage(
    @Path('id') int id,
    @Body() Map<String, dynamic> body, {
    @CancelRequest() CancelToken? cancelToken,
  });
}
