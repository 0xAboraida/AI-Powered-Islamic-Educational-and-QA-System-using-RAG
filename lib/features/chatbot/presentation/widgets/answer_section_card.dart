import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import '../utils/answer_parser.dart';

class AnswerSectionCard extends StatelessWidget {
  final AnswerSection section;
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const AnswerSectionCard({
    super.key,
    required this.section,
    this.onCitationTap,
    this.citationNames,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    final validItems = section.items
        .where((item) => item.text.trim().isNotEmpty || item.childItems != null)
        .toList();

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color:
              isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFCBD5E1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (section.title.isNotEmpty)
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
                  switch (item.type) {
                    case AnswerItemType.listItem:
                      return _ListItemRow(
                        index: idx,
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                      );
                    case AnswerItemType.quran:
                      return _TaggedQuoteCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                        icon: Icons.menu_book_rounded,
                        accentColor: const Color(0xFF10B981),
                        lightBg: const Color(0xFFECFDF5),
                        darkBg: const Color(0xFF064E3B).withOpacity(0.25),
                      );
                    case AnswerItemType.hadith:
                      return _TaggedQuoteCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                        icon: Icons.auto_stories_rounded,
                        accentColor: const Color(0xFF0284C7),
                        lightBg: const Color(0xFFF0F9FF),
                        darkBg: const Color(0xFF0C4A6E).withOpacity(0.25),
                      );
                    case AnswerItemType.saying:
                      return _TaggedQuoteCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                        icon: Icons.person_outline_rounded,
                        accentColor: const Color(0xFF8B5CF6),
                        lightBg: const Color(0xFFFDFBF7),
                        darkBg: const Color(0xFF4C1D95).withOpacity(0.25),
                      );
                    case AnswerItemType.poetry:
                      return _TaggedQuoteCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                        icon: Icons.history_edu_rounded,
                        accentColor: const Color(0xFFD97706),
                        lightBg: const Color(0xFFFFFBEB),
                        darkBg: const Color(0xFF78350F).withOpacity(0.25),
                      );
                    case AnswerItemType.reference:
                      return _TaggedQuoteCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                        icon: Icons.file_present_rounded,
                        accentColor: const Color(0xFF6366F1),
                        lightBg: const Color(0xFFEEF2FF),
                        darkBg: const Color(0xFF312E81).withOpacity(0.25),
                      );
                    case AnswerItemType.quote:
                      return _QuoteRow(
                        text: item.text,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                      );
                    case AnswerItemType.subFrame:
                      return _SubFrameCard(
                        item: item,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                      );
                    case AnswerItemType.paragraph:
                    default:
                      return _ParagraphRow(
                        text: item.text,
                        isDark: isDark,
                        onCitationTap: onCitationTap,
                        citationNames: citationNames,
                      );
                  }
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
            isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF1F5F9),
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
                      ? Colors.white.withOpacity(0.08)
                      : const Color(0xFFCBD5E1),
                ),
              )
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Flexible(
            child: Text(
              title,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: isDark ? const Color(0xFF10B981) : AppColors.primary,
                fontFamily: 'Cairo',
                fontSize: 14.sp,
                fontWeight: FontWeight.w700,
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
  final AnswerItem item;
  final bool isDark;
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const _ListItemRow({
    required this.index,
    required this.item,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
  });

  @override
  Widget build(BuildContext context) {
    final double rightIndent = (item.indentLevel * 12).w;

    return Padding(
      padding: EdgeInsets.only(top: 8.h, right: rightIndent),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          if (!item.isNumbered) ...[
            Container(
              width: item.indentLevel > 0 ? 5.w : 7.w,
              height: item.indentLevel > 0 ? 5.w : 7.w,
              margin: EdgeInsets.only(top: 8.h, left: 6.w, right: 4.w),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF10B981) : AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            SizedBox(width: 6.w),
          ],
          Flexible(
            child: Text.rich(
              TextSpan(
                children: AnswerParser.parseRichText(
                  item.text,
                  TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white70 : const Color(0xFF374151),
                    height: 1.6,
                  ),
                  onCitationTap: onCitationTap,
                  isDark: isDark,
                  citationNames: citationNames,
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
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const _ParagraphRow({
    required this.text,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
  });

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
            onCitationTap: onCitationTap,
            isDark: isDark,
            citationNames: citationNames,
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
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const _QuoteRow({
    required this.text,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
  });

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
            color: AppColors.primary,
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
            onCitationTap: onCitationTap,
            isDark: isDark,
            citationNames: citationNames,
          ),
        ),
        textAlign: TextAlign.right,
      ),
    );
  }
}

class _TaggedQuoteCard extends StatelessWidget {
  final AnswerItem item;
  final bool isDark;
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;
  final IconData icon;
  final Color accentColor;
  final Color lightBg;
  final Color darkBg;

  const _TaggedQuoteCard({
    required this.item,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
    required this.icon,
    required this.accentColor,
    required this.lightBg,
    required this.darkBg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.symmetric(vertical: 8.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: isDark ? darkBg : lightBg,
        border: Border(
          right: BorderSide(color: accentColor, width: 4.w),
        ),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(12.r),
          bottomLeft: Radius.circular(12.r),
          topRight: Radius.circular(4.r),
          bottomRight: Radius.circular(4.r),
        ),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: 6.h),
          Text.rich(
            TextSpan(
              children: AnswerParser.parseRichText(
                item.text,
                TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                  height: 1.8,
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
                onCitationTap: onCitationTap,
                isDark: isDark,
                citationNames: citationNames,
              ),
            ),
            textAlign: TextAlign.right,
          ),
          if (item.referenceText != null && item.referenceText!.isNotEmpty) ...[
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.only(top: 6.h),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? Colors.white.withOpacity(0.1)
                        : Colors.black.withOpacity(0.08),
                  ),
                ),
              ),
              child: Text.rich(
                TextSpan(
                  children: AnswerParser.parseRichText(
                    item.referenceText!,
                    TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11.5.sp,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? Colors.white.withOpacity(0.7)
                          : Colors.black.withOpacity(0.6),
                    ),
                    onCitationTap: onCitationTap,
                    citationNames: citationNames,
                  ),
                ),
                textAlign: TextAlign.left,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 11.5.sp,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? Colors.white.withOpacity(0.7)
                      : Colors.black.withOpacity(0.6),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SubFrameCard extends StatelessWidget {
  final AnswerItem item;
  final bool isDark;
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const _SubFrameCard({
    required this.item,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
  });

  @override
  Widget build(BuildContext context) {
    final children = item.childItems ?? [];

    return Container(
      margin: EdgeInsets.symmetric(vertical: 8.h),
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF16062B).withOpacity(0.8)
            : const Color(0xFFFAF5FF),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color: isDark ? AppColors.primary : AppColors.primary,
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 3.w,
                height: 14.h,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
              SizedBox(width: 6.w),
              Flexible(
                child: Text(
                  item.text,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13.5.sp,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? const Color(0xFFE9D8FD)
                        : const Color(0xFF581C87),
                  ),
                ),
              ),
            ],
          ),
          if (children.isNotEmpty) ...[
            SizedBox(height: 6.h),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children.map((child) {
                return _ParagraphRow(
                  text: child.text,
                  isDark: isDark,
                  onCitationTap: onCitationTap,
                  citationNames: citationNames,
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}
