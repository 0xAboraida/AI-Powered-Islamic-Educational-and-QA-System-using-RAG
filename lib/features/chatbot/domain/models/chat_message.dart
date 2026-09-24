import 'package:zaad/features/chatbot/domain/models/chat_response.dart';


class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  bool isAnimated;

  /// Structured AI response. Present only on bot messages that come from the API.
  final ChatResponseDTO? response;

  /// Question associated with this bot answer.
  final String? questionText;

  /// Field/Domain category for this question.
  final String? domainName;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isAnimated = false,
    this.questionText,
    this.domainName,
    this.response,
  });
}
