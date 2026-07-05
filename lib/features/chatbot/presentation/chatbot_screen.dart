import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:top_snackbar_flutter/top_snack_bar.dart';
import 'package:zaad/core/routes/app_routes.dart';
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';
import 'package:zaad/features/chatbot/presentation/widgets/highlight_widget.dart';

import '../../../core/di/injection.dart';
import '../../../core/utils/app_assets.dart';
import '../../../core/utils/app_colors/app_colors.dart';
import '../../../core/utils/app_strings.dart';
import '../domain/models/field_option.dart';
import 'cubit/chatbot_cubit.dart';
import 'cubit/chatbot_state.dart';
import 'widgets/chat_input_field.dart';
import 'widgets/chatbot_app_bar.dart';
import 'widgets/chatbot_drawer.dart';
import 'widgets/field_selection_bottom_sheet.dart';
import 'widgets/selected_field_indicator.dart';
import 'widgets/suggested_questions_list.dart';

import '../domain/models/chat_domain.dart';
import 'widgets/chat_message_bubble.dart';
import 'package:zaad/core/services/shared_prefs.dart';

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
    FieldOption("تفسير", AppAssets.sera),
    FieldOption("الحديث", AppAssets.sera),
    FieldOption(AppStrings.quranicSciences, AppAssets.olomQuran),
    FieldOption(AppStrings.history, AppAssets.tarej),
    FieldOption(AppStrings.language, AppAssets.luja),
  ];

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

  final FocusNode _focusNode = FocusNode();
  final GlobalKey voiceKey = GlobalKey();

  @override
  void initState() {
    bool isShowTutorial = SharedPrefs.getBool('showTutorial') ?? true;
    if (isShowTutorial) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showTutorial(context, voiceKey);
        SharedPrefs.setBool('showTutorial', false);
      });
    }
    super.initState();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<ChatbotCubit>(),
      child: BlocConsumer<ChatbotCubit, ChatbotState>(
        listener: (context, state) {
          if (state is ChatbotMessageFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.errorMessage,
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                backgroundColor: Colors.red.shade600,
                behavior: SnackBarBehavior.floating,
              ),
            );
          } else if (state is ChatbotMessageSuccess ||
              state is ChatbotMessageSending) {
            _scrollToBottom();
          }
        },
        builder: (context, state) {
          final cubit = context.read<ChatbotCubit>();
          final messages = state.messages;
          final isSending = state is ChatbotMessageSending;

          return Scaffold(
            extendBody: true,
            extendBodyBehindAppBar: true,
            resizeToAvoidBottomInset: false,
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
              child: Column(
                children: [
                  SizedBox(height: 5.h),
                  Expanded(
                    child: state.isLoadingHistory
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.primary,
                            ),
                          )
                        : messages.isEmpty
                            ? const Center(
                                child: SuggestedQuestionsList(),
                              )
                            : ListView.builder(
                                controller: _scrollController,
                                padding: EdgeInsets.only(
                                  top: MediaQuery.of(context).padding.top +
                                      kToolbarHeight +
                                      10.h,
                                  bottom: 120.h,
                                ),
                                itemCount:
                                    messages.length + (isSending ? 1 : 0),
                                itemBuilder: (context, index) {
                                  if (index == messages.length) {
                                    return _buildTypingIndicator(context);
                                  }
                                  return ChatMessageBubble(
                                      message: messages[index]);
                                },
                              ),
                  ),
                ],
              ),
            ),
            bottomNavigationBar: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: ChatInputField(
                isLoading: isSending,
                voiceKey: voiceKey,
                focusNode: _focusNode,
                controller: _messageController,
                onSend: () {
                  if (_messageController.text.isEmpty) {
                    Navigator.pushNamed(context, AppRoutes.childMode);
                  } else {
                    final text = _messageController.text.trim();
                    if (text.isNotEmpty) {
                      cubit.sendMessage(
                        query: text,
                        domain:
                            ChatDomain.values[selectedFieldIndex ?? 0].index +
                                1,
                      );
                      _messageController.clear();
                      _scrollToBottom();
                    }
                  }
                },
                onCancel: () => cubit.cancelSendMessage(),
                onGridTap: () => _showFieldSelectionBottomSheet(context),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTypingIndicator(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 6.h, horizontal: 16.w),
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
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
        child: SizedBox(
          width: 40.w,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(3, (index) {
              return _PulsingDot(delayMs: index * 150);
            }),
          ),
        ),
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
            setState(() {
              selectedFieldIndex = index;
            });
            _showSelectionSnackBar(fields[index].title);
          },
        );
      },
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final int delayMs;
  const _PulsingDot({required this.delayMs});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _animation = Tween<double>(begin: 0.2, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    Future.delayed(Duration(milliseconds: widget.delayMs), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: 6.w,
        height: 6.h,
        decoration: BoxDecoration(
          color: isDark ? Colors.white70 : AppColors.primary,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
