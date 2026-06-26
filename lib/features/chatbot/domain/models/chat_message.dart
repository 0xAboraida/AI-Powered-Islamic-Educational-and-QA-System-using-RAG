import 'package:zaad/features/chatbot/domain/models/chat_response.dart';


class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  bool isAnimated;

  /// Structured AI response. Present only on bot messages that come from the API.
  final ChatResponseDTO? response;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isAnimated = false,
    this.response,
  });
}
