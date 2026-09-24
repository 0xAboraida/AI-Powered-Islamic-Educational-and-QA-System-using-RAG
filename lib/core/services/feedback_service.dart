import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/chatbot/data/models/feedback_model.dart';

class FeedbackService {
  static final SupabaseClient _supabase = Supabase.instance.client;
  static const String _tableName = 'feedbacks';

  static Future<void> init() async {
    // Hive init removed
  }

  static Future<void> saveFeedback({
    required String userName,
    required String userEmail,
    required String questionText,
    required String domainName,
    required String fullAnswer,
    required String rating,
  }) async {
    try {
      final cleanAnswer = fullAnswer.replaceAll(RegExp(r'\[cite:\s*\d+\]'), '').trim();
      final snippet = cleanAnswer.length > 100
          ? '${cleanAnswer.substring(0, 100)}...'
          : cleanAnswer;

      final feedback = FeedbackModel(
        userName: userName.isEmpty ? 'مستخدم زاد' : userName,
        userEmail: userEmail.isEmpty ? 'زائر' : userEmail,
        timestamp: DateTime.now(),
        questionText: questionText,
        domainName: domainName.isEmpty ? 'العلوم الشرعية' : domainName,
        answerSnippet: snippet,
        fullAnswer: fullAnswer,
        rating: rating,
      );
      
      await _supabase.from(_tableName).insert(feedback.toJson());
    } catch (e) {
      print('Error saving feedback to Supabase: $e');
    }
  }

  static Future<List<FeedbackModel>> getAllFeedbacks() async {
    try {
      final response = await _supabase
          .from(_tableName)
          .select()
          .order('timestamp', ascending: false);
      return response.map((e) => FeedbackModel.fromJson(e)).toList();
    } catch (e) {
      print('Error getting feedbacks from Supabase: $e');
      return [];
    }
  }

  static Future<void> deleteFeedback(String id) async {
    try {
      await _supabase.from(_tableName).delete().eq('id', id);
    } catch (e) {
      print('Error deleting feedback from Supabase: $e');
    }
  }

  static Future<void> clearAllFeedbacks() async {
    try {
      await _supabase.from(_tableName).delete().neq('userName', '');
    } catch (e) {
      print('Error clearing feedbacks from Supabase: $e');
    }
  }
}
