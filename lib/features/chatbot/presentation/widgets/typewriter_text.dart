import 'dart:async';
import 'package:flutter/material.dart';

class TypewriterText extends StatefulWidget {
  final String text;
  final Duration speed;
  final TextStyle? style;
  final VoidCallback? onFinished;

  const TypewriterText({
    super.key,
    required this.text,
    this.speed = const Duration(milliseconds: 8),
    this.style,
    this.onFinished,
  });

  @override
  State<TypewriterText> createState() => _TypewriterTextState();
}

class _TypewriterTextState extends State<TypewriterText> {
  late final List<String> _chars;
  String _displayedText = "";
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _chars = widget.text.characters.toList();
    _startTyping();
  }

  void _startTyping() {
    _timer = Timer.periodic(widget.speed, (timer) {
      if (_currentIndex < _chars.length) {
        if (mounted) {
          setState(() {
            int step = 3;
            int end = (_currentIndex + step < _chars.length) ? _currentIndex + step : _chars.length;
            for (int i = _currentIndex; i < end; i++) {
              _displayedText += _chars[i];
            }
            _currentIndex = end;
          });
        }
      } else {
        _timer?.cancel();
        widget.onFinished?.call();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      _displayedText,
      style: widget.style,
    );
  }
}
