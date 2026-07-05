import 'package:equatable/equatable.dart';
import '../../domain/models/chat_message.dart';
import '../../domain/models/chat_session.dart';

abstract class ChatbotState extends Equatable {
  final List<ChatMessage> messages;
  final int? currentSessionId;
  final List<ChatSessionDTO> sessions;
  final bool isLoadingSessions;
  final bool isLoadingHistory;

  const ChatbotState({
    required this.messages,
    this.currentSessionId,
    this.sessions = const [],
    this.isLoadingSessions = false,
    this.isLoadingHistory = false,
  });

  @override
  List<Object?> get props => [
        messages,
        currentSessionId,
        sessions,
        isLoadingSessions,
        isLoadingHistory,
      ];
}

class ChatbotInitial extends ChatbotState {
  const ChatbotInitial({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
  });
}

class ChatbotMessageSending extends ChatbotState {
  const ChatbotMessageSending({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
  });
}

class ChatbotMessageSuccess extends ChatbotState {
  const ChatbotMessageSuccess({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
  });
}

class ChatbotMessageFailure extends ChatbotState {
  final String errorMessage;

  const ChatbotMessageFailure({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
    required this.errorMessage,
  });

  @override
  List<Object?> get props => [
        messages,
        currentSessionId,
        sessions,
        isLoadingSessions,
        isLoadingHistory,
        errorMessage,
      ];
}
