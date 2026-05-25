import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../../../core/utils/app_strings.dart';
import '../../../../core/routes/app_routes.dart';
import 'widgets/welcome_mode_card.dart';

import 'package:flutter_animate/flutter_animate.dart';

class WelcomePage extends StatefulWidget {
  const WelcomePage({super.key});

  @override
  State<WelcomePage> createState() => _WelcomePageState();
}

class _WelcomePageState extends State<WelcomePage> {
  int? _selectedIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7FF),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
          child: Column(
            children: [
              SizedBox(height: 20.h),
              Center(
                child: ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFFC54EEC)],
                  ).createShader(bounds),
                  child: Text(
                    AppStrings.chooseUsageStyle,
                    style: TextStyle(
                      fontSize: 27.sp,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              )
                  .animate()
                  .fade(duration: 600.ms)
                  .scale(begin: const Offset(0.9, 0.9))
                  .slideY(begin: -0.2, end: 0),
              SizedBox(height: 40.h),
              WelcomeModeCard(
                isSelected: _selectedIndex == 0,
                iconBackgroundColor: Colors.white,
                title: AppStrings.youngExplorer,
                subtitle: AppStrings.kidsMode,
                description: AppStrings.kidsDescription,
                iconAsset: AppAssets.starPng,
                onTap: () => setState(() => _selectedIndex = 0),
                backgroundGradient: _selectedIndex == 0
                    ? AppColors.selectedCardGradient
                    : AppColors.cardGradient,
                titleColor: Colors.black,
                subtitleColor: AppColors.primary,
                descriptionColor: Colors.black,
              )
                  .animate()
                  .fade(delay: 200.ms, duration: 600.ms)
                  .slideX(begin: 0.2, end: 0),
              SizedBox(height: 20.h),
              WelcomeModeCard(
                isSelected: _selectedIndex == 1,
                title: AppStrings.knowledgeSeeker,
                subtitle: AppStrings.advancedMode,
                description: AppStrings.advancedDescription,
                iconAsset: AppAssets.book,
                onTap: () => setState(() => _selectedIndex = 1),
                backgroundGradient: _selectedIndex == 1
                    ? AppColors.selectedSecondaryCardGradient
                    : AppColors.primaryGradient,
                titleColor: Colors.white,
                subtitleColor: Colors.grey,
                descriptionColor: Colors.white,
              )
                  .animate()
                  .fade(delay: 400.ms, duration: 600.ms)
                  .slideX(begin: -0.2, end: 0),
              SizedBox(height: 30.h),
              Container(
                width: double.infinity,
                height: 60.h,
                decoration: BoxDecoration(
                  color: _selectedIndex == null ? Colors.grey : null,
                  gradient:
                      _selectedIndex != null ? AppColors.primaryGradient : null,
                  borderRadius: BorderRadius.circular(16.r),
                ),
                child: InkWell(
                  onTap: () {
                    if (_selectedIndex != null) {
                      if (_selectedIndex == 0) {
                        Navigator.pushNamed(context, AppRoutes.childMode);
                      } else {
                        Navigator.pushNamed(context, AppRoutes.chatbot);
                      }
                    }
                  },
                  borderRadius: BorderRadius.circular(16.r),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        AppStrings.startJourney,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Icon(
                          size: 22.sp,
                          Icons.arrow_forward,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              )
                  .animate(delay: 600.ms)
                  .fade(duration: 600.ms)
                  .slideY(begin: 0.5, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}

