import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/svg.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_strings.dart';
import '../widgets/auth_toggle_tab.dart';
import 'login_page.dart';
import 'signup_page.dart';

class AuthPage extends StatefulWidget {
  final bool isInitialSignUp;
  const AuthPage({super.key, this.isInitialSignUp = false});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  late bool isSignUp;

  @override
  void initState() {
    super.initState();
    isSignUp = widget.isInitialSignUp;
  }

  void _toggle() {
    setState(() => isSignUp = !isSignUp);
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            SvgPicture.asset(
              AppAssets.topBackground,
              fit: BoxFit.fill,
              width: double.infinity,
              height: double.infinity,
            ),
            Positioned(
              left: 0,
              right: 0,
              top: 27.6.h,
              child: Column(
                children: [
                  SvgPicture.asset(
                    AppAssets.zaadLogo,
                    height: 135.h,
                    width: 135.w,
                    fit: BoxFit.fitWidth,
                  )
                      .animate()
                      .fade(duration: 600.ms)
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1, 1),
                        curve: Curves.easeOutBack,
                      )
                      .slideY(begin: 0.2, end: 0, curve: Curves.easeOut),
                  Text(
                    isSignUp
                        ? AppStrings.fillInformation
                        : AppStrings.createAccountToReachApp,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                      fontSize: 14.sp,
                      fontFamily: 'Cairo',
                    ),
                  )
                      .animate(delay: 400.ms)
                      .fade(duration: 600.ms)
                      .slideY(begin: 0.3, end: 0, curve: Curves.easeOut),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: EdgeInsets.only(
                    top: MediaQuery.of(context).viewInsets.bottom > 0
                        ? 70.h
                        : 193.h),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: EdgeInsets.only(
                        left: 20.w,
                        right: 20.w,
                        top: 10.h,
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: EdgeInsets.all(4.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF7F7F7),
                              borderRadius: BorderRadius.circular(16.r),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: InkWell(
                                    onTap: () =>
                                        setState(() => isSignUp = false),
                                    borderRadius: BorderRadius.circular(12.r),
                                    child: AuthToggleTab(
                                      label: AppStrings.loginHeader,
                                      isActive: !isSignUp,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: InkWell(
                                    onTap: () =>
                                        setState(() => isSignUp = true),
                                    borderRadius: BorderRadius.circular(12.r),
                                    child: AuthToggleTab(
                                      label: AppStrings.signUpLink,
                                      isActive: isSignUp,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              transitionBuilder: (child, animation) =>
                                  FadeTransition(
                                opacity: animation,
                                child: child,
                              ),
                              child: isSignUp
                                  ? SignupBody(
                                      key: const ValueKey('signup'),
                                      onToggle: _toggle,
                                    )
                                  : Align(
                                      alignment: Alignment.topCenter,
                                      child: LoginBody(
                                        key: const ValueKey('login'),
                                        onToggle: _toggle,
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                      .animate(delay: 600.ms)
                      .fade(duration: 700.ms)
                      .slideY(begin: 0.1, end: 0, curve: Curves.easeOut),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
