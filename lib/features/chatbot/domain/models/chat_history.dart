import 'package:json_annotation/json_annotation.dart';
import 'chat_session.dart';

part 'chat_history.g.dart';

@JsonSerializable(explicitToJson: true)
class ChatHistoryResponseDTO {
  final ChatSessionDTO session;
  final List<HistoryMessageDTO> messages;

  const ChatHistoryResponseDTO({
    required this.session,
    required this.messages,
  });

  factory ChatHistoryResponseDTO.fromJson(Map<String, dynamic> json) =>
      _$ChatHistoryResponseDTOFromJson(json);

  Map<String, dynamic> toJson() => _$ChatHistoryResponseDTOToJson(this);
}

@JsonSerializable(explicitToJson: true)
class HistoryMessageDTO {
  final int id;
  final String question;
  final String answer;
  final List<HistoryCitationDTO> citations;
  final DateTime createdAt;

  const HistoryMessageDTO({
    required this.id,
    required this.question,
    required this.answer,
    required this.citations,
    required this.createdAt,
  });

  factory HistoryMessageDTO.fromJson(Map<String, dynamic> json) =>
      _$HistoryMessageDTOFromJson(json);

  Map<String, dynamic> toJson() => _$HistoryMessageDTOToJson(this);
}

@JsonSerializable()
class HistoryCitationDTO {
  final String bookTitle;
  final String madhhab;
  final String author;
  final String authorDeath;
  final int totalParts;
  final String part;
  final int pageId;
  final String hierarchy;
  final String sourceUrl;

  const HistoryCitationDTO({
    required this.bookTitle,
    required this.madhhab,
    required this.author,
    required this.authorDeath,
    required this.totalParts,
    required this.part,
    required this.pageId,
    required this.hierarchy,
    required this.sourceUrl,
  });

  factory HistoryCitationDTO.fromJson(Map<String, dynamic> json) =>
      _$HistoryCitationDTOFromJson(json);

  Map<String, dynamic> toJson() => _$HistoryCitationDTOToJson(this);
}
