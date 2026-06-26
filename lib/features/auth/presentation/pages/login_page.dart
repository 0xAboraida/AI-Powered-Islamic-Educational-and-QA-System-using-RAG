import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/core/routes/app_routes.dart';
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

class LoginBody extends StatefulWidget {
  final VoidCallback onToggle;
  const LoginBody({super.key, required this.onToggle});

  @override
  State<LoginBody> createState() => _LoginBodyState();
}

class _LoginBodyState extends State<LoginBody> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isChecked = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit(AuthCubit cubit) {
    if (!_formKey.currentState!.validate()) return;
    cubit.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
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
                  'تم تسجيل الدخول بنجاح',
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
            Future.delayed(const Duration(seconds: 2), () {
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.chatbot,
                (route) => false,
              );
            });
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
              child: Padding(
                padding: EdgeInsets.only(top: 20.h),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  // mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
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
                        onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword),
                        icon: Icon(
                          !_obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          color: AppColors.primary,
                          size: 22.sp,
                        ),
                      ),
                    ),
                    // SizedBox(height: 13.8.h),
                    // Row(
                    //   mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    //   children: [
                    //     TextButton(
                    //       onPressed: () {},
                    //       style: TextButton.styleFrom(
                    //         padding: EdgeInsets.zero,
                    //         minimumSize: Size.zero,
                    //         tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    //       ),
                    //       child: Text(
                    //         AppStrings.forgotPassword,
                    //         style: TextStyle(
                    //           color: AppColors.primary,
                    //           fontSize: 12.sp,
                    //           fontWeight: FontWeight.w600,
                    //           fontFamily: 'Cairo',
                    //         ),
                    //       ),
                    //     ),
                    //     Row(
                    //       children: [
                    //         Text(
                    //           AppStrings.rememberMe,
                    //           style: TextStyle(
                    //             color: const Color(0xFF1C1B1F),
                    //             fontSize: 12.sp,
                    //             fontWeight: FontWeight.w500,
                    //             fontFamily: 'Cairo',
                    //           ),
                    //         ),
                    //         SizedBox(width: 4.w),
                    //         AuthCheckbox(
                    //           value: _isChecked,
                    //           onChanged: (v) =>
                    //               setState(() => _isChecked = v ?? false),
                    //         ),
                    //       ],
                    //     ),
                    //   ],
                    // ),
                    SizedBox(height: 17.h),
                    AuthButton(
                      label: AppStrings.loginButton,
                      onPressed: () => _submit(cubit),
                      isLoading: isLoading,
                    ),
                    SizedBox(height: 15.h),
                    const AuthDivider(),
                    SizedBox(height: 21.h),
                    AuthFooterLink(
                      label: AppStrings.noAccountText,
                      linkText: AppStrings.signUpLink,
                      onToggle: widget.onToggle,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
