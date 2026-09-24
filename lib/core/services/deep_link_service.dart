import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:zaad/core/services/shared_prefs_service.dart';
import '../routes/app_routes.dart';
import '../routes/screen_routes.dart';

class DeepLinkService {
  static final AppLinks _appLinks = AppLinks();
  static StreamSubscription<Uri>? _sub;

  /// Initializes deep link listening for both Warm Start (background) and Cold Start.
  static void init() {
    _sub?.cancel();

    // 1. Listen for incoming links while the app is running or in the background (Warm Start)
    _sub = _appLinks.uriLinkStream.listen((uri) {
      _handleUri(uri);
    });

    // 2. Handle the initial link if the app was launched directly from the link (Cold Start)
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        _handleUri(uri);
      }
    });
  }

  static Future<void> _handleUri(Uri uri) async {
    final question = uri.queryParameters['question'];
    if (question != null && question.trim().isNotEmpty) {
      final token = await SharedPrefsService.getToken() ?? "";
      final target = Uri(
        path: AppRoutes.chatbot,
        queryParameters: {'question': question.trim()},
      ).toString();

      if (token.isNotEmpty) {
        ScreenRoutes.router.go(target);
      } else {
        ScreenRoutes.router.go(AppRoutes.login);
      }
    }
  }

  static void dispose() {
    _sub?.cancel();
  }
}
