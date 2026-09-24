import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/services/feedback_service.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../data/models/feedback_model.dart';
import '../../domain/models/chat_response.dart';
import '../widgets/ai_response_widget.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/feedbacks_provider.dart';

class AdminRatingsScreen extends ConsumerWidget {
  const AdminRatingsScreen({super.key});

  Future<void> _deleteFeedback(String? id, WidgetRef ref) async {
    if (id == null) return;
    await FeedbackService.deleteFeedback(id);
    ref.invalidate(feedbacksProvider);
  }

  Future<void> _clearAll(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد المسح', textAlign: TextAlign.right),
        content: const Text(
          'هل أنت تأكد من مسح جميع التقييمات المخزنة محلياً؟',
          textAlign: TextAlign.right,
        ),
        actions: [
          TextButton(
            onPressed: () => ctx.pop(false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => ctx.pop(true),
            child: const Text('مسح الكل', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await FeedbackService.clearAllFeedbacks();
      ref.invalidate(feedbacksProvider);
    }
  }

  void _showFeedbackDetailsBottomSheet(BuildContext context, FeedbackModel item) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final formattedDate =
        intl.DateFormat('yyyy/MM/dd - hh:mm a').format(item.timestamp);
    final isLike = item.rating == 'like';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24.r),
            topRight: Radius.circular(24.r),
          ),
        ),
        child: Column(
          children: [
            SizedBox(height: 10.h),
            Container(
              width: 44.w,
              height: 4.h,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey.shade400,
                borderRadius: BorderRadius.circular(2.r),
              ),
            ),
            SizedBox(height: 14.h),

            // Header info
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20.r,
                    backgroundColor: isLike
                        ? const Color(0xFF10B981).withOpacity(0.15)
                        : const Color(0xFFEF4444).withOpacity(0.15),
                    child: Icon(
                      isLike ? Icons.thumb_up_rounded : Icons.thumb_down_rounded,
                      size: 22.sp,
                      color: isLike ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.userName,
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15.sp,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${item.userEmail} • $formattedDate',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 11.sp,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => ctx.pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            Divider(height: 20.h),

            // Details Content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Domain / Field Badge
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20.r),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.category_rounded, size: 16.sp, color: AppColors.primary),
                          SizedBox(width: 6.w),
                          Text(
                            'المجال: ${item.domainName}',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 12.sp,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Full Question Box
                    Text(
                      '❓ السؤال بالكامل:',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14.sp,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(14.w),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.white.withOpacity(0.05)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14.r),
                        border: Border.all(
                          color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        item.questionText,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14.sp,
                          height: 1.5,
                          color: isDark ? Colors.white54 : const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    SizedBox(height: 20.h),

                    // Full Response Box
                    Text(
                      '💬 الإجابة بالكامل:',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14.sp,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(14.w),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E293B)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(14.r),
                        border: Border.all(
                          color: isDark ? Colors.white10 : const Color(0xFFCBD5E1),
                        ),
                      ),
                      child: AiResponseWidget(
                        response: ChatResponseDTO(
                          answer: item.fullAnswer,
                          citations: {},
                        ),
                        questionText: item.questionText,
                        domainName: item.domainName,
                        animate: false,
                        showHeader: false,
                        showFooter: false,
                      ),
                    ),
                    SizedBox(height: 30.h),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final feedbacksAsync = ref.watch(feedbacksProvider);
    final filteredFeedbacks = ref.watch(filteredFeedbacksProvider);
    
