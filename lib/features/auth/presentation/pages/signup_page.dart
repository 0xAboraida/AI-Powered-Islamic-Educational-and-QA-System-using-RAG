import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_strings.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../widgets/auth_social_buttons.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_button.dart';
import '../widgets/auth_checkbox.dart';
import '../widgets/auth_divider.dart';
import '../widgets/auth_footer_link.dart';

class SignupBody extends StatefulWidget {
  final VoidCallback onToggle;
  const SignupBody({super.key, required this.onToggle});

  @override
  State<SignupBody> createState() => _SignupBodyState();
}

class _SignupBodyState extends State<SignupBody> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isTermsAccepted = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _submit() {}

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          AuthTextField(
            controller: _nameController,
            label: AppStrings.nameLabel,
            iconAsset: AppAssets.user,
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: 13.8.h),
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
          AuthTextField(
            controller: _confirmPasswordController,
            label: AppStrings.confirmPasswordLabel,
            iconAsset: AppAssets.password,
            keyboardType: TextInputType.visiblePassword,
            obscureText: _obscureConfirmPassword,
            suffix: IconButton(
              onPressed: () => setState(
                  () => _obscureConfirmPassword = !_obscureConfirmPassword),
              icon: Icon(
                _obscureConfirmPassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.primary,
                size: 22.sp,
              ),
            ),
          ),
          SizedBox(height: 13.8.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              RichText(
                textAlign: TextAlign.right,
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'أوافق على ',
                      style: TextStyle(
                        color: const Color(0xFF1C1B1F),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    TextSpan(
                      text: 'الشروط والأحكام',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8.w),
              AuthCheckbox(
                value: _isTermsAccepted,
                onChanged: (v) => setState(() => _isTermsAccepted = v ?? false),
              ),
            ],
          ),
          SizedBox(height: 17.h),
          AuthButton(label: AppStrings.signUpButton, onPressed: _submit),
          SizedBox(height: 15.h),
          const AuthDivider(),
          SizedBox(height: 10.h),
          const AuthSocialButtons(
            leftIconAsset: AppAssets.apple,
            rightIconAsset: AppAssets.google,
          ),
          SizedBox(height: 21.h),
          AuthFooterLink(
            label: AppStrings.alreadyHaveAccountText,
            linkText: AppStrings.loginLink,
            onToggle: widget.onToggle,
          ),
          SizedBox(
            height: 20.h,
          )
        ],
      ),
    );
  }
}
