import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:zaad/features/chatbot/domain/models/chat_message.dart';
import '../../../../core/utils/app_colors/app_colors.dart';

import 'typewriter_text.dart';

class ChatMessageBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatMessageBubble({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    bool isUser = message.isUser;
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 8.h, horizontal: 16.w),
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 18.w),
        constraints: BoxConstraints(maxWidth: 0.75.sw),
        decoration: BoxDecoration(
          gradient: isUser ? AppColors.primaryGradient : null,
          color: isUser
              ? null
              : (isDark ? AppColors.fieldDarkColor : Colors.white),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20.r),
            topRight: Radius.circular(20.r),
            bottomLeft: isUser ? Radius.circular(20.r) : Radius.zero,
            bottomRight: isUser ? Radius.zero : Radius.circular(20.r),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: (!isUser && !message.isAnimated)
            ? TypewriterText(
                text: message.text,
                style: TextStyle(
                  color: isDark ? Colors.white : Colors.black87,
                  fontSize: 15.sp,
                  fontWeight: FontWeight.w700,
                  height: 1.4,
                ),
                onFinished: () => message.isAnimated = true,
              )
            : Text(
                message.text,
                style: TextStyle(
                  color: isUser
                      ? Colors.white
                      : (isDark ? Colors.white : Colors.black87),
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w700,
                  height: 1.4,
                ),
              ),
      ),
    );

  }
}
