import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import '../utils/answer_parser.dart';

class AnswerSectionCard extends StatelessWidget {
  final AnswerSection section;

  const AnswerSectionCard({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    final validItems = section.items
        .where((item) => item.text.trim().isNotEmpty)
        .toList();

    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.15 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SectionHeader(
            title: section.title,
            isDark: isDark,
            hasContent: validItems.isNotEmpty,
          ),
          if (validItems.isNotEmpty)
            Padding(
              padding: EdgeInsets.fromLTRB(14.w, 4.h, 14.w, 14.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: validItems.asMap().entries.map((e) {
                  final idx = e.key;
                  final item = e.value;
                  return item.type == AnswerItemType.listItem
                      ? _ListItemRow(
                          index: idx,
                          text: item.text,
                          isDark: isDark,
                        )
                      : item.type == AnswerItemType.quote
                          ? _QuoteRow(
                              text: item.text,
                              isDark: isDark,
                            )
                          : _ParagraphRow(
                              text: item.text,
                              isDark: isDark,
                            );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final bool isDark;
  final bool hasContent;
  const _SectionHeader({
    required this.title,
    required this.isDark,
    this.hasContent = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 11.h),
      decoration: BoxDecoration(
        color:
            isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(14.r),
          topRight: Radius.circular(14.r),
          bottomLeft: hasContent ? Radius.zero : Radius.circular(14.r),
          bottomRight: hasContent ? Radius.zero : Radius.circular(14.r),
        ),
        border: hasContent
            ? Border(
                bottom: BorderSide(
                  color: isDark
                      ? Colors.white.withOpacity(0.06)
                      : const Color(0xFFE2E8F0),
                ),
              )
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            width: 3.w,
            height: 18.h,
            decoration: BoxDecoration(
              gradient: AppColors.textGradient,
              borderRadius: BorderRadius.circular(4.r),
            ),
          ),
          SizedBox(width: 6.w),
          Flexible(
            child: Text(
              title,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14.sp,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ListItemRow extends StatelessWidget {
  final int index;
  final String text;
  final bool isDark;
  const _ListItemRow({
    required this.index,
    required this.text,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: 8.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            width: 7.w,
            height: 7.w,
            margin: EdgeInsets.only(top: 8.h, left: 6.w, right: 6.w),
            decoration: const BoxDecoration(
              color: Color.fromARGB(255, 121, 31, 177),
              shape: BoxShape.circle,
            ),
          ),
          SizedBox(width: 8.w),
          Flexible(
            child: Text.rich(
              TextSpan(
                children: AnswerParser.parseRichText(
                  text,
                  TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white70 : const Color(0xFF374151),
                    height: 1.6,
                  ),
                ),
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}

class _ParagraphRow extends StatelessWidget {
  final String text;
  final bool isDark;
  const _ParagraphRow({required this.text, required this.isDark});

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) {
      return SizedBox(height: 12.h);
    }
    return Padding(
      padding: EdgeInsets.only(top: 8.h),
      child: Text.rich(
        TextSpan(
          children: AnswerParser.parseRichText(
            text,
            TextStyle(
              fontFamily: 'Cairo',
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white70 : const Color(0xFF374151),
              height: 1.6,
            ),
          ),
        ),
        textAlign: TextAlign.right,
      ),
    );
  }
}

class _QuoteRow extends StatelessWidget {
  final String text;
  final bool isDark;
  const _QuoteRow({required this.text, required this.isDark});

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) {
      return SizedBox(height: 12.h);
    }
    return Container(
      margin: EdgeInsets.only(top: 8.h),
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
      decoration: BoxDecoration(
        color:
            isDark ? Colors.white.withOpacity(0.03) : const Color(0xFFF3F4F6),
        border: Border(
          right: BorderSide(
            color: const Color(0xFFBA68C8),
            width: 4.w,
          ),
        ),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8.r),
          bottomLeft: Radius.circular(8.r),
        ),
      ),
      child: Text.rich(
        TextSpan(
          children: AnswerParser.parseRichText(
            text,
            TextStyle(
              fontFamily: 'Cairo',
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white70 : const Color(0xFF4B5563),
              height: 1.6,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        textAlign: TextAlign.right,
      ),
    );
  }
}
