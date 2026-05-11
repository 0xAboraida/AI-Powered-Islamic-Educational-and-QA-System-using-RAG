import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:top_snackbar_flutter/top_snack_bar.dart';

import '../../../core/utils/app_assets.dart';
import '../../../core/utils/app_colors/app_colors.dart';
import '../../../core/utils/app_strings.dart';
import '../domain/models/field_option.dart';
import 'widgets/chat_input_field.dart';
import 'widgets/chatbot_app_bar.dart';
import 'widgets/chatbot_drawer.dart';
import 'widgets/field_selection_bottom_sheet.dart';
import 'widgets/selected_field_indicator.dart';
import 'widgets/suggested_questions_list.dart';

import '../domain/models/chat_message.dart';
import 'widgets/chat_message_bubble.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  int? selectedFieldIndex;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<FieldOption> fields = [
    FieldOption(AppStrings.fiqh, AppAssets.feqh),
    FieldOption(AppStrings.aqidah, AppAssets.aqeda),
    FieldOption(AppStrings.sirah, AppAssets.sera),
    FieldOption(AppStrings.history, AppAssets.tarej),
    FieldOption(AppStrings.language, AppAssets.luja),
    FieldOption(AppStrings.quranicSciences, AppAssets.olomQuran),
  ];

  final List<ChatMessage> _messages = [
    ChatMessage(
        text: "السلام عليكم، كيف يمكنني مساعدتك اليوم؟",
        isUser: false,
        timestamp: DateTime.now(),
        isAnimated: true),
    ChatMessage(
        text: "أريد أن أسأل عن فضل صلاة الوتر",
        isUser: true,
        timestamp: DateTime.now(),
        isAnimated: true),
    ChatMessage(
        text: "صلاة الوتر سنة مؤكدة، ولها فضل عظيم، وهي خاتمة صلاة الليل.",
        isUser: false,
        timestamp: DateTime.now(),
        isAnimated: true),
  ];

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(
        text: _messageController.text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _messageController.clear();
    });

    // Simple auto-reply for testing
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.add(ChatMessage(
          text: "شكراً لسؤالك، سأقوم بالبحث عن الإجابة الدقيقة لك.",
          isUser: false,
          timestamp: DateTime.now(),
        ));
      });
      _scrollToBottom();
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      
      extendBody: true,
      extendBodyBehindAppBar: true,
      appBar: const ChatbotAppBar(),
      drawer: const ChatbotDrawer(),
      body: Container(
        
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: Theme.of(context).brightness == Brightness.dark
              ? AppColors.darkChatGradient
              : LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.chatBg.withOpacity(0.3),
                    Colors.white,
                  ],
                ),
        ),

        child: SafeArea(
          child: Column(
            children: [
              SizedBox(height: 5.h),
              Expanded(
                child: _messages.isEmpty
                    ? const Center(
                        child: SuggestedQuestionsList(),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: EdgeInsets.only(top: 10.h, bottom: 100.h),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          return ChatMessageBubble(message: _messages[index]);
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: ChatInputField(
        controller: _messageController,
        onSend: _sendMessage,
        onGridTap: () => _showFieldSelectionBottomSheet(context),
      ),
    );
  }

  void _showSelectionSnackBar(String title) {
    showTopSnackBar(
      displayDuration: const Duration(milliseconds: 800),
      Overlay.of(context),
      Material(
        color: Colors.transparent,
        child: Container(
          margin: EdgeInsets.symmetric(horizontal: 16.w),
          padding: EdgeInsets.symmetric(
            horizontal: 18.w,
            vertical: 16.h,
          ),
          decoration: BoxDecoration(
            gradient: AppColors.textGradient,
            borderRadius: BorderRadius.circular(18.r),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 20,
                offset: const Offset(0, 8),
              )
            ],
          ),
          child: Row(
            children: [
              Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 22.sp,
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  "سؤالك الحالي في مجال $title",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFieldSelectionBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return FieldSelectionBottomSheet(
          fields: fields,
          initialSelectedIndex: selectedFieldIndex,
          onSelected: (index) {
            _showSelectionSnackBar(fields[index].title);
          },
        );
      },
    );
  }
}
