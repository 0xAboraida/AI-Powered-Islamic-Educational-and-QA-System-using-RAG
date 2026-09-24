class RegisteredUserModel {
  final String userName;
  final String userEmail;
  final DateTime timestamp;

  RegisteredUserModel({
    required this.userName,
    required this.userEmail,
    required this.timestamp,
  });

  factory RegisteredUserModel.fromJson(Map<String, dynamic> json) {
    return RegisteredUserModel(
      userName: json['userName'] ?? '',
      userEmail: json['userEmail'] ?? '',
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userName': userName,
      'userEmail': userEmail,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