    final allFeedbacks = feedbacksAsync.valueOrNull ?? [];
    final likesCount = allFeedbacks.where((f) => f.rating == 'like').length;
    final dislikesCount = allFeedbacks.where((f) => f.rating == 'dislike').length;
    final filter = ref.watch(feedbackFilterProvider);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'لوحة تقييمات الإجابات',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          if (allFeedbacks.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: Colors.red),
              tooltip: 'مسح جميع التقييمات',
              onPressed: () => _clearAll(context, ref),
            ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(14.w),
        child: Column(
          children: [
            // ── Statistics Overview Cards ─────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'إجمالي التقييمات',
                    value: '${allFeedbacks.length}',
                    icon: Icons.rate_review_rounded,
                    color: const Color(0xFF9333EA),
                    isDark: isDark,
                  ),
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: _StatCard(
                    title: 'الإعجابات',
                    value: '$likesCount',
                    icon: Icons.thumb_up_rounded,
                    color: const Color(0xFF10B981),
                    isDark: isDark,
                  ),
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: _StatCard(
                    title: 'لم يعجبني',
                    value: '$dislikesCount',
                    icon: Icons.thumb_down_rounded,
                    color: const Color(0xFFEF4444),
                    isDark: isDark,
                  ),
                ),
              ],
            ),
            SizedBox(height: 14.h),

            // ── Search & Filter ──────────────────────────────────────────────
            TextField(
              onChanged: (val) => ref.read(feedbackSearchQueryProvider.notifier).state = val.trim(),
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13.sp,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'بحث في اسم المستخدم، المجال، أو السؤال...',
                hintStyle: TextStyle(fontFamily: 'Cairo', fontSize: 12.sp),
                prefixIcon: const Icon(Icons.search_rounded),
                contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            SizedBox(height: 10.h),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _FilterChip(
                  label: 'الكل (${allFeedbacks.length})',
                  selected: filter == 'all',
                  onTap: () => ref.read(feedbackFilterProvider.notifier).state = 'all',
                  isDark: isDark,
                ),
                SizedBox(width: 8.w),
                _FilterChip(
                  label: 'إعجاب 👍 ($likesCount)',
                  selected: filter == 'like',
                  onTap: () => ref.read(feedbackFilterProvider.notifier).state = 'like',
                  isDark: isDark,
                ),
                SizedBox(width: 8.w),
                _FilterChip(
                  label: 'لم يعجبني 👎 ($dislikesCount)',
                  selected: filter == 'dislike',
                  onTap: () => ref.read(feedbackFilterProvider.notifier).state = 'dislike',
                  isDark: isDark,
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // ── Feedbacks List ──────────────────────────────────────────────
            Expanded(
              child: feedbacksAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('خطأ: $err')),
                data: (_) => filteredFeedbacks.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inbox_rounded,
                              size: 54.sp,
                              color: Colors.grey.shade400,
                            ),
                            SizedBox(height: 8.h),
                            Text(
                              'لا توجد تقييمات مخزنة حالياً',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14.sp,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: filteredFeedbacks.length,
                        itemBuilder: (ctx, index) {
                          final item = filteredFeedbacks[index];
                        final formattedDate =
                            intl.DateFormat('yyyy/MM/dd - hh:mm a')
                                .format(item.timestamp);
                        final isLike = item.rating == 'like';

                        return GestureDetector(
                          onTap: () => _showFeedbackDetailsBottomSheet(context, item),
                          child: Container(
                            margin: EdgeInsets.only(bottom: 10.h),
                            padding: EdgeInsets.all(12.w),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1E293B)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(14.r),
                              border: Border.all(
                                color: isDark
                                    ? Colors.white.withOpacity(0.08)
                                    : const Color(0xFFCBD5E1),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.04),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // User Header
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18.r,
                                      backgroundColor: isLike
                                          ? const Color(0xFF10B981).withOpacity(0.15)
                                          : const Color(0xFFEF4444).withOpacity(0.15),
                                      child: Icon(
                                        isLike
                                            ? Icons.thumb_up_rounded
                                            : Icons.thumb_down_rounded,
                                        size: 18.sp,
                                        color: isLike
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFFEF4444),
                                      ),
                                    ),
                                    SizedBox(width: 10.w),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.userName,
                                            style: TextStyle(
                                              fontFamily: 'Cairo',
                                              fontSize: 13.sp,
                                              fontWeight: FontWeight.bold,
                                              color: isDark
                                                  ? Colors.white
                                                  : const Color(0xFF0F172A),
                                            ),
                                          ),
                                          Text(
                                            item.userEmail,
                                            style: TextStyle(
                                              fontFamily: 'Cairo',
                                              fontSize: 11.sp,
                                              color: Colors.grey.shade500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      formattedDate,
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        fontSize: 10.sp,
                                        color: Colors.grey,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.close_rounded,
                                        size: 18,
                                        color: Colors.grey,
                                      ),
                                      onPressed: () => _deleteFeedback(item.id, ref),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 6.h),

                                // Domain Tag & Hint Row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12.r),
                                      ),
                                      child: Text(
                                        '🏷️ المجال: ${item.domainName}',
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 11.sp,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        Text(
                                          'انقر لمشاهدة الرد الكامل',
                                          style: TextStyle(
                                            fontFamily: 'Cairo',
                                            fontSize: 10.sp,
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        SizedBox(width: 2.w),
                                        Icon(
                                          Icons.arrow_forward_ios_rounded,
                                          size: 10.sp,
                                          color: AppColors.primary,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                SizedBox(height: 8.h),

                                // Question Section
                                Container(
                                  width: double.infinity,
                                  padding: EdgeInsets.all(8.w),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.white.withOpacity(0.04)
                                        : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                  child: Text(
                                    '❓ السؤال: ${item.questionText}',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 12.sp,
                                      fontWeight: FontWeight.w600,
                                      color: isDark
                                          ? Colors.white70
                                          : const Color(0xFF334155),
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                SizedBox(height: 6.h),

                                // Answer Snippet Section
                                Container(
                                  width: double.infinity,
                                  padding: EdgeInsets.all(8.w),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.white.withOpacity(0.02)
                                        : const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8.r),
                                    border: Border.all(
                                      color: isDark
                                          ? Colors.white.withOpacity(0.05)
                                          : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Text(
                                    '💬 مختصر الإجابة: ${item.answerSnippet}',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 11.sp,
                                      color: isDark
                                          ? Colors.white60
                                          : const Color(0xFF475569),
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
              ),
        )],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 10.h),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20.sp),
          SizedBox(height: 4.h),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16.sp,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10.sp,
              color: isDark ? Colors.white60 : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool isDark;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary
              : isDark
                  ? const Color(0xFF1E293B)
                  : Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(
            color: selected ? AppColors.primary : Colors.grey.shade400,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 11.sp,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            color: selected
                ? Colors.white
                : isDark
                    ? Colors.white70
                    : Colors.black87,
          ),
        ),
      ),
    );
  }
}
