import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:zaad/core/utils/app_assets.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import 'package:zaad/core/utils/app_strings.dart';

class ChatbotDrawer extends StatelessWidget {
  const ChatbotDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final Map<String, List<String>> chatHistory = {
      AppStrings.now: ['محادثة جديدة', 'محادثة جديدة'],
      AppStrings.today: [
        'حكم ترك الصلاة تكسلاً',
        'صحة حديث إنما الأعمال بالنيات'
      ],
      AppStrings.yesterday: [
        'الفرق بين الفرض والواجب',
        'التصريف اللغوي لكلمة كتب'
      ],
      AppStrings.twoDaysAgo: ['سيرة عبد الملك بن مروان', 'تفسير سورة الفاتحة'],
    };

    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Drawer(
      width: 300.w,
      backgroundColor: isDark ? AppColors.darkPrimary : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(30),
          bottomLeft: Radius.circular(30),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildHeader(context),
              SizedBox(height: 15.h),
              _buildSearchBar(context),
              SizedBox(height: 15.h),
              _buildNewChatButton(context),
              SizedBox(height: 25.h),
              _buildConversationsTitle(context),
              SizedBox(height: 10.h),
              Expanded(
                child: ListView.builder(
                  itemCount: chatHistory.keys.length,
                  itemBuilder: (context, sectionIndex) {
                    String sectionTitle =
                        chatHistory.keys.elementAt(sectionIndex);
                    List<String> items = chatHistory[sectionTitle]!;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.h),
                          child: Text(
                            sectionTitle,
                            style: TextStyle(
                              fontSize: 13.sp,
                              color: Colors.grey[400],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        ...items.map((item) => _buildChatItem(item, context)),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 45.w,
              height: 45.w,
              padding: EdgeInsets.all(2.w),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.textGradient,
              ),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF0E0F14) : Colors.white,
                ),
                child: Padding(
                  padding: EdgeInsets.all(8.w),
                  child: SvgPicture.asset(
                    AppAssets.user,
                    colorFilter: ColorFilter.mode(
                        isDark ? Colors.white : AppColors.primary,
                        BlendMode.srcIn),
                  ),
                ),
              ),
            ),
            SizedBox(width: 10.w),
            ShaderMask(
              shaderCallback: (bounds) =>
                  AppColors.textGradient.createShader(bounds),
              child: Text(
                AppStrings.splashTitle,
                style: TextStyle(
                  fontSize: 24.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Icon(Icons.close,
              color: isDark ? Colors.white : AppColors.primary, size: 28.sp),
        ),
      ],
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: 45.h,
      decoration: BoxDecoration(
        color:
            isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFFBF7FF),
        borderRadius: BorderRadius.circular(15.r),
        border: Border.all(
            color: isDark
                ? Colors.white.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.1)),
      ),
      child: TextField(
        textAlign: TextAlign.right,
        style: TextStyle(color: isDark ? Colors.white : Colors.black87),
        decoration: InputDecoration(
          hintText: AppStrings.searchChats,
          hintStyle: TextStyle(
            color: isDark ? Colors.white38 : Colors.grey[400],
            fontSize: 13.sp,
          ),
          border: InputBorder.none,
          prefixIcon: Icon(Icons.search,
              color: isDark ? Colors.white38 : AppColors.primary, size: 20.sp),
          contentPadding:
              EdgeInsets.symmetric(vertical: 10.h, horizontal: 15.w),
        ),
      ),
    );
  }

  Widget _buildNewChatButton(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 50.h,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(15.r),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, color: Colors.white, size: 20.sp),
            SizedBox(width: 8.w),
            Text(
              AppStrings.newChat,
              style: TextStyle(
                color: Colors.white,
                fontSize: 15.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationsTitle(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Align(
      alignment: Alignment.centerRight,
      child: Text(
        AppStrings.conversations,
        style: TextStyle(
          fontSize: 16.sp,
          fontWeight: FontWeight.w800,
          color: isDark ? Colors.white70 : AppColors.primary,
        ),
      ),
    );
  }

  Widget _buildChatItem(String title, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: EdgeInsets.only(bottom: 14.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.darkSecondary.withOpacity(0.4)
                  : AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: SvgPicture.asset(
              AppAssets.message,
              width: 18.w,
              height: 18.w,
              colorFilter: ColorFilter.mode(
                  isDark ? AppColors.darkSecondary : AppColors.primary,
                  BlendMode.srcIn),
            ),
          ),
          SizedBox(width: 12.w),
          Text(
            title,
            style: TextStyle(
              fontSize: 14.sp,
              color: isDark ? Colors.white70 : Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.right,
          ),
        ],
      ),
    );
  }
}
