import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../../../core/utils/app_strings.dart';

class ChatInputField extends StatelessWidget {
  final VoidCallback onGridTap;
  final TextEditingController? controller;
  final VoidCallback? onSend;

  const ChatInputField({
    super.key,
    required this.onGridTap,
    this.controller,
    this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 30.h),
      child: Container(
        decoration: const BoxDecoration(
          boxShadow: [
            BoxShadow(
                color: Color(0xFFC54EEC),
                blurRadius: 20,
                spreadRadius: -15,
                offset: Offset(6, 0)),
            BoxShadow(
              color: Color(0xFF3B82F6),
              blurRadius: 20,
              spreadRadius: -15,
              offset: Offset(-6, 0),
            ),
          ],
        ),
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: TextField(
            controller: controller,
            onSubmitted: (_) => onSend?.call(),
            textAlign: TextAlign.right,
            style: TextStyle(
              color: isDark ? Colors.white : Colors.black87,
              fontSize: 15.sp,
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              hintText: AppStrings.writeQuestion,
              hintStyle: TextStyle(
                color:
                    isDark ? Colors.white.withOpacity(0.4) : Colors.grey[400],
                fontSize: 14.sp,
                fontWeight: FontWeight.w500,
              ),
              filled: true,
              fillColor: isDark ? AppColors.darkPrimary : Colors.white,
              isDense: true,
              contentPadding:
                  EdgeInsets.symmetric(horizontal: 17.w, vertical: 20.h),
              prefixIcon: Padding(
                padding: EdgeInsets.only(left: 12.w, right: 12.w),
                child: InkWell(
                  onTap: onSend,
                  child: Container(
                    width: 35.w,
                    height: 35.w,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.textGradient,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3B82F6).withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(10.w),
                      child: SvgPicture.asset(
                        AppAssets.send,
                        colorFilter: const ColorFilter.mode(
                            Colors.white, BlendMode.srcIn),
                      ),
                    ),
                  ),
                ),
              ),
              prefixIconConstraints: BoxConstraints(
                minWidth: 64.w,
                minHeight: 48.w,
              ),
              suffixIcon: Padding(
                padding: EdgeInsets.only(right: 12.w, left: 8.w),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: onGridTap,
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          SvgPicture.asset(
                            AppAssets.grid,
                            width: 20.w,
                            height: 20.w,
                            colorFilter: const ColorFilter.mode(
                                Color(0xFFBA68C8), BlendMode.srcIn),
                          ),
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              width: 6.w,
                              height: 6.w,
                              decoration: const BoxDecoration(
                                color: Color(0xFFBA68C8),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 16.w),
                    SvgPicture.asset(
                      AppAssets.mic,
                      width: 20.w,
                      height: 20.w,
                      colorFilter: const ColorFilter.mode(
                          Color(0xFFBA68C8), BlendMode.srcIn),
                    ),
                    SizedBox(width: 8.w),
                  ],
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30.r),
                borderSide: BorderSide(
                  color: isDark
                      ? const Color(0xFFC54EEC).withOpacity(0.2)
                      : const Color(0xFFC54EEC).withOpacity(0.4),
                  width: 2,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30.r),
                borderSide: BorderSide(
                  color: isDark ? AppColors.primary : AppColors.primary,
                  width: 2,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
