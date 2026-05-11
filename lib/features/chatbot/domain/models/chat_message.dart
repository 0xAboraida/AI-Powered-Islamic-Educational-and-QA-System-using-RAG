class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  bool isAnimated;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isAnimated = false,
  });
}

