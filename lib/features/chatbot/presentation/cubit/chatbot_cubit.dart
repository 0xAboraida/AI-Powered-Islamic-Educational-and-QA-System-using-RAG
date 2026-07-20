import 'package:bloc/bloc.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';
import '../../data/repos/chat_repository.dart';
import '../../domain/models/chat_message.dart';
import '../../domain/models/chat_response.dart';
import '../../domain/models/chat_session.dart';
import '../../../../core/services/shared_prefs.dart';
import '../../../../core/di/injection.dart';
import '../../../auth/data/repos/auth_repository.dart';
import 'chatbot_state.dart';

@injectable
class ChatbotCubit extends Cubit<ChatbotState> {
  final ChatRepository _chatRepository;

  ChatbotCubit(this._chatRepository)
      : super(ChatbotInitial(messages: [
          ChatMessage(
            text: "السلام عليكم، كيف يمكنني مساعدتك اليوم؟",
            isUser: false,
            timestamp: DateTime.now(),
            isAnimated: false,
          ),
        ])) {
    loadSessions();
  }

  CancelToken? _cancelToken;

  void cancelSendMessage() {
    _cancelToken?.cancel('User cancelled sending message');
  }

  Future<void> loadSessions() async {
    emit(ChatbotInitial(
      messages: state.messages,
      currentSessionId: state.currentSessionId,
      sessions: state.sessions,
      isLoadingSessions: true,
      isLoadingHistory: state.isLoadingHistory,
    ));

    try {
      final email = SharedPrefs.getString('last_login_email');
      final password = SharedPrefs.getString('last_login_password');
      if (email != null && password != null && email.isNotEmpty && password.isNotEmpty) {
        final authRepo = getIt<AuthRepository>();
        await authRepo.login(email: email, password: password);
      }
    } catch (e) {
      // Ignore auto-login errors and proceed
    }

    try {
      final fetchedSessions = await _chatRepository.getSessions();
      emit(ChatbotInitial(
        messages: state.messages,
        currentSessionId: state.currentSessionId,
        sessions: fetchedSessions,
        isLoadingSessions: false,
        isLoadingHistory: state.isLoadingHistory,
      ));
    } catch (e) {
      emit(ChatbotMessageFailure(
        messages: state.messages,
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        isLoadingSessions: false,
        isLoadingHistory: state.isLoadingHistory,
        errorMessage: 'فشل في تحميل قائمة المحادثات السابقة',
      ));
    }
  }

  void startNewChat() {
    emit(ChatbotInitial(
      messages: [
        ChatMessage(
          text: "السلام عليكم، كيف يمكنني مساعدتك اليوم؟",
          isUser: false,
          timestamp: DateTime.now(),
          isAnimated: false,
        ),
      ],
      currentSessionId: null,
      sessions: state.sessions,
      isLoadingHistory: false,
      isLoadingSessions: false,
    ));
  }

  Future<void> startNewSession(String name) async {
    emit(ChatbotInitial(
      messages: state.messages,
      currentSessionId: state.currentSessionId,
      sessions: state.sessions,
      isLoadingHistory: true,
      isLoadingSessions: state.isLoadingSessions,
    ));
    try {
      final newSession = await _chatRepository.createSession(name);
      final updatedSessions = List<ChatSessionDTO>.from(state.sessions);
      if (!updatedSessions.any((s) => s.id == newSession.id)) {
        updatedSessions.insert(0, newSession);
      }
      emit(ChatbotInitial(
        messages: [
          ChatMessage(
            text: "السلام عليكم، كيف يمكنني مساعدتك اليوم؟",
            isUser: false,
            timestamp: DateTime.now(),
            isAnimated: false,
          ),
        ],
        currentSessionId: newSession.id,
        sessions: updatedSessions,
        isLoadingHistory: false,
        isLoadingSessions: false,
      ));
    } catch (e) {
      emit(ChatbotMessageFailure(
        messages: state.messages,
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        isLoadingHistory: false,
        isLoadingSessions: false,
        errorMessage: 'فشل في إنشاء جلسة محادثة جديدة',
      ));
    }
  }

