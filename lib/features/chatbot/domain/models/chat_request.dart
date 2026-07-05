import 'package:json_annotation/json_annotation.dart';

part 'chat_request.g.dart';

@JsonSerializable()
class ChatRequest {
  @JsonKey(name: 'session_id')
  final int sessionId;
  final String query;
  final int domain;

  const ChatRequest({
    required this.sessionId,
    required this.query,
    required this.domain,
  });

  factory ChatRequest.fromJson(Map<String, dynamic> json) =>
      _$ChatRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ChatRequestToJson(this);
}
