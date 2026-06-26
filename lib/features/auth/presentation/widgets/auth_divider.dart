import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class AuthDivider extends StatelessWidget {
  const AuthDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: Colors.grey.withOpacity(0.2),
            thickness: 1.h,
          ),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10.w),
          child: Text(
            'أو الاستمرار بواسطة',
            style: TextStyle(
              color: const Color(0xFF1C1B1F).withOpacity(0.35),
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              fontFamily: 'Cairo',
            ),
          ),
        ),
        Expanded(
          child: Divider(
            color: Colors.grey.withOpacity(0.2),
            thickness: 1.h,
          ),
        ),
      ],
    );
  }
}
