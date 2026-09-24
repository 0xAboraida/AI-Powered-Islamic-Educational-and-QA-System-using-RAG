import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/svg.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:zaad/core/routes/app_routes.dart';
import 'package:zaad/core/services/feedback_service.dart';
import 'package:zaad/core/services/pdf_export_service.dart';
import 'package:zaad/core/services/shared_prefs.dart';
import 'package:zaad/core/utils/app_assets.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';
import '../utils/answer_parser.dart';
import 'answer_section_card.dart';
import 'citations_section.dart';

class AiResponseWidget extends StatefulWidget {
  final ChatResponseDTO response;
  final String? questionText;
  final String? domainName;

  /// When true, the content fades in section by section (new message).
  /// When false, renders fully instantly (history replay).
  final bool animate;
  final bool showHeader;
  final bool showFooter;

  const AiResponseWidget({
    super.key,
    required this.response,
    this.questionText,
    this.domainName,
    this.animate = false,
    this.showHeader = true,
    this.showFooter = true,
  });

  @override
  State<AiResponseWidget> createState() => _AiResponseWidgetState();
}

class _AiResponseWidgetState extends State<AiResponseWidget> {
  late ParsedAnswer _parsed;
  Timer? _timer;
  bool _copyDone = false;
  bool _linkCopied = false;
  bool _isLiked = false;
  bool _isDisliked = false;

  late final List<String> _chars;
  int _currentIndex = 0;
  String _streamedAnswer = "";
  bool _isStreaming = false;

  @override
  void initState() {
    super.initState();
    _chars = widget.response.answer.characters.toList();
    if (widget.animate) {
      _parsed = AnswerParser.parse("");
      _isStreaming = true;
      _startStreaming();
    } else {
      _parsed = AnswerParser.parse(widget.response.answer);
      _isStreaming = false;
    }
  }

