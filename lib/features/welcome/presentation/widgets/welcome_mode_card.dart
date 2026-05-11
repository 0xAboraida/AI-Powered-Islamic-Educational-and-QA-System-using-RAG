import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

class WelcomeModeCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String description;
  final String iconAsset;
  final VoidCallback onTap;
  final LinearGradient? backgroundGradient;
  final Color? iconBackgroundColor;
  final Color titleColor;
  final Color subtitleColor;
  final Color descriptionColor;

  final bool isSelected;

  const WelcomeModeCard({
    super.key,
    required this.isSelected,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.iconAsset,
    required this.onTap,
    required this.titleColor,
    required this.subtitleColor,
    required this.descriptionColor,
    this.backgroundGradient,
    this.iconBackgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: onTap,
        child: AnimatedScale(
          scale: isSelected ? 1.05 : 1.0,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            width: 340.w,
            height: 210.h,
            padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 15.h),
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isSelected ? 0.25 : 0.15),
                  blurRadius: isSelected ? 12 : 4,
                  spreadRadius: -2,
                ),
              ],
              gradient: backgroundGradient,
              borderRadius: BorderRadius.circular(28.r),
              border: isSelected
                  ? Border.all(
                      
                    )
                  : null,
            ),
            child: Column(
              children: [
                Container(
                  padding: EdgeInsets.all(16.w),
                  decoration: BoxDecoration(
                    color: iconBackgroundColor ?? Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                    boxShadow: iconBackgroundColor != null
                        ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10.r,
                              offset: Offset(0, 4.h),
                            )
                          ]
                        : null,
                  ),
                  child: iconAsset.endsWith('.png')
                      ? Image.asset(
                          iconAsset,
                          height: 32.h,
                        )
                      : SvgPicture.asset(
                          iconAsset,
                          height: 32.h,
                          colorFilter: backgroundGradient != null
                              ? const ColorFilter.mode(
                                  Colors.white, BlendMode.srcIn)
                              : null,
                        ),
                ),
                SizedBox(height: 16.sp),
                Text(
                  title,
                  style: TextStyle(
                    color: titleColor,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 4.sp),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: subtitleColor,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8.sp),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: descriptionColor,
                    fontSize: 12.sp,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ));
  }
}
