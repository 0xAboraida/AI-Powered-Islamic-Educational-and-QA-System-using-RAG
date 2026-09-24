import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/svg.dart';
import 'package:zaad/core/utils/app_assets.dart';
import 'package:zaad/features/chatbot/domain/models/chat_message.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import 'ai_response_widget.dart';
import 'typewriter_text.dart';

class ChatMessageBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatMessageBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    // ── Structured AI response ──────────────────────────────────────────────
    if (!message.isUser && message.response != null) {
      final shouldAnimate = !message.isAnimated;
      if (shouldAnimate) {
        message.isAnimated = true;
      }
      return AiResponseWidget(
        response: message.response!,
        questionText: message.questionText,
        domainName: message.domainName,
        animate: shouldAnimate,
      );
    }

    // ── Plain user bubble  ──────────────────────────────────────────────────
    if (message.isUser) {
      return _UserMessageBubble(text: message.text);
    }

    // ── Plain bot text bubble (fallback / simple messages) ──────────────────
    return Padding(
      padding: EdgeInsets.only(left: 12.sp),
      child: Column(
        children: [
          Row(
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
                          isDark ? Colors.white : AppColors.primary,
                          BlendMode.srcIn),
                    ),
                  ),
                ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
              margin: EdgeInsets.symmetric(
                vertical: 6.h,
              ),
              padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
              constraints: BoxConstraints(maxWidth: 0.78.sw),
              decoration: BoxDecoration(
                // color: isDark ? AppColors.darkPrimary : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.zero,
                  topRight: Radius.circular(20.r),
                  bottomLeft: Radius.circular(20.r),
                  bottomRight: Radius.circular(20.r),
                ),
                color: isDark
                    ? const Color(0xFF1B2436).withOpacity(0.85)
                    : Colors.white,
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
              child: !message.isAnimated
                  ? TypewriterText(
                      text: message.text,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        color: isDark ? Colors.white : Colors.black87,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                        height: 1.5,
                      ),
                      onFinished: () => message.isAnimated = true,
                    )
                  : Text(
                      message.text,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        color: isDark ? Colors.white : Colors.black87,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                        height: 1.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UserMessageBubble extends StatefulWidget {
  final String text;

  const _UserMessageBubble({required this.text});

  @override
  State<_UserMessageBubble> createState() => _UserMessageBubbleState();
}

class _UserMessageBubbleState extends State<_UserMessageBubble> {
  bool _copied = false;

  Future<void> _copyText() async {
    await Clipboard.setData(ClipboardData(text: widget.text));
    if (!mounted) return;
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  Future<void> _shareQuestion() async {
    final uri = Uri(
      scheme: 'https',
      host: 'zad-deeplink.mohamedqandill912.workers.dev',
      path: AppRoutes.chatbot,
      queryParameters: {
        'question': widget.text,
      },
    );

    final link = uri.toString();
    final messageText = '✨ سؤال من تطبيق زاد للعلوم الشرعية 🌿\n\n'
        '${widget.text}\n\n'
        '📍 رابط السؤال في التطبيق:\n$link';

    await Share.share(
      messageText,
      subject: 'سؤال من تطبيق زاد للعلوم الشرعية',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6.h, horizontal: 16.w),
        constraints: BoxConstraints(maxWidth: 0.78.sw),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20.r),
                  topRight: Radius.circular(20.r),
                  bottomLeft: Radius.circular(20.r),
                  bottomRight: Radius.zero,
                ),
              ),
              child: Text(
                widget.text,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  color: Colors.white,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                  height: 1.5,
                ),
              ),
            ),
            SizedBox(height: 4.h),
            // Row(
            //   mainAxisSize: MainAxisSize.min,
            //   children: [
            //     GestureDetector(
            //       onTap: _shareQuestion,
            //       behavior: HitTestBehavior.opaque,
            //       child: Padding(
            //         padding:
            //             EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
            //         child: Row(
            //           mainAxisSize: MainAxisSize.min,
            //           children: [
            //             Text(
            //               'مشاركة',
            //               style: TextStyle(
            //                 fontFamily: 'Cairo',
            //                 fontSize: 11.sp,
            //                 color: Colors.grey.shade500,
            //                 fontWeight: FontWeight.w600,
            //               ),
            //             ),
            //             SizedBox(width: 4.w),
            //             Icon(
            //               Icons.share_rounded,
            //               size: 13.sp,
            //               color: Colors.grey.shade500,
            //             ),
            //           ],
            //         ),
            //       ),
            //     ),
            //     SizedBox(width: 12.w),
            GestureDetector(
              onTap: _copyText,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _copied ? 'تم النسخ' : 'نسخ',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11.sp,
                        color: _copied
                            ? const Color(0xFF10B981)
                            : Colors.grey.shade500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(width: 4.w),
                    Icon(
                      _copied ? Icons.check_rounded : Icons.copy_rounded,
                      size: 13.sp,
                      color: _copied
                          ? const Color(0xFF10B981)
                          : Colors.grey.shade500,
                    ),
                  ],
                ),
              ),
            ),
            //   ],
            // ),
          ],
        ),
      ),
    );
  }
}
