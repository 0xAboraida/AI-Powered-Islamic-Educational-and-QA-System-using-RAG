import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../../core/utils/app_colors/app_colors.dart';

class AuthTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String iconAsset;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? suffix;
  final String? Function(String?)? validator;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.iconAsset,
    required this.keyboardType,
    this.obscureText = false,
    this.suffix,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          label,
          style: TextStyle(
            color: const Color(0xFF1C1B1F),
            fontWeight: FontWeight.w700,
            fontSize: 14.sp,
          ),
        ),
        SizedBox(height: 5.h),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          textAlign: TextAlign.right,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: validator,
          style: TextStyle(
            color: const Color(0xFF1C1B1F),
            fontSize: 14.sp,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: 'ادخل $label',
            hintStyle: TextStyle(
              color: const Color(0xFF1C1B1F).withOpacity(0.35),
              fontSize: 13.sp,
              fontWeight: FontWeight.w400,
            ),
            prefixIcon: suffix,
            suffixIcon: Padding(
              padding: EdgeInsets.all(14.sp),
              child: SvgPicture.asset(
                iconAsset,
                width: 20.w,
                height: 20.h,
                colorFilter: const ColorFilter.mode(
                  AppColors.primary,
                  BlendMode.srcIn,
                ),
              ),
            ),
            isDense: true,
            contentPadding: EdgeInsets.symmetric(
              horizontal: 12.w,
              vertical: 12.h,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(
                color: Colors.grey.withOpacity(0.2),
                width: 1.w,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(
                color: AppColors.primary,
                width: 1.w,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            errorStyle: TextStyle(fontSize: 11.sp, fontFamily: 'Cairo'),
          ),
        ),
      ],
    );
  }
}
