import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:siri_wave/siri_wave.dart';
import 'package:zaad/core/api/secret_key.dart';
import 'package:zaad/core/di/injection.dart';
import 'package:zaad/core/services/shared_prefs_service.dart';
import 'package:zaad/core/theme/theme_provider.dart';
import 'package:zaad/core/utils/app_assets.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';
import 'package:zaad/core/utils/app_strings.dart';
import 'package:zaad/features/chatbot/presentation/widgets/chatbot_app_bar.dart';
import 'package:zaad/core/services/shared_prefs.dart';
import 'package:livekit_client/livekit_client.dart';

class ChildModeScreen extends StatefulWidget {
  const ChildModeScreen({super.key});

  @override
  State<ChildModeScreen> createState() => _ChildModeScreenState();
}

class _ChildModeScreenState extends State<ChildModeScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _rotationController;
  bool isSpeaking = false;
  late final Room _room;
  EventsListener<RoomEvent>? _listener;

  @override
  void initState() {
    super.initState();
    _room = Room();
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
  }

  Future<void> _connectToLiveKit() async {
    try {
      const savedToken = SecretKey.liveKitApiKey;

      // NOTE: You need a valid token to connect.
      // Replace 'YOUR_TOKEN_HERE' with an actual token from your backend.
      const url = SecretKey.liveKitHost;

      await _room.connect(url, savedToken);

      _listener = _room.createListener();
      _listener!.on<RoomDisconnectedEvent>((event) {
        if (mounted) {
          setState(() {
            isSpeaking = false;
            _rotationController.stop();
          });
        }
      });

      // Enable microphone to speak to the voice agent
      await _room.localParticipant?.setMicrophoneEnabled(true);

      setState(() {
        isSpeaking = true;
        _rotationController.repeat();
      });
    } catch (e) {
      debugPrint('LiveKit connection error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل الاتصال: $e')),
        );
      }
    }
  }

  Future<void> _disconnectLiveKit() async {
    try {
      await _room.localParticipant?.setMicrophoneEnabled(false);
      await _room.disconnect();
    } catch (e) {
      debugPrint('Error disconnecting LiveKit: $e');
    } finally {
      if (mounted) {
        setState(() {
          isSpeaking = false;
          _rotationController.stop();
        });
      }
    }
  }

  @override
  void dispose() {
    _listener?.dispose();
    _room.disconnect();
    _room.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Consumer<ThemeProvider>(
          builder: (context, themeProvider, child) => ChatbotAppBar(
            actionWidget: InkWell(
              onTap: () {
                themeProvider.toggleTheme();
              },
              child: Container(
                width: 40.w,
                height: 40.w,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: Padding(
                  padding: EdgeInsets.all(8.sp),
                  child: SvgPicture.asset(
                    isDark ? AppAssets.sun : AppAssets.mode,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: isDark
              ? AppColors.darkChatGradient
              : LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  stops: const [0.0, 0.65, 1.0],
                  colors: [
                    AppColors.secondary.withOpacity(0.05),
                    Colors.white.withOpacity(0.3),
                    AppColors.secondary.withOpacity(0.05),
                  ],
                ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Spacer(),
            Column(
              children: [
                Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Rotating Gradient Shadow / Glow (Gemini Chat style)
                      RotationTransition(
                        turns: _rotationController,
                        child: Container(
                          width: 218.w,
                          height: 218.h,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const SweepGradient(
                              colors: [
                                AppColors.card2End,
                                AppColors.primary,
                                Colors.purple,
                                AppColors.card2End,
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.card2End.withOpacity(0.6),
                                blurRadius: 30,
                                spreadRadius: 4,
                                offset: const Offset(12, 12),
                              ),
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.6),
                                blurRadius: 30,
                                spreadRadius: 4,
                                offset: const Offset(-12, -12),
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Core Logo Container
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 10.w, vertical: 10.h),
                        width: 220.w,
                        height: 220.h,
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.darkPrimary.withOpacity(0.8)
                              : Colors.white.withOpacity(0.4),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark
                                ? AppColors.card2End.withOpacity(0.4)
                                : Colors.transparent,
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                                color: isDark
                                    ? AppColors.card2End.withOpacity(0.2)
                                    : Colors.white,
                                blurRadius: 25,
                                spreadRadius: 3,
                                blurStyle:
                                    isDark ? BlurStyle.outer : BlurStyle.inner),
                            BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 15,
                                blurStyle: BlurStyle.outer),
                          ],
                        ),
                        child: Center(
                            child: SvgPicture.asset(
                          AppAssets.zadColoredLogo,
                          width: 270.w,
                          height: 270.h,
                          fit: BoxFit.cover,
                        )),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 30.h),
            ShaderMask(
              blendMode: BlendMode.srcIn,
              shaderCallback: (bounds) {
                return AppColors.textGradient.createShader(bounds);
              },
              child: Text(
                isSpeaking ? 'استمع اليك...' : 'مرحبا بك, اضغط للتحدث...',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Spacer(),
            Visibility(
              visible: isSpeaking,
              maintainSize: true,
              maintainState: true,
              maintainAnimation: true,
              child: SiriWave(),
            ),
            InkWell(
              overlayColor: WidgetStateProperty.all(Colors.transparent),
              onTap: () {
                if (isSpeaking) {
                  _disconnectLiveKit();
                } else {
                  _connectToLiveKit();
                }
              },
              child: Container(
                  width: 110.w,
                  height: 110.h,
                  decoration: BoxDecoration(
                      color: isDark
                          ? Colors.transparent
                          : Colors.white.withOpacity(0.1),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                            color: isDark
                                ? AppColors.card2End.withOpacity(0.6)
                                : Colors.black.withOpacity(0.2),
                            blurRadius: 10,
                            blurStyle: BlurStyle.outer)
                      ]),
                  child: Padding(
                    padding: EdgeInsets.all(9.sp),
                    child: Container(
                      width: 90.w,
                      height: 90.h,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.card2End.withOpacity(0.2),
                            width: 1,
                          )),
                      child: Center(
                        child: Container(
                          padding: EdgeInsets.all(10.sp),
                          width: 80.w,
                          height: 80.h,
                          decoration: const BoxDecoration(
                              color: AppColors.primary, shape: BoxShape.circle),
                          child: Padding(
                              padding: EdgeInsets.all(14.sp),
                              child: SvgPicture.asset(
                                isSpeaking ? AppAssets.close : AppAssets.mic,
                                fit: BoxFit.contain,
                                colorFilter: const ColorFilter.mode(
                                    Colors.white, BlendMode.srcIn),
                              )),
                        ),
                      ),
                    ),
                  )),
            ),
            SizedBox(height: 50.h),
          ],
        ),
      ),
    );
  }
}

class SiriWave extends StatelessWidget {
  SiriWave({super.key});

  final controller = IOS9SiriWaveformController(
    amplitude: 0.9,
    color1: AppColors.primary,
    color2: AppColors.card2End,
    speed: 0.15,
  );

  @override
  Widget build(BuildContext context) => Transform.scale(
        scaleY: 5,
        child: SiriWaveform.ios9(
          controller: controller,
          options: IOS9SiriWaveformOptions(
            showSupportBar: false,
            height: 50,
            width: 250.w,
          ),
        ),
      );
}
