import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../api/chat_api.dart';
import '../api/chat_session_api.dart';
import '../../domain/models/chat_request.dart';
import '../../domain/models/chat_response.dart';
import '../../domain/models/chat_session.dart';
import '../../domain/models/chat_history.dart';
import 'chat_repository.dart';

@LazySingleton(as: ChatRepository)
class ChatRepositoryImpl implements ChatRepository {
  final ChatApiClient _apiClient;
  final ChatSessionApiClient _sessionApiClient;

  ChatRepositoryImpl(this._apiClient, this._sessionApiClient);

  @override
  Future<ChatResponseDTO> askChat({
    required String query,
    required int sessionId,
    required int domain,
    CancelToken? cancelToken,
  }) async {
    return await _apiClient.askChat(
      ChatRequest(
        sessionId: sessionId,
        query: query,
        domain: domain,
      ),
      cancelToken: cancelToken,
    );
  }

  @override
  Future<ChatSessionDTO> createSession(String name) async {
    return await _sessionApiClient.createSession({
      'name': name,
    });
  }

  @override
  Future<List<ChatSessionDTO>> getSessions() async {
    return await _sessionApiClient.getSessions();
  }

  @override
  Future<ChatHistoryResponseDTO> getSessionHistory(int sessionId) async {
    return await _sessionApiClient.getSessionHistory(sessionId);
  }

  @override
  Future<HistoryMessageDTO> sendSessionMessage({
    required int sessionId,
    required String query,
    required int domain,
    CancelToken? cancelToken,
  }) async {
    return await _sessionApiClient.sendMessage(
      sessionId,
      {
        'question': query,
        'mode': domain,
      },
      cancelToken: cancelToken,
    );
  }
}
