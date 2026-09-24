import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:zaad/features/auth/presentation/pages/admin_users_screen.dart';
import 'package:zaad/features/chatbot/presentation/pages/admin_ratings_screen.dart';
import 'package:zaad/features/chatbot/presentation/child_mode_screen.dart';

import '../../features/auth/presentation/pages/auth_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/welcome/presentation/welcome_page.dart';
import '../../features/chatbot/presentation/chatbot_screen.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/profile/presentation/about_app_page.dart';
import 'app_routes.dart';

class MyObserver extends NavigatorObserver {
  @override
  void didPush(Route route, Route? previousRoute) {
    debugPrint('PUSH => ${route.settings.name}');
  }

  @override
  void didReplace({Route? newRoute, Route? oldRoute}) {
    debugPrint('REPLACE => ${newRoute?.settings.name}');
  }
}

class ScreenRoutes {
  static final GoRouter router = GoRouter(
    initialLocation: AppRoutes.splash,
    observers: [
      MyObserver(),
    ],
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const AuthPage(isInitialSignUp: false),
      ),
      GoRoute(
        path: AppRoutes.signup,
        builder: (context, state) => const AuthPage(isInitialSignUp: true),
      ),
      GoRoute(
        path: AppRoutes.welcome,
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: AppRoutes.chatbot,
        builder: (context, state) {
          final question = state.uri.queryParameters['question'];
          return ChatbotScreen(initialQuestion: question);
        },
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: AppRoutes.childMode,
        builder: (context, state) => const ChildModeScreen(),
      ),
      GoRoute(
        path: AppRoutes.aboutApp,
        builder: (context, state) => const AboutAppPage(),
      ),
      GoRoute(
        path: AppRoutes.adminRatings,
        builder: (context, state) => const AdminRatingsScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminUsers,
        builder: (context, state) => const AdminUsersScreen(),
      ),
    ],
    errorBuilder: (context, state) => const Scaffold(
      body: Center(
        child: Text("No Route"),
      ),
    ),
  );
}


