import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/theme_provider.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkPrimary : Colors.white,
      body: SingleChildScrollView(
        child: Stack(
          children: [
            // Background Image
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Image.asset(
                AppAssets.topBg,
                fit: BoxFit.cover,
                height: 400.h,
              ),
            ),

            SafeArea(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: Column(
                  children: [
                    SizedBox(height: 20.h),
                    // Avatar and Info
                    _buildUserInfo(),
                    SizedBox(height: 20.h),
                    // Stats Row
                    _buildStatsRow(context),
                    SizedBox(height: 30.h),
                    // Sections
                    _buildAccountSection(context),
                    SizedBox(height: 20.h),
                    _buildPreferencesSection(context),
                    SizedBox(height: 20.h),
                    _buildSupportSection(context),
                    SizedBox(height: 30.h),
                    // Logout Footer
                    _buildLogoutSection(context),
                    SizedBox(height: 40.h),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserInfo() {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 100.w,
              height: 100.w,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.textGradient,
              ),
              child: Center(
                child: Icon(
                  Icons.person,
                  size: 60.w,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ),
            Positioned(
              bottom: 5.h,
              left: 5.w,
              child: Container(
                width: 18.w,
                height: 18.w,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.w),
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 15.h),
        Text(
          'محمد قنديل',
          style: TextStyle(
            fontSize: 22.sp,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        SizedBox(height: 5.h),
        Text(
          'mohamedqandill912@gmail.com',
          style: TextStyle(
            fontSize: 14.sp,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        SizedBox(height: 10.h),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20.r),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.star, color: Colors.amber, size: 16.sp),
              SizedBox(width: 8.w),
              Text(
                'طالب العلم - المستوى المتقدم',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        Expanded(
          child: _buildStatCard(
              value: '١٣٤',
              label: 'سؤال',
              iconPath: AppAssets.comment,
              context: context),
        ),
        Expanded(
            child: _buildStatCard(
                value: '٦',
                label: 'مجال',
                iconPath: AppAssets.book,
                context: context)),
        Expanded(
          child: _buildStatCard(
              value: '٤٥',
              label: 'يوم متتالي',
              iconPath: AppAssets.calendar,
              context: context),
        ),
        Expanded(
            child: _buildStatCard(
                value: '٨٩٠',
                label: 'نقطة',
                iconPath: AppAssets.point,
                context: context)),
      ],
    );
  }

  Widget _buildStatCard(
      {required String value,
      required String label,
      required String iconPath,
      
      required BuildContext context}) {
         bool isDark= Theme.of(context).brightness==Brightness.dark;
    return Container(
      width: 90.w,
      padding: EdgeInsets.symmetric(vertical: 12.h),
      margin: EdgeInsets.symmetric(horizontal: 5.w),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.fieldDarkColor
            : Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(16.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          SvgPicture.asset(
            iconPath,
            width: 24.w,
            height: 24.w,
            colorFilter:
                const ColorFilter.mode(AppColors.primary, BlendMode.srcIn),
          ),
          SizedBox(height: 8.h),
          Text(
            value,
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? Colors.white
                  : Colors.black87,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12.sp,
              color: const Color(0xFF6A1B9A),
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, BuildContext context) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h, right: 8.w),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
            color: isDark
                ? Colors.white.withOpacity(0.6)
                : Colors.grey.shade100,
          ),
        ),
      ),
    );
  }

  Widget _buildAccountSection(BuildContext context) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _buildSectionHeader('الحساب', context),
        Container(
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.fieldDarkColor
                : Colors.white,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.1)
                    : Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 1,
              ),
            ],
          ),
          child: Column(
            children: [
              _buildListTile(
                context: context,
                title: 'تعديل الملف الشخصي',
                iconPath: AppAssets.user,
              ),
              _buildDivider(),
              _buildListTile(
                context: context,
                title: 'تغيير كلمة المرور',
                iconPath: AppAssets.password,
              ),
              _buildDivider(),
              _buildListTile(
                context: context,
                title: 'البريد الإلكتروني',
                iconPath: AppAssets.email,
                trailingWidget: Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: const Color(0xFFA855F7),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    'مفعل',
                    style: TextStyle(color: Colors.white, fontSize: 12.sp),
                  ),
                ),
              ),
              _buildDivider(),
              _buildListTile(
                context: context,
                title: 'الخصوصية والأمان',
                iconPath: AppAssets.privacy,
                showArrow: false,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPreferencesSection(BuildContext context) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _buildSectionHeader('التفضيلات', context),
        Container(
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.fieldDarkColor
                : Colors.white,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.1)
                    : Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 1,
              ),
            ],
          ),
          child: Column(
            children: [
              _buildListTile(
                context: context,
                title: 'الإشعارات',
                iconPath: AppAssets.notification,
                trailingWidget: Transform.scale(
                  scale: 0.8,
                  child: Switch(
                    value: true,
                    onChanged: (val) {},
                    activeColor: Colors.white,
                    activeTrackColor: const Color(0xFFA855F7),
                  ),
                ),
                showArrow: false,
              ),
              _buildDivider(),
              Consumer<ThemeProvider>(
                builder: (context, themeProvider, child) {
                  return _buildListTile(
                  context: context,
                  title: 'الوضع الداكن',
                  iconPath: AppAssets.mode,
                  trailingWidget: Transform.scale(
                    scale: 0.8,
                    child: Switch(

                      value: themeProvider.isDarkMode,
                      onChanged: (val) {
                        themeProvider.toggleTheme();
                      },
                      activeColor: Colors.white,
                      activeTrackColor: const Color(0xFFA855F7),
                    ),
                  ),
                  showArrow: false,
                );
              },
              ),
              _buildDivider(),
              _buildListTile(
                context: context,
                title: 'اللغة',
                iconPath: AppAssets.lang,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSupportSection(BuildContext context) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _buildSectionHeader('الدعم', context),
        Container(
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.fieldDarkColor
                : Colors.white,
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.1)
                    : Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 1,
              ),
            ],
          ),
          child: Column(
            children: [
              _buildListTile(
                context: context,
                title: 'المساعدة والأسئلة الشائعة',
                iconPath: AppAssets.help,
              ),
              _buildDivider(),
              _buildListTile(
                context: context,
                title: 'عن التطبيق',
                iconPath: AppAssets.about,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLogoutSection(BuildContext context) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Container(
        decoration: BoxDecoration(
          color: isDark
              ? AppColors.fieldDarkColor
              : Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.1)
                  : Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 1,
            ),
          ],
        ),
        child: _buildListTile(
            context: context,
            title: "تسجيل الخروج",
            iconPath: AppAssets.logout,
            isLogout: true));
  }

  Widget _buildListTile({
    required String title,
    required String iconPath,
    Widget? trailingWidget,
    bool showArrow = true,
    bool isLogout = false,
    required BuildContext context,
  }) {
    bool isDark=Theme.of(context).brightness==Brightness.dark;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4.h),
      child: ListTile(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        onTap: () {},
        contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 0),
        leading: SvgPicture.asset(
          iconPath,
          width: 24.w,
          height: 24.w,
        ),
        title: Padding(
          padding: EdgeInsets.only(right: 8.w),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
              color: isLogout
                  ? Colors.red
                  : (isDark
                      ? Colors.white
                      : Colors.black87),
            ),
            textAlign: TextAlign.right,
          ),
        ),
        trailing: trailingWidget ??
            (showArrow
                ? Icon(
                    Icons.arrow_forward_ios,
                    size: 16.sp,
                    color: Colors.grey,
                  )
                : const SizedBox.shrink()),
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      thickness: 1,
      color: Colors.grey.shade100,
      indent: 20.w,
      endIndent: 20.w,
    );
  }
}
