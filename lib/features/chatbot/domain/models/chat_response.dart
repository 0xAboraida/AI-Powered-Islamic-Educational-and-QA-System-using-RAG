import 'package:json_annotation/json_annotation.dart';

part 'chat_response.g.dart';

@JsonSerializable(explicitToJson: true)
class ChatResponseDTO {
  @JsonKey(name: 'answer')
  final String answer;

  @JsonKey(name: 'citations')
  final Map<String, CitationDTO> citations;

  const ChatResponseDTO({
    required this.answer,
    required this.citations,
  });

  factory ChatResponseDTO.fromJson(Map<String, dynamic> json) =>
      _$ChatResponseDTOFromJson(json);

  Map<String, dynamic> toJson() => _$ChatResponseDTOToJson(this);
}

@JsonSerializable()
class CitationDTO {
  @JsonKey(name: 'book_title')
  final String bookTitle;

  @JsonKey(name: 'madhhab')
  final String madhhab;

  @JsonKey(name: 'author')
  final String author;

  @JsonKey(name: 'author_death')
  final String authorDeath;

  @JsonKey(name: 'total_parts')
  final int totalParts;

  @JsonKey(name: 'part')
  final String part;

  @JsonKey(name: 'page_id')
  final int pageId;

  @JsonKey(name: 'hierarchy')
  final String hierarchy;

  @JsonKey(name: 'source_url')
  final String sourceUrl;

  const CitationDTO({
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

  factory CitationDTO.fromJson(Map<String, dynamic> json) =>
      _$CitationDTOFromJson(json);

  Map<String, dynamic> toJson() => _$CitationDTOToJson(this);
}
