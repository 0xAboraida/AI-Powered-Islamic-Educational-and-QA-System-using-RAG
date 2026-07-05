import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';

class CitationCard extends StatelessWidget {
  final String citKey;
  final CitationDTO citation;
  final int index;

  const CitationCard({
    super.key,
    required this.citKey,
    required this.citation,
    required this.index,
  });

  Color _madhhabColor(String madhhab) {
    switch (madhhab) {
      case 'مالكي':
        return const Color(0xFFD97706);
      case 'حنبلي':
        return const Color(0xFF059669);
      case 'شافعي':
        return const Color(0xFF2563EB);
      case 'حنفي':
        return const Color(0xFF7C3AED);
      default:
        return const Color(0xFF6B7280);
    }
  }

  Future<void> _openUrl(BuildContext context) async {
    final uri = Uri.tryParse(citation.sourceUrl);
    if (uri == null) {
      _showErrorSnackBar(context, 'رابط المصدر غير صالح');
      return;
    }
    try {
      bool launched = false;
      if (await canLaunchUrl(uri)) {
        launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      }

      if (!launched) {
        // Fallback to platform default launch mode
        launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
      }

      if (!launched) {
        if (!context.mounted) return;
        _showErrorSnackBar(context, 'تعذر فتح الرابط');
      }
    } catch (e) {
      debugPrint('Error launching URL: $e');
      if (!context.mounted) return;
      _showErrorSnackBar(context, 'حدث خطأ أثناء محاولة فتح الرابط');
    }
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          textAlign: TextAlign.right,
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        backgroundColor: Colors.red.shade600,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color madhhabColor = _madhhabColor(citation.madhhab);

    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border(
          right: BorderSide(color: madhhabColor, width: 3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(12.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _IndexBadge(index: index),
                    SizedBox(width: 8.w),
                    GestureDetector(
                      onTap: () => _openUrl(context),
                      child: Icon(
                        Icons.open_in_new_rounded,
                        size: 18.sp,
                        color: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        citation.bookTitle,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13.sp,
                          fontWeight: FontWeight.w700,
                          color:
                              isDark ? Colors.white : const Color(0xFF1E293B),
                          height: 1.4,
                        ),
                      ),
                      SizedBox(height: 3.h),
                      Text(
                        citation.author,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 11.sp,
                          color: const Color(0xFF6B7280),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 8.h),
            Wrap(
              spacing: 5, runSpacing: 5,
              // ma  inAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _InfoChip(
                      label: 'ج ${citation.part} · ص ${citation.pageId}',
                      icon: Icons.menu_book_rounded,
                      color: const Color(0xFF6B7280),
                      isDark: isDark,
                    ),
                    SizedBox(width: 6.w),
                    _InfoChip(
                      label: citation.authorDeath,
                      icon: Icons.history_edu_rounded,
                      color: const Color(0xFF6B7280),
                      isDark: isDark,
                    ),
                  ],
                ),
                SizedBox(
                  height: 5.h,
                ),
                _MadhhabBadge(
                  label: citation.madhhab,
                  color: madhhabColor,
                ),
              ],
            ),
            if (citation.hierarchy.isNotEmpty) ...[
              SizedBox(height: 6.h),
              Text(
                citation.hierarchy,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 10.sp,
                  color: const Color(0xFF9CA3AF),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _IndexBadge extends StatelessWidget {
  final int index;
  const _IndexBadge({required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22.w,
      height: 22.w,
      decoration: BoxDecoration(
        color: const Color(0xFF6B7280).withOpacity(0.12),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          '$index',
          style: TextStyle(
            fontSize: 10.sp,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}

class _MadhhabBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _MadhhabBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6.r),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 10.sp,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isDark;
  const _InfoChip({
    required this.label,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 7.w, vertical: 3.h),
      decoration: BoxDecoration(
        color:
            isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(6.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10.sp,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(width: 3.w),
          Icon(icon, size: 11.sp, color: color),
        ],
      ),
    );
  }
}
