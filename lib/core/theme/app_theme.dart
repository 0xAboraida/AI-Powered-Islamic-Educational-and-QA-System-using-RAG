import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/app_colors/app_colors.dart';

class AppTheme {
  static ThemeData get themeData {
    return ThemeData(
      fontFamily: "Cairo",
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        secondary: AppColors.secondary,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: const Color(0xFFF7F7FF),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 16.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide(color: AppColors.primary, width: 1.2.w),
        ),
        hintStyle: TextStyle(
          color: AppColors.primary.withOpacity(0.55),
          fontSize: 14.sp,
        ),
        labelStyle: TextStyle(
          color: AppColors.primary.withOpacity(0.7),
          fontSize: 14.sp,
        ),
      ),
      textTheme: TextTheme(
        bodyMedium: TextStyle(fontSize: 14.sp, color: const Color(0xFF1C1B1F)),
        bodyLarge: TextStyle(fontSize: 16.sp, color: const Color(0xFF1C1B1F)),
        headlineMedium: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w700, color: const Color(0xFF1C1B1F)),
        headlineSmall: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600, color: const Color(0xFF1C1B1F)),
      ),
    );
  }

  static ThemeData get darkThemeData {
    return ThemeData(
      fontFamily: "Cairo",
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        secondary: AppColors.secondary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: AppColors.darkPrimary,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.fieldDarkColor,
        contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 16.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide(color: AppColors.primary, width: 1.2.w),
        ),
        hintStyle: TextStyle(
          color: Colors.white.withOpacity(0.5),
          fontSize: 14.sp,
        ),
        labelStyle: TextStyle(
          color: Colors.white.withOpacity(0.7),
          fontSize: 14.sp,
        ),
      ),
      textTheme: TextTheme(
        bodyMedium: TextStyle(fontSize: 14.sp, color: Colors.white),
        bodyLarge: TextStyle(fontSize: 16.sp, color: Colors.white),
        headlineMedium: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w700, color: Colors.white),
        headlineSmall: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600, color: Colors.white),
      ),
    );
  }

}
