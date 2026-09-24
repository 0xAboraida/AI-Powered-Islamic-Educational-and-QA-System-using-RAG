import 'package:equatable/equatable.dart';
import '../../domain/models/chat_message.dart';
import '../../domain/models/chat_session.dart';

abstract class ChatbotState extends Equatable {
  final List<ChatMessage> messages;
  final int? currentSessionId;
  final List<ChatSessionDTO> sessions;
  final bool isLoadingSessions;
  final bool isLoadingHistory;
  final String selectedResponseMode;

  const ChatbotState({
    required this.messages,
    this.currentSessionId,
    this.sessions = const [],
    this.isLoadingSessions = false,
    this.isLoadingHistory = false,
    this.selectedResponseMode = 'simple',
  });

  @override
  List<Object?> get props => [
        messages,
        currentSessionId,
        sessions,
        isLoadingSessions,
        isLoadingHistory,
        selectedResponseMode,
      ];
}

class ChatbotInitial extends ChatbotState {
  const ChatbotInitial({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
    super.selectedResponseMode,
  });
}

class ChatbotMessageSending extends ChatbotState {
  const ChatbotMessageSending({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
    super.selectedResponseMode,
  });
}

class ChatbotMessageSuccess extends ChatbotState {
  const ChatbotMessageSuccess({
    required super.messages,
    super.currentSessionId,
    super.sessions,
    super.isLoadingSessions,
    super.isLoadingHistory,
    super.selectedResponseMode,
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
    super.selectedResponseMode,
    required this.errorMessage,
  });

  @override
  List<Object?> get props => [
        messages,
        currentSessionId,
        sessions,
        isLoadingSessions,
        isLoadingHistory,
        selectedResponseMode,
        errorMessage,
      ];
}
