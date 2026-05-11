import 'package:flutter/material.dart';

abstract class AppColors {
  static const Color primary = Color(0xFF6A1B9A);
  static const Color darkPrimary = Color(0xFF12121F);
  static const Color darkSecondary = Color(0xFFC084FC);
  static const Color fieldDarkColor = Color(0xFF2A2D3E);
  static const Color card1BorderStart = Color(0xFF4FC3F7);
  static const Color secondary = Color(0xFF4A148C);
  static const Color card1BorderEnd = Color(0xFF9575CD);
  static const Color card2Start = Color(0xFFBA68C8);
  static const Color card2End = Color(0xFF7B1FA2);
  static const Color buttonStart = Color(0xFFCE93D8);
  static const Color buttonEnd = Color(0xFF6A1B9A);

  static const LinearGradient textGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFFC54EEC)],
  );
  static const LinearGradient cardGradient = LinearGradient(
    stops: [0.0, 0.0],
    colors: [
      Color(0xFFFAF5FF),
      Color(0xFFF3E8FF),
    ],
  );
  static const LinearGradient selectedCardGradient = LinearGradient(
    stops: [0.0, 0.97],
    colors: [
      Color(0xFFFAF5FF),
      Color(0xFFAE91CE),
    ],
  );
  static const LinearGradient selectedSecondaryCardGradient = LinearGradient(
    stops: [0.0, 0.97],
    colors: [
      Color(0xFF7B1FA2),
      Color(0xFF6A1B9A),
    ],
  );
  static const LinearGradient darkChatGradient = LinearGradient(
    stops: [0.0, 0.60, 1],
    end: Alignment.bottomCenter,
    begin: Alignment.topCenter,
    colors: [
      Color(0xFF0E0F14),
      Color(0xFF14162A),
      Color(0xFF1B1140),
    ],
  );

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFC020F0), Color(0xFF8A17C9), Color(0xFF5B0E9C)],
  );

  static const LinearGradient card2Gradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [card2Start, card2End],
  );

  static const LinearGradient buttonGradient = LinearGradient(
    begin: Alignment.centerRight,
    end: Alignment.centerLeft,
    colors: [buttonStart, buttonEnd],
  );

  static const Color chatBg = Color(0xFFF3E5F5);
}
