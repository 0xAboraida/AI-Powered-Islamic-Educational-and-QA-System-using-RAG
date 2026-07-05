import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../utils/answer_parser.dart';

class AnswerSectionCard extends StatelessWidget {
  final AnswerSection section;

  const AnswerSectionCard({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

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
          _SectionHeader(title: section.title, isDark: isDark),
          if (section.items.isNotEmpty)
            Padding(
              padding: EdgeInsets.fromLTRB(14.w, 4.h, 14.w, 14.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: section.items.asMap().entries.map((e) {
                  final idx = e.key;
                  final item = e.value;
                  return item.type == AnswerItemType.listItem
                      ? _ListItemRow(
                          index: idx,
                          text: AnswerParser.stripCitationRefs(item.text),
                          isDark: isDark,
                        )
                      : _ParagraphRow(
                          text: AnswerParser.stripCitationRefs(item.text),
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
  const _SectionHeader({required this.title, required this.isDark});

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
        ),
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? Colors.white.withOpacity(0.06)
                : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            width: 3.w,
            height: 18.h,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF2ECC71), Color(0xFF1ABC9C)],
              ),
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
              gradient: LinearGradient(
                colors: [Color(0xFF2ECC71), Color(0xFF1ABC9C)],
              ),
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
