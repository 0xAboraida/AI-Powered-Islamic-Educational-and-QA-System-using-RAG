import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../../core/utils/app_colors/app_colors.dart';

class AuthFooterLink extends StatelessWidget {
  final String label;
  final String linkText;
  final VoidCallback onToggle;

  const AuthFooterLink({
    super.key,
    required this.label,
    required this.linkText,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextButton(
            onPressed: onToggle,
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              linkText,
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 14.sp,
                fontFamily: 'Cairo',
              ),
            ),
          ),
          SizedBox(width: 4.w),
          Text(
            label,
            style: TextStyle(
              color: const Color(0xFF1C1B1F),
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
