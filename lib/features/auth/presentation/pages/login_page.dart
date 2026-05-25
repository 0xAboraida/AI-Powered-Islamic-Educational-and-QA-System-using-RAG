import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/core/routes/app_routes.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_strings.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../widgets/auth_social_buttons.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_button.dart';
import '../widgets/auth_checkbox.dart';
import '../widgets/auth_divider.dart';
import '../widgets/auth_footer_link.dart';

class LoginBody extends StatefulWidget {
  final VoidCallback onToggle;
  const LoginBody({super.key, required this.onToggle});

  @override
  State<LoginBody> createState() => _LoginBodyState();
}

class _LoginBodyState extends State<LoginBody> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool isChecked = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    Navigator.pushNamed(context, AppRoutes.welcome);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          AuthTextField(
            controller: _emailController,
            label: AppStrings.emailLabel,
            iconAsset: AppAssets.email,
            keyboardType: TextInputType.emailAddress,
          ),
          SizedBox(height: 13.8.h),
          AuthTextField(
            controller: _passwordController,
            label: AppStrings.passwordLabel,
            iconAsset: AppAssets.password,
            keyboardType: TextInputType.visiblePassword,
            obscureText: _obscurePassword,
            suffix: IconButton(
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.primary,
                size: 22.sp,
              ),
            ),
          ),
          SizedBox(height: 13.8.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  AppStrings.forgotPassword,
                  style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600),
                ),
              ),
              Row(
                children: [
                  Text(
                    AppStrings.rememberMe,
                    style: TextStyle(
                        color: const Color(0xFF1C1B1F),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500),
                  ),
                  SizedBox(width: 4.w),
                  AuthCheckbox(
                      value: isChecked,
                      onChanged: (value) {
                        setState(() {
                          isChecked = value!;
                        });
                      }),
                ],
              ),
            ],
          ),
          SizedBox(height: 17.h),
          AuthButton(label: AppStrings.loginButton, onPressed: _submit),
          SizedBox(height: 15.h),
          const AuthDivider(),
          SizedBox(height: 10.h),
          const AuthSocialButtons(
            leftIconAsset: AppAssets.apple,
            rightIconAsset: AppAssets.google,
          ),
          SizedBox(height: 21.h),
          AuthFooterLink(
            label: AppStrings.noAccountText,
            linkText: AppStrings.signUpLink,
            onToggle: widget.onToggle,
          ),
        ],
      ),
    );
  }
}
