// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_history.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatHistoryResponseDTO _$ChatHistoryResponseDTOFromJson(
        Map<String, dynamic> json) =>
    ChatHistoryResponseDTO(
      session: ChatSessionDTO.fromJson(json['session'] as Map<String, dynamic>),
      messages: (json['messages'] as List<dynamic>)
          .map((e) => HistoryMessageDTO.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$ChatHistoryResponseDTOToJson(
        ChatHistoryResponseDTO instance) =>
    <String, dynamic>{
      'session': instance.session.toJson(),
      'messages': instance.messages.map((e) => e.toJson()).toList(),
    };

HistoryMessageDTO _$HistoryMessageDTOFromJson(Map<String, dynamic> json) =>
    HistoryMessageDTO(
      id: (json['id'] as num).toInt(),
      question: json['question'] as String,
      answer: json['answer'] as String,
      citations: (json['citations'] as List<dynamic>)
          .map((e) => HistoryCitationDTO.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$HistoryMessageDTOToJson(HistoryMessageDTO instance) =>
    <String, dynamic>{
      'id': instance.id,
      'question': instance.question,
      'answer': instance.answer,
      'citations': instance.citations.map((e) => e.toJson()).toList(),
      'createdAt': instance.createdAt.toIso8601String(),
    };

HistoryCitationDTO _$HistoryCitationDTOFromJson(Map<String, dynamic> json) =>
    HistoryCitationDTO(
      bookTitle: json['bookTitle'] as String,
      madhhab: json['madhhab'] as String,
      author: json['author'] as String,
      authorDeath: json['authorDeath'] as String,
      totalParts: (json['totalParts'] as num).toInt(),
      part: json['part'] as String,
      pageId: (json['pageId'] as num).toInt(),
      hierarchy: json['hierarchy'] as String,
      sourceUrl: json['sourceUrl'] as String,
    );

Map<String, dynamic> _$HistoryCitationDTOToJson(HistoryCitationDTO instance) =>
    <String, dynamic>{
      'bookTitle': instance.bookTitle,
      'madhhab': instance.madhhab,
      'author': instance.author,
      'authorDeath': instance.authorDeath,
      'totalParts': instance.totalParts,
      'part': instance.part,
      'pageId': instance.pageId,
      'hierarchy': instance.hierarchy,
      'sourceUrl': instance.sourceUrl,
    };
