import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad/core/api/secret_key.dart';
import 'package:zaad/core/di/injection.dart';
import 'package:zaad/core/services/shared_prefs_service.dart';

import 'core/routes/screen_routes.dart';
import 'core/theme/app_theme.dart';

import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/services/feedback_service.dart';
import 'core/services/users_service.dart';
import 'core/theme/theme_provider.dart';
import 'core/services/shared_prefs.dart';
import 'core/services/deep_link_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'
    hide ChangeNotifierProvider, Consumer;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  DeepLinkService.init();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  await Supabase.initialize(
    url: SecretKey.subapaseUrl,
    publishableKey: SecretKey.publishKey,
  );
  await SharedPrefs.init();
  await FeedbackService.init();
  await UsersService.init();
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('isDarkMode') ?? false;
  final savedToken = await SharedPrefsService.getToken();

  // Local server IP configuration removed since we now use the remote backend.

  await configureDependencies();

  runApp(
    ProviderScope(
      child: ChangeNotifierProvider(
        create: (context) => ThemeProvider(initialDarkMode: isDarkMode),
        child: ZaadApp(
          isTokenSaved: savedToken != null,
        ),
      ),
    ),
  );
}

class ZaadApp extends StatelessWidget {
  const ZaadApp({super.key, required this.isTokenSaved});
  final bool isTokenSaved;

  @override
  Widget build(BuildContext context) {
    print("isTokenSaved: $isTokenSaved");
    return ScreenUtilInit(
      designSize: const Size(360, 690),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return Consumer<ThemeProvider>(
          builder: (context, themeProvider, child) {
            return MaterialApp.router(
              routerConfig: ScreenRoutes.router,
              locale: const Locale("ar"),
              supportedLocales: const [Locale("ar")],
              localizationsDelegates: const [
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              debugShowCheckedModeBanner: false,
              title: 'Zaad',
              theme: AppTheme.themeData,
              darkTheme: AppTheme.darkThemeData,
              themeMode:
                  themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
              themeAnimationDuration: const Duration(milliseconds: 300),
              themeAnimationCurve: Curves.easeInOut,
            );
          },
        );
      },
    );
  }
}
