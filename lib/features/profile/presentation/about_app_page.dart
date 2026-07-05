import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';

class AboutAppPage extends StatelessWidget {
  const AboutAppPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkPrimary : Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: EdgeInsets.all(8.w),
          decoration: BoxDecoration(
            color: isDark ? AppColors.fieldDarkColor : Colors.grey.shade100,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new,
              size: 16.sp,
              color: isDark ? Colors.white : Colors.black87,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        title: Text(
          'عن التطبيق',
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 20.w),
          child: Column(
            children: [
              SizedBox(height: 20.h),

              // App Logo with Animation
              Center(
                child: SvgPicture.asset(
                  AppAssets.zadColoredLogo,
                  height: 120.h,
                  width: 120.w,
                  fit: BoxFit.contain,
                ),
              ).animate().fade(duration: 500.ms).scale(
                  begin: const Offset(0.8, 0.8), curve: Curves.easeOutBack),

              SizedBox(height: 16.h),

              // App Name & Version Badge
              Text(
                'زاد الذكي (Zaad AI)',
                style: TextStyle(
                  fontSize: 24.sp,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ).animate().fade(delay: 150.ms).slideY(begin: 0.2, end: 0),

              SizedBox(height: 8.h),

              Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
                decoration: BoxDecoration(
                  gradient: AppColors.textGradient,
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Text(
                  'الإصدار 1.0.0',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ).animate().fade(delay: 250.ms).scale(),

              SizedBox(height: 30.h),

              // App Description Card (App Idea)
              _buildSectionCard(
                context: context,
                isDark: isDark,
                title: 'فكرة التطبيق',
                icon: Icons.lightbulb_outline,
                child: Text(
                  'زاد هو مساعد إسلامي ذكي يعتمد على تقنيات الذكاء الاصطناعي المتطورة للتوليد المعزز بالاسترجاع (RAG). يقوم التطبيق بتوليد إجابات فقهية وشرعية دقيقة وموثوقة مستخلصة مباشرة من أمهات الكتب والمراجع الإسلامية المعتمدة، مع ربط كل إجابة بمصدرها لضمان الأمانة العلمية والدقة الشرعية.',
                  style: TextStyle(
                    fontSize: 14.sp,
                    height: 1.6,
                    color:
                        isDark ? Colors.white.withOpacity(0.8) : Colors.black87,
                  ),
                  textAlign: TextAlign.justify,
                ),
              ).animate().fade(delay: 350.ms).slideY(begin: 0.2, end: 0),

              SizedBox(height: 20.h),

              // How It Works Section
              _buildSectionCard(
                context: context,
                isDark: isDark,
                title: 'كيف يعمل زاد؟',
                icon: Icons.alt_route,
                child: Column(
                  children: [
                    _buildStepRow(
                      stepNumber: '١',
                      title: 'طرح السؤال',
                      description: 'اكتب سؤالك الفقهي أو الشرعي في أي مجال.',
                      isDark: isDark,
                    ),
                    _buildStepDivider(isDark),
                    _buildStepRow(
                      stepNumber: '٢',
                      title: 'البحث في أمهات الكتب',
                      description:
                          'يقوم النظام بالبحث الفوري والذكي في مراجع وكتب الشريعة الموثوقة.',
                      isDark: isDark,
                    ),
                    _buildStepDivider(isDark),
                    _buildStepRow(
                      stepNumber: '٣',
                      title: 'توليد الإجابة والمصادر',
                      description:
                          'يتم صياغة إجابة شاملة ومدعومة بذكر اسم الكتاب، الباب، والصفحة بدقة.',
                      isDark: isDark,
                    ),
                  ],
                ),
              ).animate().fade(delay: 450.ms).slideY(begin: 0.2, end: 0),

              SizedBox(height: 20.h),

              // Key Features List
              _buildSectionCard(
                context: context,
                isDark: isDark,
                title: 'أهم ميزات التطبيق',
                icon: Icons.star_border,
                child: Column(
                  children: [
                    _buildFeatureTile(
                      icon: Icons.menu_book,
                      title: 'مصادر إسلامية موثوقة',
                      description: 'إجابات منسوبة مباشرة للمراجع المعتمدة.',
                      isDark: isDark,
                    ),
                    SizedBox(height: 12.h),
                    _buildFeatureTile(
                      icon: Icons.psychology,
                      title: 'ذكاء اصطناعي متطور',
                      description: 'فهم دقيق للسياق اللغوي والدلالي للأسئلة.',
                      isDark: isDark,
                    ),
                    SizedBox(height: 12.h),
                    _buildFeatureTile(
                      icon: Icons.search,
                      title: 'بحث فوري وسريع',
                      description:
                          'البحث في آلاف الصفحات والكتب في أجزاء من الثانية.',
                      isDark: isDark,
                    ),
                    SizedBox(height: 12.h),
                    _buildFeatureTile(
                      icon: Icons.shield,
                      title: 'أمان وموثوقية',
                      description:
                          'حماية وتوثيق مستمر للمعلومات الشرعية لتفادي الأخطاء.',
                      isDark: isDark,
                    ),
                  ],
                ),
              ).animate().fade(delay: 550.ms).slideY(begin: 0.2, end: 0),

              SizedBox(height: 40.h),

              // Footer message
              Text(
                'صُنع بكل حب لخدمة أمة الإسلام ونشر العلم النافع.',
                style: TextStyle(
                  fontSize: 12.sp,
                  color: isDark ? Colors.white.withOpacity(0.5) : Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
              ).animate().fade(delay: 650.ms),

              SizedBox(height: 30.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required BuildContext context,
    required bool isDark,
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: isDark ? AppColors.fieldDarkColor : Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade100,
          width: 1.w,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: AppColors.primary,
                size: 22.sp,
              ),
              SizedBox(width: 8.w),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          child,
        ],
      ),
    );
  }

  Widget _buildStepRow({
    required String stepNumber,
    required String title,
    required String description,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28.w,
          height: 28.w,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              stepNumber,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12.sp,
                  height: 1.5,
                  color: isDark
                      ? Colors.white.withOpacity(0.7)
                      : Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider(bool isDark) {
    return Container(
      margin: EdgeInsets.only(right: 14.w, top: 8.h, bottom: 8.h),
      height: 20.h,
      width: 1.5.w,
      color: isDark ? Colors.white.withOpacity(0.15) : Colors.grey.shade300,
    );
  }

  Widget _buildFeatureTile({
    required IconData icon,
    required String title,
    required String description,
    required bool isDark,
  }) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8.r),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10.r),
          ),
          child: Icon(
            icon,
            color: AppColors.primary,
            size: 20.sp,
          ),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12.sp,
                  color: isDark
                      ? Colors.white.withOpacity(0.6)
                      : Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
