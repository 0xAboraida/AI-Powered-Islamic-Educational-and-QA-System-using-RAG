import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:zaad/core/services/shared_prefs_service.dart';
import 'package:zaad/core/utils/app_strings.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/utils/app_assets.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:flutter_animate/flutter_animate.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  late String? token;
  @override
  void initState() {
    super.initState();
    _goNext();
    getToken();
  }

  getToken() async {
    token= await SharedPrefsService.getToken()??"";
  }

  void _goNext() {
    Future<void>.delayed(const Duration(seconds: 7)).then((_) {
      if (!mounted) return;
      if(token?.isNotEmpty==true && token !=null){
        Navigator.pushReplacementNamed(context, AppRoutes.chatbot);
      }
      else{
        Navigator.pushReplacementNamed(context, AppRoutes.login);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        clipBehavior: Clip.none,
        fit: StackFit.expand,
        children: [
          SvgPicture.asset(
            AppAssets.splashBg,
            width: double.infinity,
            height: double.infinity,
            fit: BoxFit.fill,
          ),
          Positioned(
            right: 0,
            left: 0,
            child: Column(
              children: [
                SizedBox(
                  height: 69.h,
                ),
                SvgPicture.asset(
                  AppAssets.zaadLogo,
                  height: 220.h,
                  width: 220.w,
                  fit: BoxFit.contain,
                )
                    .animate()
                    .fade(duration: 700.ms)
                    .scale(
                      begin: const Offset(0.7, 0.7),
                      end: const Offset(1, 1),
                      curve: Curves.easeOutBack,
                    )
                    .slideY(begin: 0.2, end: 0, curve: Curves.easeOut),
                SizedBox(
                  height: 15.h,
                ),
                Text(
                  AppStrings.splashWelcome,
                  style: TextStyle(
                    fontSize: 28.sp,
                    fontWeight: FontWeight.w400,
                    color: Colors.white,
                    letterSpacing: 1.2,
                  ),
                )
                    .animate(delay: 600.ms)
                    .fade(duration: 700.ms)
                    .slideY(begin: 0.3, end: 0, curve: Curves.easeOut),
              ],
            ),
          ),
          Positioned(
            right: 0,
            left: 0,
            bottom: 0,
            child: SvgPicture.asset(
              AppAssets.mosque,
              height: 200.h,
              width: double.infinity,
              fit: BoxFit.cover,
            ).animate().slideY(
                begin: 0.5,
                end: 0,
                curve: Curves.easeOut,
                duration: 700.milliseconds),
          ),
        ],
      ),
    );
  }
}
