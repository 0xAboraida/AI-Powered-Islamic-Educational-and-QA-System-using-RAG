import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/svg.dart';
import 'package:zaad/core/utils/app_assets.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';
import '../utils/answer_parser.dart';
import 'answer_section_card.dart';
import 'citations_section.dart';

class AiResponseWidget extends StatefulWidget {
  final ChatResponseDTO response;

  /// When true, the content fades in section by section (new message).
  /// When false, renders fully instantly (history replay).
  final bool animate;

  const AiResponseWidget({
    super.key,
    required this.response,
    this.animate = false,
  });

  @override
  State<AiResponseWidget> createState() => _AiResponseWidgetState();
}

class _AiResponseWidgetState extends State<AiResponseWidget> {
  late ParsedAnswer _parsed;
  int _visibleSections = 0;
  Timer? _timer;
  bool _copyDone = false;

  @override
  void initState() {
    super.initState();
    _parsed = AnswerParser.parse(widget.response.answer);
    if (widget.animate) {
      _revealSections();
    } else {
      _visibleSections = _totalSections;
    }
  }

  int get _totalSections =>
      (_parsed.intro != null ? 1 : 0) + _parsed.sections.length + 1;

  void _revealSections() {
    _timer = Timer.periodic(const Duration(milliseconds: 180), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _visibleSections++);
      if (_visibleSections >= _totalSections) t.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _copyAnswer() async {
    await Clipboard.setData(ClipboardData(text: widget.response.answer));
    if (!mounted) return;
    setState(() => _copyDone = true);
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) setState(() => _copyDone = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    int revealed = 0;

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 6.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ResponseHeader(
              isDark: isDark, onCopy: _copyAnswer, copyDone: _copyDone),
          SizedBox(height: 10.h),

          // Intro paragraph
          if (_parsed.intro != null) ...[
            _buildFadeIn(
              visible: _visibleSections > revealed++,
              child: _IntroParagraph(text: _parsed.intro!, isDark: isDark),
            ),
            SizedBox(height: 10.h),
          ],

          // Sections
          ..._parsed.sections.asMap().entries.map((e) {
            final section = e.value;
            return _buildFadeIn(
              visible: _visibleSections > revealed++,
              child: AnswerSectionCard(section: section),
            );
          }),

          // Citations
          if (widget.response.citations.isNotEmpty)
            _buildFadeIn(
              visible: _visibleSections > revealed,
              child: Padding(
                padding: EdgeInsets.only(top: 4.h),
                child: CitationsSection(citations: widget.response.citations),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFadeIn({required bool visible, required Widget child}) {
    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: visible ? Offset.zero : const Offset(0, 0.06),
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOut,
        child: child,
      ),
    );
  }
}

class _ResponseHeader extends StatelessWidget {
  final bool isDark;
  final VoidCallback onCopy;
  final bool copyDone;
  const _ResponseHeader({
    required this.isDark,
    required this.onCopy,
    required this.copyDone,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        GestureDetector(
          onTap: onCopy,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: copyDone
                ? Row(
                    key: const ValueKey('done'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_rounded,
                          size: 14.sp, color: const Color(0xFF10B981)),
                      SizedBox(width: 4.w),
                      Text(
                        'تم النسخ',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 11.sp,
                          color: const Color(0xFF10B981),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  )
                : Row(
                    key: const ValueKey('copy'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.copy_rounded,
                        size: 14.sp,
                        color:
                            isDark ? Colors.white38 : const Color(0xFF9CA3AF),
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        'نسخ',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 11.sp,
                          color:
                              isDark ? Colors.white38 : const Color(0xFF9CA3AF),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ShaderMask(
              blendMode: BlendMode.srcIn,
              shaderCallback: (bounds) =>
                  AppColors.textGradient.createShader(bounds),
              child: Text(
                'زاد',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 15.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            SizedBox(width: 6.w),
            Container(
              width: 35.w,
              height: 35.h,
              padding: EdgeInsets.all(2.w),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.textGradient,
              ),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF0E0F14) : Colors.white,
                ),
                child: Padding(
                  padding: EdgeInsets.all(3.sp),
                  child: SvgPicture.asset(
                    AppAssets.zaadLogo,
                    colorFilter: ColorFilter.mode(
                        isDark ? Colors.white : AppColors.primary,
                        BlendMode.srcIn),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _IntroParagraph extends StatelessWidget {
  final String text;
  final bool isDark;
  const _IntroParagraph({required this.text, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(14.w),
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
      child: Text.rich(
        TextSpan(
          children: AnswerParser.parseRichText(
            text,
            TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white70 : const Color(0xFF374151),
              height: 1.7,
            ),
          ),
        ),
        textAlign: TextAlign.right,
      ),
    );
  }
}
