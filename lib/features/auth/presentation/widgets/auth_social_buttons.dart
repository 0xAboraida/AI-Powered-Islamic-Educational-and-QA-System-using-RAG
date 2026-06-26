import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AuthSocialButtons extends StatelessWidget {
  final String leftIconAsset;
  final String rightIconAsset;
  final VoidCallback? onLeftPressed;
  final VoidCallback? onRightPressed;

  const AuthSocialButtons({
    super.key,
    required this.leftIconAsset,
    required this.rightIconAsset,
    this.onLeftPressed,
    this.onRightPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: _SocialIconButton(
            iconAsset: rightIconAsset,
            onPressed: onRightPressed,
            label: 'Google',
          ),
        ),
        SizedBox(width: 14.w),
        Expanded(
          child: _SocialIconButton(
            iconAsset: leftIconAsset,
            onPressed: onLeftPressed,
            label: 'Apple',
          ),
        ),
      ],
    );
  }
}

class _SocialIconButton extends StatelessWidget {
  final String iconAsset;
  final VoidCallback? onPressed;
  final String label;

  const _SocialIconButton({
    required this.iconAsset,
    required this.onPressed,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 45.h,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: BorderSide(
            color: Colors.grey.withOpacity(0.2),
            width: 1.w,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          padding: EdgeInsets.symmetric(horizontal: 8.w),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                color: const Color(0xFF1C1B1F),
                fontSize: 14.sp,
                fontWeight: FontWeight.w600,
                fontFamily: 'Cairo',
              ),
            ),
            SizedBox(width: 8.w),
            SvgPicture.asset(
              iconAsset,
              width: 20.sp,
              height: 20.sp,
            ),
          ],
        ),
      ),
    );
  }
}
