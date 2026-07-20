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
    if (madhhab.contains('مالكي')) return const Color(0xFFF59E0B);
    if (madhhab.contains('حنبلي')) return const Color(0xFF10B981);
    if (madhhab.contains('شافعي')) return const Color(0xFF3B82F6);
    if (madhhab.contains('حنفي')) return const Color(0xFF8B5CF6);
    return const Color(0xFF9333EA); // Default purple matches the design
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
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : Colors.grey.withOpacity(0.15),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(11.r),
        child: Stack(
          children: [
            // Right thick border line matching the design
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: Container(
                width: 4.w,
                color: madhhabColor,
              ),
            ),
            Padding(
              padding: EdgeInsets.all(16.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _IndexBadge(
                            index: index,
                            color: madhhabColor,
                            isDark: isDark,
                          ),
                          SizedBox(width: 8.w),
                          GestureDetector(
                            onTap: () => _openUrl(context),
                            child: Container(
                              padding: EdgeInsets.all(4.w),
                              decoration: BoxDecoration(
                                border: Border.all(
                                    color: madhhabColor.withOpacity(0.3)),
                                borderRadius: BorderRadius.circular(6.r),
                              ),
                              child: Icon(
                                Icons.open_in_new_rounded,
                                size: 16.sp,
                                color: madhhabColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              citation.bookTitle,
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w700,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF1E293B),
                                height: 1.4,
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              citation.author,
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 12.sp,
                                color: isDark
                                    ? Colors.white60
                                    : const Color(0xFF6B7280),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  Wrap(
                    spacing: 8.w,
                    runSpacing: 8.h,
                    children: [
                      _CustomChip(
                        label: citation.madhhab,
                        icon: Icons.widgets_rounded,
                        color: madhhabColor,
                        isDark: isDark,
                      ),
                      _CustomChip(
                        label:
                            'الجزء ${citation.part} من ${citation.totalParts}',
                        icon: Icons.menu_book_rounded,
                        color: const Color(0xFF3B82F6),
                        isDark: isDark,
                      ),
                      _CustomChip(
                        label: 'ص ${citation.pageId}',
                        icon: Icons.insert_drive_file_outlined,
                        color: const Color(0xFF10B981),
                        isDark: isDark,
                      ),
                      if (!citation.authorDeath.contains('غير معروف'))
                        _CustomChip(
                          label: citation.authorDeath,
                          icon: Icons.history_edu_rounded,
                          color: const Color(0xFF6366F1),
                          isDark: isDark,
                        ),
                    ],
                  ),
                  if (citation.hierarchy.isNotEmpty) ...[
                    SizedBox(height: 16.h),
                    Text(
                      citation.hierarchy,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 12.sp,
                        color:
                            isDark ? Colors.white54 : const Color(0xFF9CA3AF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _IndexBadge extends StatelessWidget {
  final int index;
  final Color color;
  final bool isDark;

  const _IndexBadge({
    required this.index,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(6.r),
      ),
      child: Center(
        child: Text(
          '$index',
          style: TextStyle(
            fontSize: 12.sp,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ),
    );
  }
}

class _CustomChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _CustomChip({
    required this.label,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(6.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14.sp, color: color),
          SizedBox(width: 4.w),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 11.sp,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
