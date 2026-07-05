import 'package:dio/dio.dart';
import '../../domain/models/chat_response.dart';
import '../../domain/models/chat_session.dart';
import '../../domain/models/chat_history.dart';

abstract class ChatRepository {
  Future<ChatResponseDTO> askChat({
    required String query,
    required int sessionId,
    required int domain,
    CancelToken? cancelToken,
  });

  Future<ChatSessionDTO> createSession(String name);

  Future<List<ChatSessionDTO>> getSessions();

  Future<ChatHistoryResponseDTO> getSessionHistory(int sessionId);

  Future<HistoryMessageDTO> sendSessionMessage({
    required int sessionId,
    required String query,
    required int domain,
    CancelToken? cancelToken,
  });
}
