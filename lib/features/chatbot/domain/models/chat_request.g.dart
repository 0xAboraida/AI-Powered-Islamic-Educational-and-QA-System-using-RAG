// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatRequest _$ChatRequestFromJson(Map<String, dynamic> json) => ChatRequest(
      sessionId: (json['session_id'] as num).toInt(),
      query: json['query'] as String,
      domain: (json['domain'] as num).toInt(),
    );

Map<String, dynamic> _$ChatRequestToJson(ChatRequest instance) =>
    <String, dynamic>{
      'session_id': instance.sessionId,
      'query': instance.query,
      'domain': instance.domain,
    };