  Future<void> selectSession(int sessionId) async {
    emit(ChatbotInitial(
      messages: state.messages,
      currentSessionId: sessionId,
      sessions: state.sessions,
      isLoadingSessions: state.isLoadingSessions,
      isLoadingHistory: true,
    ));
    try {
      final history = await _chatRepository.getSessionHistory(sessionId);
      final loadedMessages = history.messages.map((m) {
        final Map<String, CitationDTO> mappedCitations = {};
        for (int i = 0; i < m.citations.length; i++) {
          final cit = m.citations[i];
          mappedCitations[(i + 1).toString()] = CitationDTO(
            bookTitle: cit.bookTitle,
            madhhab: cit.madhhab,
            author: cit.author,
            authorDeath: cit.authorDeath,
            totalParts: cit.totalParts,
            part: cit.part,
            pageId: cit.pageId,
            hierarchy: cit.hierarchy,
            sourceUrl: cit.sourceUrl,
          );
        }

        return [
          ChatMessage(
            text: m.question,
            isUser: true,
            timestamp: m.createdAt,
          ),
          ChatMessage(
            text: m.answer,
            isUser: false,
            timestamp: m.createdAt,
            isAnimated: false,
            response: ChatResponseDTO(
              answer: m.answer,
              citations: mappedCitations,
            ),
          )
        ];
      }).expand((x) => x).toList();

      if (loadedMessages.isEmpty) {
        loadedMessages.add(ChatMessage(
          text: "السلام عليكم، كيف يمكنني مساعدتك اليوم؟",
          isUser: false,
          timestamp: DateTime.now(),
          isAnimated: false,
        ));
      }

      emit(ChatbotMessageSuccess(
        messages: loadedMessages,
        currentSessionId: sessionId,
        sessions: state.sessions,
        isLoadingSessions: false,
        isLoadingHistory: false,
      ));
    } catch (e) {
      emit(ChatbotMessageFailure(
        messages: state.messages,
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        isLoadingSessions: false,
        isLoadingHistory: false,
        errorMessage: 'فشل في تحميل تاريخ المحادثة',
      ));
    }
  }

  Future<void> sendMessage({required String query, required int domain}) async {
    if (query.trim().isEmpty) return;

    int? sessionId = state.currentSessionId;
    bool isNewSession = sessionId == null;
    ChatSessionDTO? newSession;
    if (sessionId == null) {
      try {
        newSession = await _chatRepository.createSession(query);
        sessionId = newSession.id;
      } catch (e) {
        emit(ChatbotMessageFailure(
          messages: state.messages,
          currentSessionId: state.currentSessionId,
          sessions: state.sessions,
          errorMessage: 'فشل في إنشاء جلسة محادثة لإرسال الرسالة',
        ));
        return;
      }
    }

    final updatedMessages = List<ChatMessage>.from(state.messages);

    // Add User Message
    updatedMessages.add(
      ChatMessage(
        text: query,
        isUser: true,
        timestamp: DateTime.now(),
      ),
    );

    List<ChatSessionDTO> updatedSessions = List<ChatSessionDTO>.from(state.sessions);
    if (isNewSession && newSession != null) {
      if (!updatedSessions.any((s) => s.id == newSession!.id)) {
        updatedSessions.insert(0, newSession);
      }
    }

    emit(ChatbotMessageSending(
      messages: updatedMessages,
      currentSessionId: sessionId,
      sessions: updatedSessions,
    ));

    _cancelToken = CancelToken();

    try {
      final historyMsg = await _chatRepository.sendSessionMessage(
        sessionId: sessionId??0,
        query: query,
        domain: domain,
        cancelToken: _cancelToken,
      );

      final Map<String, CitationDTO> mappedCitations = {};
      for (int i = 0; i < historyMsg.citations.length; i++) {
        final cit = historyMsg.citations[i];
        mappedCitations[(i + 1).toString()] = CitationDTO(
          bookTitle: cit.bookTitle,
          madhhab: cit.madhhab,
          author: cit.author,
          authorDeath: cit.authorDeath,
          totalParts: cit.totalParts,
          part: cit.part,
          pageId: cit.pageId,
          hierarchy: cit.hierarchy,
          sourceUrl: cit.sourceUrl,
        );
      }

      final aiMessage = ChatMessage(
        text: historyMsg.answer,
        isUser: false,
        timestamp: historyMsg.createdAt,
        isAnimated: true,
        response: ChatResponseDTO(
          answer: historyMsg.answer,
          citations: mappedCitations,
        ),
      );

      final finalMessages = List<ChatMessage>.from(state.messages)
        ..add(aiMessage);

      int currentPoints = SharedPrefs.getInt('points_count') ?? 890;
      int currentQuestions = SharedPrefs.getInt('questions_count') ?? 134;
      int currentDomains = SharedPrefs.getInt('domains_count') ?? 6;

      SharedPrefs.setInt('points_count', currentPoints + 5);
      SharedPrefs.setInt('questions_count', currentQuestions + 1);
      SharedPrefs.setInt('domains_count', currentDomains + 1);

      emit(ChatbotMessageSuccess(
        messages: finalMessages,
        currentSessionId: sessionId,
        sessions: updatedSessions,
      ));
    } on DioException catch (e) {
      if (CancelToken.isCancel(e)) {
        emit(ChatbotMessageSuccess(
          messages: state.messages,
          currentSessionId: sessionId,
          sessions: updatedSessions,
        ));
        return;
      }
      emit(ChatbotMessageFailure(
        messages: state.messages,
        currentSessionId: sessionId,
        sessions: updatedSessions,
        errorMessage: _parseDioError(e),
      ));
    } catch (e) {
      emit(ChatbotMessageFailure(
        messages: state.messages,
        currentSessionId: sessionId,
        sessions: updatedSessions,
        errorMessage: 'حدث خطأ غير متوقع، حاول مجدداً',
      ));
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
    if (statusCode != null) return 'خطأ من الخادم ($statusCode)';
    return 'حدث خطأ غير متوقع، حاول مجدداً';
  }
}
