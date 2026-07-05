import 'package:flutter/material.dart';
import 'package:zaad/features/chatbot/presentation/child_mode_screen.dart';

import '../../features/auth/presentation/pages/auth_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/welcome/presentation/welcome_page.dart';
import '../../features/chatbot/presentation/chatbot_screen.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/profile/presentation/about_app_page.dart';
import 'app_routes.dart';

class ScreenRoutes {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return MaterialPageRoute(
          builder: (_) => const SplashPage(),
          settings: settings,
        );
      case AppRoutes.login:
        return MaterialPageRoute(
          builder: (_) => const AuthPage(isInitialSignUp: false),
          settings: settings,
        );
      case AppRoutes.signup:
        return MaterialPageRoute(
          builder: (_) => const AuthPage(isInitialSignUp: true),
          settings: settings,
        );
      case AppRoutes.welcome:
        return MaterialPageRoute(
          builder: (_) => const WelcomePage(),
          settings: settings,
        );
      case AppRoutes.chatbot:
        return MaterialPageRoute(
          builder: (_) => const ChatbotScreen(),
          settings: settings,
        );
      case AppRoutes.profile:
        return MaterialPageRoute(
          builder: (_) => const ProfilePage(),
          settings: settings,
        );
      case AppRoutes.childMode:
        return MaterialPageRoute(
          builder: (_) => const ChildModeScreen(),
          settings: settings,
        );
      case AppRoutes.aboutApp:
        return MaterialPageRoute(
          builder: (_) => const AboutAppPage(),
          settings: settings,
        );
      default:
        return MaterialPageRoute(
          builder: (_) => const Text("No Route"),
          settings: settings,
        );
    }
  }
}

