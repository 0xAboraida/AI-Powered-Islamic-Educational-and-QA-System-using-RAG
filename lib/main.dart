import 'package:device_preview/device_preview.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/routes/app_routes.dart';
import 'core/routes/screen_routes.dart';
import 'core/theme/app_theme.dart';

import 'package:provider/provider.dart';
import 'core/theme/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('isDarkMode') ?? false;

  runApp(
    ChangeNotifierProvider(
      create: (context) => ThemeProvider(initialDarkMode: isDarkMode),
      child: const ZaadApp(),
    ),
  );
}


class ZaadApp extends StatelessWidget {
  const ZaadApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(360, 690),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return Consumer<ThemeProvider>(
          builder: (context, themeProvider, child) {
            return MaterialApp(
              
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
              initialRoute: AppRoutes.splash,
              onGenerateRoute: ScreenRoutes.onGenerateRoute,
            );
          },
        );
      },
    );
  }
}


