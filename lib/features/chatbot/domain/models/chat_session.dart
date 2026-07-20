import 'package:json_annotation/json_annotation.dart';

part 'chat_session.g.dart';

@JsonSerializable()
class ChatSessionDTO {
  final int? id;
  final String? name;
  final DateTime? createdAt;
  final int? messageCount;

  const ChatSessionDTO({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.messageCount,
  });

  factory ChatSessionDTO.fromJson(Map<String, dynamic> json) =>
      _$ChatSessionDTOFromJson(json);

  Map<String, dynamic> toJson() => _$ChatSessionDTOToJson(this);
}
