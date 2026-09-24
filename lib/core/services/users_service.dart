import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/data/models/registered_user_model.dart';

class UsersService {
  static final SupabaseClient _supabase = Supabase.instance.client;
  static const String _tableName = 'users';

  static Future<void> init() async {
    // Hive init removed
  }

  static Future<void> saveUser({
    required String userName,
    required String userEmail,
  }) async {
    try {
      final user = RegisteredUserModel(
        userName: userName,
        userEmail: userEmail,
        timestamp: DateTime.now(),
      );
      await _supabase.from(_tableName).insert(user.toJson());
    } catch (e) {
      print('Error saving user to Supabase: $e');
    }
  }

  static Future<List<RegisteredUserModel>> getAllUsers() async {
    try {
      final response = await _supabase
          .from(_tableName)
          .select()
          .order('timestamp', ascending: false);
      return response.map((e) => RegisteredUserModel.fromJson(e)).toList();
    } catch (e) {
      print('Error getting users from Supabase: $e');
      return [];
    }
  }

  static Future<void> clearAllUsers() async {
    try {
      await _supabase.from(_tableName).delete().neq('userName', '');
    } catch (e) {
      print('Error clearing users from Supabase: $e');
    }
  }
}
