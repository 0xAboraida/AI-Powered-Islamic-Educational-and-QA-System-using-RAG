import 'package:flutter/material.dart';

/// Parses the raw `answer` string from the API into structured sections.
class AnswerParser {
  static ParsedAnswer parse(String raw) {
    final lines = raw.split('\n');

    String? intro;
    final sections = <AnswerSection>[];
    AnswerSection? current;

    final introBuffer = StringBuffer();
    bool foundFirstSection = false;

    for (int i = 0; i < lines.length; i++) {
      final rawLine = lines[i];
      final cleanLine = rawLine.trim();

      // Check if this line is a section header
      bool isHeader = false;
      String headerTitle = '';

      if (cleanLine.startsWith('###')) {
        isHeader = true;
        headerTitle = cleanLine.replaceFirst(RegExp(r'^#+\s*'), '').trim();
      } else if (cleanLine.startsWith('**') &&
          (cleanLine.endsWith('**') ||
              cleanLine.endsWith(':**') ||
              cleanLine.endsWith(':'))) {
        isHeader = true;
        headerTitle = cleanLine.replaceAll('**', '').trim();
      }

      if (isHeader) {
        foundFirstSection = true;
        if (current != null) sections.add(current);
        current = AnswerSection(title: headerTitle, items: []);
      } else if (!foundFirstSection) {
        if (cleanLine.isEmpty) {
          introBuffer.write('\n\n');
        } else {
          if (introBuffer.isNotEmpty &&
              !introBuffer.toString().endsWith('\n\n')) {
            introBuffer.write('\n');
          }
          introBuffer.write(rawLine);
        }
      } else {
        if (cleanLine.isEmpty) {
          current?.items.add(const AnswerItem(
            type: AnswerItemType.paragraph,
            text: '',
          ));
          continue;
        }

        final bulletMatch = RegExp(r'^[\*\-\+]\s+(.+)$').firstMatch(cleanLine);
        final numberedMatch = RegExp(r'^\d+\.\s*(.+)$').firstMatch(cleanLine);

        if (bulletMatch != null) {
          current?.items.add(AnswerItem(
            type: AnswerItemType.listItem,
            text: bulletMatch.group(1)!.trim(),
          ));
        } else if (numberedMatch != null) {
          current?.items.add(AnswerItem(
            type: AnswerItemType.listItem,
            text: cleanLine, // Keep the number prefix
          ));
        } else {
          current?.items.add(AnswerItem(
            type: AnswerItemType.paragraph,
            text: cleanLine,
          ));
        }
      }
    }

    if (current != null) sections.add(current);

    final introText = introBuffer.toString().trim();
    if (introText.isNotEmpty) intro = introText;

    return ParsedAnswer(intro: intro, sections: sections);
  }

  /// Extracts citation keys referenced in a text, e.g. `[cit_2]` → `cit_2`,
  /// or `[2]` → key lookup by index.
  static List<String> extractCitationRefs(String text) {
    final refs = <String>[];
    final pattern = RegExp(r'\[(cit_\d+|\d+)\]');
    for (final m in pattern.allMatches(text)) {
      refs.add(m.group(1)!);
    }
    return refs;
  }

  /// Strips citation markers from display text (handles multi-cites like [3, 5] as well).
  static String stripCitationRefs(String text) =>
      text.replaceAll(RegExp(r'\s*\[[^\]]+\]'), '').trim();

  /// Parses inline markdown `**bold**` formatting into a List of TextSpans.
  static List<TextSpan> parseRichText(String text, TextStyle baseStyle) {
    final cleanText = stripCitationRefs(text);
    final List<TextSpan> spans = [];
    final regex = RegExp(r'\*\*(.*?)\*\*');
    int start = 0;

    for (final match in regex.allMatches(cleanText)) {
      if (match.start > start) {
        spans.add(TextSpan(
          text: cleanText.substring(start, match.start),
          style: baseStyle,
        ));
      }
      spans.add(TextSpan(
        text: match.group(1),
        style: baseStyle.copyWith(fontWeight: FontWeight.bold),
      ));
      start = match.end;
    }

    if (start < cleanText.length) {
      spans.add(TextSpan(
        text: cleanText.substring(start),
        style: baseStyle,
      ));
    }

    return spans;
  }
}

class ParsedAnswer {
  final String? intro;
  final List<AnswerSection> sections;

  const ParsedAnswer({this.intro, required this.sections});
}

class AnswerSection {
  final String title;
  final List<AnswerItem> items;

  AnswerSection({required this.title, required this.items});
}

class AnswerItem {
  final AnswerItemType type;
  final String text;

  const AnswerItem({required this.type, required this.text});
}

enum AnswerItemType { paragraph, listItem }
