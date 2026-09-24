import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/utils/app_colors/app_colors.dart';

class ResponseModeSelector extends StatefulWidget {
  final String selectedMode; // 'auto', 'student', 'simple'
  final ValueChanged<String> onModeChanged;

  const ResponseModeSelector({
    super.key,
    required this.selectedMode,
    required this.onModeChanged,
  });

  @override
  State<ResponseModeSelector> createState() => _ResponseModeSelectorState();
}

class _ResponseModeSelectorState extends State<ResponseModeSelector>
    with SingleTickerProviderStateMixin {
  bool _isOpen = false;
  late AnimationController _animationController;
  late Animation<double> _expandAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _expandAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutBack,
      reverseCurve: Curves.easeInQuad,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    setState(() {
      _isOpen = !_isOpen;
      if (_isOpen) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  void _selectMode(String mode) {
    widget.onModeChanged(mode);
    setState(() {
      _isOpen = false;
      _animationController.reverse();
    });
  }

  String _getDisplayLabel(String mode) {
    switch (mode) {
      case 'student':
        return 'رد طالب علم';
      case 'simple':
        return 'رد مختصر';
      case 'auto':
      default:
        return 'رد مختصر';
    }
  }

  IconData _getDisplayIcon(String mode) {
    switch (mode) {
      case 'student':
        return Icons.school_rounded;
      case 'simple':
        return Icons.bolt_rounded;
      case 'auto':
      default:
        return Icons.auto_awesome_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Popover Bubble Card (Appears above the box)
        SizeTransition(
          sizeFactor: _fadeAnimation,
          axisAlignment: 1.0,
          child: ScaleTransition(
            scale: _expandAnimation,
            alignment: Alignment.bottomCenter,
            child: Container(
              margin: EdgeInsets.only(bottom: 8.h),
              padding: EdgeInsets.all(10.w),
              width: 250.w,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkPrimary : Colors.white,
                borderRadius: BorderRadius.circular(18.r),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFFC54EEC).withOpacity(0.4)
                      : AppColors.primary.withOpacity(0.3),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark
                        ? const Color(0xFFC54EEC).withOpacity(0.2)
                        : AppColors.primary.withOpacity(0.12),
                    blurRadius: 16,
                    spreadRadius: 2,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.tune_rounded,
                        size: 15.sp,
                        color: isDark
                            ? AppColors.darkSecondary
                            : AppColors.primary,
                      ),
                      SizedBox(width: 6.w),
                      Text(
                        "اختر نوع الرد المناسب:",
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 12.sp,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white.withOpacity(0.9)
                              : AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4.h),
                  _buildOptionItem(
                    modeKey: 'student',
                    title: 'رد طالب علم',
                    subtitle: 'إجابة مفصلة مع المراجع والدلائل',
                    icon: Icons.school_rounded,
                    isDark: isDark,
                  ),
                  SizedBox(height: 4.h),
                  _buildOptionItem(
                    modeKey: 'simple',
                    title: 'رد مختصر',
                    subtitle: 'إجابة موجزة وسريعة',
                    icon: Icons.bolt_rounded,
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ),
        ),

        // Trigger Box Button
        GestureDetector(
          onTap: _toggleMenu,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 7.h),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkPrimary : Colors.white,
              borderRadius: BorderRadius.circular(20.r),
              border: Border.all(
                color: _isOpen
                    ? AppColors.primary
                    : (isDark
                        ? const Color(0xFFC54EEC).withOpacity(0.3)
                        : AppColors.primary.withOpacity(0.25)),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? const Color(0xFFC54EEC).withOpacity(0.12)
                      : AppColors.primary.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getDisplayIcon(widget.selectedMode),
                  size: 15.sp,
                  color: isDark ? AppColors.darkSecondary : AppColors.primary,
                ),
                SizedBox(width: 6.w),
                Text(
                  " ${_getDisplayLabel(widget.selectedMode)}",
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.primary,
                  ),
                ),
                SizedBox(width: 6.w),
                AnimatedRotation(
                  turns: _isOpen ? 0.5 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.keyboard_arrow_up_rounded,
                    size: 18.sp,
                    color: isDark ? Colors.white70 : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOptionItem({
    required String modeKey,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
  }) {
    final bool isSelected = widget.selectedMode == modeKey;

    return InkWell(
      onTap: () => _selectMode(modeKey),
      borderRadius: BorderRadius.circular(12.r),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.primaryGradient : null,
          color: isSelected
              ? null
              : (isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.grey.withOpacity(0.06)),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : (isDark
                    ? Colors.white.withOpacity(0.08)
                    : Colors.grey.withOpacity(0.15)),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(6.w),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withOpacity(0.2)
                    : (isDark
                        ? AppColors.darkSecondary.withOpacity(0.15)
                        : AppColors.primary.withOpacity(0.1)),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 14.sp,
                color: isSelected
                    ? Colors.white
                    : (isDark ? AppColors.darkSecondary : AppColors.primary),
              ),
            ),
            SizedBox(width: 8.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 12.sp,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? Colors.white
                          : (isDark ? Colors.white : Colors.black87),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 9.5.sp,
                      color: isSelected
                          ? Colors.white.withOpacity(0.85)
                          : (isDark ? Colors.white60 : Colors.black54),
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle_rounded,
                size: 16.sp,
                color: Colors.white,
              ),
          ],
        ),
      ),
    );
  }
}
