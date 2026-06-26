import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../../../core/utils/app_strings.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/di/injection.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import '../widgets/auth_button.dart';
import '../widgets/auth_checkbox.dart';
import '../widgets/auth_divider.dart';
import '../widgets/auth_footer_link.dart';
import '../widgets/auth_text_field.dart';

class SignupBody extends StatefulWidget {
  final VoidCallback onToggle;
  const SignupBody({super.key, required this.onToggle});

  @override
  State<SignupBody> createState() => _SignupBodyState();
}

class _SignupBodyState extends State<SignupBody> {
  final _formKey = GlobalKey<FormState>();
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

  void _submit(AuthCubit cubit) {
    if (!_formKey.currentState!.validate()) return;
    if (!_isTermsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'يجب الموافقة على الشروط والأحكام',
            textAlign: TextAlign.right,
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: Colors.orange.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10.r),
          ),
        ),
      );

      return;
    }
    cubit.register(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      confirmPassword: _confirmPasswordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<AuthCubit>(),
      child: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text(
                  'تم إنشاء الحساب بنجاح',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontFamily: 'Cairo'),
                ),
                backgroundColor: Colors.green.shade600,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.r),
                ),
              ),
            );
            widget.onToggle();

            // Navigator.pushReplacementNamed(context, AppRoutes.chatbot);
          } else if (state is AuthFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                backgroundColor: Colors.red.shade600,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10.r),
                ),
              ),
            );
          }
        },
        builder: (context, state) {
          final cubit = context.read<AuthCubit>();
          final isLoading = state is AuthLoading;

          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AuthTextField(
                    controller: _nameController,
                    label: AppStrings.nameLabel,
                    iconAsset: AppAssets.user,
                    keyboardType: TextInputType.name,
                    validator: Validators.name,
                  ),
                  SizedBox(height: 13.8.h),
                  AuthTextField(
                    controller: _emailController,
                    label: AppStrings.emailLabel,
                    iconAsset: AppAssets.email,
                    keyboardType: TextInputType.emailAddress,
                    validator: Validators.email,
                  ),
                  SizedBox(height: 13.8.h),
                  AuthTextField(
                    controller: _passwordController,
                    label: AppStrings.passwordLabel,
                    iconAsset: AppAssets.password,
                    keyboardType: TextInputType.visiblePassword,
                    obscureText: _obscurePassword,
                    validator: Validators.password,
                    suffix: IconButton(
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                      icon: Icon(
                        !_obscurePassword
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
                    validator: (v) => Validators.confirmPassword(
                      v,
                      _passwordController.text,
                    ),
                    suffix: IconButton(
                      onPressed: () => setState(
                        () =>
                            _obscureConfirmPassword = !_obscureConfirmPassword,
                      ),
                      icon: Icon(
                        !_obscureConfirmPassword
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
                        onChanged: (v) =>
                            setState(() => _isTermsAccepted = v ?? false),
                      ),
                    ],
                  ),
                  SizedBox(height: 17.h),
                  AuthButton(
                    label: AppStrings.signUpButton,
                    onPressed: () => _submit(cubit),
                    isLoading: isLoading,
                  ),
                  SizedBox(height: 15.h),
                  const AuthDivider(),
                  SizedBox(height: 21.h),
                  AuthFooterLink(
                    label: AppStrings.alreadyHaveAccountText,
                    linkText: AppStrings.loginLink,
                    onToggle: widget.onToggle,
                  ),
                  SizedBox(height: 20.h),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
