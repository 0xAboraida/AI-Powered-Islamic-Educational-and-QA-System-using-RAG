import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad/core/di/injection.dart';
import 'package:zaad/core/services/shared_prefs_service.dart';

import 'core/routes/app_routes.dart';
import 'core/routes/screen_routes.dart';
import 'core/theme/app_theme.dart';

import 'package:provider/provider.dart';
import 'core/theme/theme_provider.dart';
import 'core/services/shared_prefs.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharedPrefs.init();
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('isDarkMode') ?? false;
 final savedToken=await SharedPrefsService.getToken();
  
  await configureDependencies();
  
  runApp(
    ChangeNotifierProvider(
      create: (context) => ThemeProvider(initialDarkMode: isDarkMode),
      child: ZaadApp(
        isTokenSaved: savedToken != null,
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
            return MaterialApp(
              navigatorObservers: [
                MyObserver(),
              ],
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
              initialRoute: isTokenSaved ? AppRoutes.chatbot : AppRoutes.splash,
              onGenerateInitialRoutes: (String initialRoute) {
                return [
                  ScreenRoutes.onGenerateRoute(
                    RouteSettings(name: initialRoute),
                  ),
                ];
              },
              onGenerateRoute: ScreenRoutes.onGenerateRoute,
              themeAnimationDuration: const Duration(milliseconds: 300),
              themeAnimationCurve: Curves.easeInOut,
            );
          },
        );
      },
    );
  }
}
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