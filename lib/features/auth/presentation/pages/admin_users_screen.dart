import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/services/users_service.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../data/models/registered_user_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/users_provider.dart';

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  Future<void> _clearAll(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد المسح', textAlign: TextAlign.right),
        content: const Text(
          'هل أنت متأكد من مسح جميع المستخدمين المسجلين محلياً؟',
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
      await UsersService.clearAllUsers();
      ref.invalidate(usersProvider);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final usersAsync = ref.watch(usersProvider);
    final filteredUsers = ref.watch(filteredUsersProvider);
    final totalUsers = usersAsync.valueOrNull?.length ?? 0;

    return Scaffold(
      backgroundColor:
          isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'لوحة المستخدمين المسجلين',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          if (totalUsers > 0)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: Colors.red),
              tooltip: 'مسح جميع المستخدمين',
              onPressed: () => _clearAll(context, ref),
            ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(14.w),
        child: Column(
          children: [
            // Statistics Card
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(12.r),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.group_rounded,
                      color: AppColors.primary, size: 24.sp),
                  SizedBox(width: 10.w),
                  Column(
                    children: [
                      Text(
                        'إجمالي المستخدمين',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 12.sp,
                          color: isDark ? Colors.white60 : Colors.grey.shade600,
                        ),
                      ),
                      Text(
                        '$totalUsers',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 20.sp,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 14.h),

            // Search
            TextField(
              onChanged: (val) => ref
                  .read(usersSearchQueryProvider.notifier)
                  .state = val.trim(),
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13.sp,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'بحث باسم المستخدم أو البريد الإلكتروني...',
                hintStyle: TextStyle(fontFamily: 'Cairo', fontSize: 12.sp),
                prefixIcon: const Icon(Icons.search_rounded),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            SizedBox(height: 14.h),

            // Users List
            Expanded(
              child: usersAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('خطأ: $err')),
                data: (_) => filteredUsers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.group_off_rounded,
                              size: 54.sp,
                              color: Colors.grey.shade400,
                            ),
                            SizedBox(height: 8.h),
                            Text(
                              'لا يوجد مستخدمين مسجلين حالياً',
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
                        itemCount: filteredUsers.length,
                        itemBuilder: (ctx, index) {
                          final user = filteredUsers[index];
                          final formattedDate =
                              intl.DateFormat('yyyy/MM/dd - hh:mm a')
                                  .format(user.timestamp);

                          return Container(
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
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 22.r,
                                  backgroundColor:
                                      AppColors.primary.withOpacity(0.15),
                                  child: Icon(
                                    Icons.person_rounded,
                                    size: 24.sp,
                                    color: AppColors.primary,
                                  ),
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user.userName,
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 14.sp,
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      Text(
                                        user.userEmail,
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 12.sp,
                                          color: Colors.grey.shade500,
                                        ),
                                      ),
                                      SizedBox(height: 4.h),
                                      Text(
                                        formattedDate,
                                        style: TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 10.sp,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
