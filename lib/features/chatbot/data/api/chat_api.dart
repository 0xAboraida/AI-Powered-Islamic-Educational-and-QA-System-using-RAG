import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../domain/models/chat_request.dart';
import '../../domain/models/chat_response.dart';

part 'chat_api.g.dart';

@RestApi()
@singleton
@injectable
abstract class ChatApiClient {
  @factoryMethod
  factory ChatApiClient(Dio dio) = _ChatApiClient;

  @POST("api/v1/chat/ask")
  Future<ChatResponseDTO> askChat(
    @Body() ChatRequest body, {
    @CancelRequest() CancelToken? cancelToken,
  });
}
