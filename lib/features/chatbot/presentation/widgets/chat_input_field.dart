import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../../core/utils/app_assets.dart';
import '../../../../core/utils/app_colors/app_colors.dart';
import '../../../../core/utils/app_strings.dart';

class ChatInputField extends StatefulWidget {
  final VoidCallback onGridTap;
  final TextEditingController? controller;
  final VoidCallback? onSend;
  final VoidCallback? onCancel;
  final FocusNode focusNode;
  final GlobalKey voiceKey;
  final bool? isLoading;

  const ChatInputField({
    super.key,
    required this.onGridTap,
    this.controller,
    this.isLoading,
    this.onSend,
    this.onCancel,
    required this.focusNode,
    required this.voiceKey,
  });

  @override
  State<ChatInputField> createState() => _ChatInputFieldState();
}

class _ChatInputFieldState extends State<ChatInputField> {
  late VoidCallback _listener;
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;

  bool _isFocused = false;

  @override
  void initState() {
    super.initState();

    _listener = () {
      setState(() {});
    };

    widget.controller?.addListener(_listener);
    widget.focusNode.addListener(_focusListener);
  }

  void _focusListener() {
    setState(() {
      _isFocused = widget.focusNode.hasFocus;
    });
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_listener);
    widget.focusNode.removeListener(_focusListener);
    _speech.stop();
    super.dispose();
  }

  Future<void> _listen() async {
    if (!_isListening) {
      bool available = await _speech.initialize(
        onStatus: (val) {
          debugPrint('Speech status: $val');
          if (val == 'done' || val == 'notListening') {
            setState(() => _isListening = false);
          }
        },
        onError: (val) {
          debugPrint('Speech error: $val');
          setState(() => _isListening = false);
        },
      );
      if (available) {
        setState(() => _isListening = true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text(
                'تحدث الآن باللغة العربية...',
                textAlign: TextAlign.right,
                style: TextStyle(fontFamily: 'Cairo'),
              ),
              duration: const Duration(seconds: 4),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10.r),
              ),
            ),
          );
        }

        _speech.listen(
          onResult: (val) {
            if (mounted) {
              setState(() {
                widget.controller?.text = val.recognizedWords;
                widget.controller?.selection = TextSelection.fromPosition(
                  TextPosition(offset: widget.controller!.text.length),
                );
              });
            }
          },
          localeId: 'ar',
        );
      }
      if (!available) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Speech recognition is not available on this device'),
          ),
        );
        return;
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    final showVoice = widget.controller?.text.trim().isEmpty ?? true;
    return Padding(
      padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 10.h),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkPrimary : Colors.white,
          borderRadius: BorderRadius.circular(30.r),
          border: Border.all(
            color: _isFocused
                ? AppColors.primary
                : (isDark
                    ? const Color(0xFFC54EEC).withOpacity(0.2)
                    : const Color(0xFFC54EEC).withOpacity(0.4)),
            width: 2,
          ),
          boxShadow: const [
            BoxShadow(
                color: Color(0xFFC54EEC),
                blurRadius: 20,
                spreadRadius: -15,
                offset: Offset(6, 0)),
            BoxShadow(
              color: Color(0xFF3B82F6),
              blurRadius: 20,
              spreadRadius: -15,
              offset: Offset(-6, 0),
            ),
          ],
        ),
        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Right Side: Icons
            Padding(
              padding: EdgeInsets.only(right: 12.w, left: 8.w, bottom: 12.h),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: widget.onGridTap,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        SvgPicture.asset(
                          AppAssets.grid,
                          width: 20.w,
                          height: 20.w,
                          colorFilter: const ColorFilter.mode(
                              Color(0xFFBA68C8), BlendMode.srcIn),
                        ),
                        Positioned(
                          top: -2,
                          right: -2,
                          child: Container(
                            width: 6.w,
                            height: 6.w,
                            decoration: const BoxDecoration(
                              color: Color(0xFFBA68C8),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 16.w),
                  InkWell(
                    onTap: widget.isLoading == true ? null : _listen,
                    child: _isListening
                        ? const Icon(
                            Icons.mic,
                            color: Colors.red,
                            size: 20,
                          )
                        : SvgPicture.asset(
                            AppAssets.mic,
                            width: 20.w,
                            height: 20.w,
                            colorFilter: const ColorFilter.mode(
                                Color(0xFFBA68C8), BlendMode.srcIn),
                          ),
                  ),
                ],
              ),
            ),

            // Middle: TextField
            Expanded(
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: TextField(
                  readOnly: widget.isLoading ?? false,
                  focusNode: widget.focusNode,
                  controller: widget.controller,
                  minLines: 1,
                  maxLines: 5,
                  keyboardType: TextInputType.multiline,
                  onSubmitted: (_) => widget.controller!.text.isEmpty
                      ? null
                      : widget.onSend?.call(),
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w600,
                  ),
                  decoration: InputDecoration(
                    focusedBorder: const UnderlineInputBorder(
                        borderSide: BorderSide(color: Colors.transparent)),
                    fillColor: Colors.transparent,
                    filled: true,
                    hintText: AppStrings.writeQuestion,
                    hintStyle: TextStyle(
                      color: isDark
                          ? Colors.white.withOpacity(0.4)
                          : Colors.grey[400],
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                    ),
                    border: InputBorder.none,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 10.h),
                  ),
                ),
              ),
            ),

            // Left Side: Send / Voice Wave
            Padding(
              padding: EdgeInsets.only(left: 8.w, right: 4.w, bottom: 4.h),
              child: InkWell(
                onTap:
                    widget.isLoading == true ? widget.onCancel : widget.onSend,
                child: Container(
                  width: 35.w,
                  height: 35.w,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.textGradient,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: widget.isLoading == true
                      ? const Center(
                          child: Icon(
                            Icons.stop_circle_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        )
                      : showVoice
                          ? Center(
                              key: widget.voiceKey,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  _bar(10),
                                  const SizedBox(width: 3),
                                  _bar(18),
                                  const SizedBox(width: 3),
                                  _bar(15),
                                  const SizedBox(width: 3),
                                  _bar(10),
                                ],
                              ),
                            )
                          : Padding(
                              padding: EdgeInsets.all(10.w),
                              child: SvgPicture.asset(
                                AppAssets.send,
                                colorFilter: const ColorFilter.mode(
                                    Colors.white, BlendMode.srcIn),
                              ),
                            ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _bar(double h) => Container(
      width: 3,
      height: h,
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(100),
      ),
    );
