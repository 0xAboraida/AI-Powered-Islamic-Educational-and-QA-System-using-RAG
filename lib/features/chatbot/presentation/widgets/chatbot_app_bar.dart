import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_strings.dart';
import '../../../../core/routes/app_routes.dart';

class ChatbotAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ChatbotAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      scrolledUnderElevation: 0,
      leadingWidth: 70.w,
      leading: IconButton(
        onPressed: () => Scaffold.of(context).openDrawer(),
        style: ButtonStyle(
          overlayColor: WidgetStateProperty.all(Colors.transparent),
          shadowColor: WidgetStateProperty.all(Colors.transparent),
          surfaceTintColor: WidgetStateProperty.all(Colors.transparent),
        ),
        icon: SvgPicture.asset(
          AppAssets.bar,
          width: 24.w,
          height: 24.w,
          fit: BoxFit.contain,
        ),
      ),
      centerTitle: true,
      title: ShaderMask(
        shaderCallback: (bounds) => AppColors.textGradient.createShader(bounds),
        child: Text(
          AppStrings.splashTitle,
          style: TextStyle(
            fontSize: 22.sp,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
      actions: [
        Padding(
          padding: EdgeInsets.only(right: 16.w),
          child: GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, AppRoutes.profile);
            },
            child: Container(
              width: 40.w,
              height: 40.w,
              margin: EdgeInsets.all(8.w),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.textGradient,
              ),
              child: Padding(
                padding: EdgeInsets.all(5.0.sp),
                child: SvgPicture.asset(
                  AppAssets.user,
                  fit: BoxFit.contain,
                  colorFilter:
                      const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                ),
              ),
            ),
          ),
        ),
        SizedBox(width: 8.w),
      ],
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}
