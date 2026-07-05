import 'package:shared_preferences/shared_preferences.dart';

class SharedPrefs {
  SharedPrefs._();

  static late SharedPreferences _prefs;

  /// Initialize in main()
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Write
  static Future<bool> setString(String key, String value) =>
      _prefs.setString(key, value);

  static Future<bool> setInt(String key, int value) =>
      _prefs.setInt(key, value);

  static Future<bool> setDouble(String key, double value) =>
      _prefs.setDouble(key, value);

  static Future<bool> setBool(String key, bool value) =>
      _prefs.setBool(key, value);

  static Future<bool> setStringList(String key, List<String> value) =>
      _prefs.setStringList(key, value);

  /// Read
  static String? getString(String key) => _prefs.getString(key);

  static int? getInt(String key) => _prefs.getInt(key);

  static double? getDouble(String key) => _prefs.getDouble(key);

  static bool? getBool(String key) => _prefs.getBool(key);

  static List<String>? getStringList(String key) =>
      _prefs.getStringList(key);

  /// Delete one key
  static Future<bool> remove(String key) =>
      _prefs.remove(key);

  /// Clear all data
  static Future<bool> clear() =>
      _prefs.clear();

  /// Check if key exists
  static bool contains(String key) =>
      _prefs.containsKey(key);
}