class FeedbackModel {
  final String userName;
  final String userEmail;
  final DateTime timestamp;
  final String questionText;
  final String domainName;
  final String answerSnippet;
  final String fullAnswer;
  final String rating; // 'like' or 'dislike'
  final String? id;

  FeedbackModel({
    required this.userName,
    required this.userEmail,
    required this.timestamp,
    required this.questionText,
    required this.domainName,
    required this.answerSnippet,
    required this.fullAnswer,
    required this.rating,
    this.id,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) {
    return FeedbackModel(
      id: json['id']?.toString(),
      userName: json['userName'] ?? '',
      userEmail: json['userEmail'] ?? '',
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
      questionText: json['questionText'] ?? '',
      domainName: json['domainName'] ?? '',
      answerSnippet: json['answerSnippet'] ?? '',
      fullAnswer: json['fullAnswer'] ?? '',
      rating: json['rating'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userName': userName,
      'userEmail': userEmail,
      'timestamp': timestamp.toIso8601String(),
      'questionText': questionText,
      'domainName': domainName,
      'answerSnippet': answerSnippet,
      'fullAnswer': fullAnswer,
      'rating': rating,
    };
  }
}
