// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatResponseDTO _$ChatResponseDTOFromJson(Map<String, dynamic> json) =>
    ChatResponseDTO(
      answer: json['answer'] as String,
      citations: (json['citations'] as Map<String, dynamic>).map(
        (k, e) => MapEntry(k, CitationDTO.fromJson(e as Map<String, dynamic>)),
      ),
    );

Map<String, dynamic> _$ChatResponseDTOToJson(ChatResponseDTO instance) =>
    <String, dynamic>{
      'answer': instance.answer,
      'citations': instance.citations.map((k, e) => MapEntry(k, e.toJson())),
    };

CitationDTO _$CitationDTOFromJson(Map<String, dynamic> json) => CitationDTO(
      bookTitle: json['book_title'] as String,
      madhhab: json['madhhab'] as String,
      author: json['author'] as String,
      authorDeath: json['author_death'] as String,
      totalParts: (json['total_parts'] as num).toInt(),
      part: json['part'] as String,
      pageId: (json['page_id'] as num).toInt(),
      hierarchy: json['hierarchy'] as String,
      sourceUrl: json['source_url'] as String,
    );

Map<String, dynamic> _$CitationDTOToJson(CitationDTO instance) =>
    <String, dynamic>{
      'book_title': instance.bookTitle,
      'madhhab': instance.madhhab,
      'author': instance.author,
      'author_death': instance.authorDeath,
      'total_parts': instance.totalParts,
      'part': instance.part,
      'page_id': instance.pageId,
      'hierarchy': instance.hierarchy,
      'source_url': instance.sourceUrl,
    };
