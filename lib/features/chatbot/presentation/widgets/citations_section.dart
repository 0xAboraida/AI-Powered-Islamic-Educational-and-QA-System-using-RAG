import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';
import 'citation_card.dart';

class CitationsSection extends StatefulWidget {
  final Map<String, CitationDTO> citations;

  const CitationsSection({super.key, required this.citations});

  @override
  State<CitationsSection> createState() => _CitationsSectionState();
}

class _CitationsSectionState extends State<CitationsSection>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late final AnimationController _controller;
  late final Animation<double> _expandAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _expandAnim = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    if (_expanded) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final count = widget.citations.length;
    final entries = widget.citations.entries.toList();

    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF1E293B).withOpacity(0.6)
            : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color:
              isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: _toggle,
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  AnimatedRotation(
                    turns: _expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 280),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 20.sp,
                      color: const Color(0xFF6B7280),
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$count مصدر',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13.sp,
                          fontWeight: FontWeight.w600,
                          color:
                              isDark ? Colors.white70 : const Color(0xFF374151),
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Icon(
                        Icons.auto_stories_rounded,
                        size: 16.sp,
                        color: const Color(0xFF6B7280),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SizeTransition(
            sizeFactor: _expandAnim,
            child: Padding(
              padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
              child: Column(
                children: [
                  Divider(
                    color: isDark
                        ? Colors.white.withOpacity(0.08)
                        : const Color(0xFFE2E8F0),
                    height: 1,
                    thickness: 1,
                  ),
                  SizedBox(height: 10.h),
                  ...entries.asMap().entries.map((e) {
                    final idx = e.key;
                    final entry = e.value;
                    return CitationCard(
                      citKey: entry.key,
                      citation: entry.value,
                      index: idx + 1,
                    );
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
