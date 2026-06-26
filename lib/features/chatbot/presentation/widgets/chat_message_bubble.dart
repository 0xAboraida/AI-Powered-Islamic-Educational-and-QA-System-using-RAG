import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/features/chatbot/domain/models/chat_message.dart';
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
      return AiResponseWidget(
        response: message.response!,
        animate: !message.isAnimated,
      );
    }

    // ── Plain user bubble  ──────────────────────────────────────────────────
    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: EdgeInsets.symmetric(vertical: 6.h, horizontal: 16.w),
          padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
          constraints: BoxConstraints(maxWidth: 0.78.sw),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20.r),
              topRight: Radius.circular(20.r),
              bottomLeft: Radius.circular(20.r),
              bottomRight: Radius.zero,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2ECC71).withOpacity(0.25),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Text(
            message.text,
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
      );
    }

    // ── Plain bot text bubble (fallback / simple messages) ──────────────────
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6.h, horizontal: 16.w),
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
        constraints: BoxConstraints(maxWidth: 0.78.sw),
        decoration: BoxDecoration(
          color: isDark ? AppColors.fieldDarkColor : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20.r),
            topRight: Radius.circular(20.r),
            bottomLeft: Radius.zero,
            bottomRight: Radius.circular(20.r),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
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
    );
  }
}
