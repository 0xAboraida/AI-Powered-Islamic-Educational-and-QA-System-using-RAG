// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_session.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatSessionDTO _$ChatSessionDTOFromJson(Map<String, dynamic> json) =>
    ChatSessionDTO(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      messageCount: (json['messageCount'] as num).toInt(),
    );

Map<String, dynamic> _$ChatSessionDTOToJson(ChatSessionDTO instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'createdAt': instance.createdAt.toIso8601String(),
      'messageCount': instance.messageCount,
    };