  void _startStreaming() {
    _timer = Timer.periodic(const Duration(milliseconds: 10), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_currentIndex < _chars.length) {
        setState(() {
          int step = 8;
          int end = (_currentIndex + step < _chars.length)
              ? _currentIndex + step
              : _chars.length;
          for (int i = _currentIndex; i < end; i++) {
            _streamedAnswer += _chars[i];
          }
          _currentIndex = end;
          _parsed = AnswerParser.parse(_streamedAnswer);
        });
      } else {
        t.cancel();
        setState(() {
          _isStreaming = false;
        });
      }
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
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _copyDone = false);
    });
  }

  Future<void> _copyLink() async {
    final question = widget.questionText ?? '';
    final uri = Uri(
      scheme: 'https',
      host: 'zad-deeplink.mohamedqandill912.workers.dev',
      path: AppRoutes.chatbot,
      queryParameters: {
        if (question.isNotEmpty) 'question': question,
      },
    );

    final link = uri.toString();
    await Clipboard.setData(ClipboardData(text: link));
    if (!mounted) return;
    setState(() => _linkCopied = true);
    _showToast('تم نسخ رابط السؤال بنجاح 🔗');
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _linkCopied = false);
    });
  }

  Future<void> _shareAnswer() async {
    final cleanAnswer = AnswerParser.stripCitationRefs(widget.response.answer);
    final formattedMessage = '✨ إجابة من تطبيق زاد للعلوم الشرعية 🌿\n\n'
        '$cleanAnswer\n\n'
        '📍 حمّل تطبيق زاد للعلوم الشرعية لمزيد من الفتاوى والإجابات الموثقة.';

    await Share.share(
      formattedMessage,
      subject: 'إجابة من تطبيق زاد للعلوم الشرعية',
    );
  }

  Future<void> _exportPdf() async {
    try {
      _showToast('جاري تحضير ملف الـ PDF... 📄');
      await PdfExportService.generateAndExportPdf(
        context: context,
        questionText: widget.questionText ?? '',
        domainName: widget.domainName ?? 'العلوم الشرعية',
        fullAnswer: widget.response.answer,
        citations: widget.response.citations,
      );
    } catch (e) {
      if (mounted) _showToast('حدث خطأ أثناء تصدير ملف الـ PDF');
      print(e);
    }
  }

  Future<void> _handleRating(String rating) async {
    final userName = SharedPrefs.getString('user_name') ??
        SharedPrefs.getString('name') ??
        'مستخدم زاد';
    final userEmail = SharedPrefs.getString('user_email') ??
        SharedPrefs.getString('email') ??
        'زائر';

    await FeedbackService.saveFeedback(
      userName: userName,
      userEmail: userEmail,
      questionText: widget.questionText ?? 'سؤال في العلوم الشرعية',
      domainName: widget.domainName ?? 'العلوم الشرعية',
      fullAnswer: widget.response.answer,
      rating: rating,
    );

    _showToast(rating == 'like'
        ? 'شكراً لتقييمك بالإيجاب! 🌿'
        : 'شكراً لتقييمك وسنعمل على تحسين الإجابة 🌿');
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          textAlign: TextAlign.right,
          style: const TextStyle(fontFamily: 'Cairo'),
        ),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _handleCitationTap(String citeRef) async {
    CitationDTO? cit;
    if (widget.response.citations.containsKey(citeRef)) {
      cit = widget.response.citations[citeRef];
    } else if (widget.response.citations.containsKey('cit_$citeRef')) {
      cit = widget.response.citations['cit_$citeRef'];
    } else {
      final idx = int.tryParse(citeRef);
      if (idx != null && idx > 0 && idx <= widget.response.citations.length) {
        cit = widget.response.citations.values.elementAt(idx - 1);
      }
    }

    if (cit != null && cit.sourceUrl.isNotEmpty) {
      final uri = Uri.tryParse(cit.sourceUrl);
      if (uri != null) {
        try {
          bool launched =
              await launchUrl(uri, mode: LaunchMode.externalApplication);
          if (!launched) {
            launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
          }
          if (!launched && mounted) {
            _showToast('تعذر فتح رابط المصدر ($citeRef)');
          }
        } catch (e) {
          if (mounted) _showToast('تعذر فتح رابط المصدر ($citeRef)');
        }
      }
    } else if (cit != null) {
      _showToast('المصدر ($citeRef): ${cit.bookTitle}');
    } else {
      _showToast('المصدر رقم $citeRef غير متوفر');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    // Build a map from normalized citation key to book title for inline display
    final Map<String, String> citationNames = {};
    for (final entry in widget.response.citations.entries) {
      final normalizedKey = entry.key.replaceAll('cit_', '');
      citationNames[normalizedKey] = entry.value.bookTitle;
    }

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.only(left: 12.w),
          child: _ResponseHeader(isDark: isDark),
        ),
        Container(
          margin: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF1B2436).withOpacity(0.85)
                : Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(0.r),
              bottomLeft: Radius.circular(20.r),
              bottomRight: Radius.circular(20.r),
              topRight: Radius.circular(20.r),
            ),
            border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.09)
                  : const Color(0xFFCBD5E1),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.25 : 0.05),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Intro paragraph
              if (_parsed.intro != null && _parsed.intro!.isNotEmpty) ...[
                _IntroParagraph(
                  text: _parsed.intro!,
                  isDark: isDark,
                  onCitationTap: _handleCitationTap,
                  citationNames: citationNames,
                ),
                SizedBox(height: 10.h),
              ],

              // Sections
              ..._parsed.sections.asMap().entries.map((e) {
                final section = e.value;
                return AnswerSectionCard(
                  section: section,
                  onCitationTap: _handleCitationTap,
                  citationNames: citationNames,
                );
              }),

              // Citations
              if (widget.response.citations.isNotEmpty && !_isStreaming)
                Padding(
                  padding: EdgeInsets.only(top: 4.h),
                  child: CitationsSection(citations: widget.response.citations),
                ),

              if (widget.showFooter && !_isStreaming) ...[
                SizedBox(height: 14.h),
                _ResponseActionBar(
                  linkCopied: _linkCopied,
                  onCopyLink: _copyLink,
                  isDark: isDark,
                  isLiked: _isLiked,
                  isDisliked: _isDisliked,
                  copyDone: _copyDone,
                  onLike: () {
                    setState(() {
                      _isLiked = !_isLiked;
                      if (_isLiked) {
                        _isDisliked = false;
                        _handleRating('like');
                      }
                    });
                  },
                  onDislike: () {
                    setState(() {
                      _isDisliked = !_isDisliked;
                      if (_isDisliked) {
                        _isLiked = false;
                        _handleRating('dislike');
                      }
                    });
                  },
                  onCopy: _copyAnswer,
                  onShare: _shareAnswer,
                  onPdfExport: _exportPdf,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _ResponseHeader extends StatelessWidget {
  final bool isDark;
  const _ResponseHeader({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (bounds) =>
              AppColors.textGradient.createShader(bounds),
          child: Text(
            'زاد',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 22.sp,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ),
        SizedBox(width: 8.w),
        Container(
          width: 40.w,
          height: 40.h,
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
              padding: EdgeInsets.all(4.sp),
              child: SvgPicture.asset(
                AppAssets.zaadLogo,
                colorFilter: ColorFilter.mode(
                    isDark ? Colors.white : AppColors.primary, BlendMode.srcIn),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _IntroParagraph extends StatelessWidget {
  final String text;
  final bool isDark;
  final void Function(String citationRef)? onCitationTap;
  final Map<String, String>? citationNames;

  const _IntroParagraph({
    required this.text,
    required this.isDark,
    this.onCitationTap,
    this.citationNames,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A29) : Colors.white,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color:
              isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFCBD5E1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.15 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
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

class _ResponseActionBar extends StatelessWidget {
  final bool isDark;
  final bool isLiked;
  final bool isDisliked;
  final bool copyDone;
  final bool linkCopied;
  final VoidCallback onLike;
  final VoidCallback onDislike;
  final VoidCallback onCopy;
  final VoidCallback onCopyLink;
  final VoidCallback onShare;
  final VoidCallback onPdfExport;

  const _ResponseActionBar({
    required this.isDark,
    required this.isLiked,
    required this.isDisliked,
    required this.copyDone,
    required this.linkCopied,
    required this.onLike,
    required this.onDislike,
    required this.onCopy,
    required this.onCopyLink,
    required this.onShare,
    required this.onPdfExport,
  });

  @override
  Widget build(BuildContext context) {
    final borderDecoration = BoxDecoration(
      color: isDark
          ? Colors.white.withOpacity(0.05)
          : const Color(0xFFE2E8F0).withOpacity(0.6),
      borderRadius: BorderRadius.circular(12.r),
    );

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: borderDecoration,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // PDF Export
          _ActionButton(
            icon: Icons.picture_as_pdf_rounded,
            tooltip: 'تصدير كملف PDF',
            color: isDark ? const Color(0xFFC084FC) : AppColors.primary,
            onTap: onPdfExport,
          ),
          // Share
          _ActionButton(
            icon: Icons.share_rounded,
            tooltip: 'مشاركة الإجابة',
            color: isDark ? Colors.white70 : const Color(0xFF475569),
            onTap: onShare,
          ),
          // Copy Link
          _ActionButton(
            icon: linkCopied ? Icons.check_rounded : Icons.link_rounded,
            tooltip: linkCopied ? 'تم نسخ الرابط' : 'نسخ رابط السؤال',
            color: linkCopied
                ? const Color(0xFF10B981)
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            onTap: onCopyLink,
          ),
          // Copy
          _ActionButton(
            icon: copyDone ? Icons.check_rounded : Icons.copy_rounded,
            tooltip: copyDone ? 'تم النسخ' : 'نسخ النص',
            color: copyDone
                ? const Color(0xFF10B981)
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            onTap: onCopy,
          ),
          // Dislike
          _ActionButton(
            icon: isDisliked
                ? Icons.thumb_down_rounded
                : Icons.thumb_down_outlined,
            tooltip: 'لم يعجبني',
            color: isDisliked
                ? Colors.red.shade400
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            onTap: onDislike,
          ),
          // Like
          _ActionButton(
            icon: isLiked ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
            tooltip: 'إعجاب',
            color: isLiked
                ? const Color(0xFF10B981)
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            onTap: onLike,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10.r),
        child: Padding(
          padding: EdgeInsets.all(8.w),
          child: Icon(icon, size: 18.sp, color: color),
        ),
      ),
    );
  }
}
