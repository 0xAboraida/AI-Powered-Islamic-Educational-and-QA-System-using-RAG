import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import 'package:zaad/core/utils/app_strings.dart';

import '../../domain/models/field_option.dart';
import 'field_option_item.dart';

class FieldSelectionBottomSheet extends StatefulWidget {
  final List<FieldOption> fields;
  final int? initialSelectedIndex;
  final Function(int) onSelected;

  const FieldSelectionBottomSheet({
    super.key,
    required this.fields,
    this.initialSelectedIndex,
    required this.onSelected,
  });

  @override
  State<FieldSelectionBottomSheet> createState() =>
      _FieldSelectionBottomSheetState();
}

class _FieldSelectionBottomSheetState extends State<FieldSelectionBottomSheet> {
  int? _selectedIndex;

  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.initialSelectedIndex;
  }

  @override
  Widget build(BuildContext context) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 15.h),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkPrimary : Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30.r)),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.1)
              : AppColors.primary.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40.w,
            height: 4.h,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.grey[300],
              borderRadius: BorderRadius.circular(2.r),
            ),
          ),
          SizedBox(height: 20.h),
          Text(
            AppStrings.chooseQuestionField,
            style: TextStyle(
              fontSize: 22.sp,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black,
            ),
          ),
          SizedBox(height: 20.h),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: widget.fields.length,
              separatorBuilder: (context, index) => SizedBox(height: 12.h),
              itemBuilder: (context, index) {
                return FieldOptionItem(
                  title: widget.fields[index].title,
                  icon: widget.fields[index].icon,
                  isSelected: _selectedIndex == index,
                  onTap: () {
                    setState(() {
                      _selectedIndex = index;
                    });
                  },
                );
              },
            ),
          ),
          SizedBox(height: 20.h),
          InkWell(
            onTap: _selectedIndex != null
                ? () {
                    widget.onSelected(_selectedIndex!);
                    Navigator.pop(context);
                  }
                : null,
            child: Container(
              width: double.infinity,
              height: 55.h,
              decoration: BoxDecoration(
                color: _selectedIndex != null
                    ? (isDark ? Colors.black : AppColors.primary)
                    : (isDark ? Colors.white10 : const Color(0xFFE5E7EB)),
                borderRadius: BorderRadius.circular(15.r),
                border: isDark && _selectedIndex != null
                    ? Border.all(color: Colors.white12)
                    : null,
              ),
              child: Center(
                child: Text(
                  AppStrings.confirm,
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: _selectedIndex != null
                        ? Colors.white
                        : (isDark ? Colors.white24 : Colors.grey[600]),
                  ),
                ),
              ),
            ),
          ),
          SizedBox(height: 10.h),
        ],
      ),
    );
  }

}
