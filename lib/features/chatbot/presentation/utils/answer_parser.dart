import 'package:flutter/material.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';

/// Item types for parsed answer items.
enum AnswerItemType {
  paragraph,
  listItem,
  quote,
  quran,
  hadith,
  saying,
  poetry,
  reference,
  subFrame,
}

/// Represents an individual item inside an answer section.
class AnswerItem {
  final AnswerItemType type;
  final String text;
  final String? referenceText;
  final bool isNumbered;
  final int indentLevel;
  final List<AnswerItem>? childItems;

  const AnswerItem({
    required this.type,
    required this.text,
    this.referenceText,
    this.isNumbered = false,
    this.indentLevel = 0,
    this.childItems,
  });
}

/// Represents a section in the parsed answer.
class AnswerSection {
  final String title;
  final List<AnswerItem> items;

  const AnswerSection({
    required this.title,
    required this.items,
  });
}

/// Holds the complete parsed output of an AI raw answer text.
class ParsedAnswer {
  final String? intro;
  final List<AnswerSection> sections;

  const ParsedAnswer({
    this.intro,
    required this.sections,
  });
}

/// Central parser class that preprocesses and parses raw AI answer strings into structured data.
class AnswerParser {
  /// Preprocesses raw frame text by normalizing headings, list items, citations,
  /// squashed text, Islamic quote tags (&...&, %...%, @...@, $...$, ^...^), auto-indenting lists, etc.
  static String preprocess(String text) {
    if (text.trim().isEmpty) return text;

    // 1. Remove standalone lines containing only a period or Arabic full stop
    text = text.replaceAll(RegExp(r'^\s*[\.\u06D4]\s*$', multiLine: true), '');

    // 2. Preprocess citation numbers like [1], [1] [2], [1][2], [1] و [2] into normalized brackets
    text = text.replaceAllMapped(
      RegExp(r'(?:\[\s*\d+\s*\](?:[\s,،و]*\[\s*\d+\s*\])*)'),
      (match) {
        final str = match.group(0)!;
        final numbers = RegExp(r'\d+')
            .allMatches(str)
            .map((m) => m.group(0)!)
            .toSet()
            .toList();
        if (numbers.isEmpty) return str;
        return '[${numbers.join(', ')}]';
      },
    );

    // 3. Fix missing spaces in headings (e.g., ###1. -> ### 1., ###أ. -> ### أ.)
    text = text.replaceAllMapped(
      RegExp(r'^(#{1,4})([0-9]+\.|[\u0600-\u06FF]+\.)', multiLine: true),
      (m) => '${m[1]} ${m[2]}',
    );

    // 4. Normalize extra spaces after list bullet markers (e.g. "*   **Title**" -> "* **Title**")
    text = text.replaceAllMapped(
      RegExp(r'^([ \t]*[\*\-\+]|\d+\.|\w+\.)[ \t]{2,}', multiLine: true),
      (m) => '${m[1]} ',
    );

    // 5. Fix squashed text where AI puts lists or headings on the same line as previous text
    text = text.replaceAllMapped(
      RegExp(r'([^\s#])[ \t]+(#{1,4}[ \t]+)'),
      (m) => '${m[1]}\n\n${m[2]}',
    );
    text = text.replaceAllMapped(
      RegExp(r'([^\s#])[ \t]+([0-9]+\.[ \t]+\*\*)'),
      (m) => '${m[1]}\n\n${m[2]}',
    );
    text = text.replaceAllMapped(
      RegExp(r'([^\s#])[ \t]+([\u0600-\u06FF]\.[ \t]+\*\*)'),
      (m) => '${m[1]}\n\n${m[2]}',
    );
    text = text.replaceAllMapped(
      RegExp(r'([^\s#])[ \t]+(\*[ \t]+\*\*)'),
      (m) => '${m[1]}\n\n${m[2]}',
    );
    text = text.replaceAllMapped(
      RegExp(r'([^\s#])[ \t]+(-[ \t]+\*\*)'),
      (m) => '${m[1]}\n\n${m[2]}',
    );

    // 6. Badges & Frame titles
    text = text.replaceAllMapped(
      RegExp(r'\*\*((?:الخلاص[ةه]|توضيح|ملاحظ[ةه]|تنبيه|فائدة).*?)\*\*'),
      (m) => '**ZAD_BADGE_${m[1]}**',
    );
    text = text.replaceAllMapped(
      RegExp(r'^([ \t]*)\*\*([^\*\r\n]+)\*\*([: \t.\u06D4؟\?]*)[ \t]*$',
          multiLine: true),
      (m) => '${m[1]}**ZAD_FRAME_${m[2]}${m[3]}**',
    );

    // 7. Ensure list items with bold titles split into double newlines so description starts on a new line
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)([\*\-\+]|\d+\.|\w+\.)[ \t]*(\*\*[^\*\r\n]+\*\*[: \t.\u06D4]*)[ \t]*\n(?!\n)([ \t]*)(?![ \t]*([\*\-\+]|\d+\.|\w+\.))',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final bullet = m[2] ?? '';
        final title = m[3] ?? '';
        final nextIndent = m[4] ?? '';
        final spacesNeeded = indent.length + 4;
        final actualIndent =
            nextIndent.length >= spacesNeeded ? nextIndent : ' ' * spacesNeeded;
        return '$indent$bullet $title\n\n$actualIndent';
      },
    );

    // 8. Ensure bold/italic sub-headings on standalone lines get double newlines
    text = text.replaceAllMapped(
      RegExp(
          r'([^\n])\n([ \t]*)(\*[^\*\r\n]+\*[: \t]*|\*\*[^\*\r\n]+\*\*[: \t]*|_[^_\r\n]+_[: \t]*)'),
      (m) => '${m[1]}\n\n${m[2]}${m[3]}',
    );
    text = text.replaceAllMapped(
      RegExp(r'^([ \t]*\*\*[^\*\r\n]+\*\*[: \t]*)\n(?!\n)', multiLine: true),
      (m) => '${m[1]}\n\n',
    );
    text = text.replaceAllMapped(
      RegExp(r'^([ \t]*\*[^\*\r\n]+\*[: \t]*)\n(?!\n)', multiLine: true),
      (m) => '${m[1]}\n\n',
    );

    // 9. Remove horizontal rules (--- or ___)
    text = text.replaceAll(RegExp(r'^[\-_]{3,}\s*$', multiLine: true), '');

    // 10. Convert Islamic & Tagged Blockquotes (&...&, %...%, @...@, $...$, ^...^)
    text = _convertQuoteTags(text);

    // 11. Keyword formatting & Arabic quotes
    text = text.replaceAllMapped(
      RegExp(r'\+\+([^+]+)\+\+'),
      (m) => '~~${m[1]}~~',
    );
    text = text.replaceAllMapped(
      RegExp(r'«([^»\n]+)»'),
      (m) => '~~«${m[1]}»~~',
    );

    // 12. Auto indent sub-lists
    text = autoIndentSubLists(text);

    // 13. Trim excess blank lines
    text = text.replaceAll(RegExp(r'\n{3,}'), '\n\n');

    return text.trim();
  }

  /// Converts Islamic quote syntax (&...&, %...%, @...@, $...$, ^...^) into tagged blockquotes.
  static String _convertQuoteTags(String text) {
    // Qur'an: &Ayah& or &&Ayah&& -> > [QURAN] Ayah
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)(.*?)&+([^&\r\n]+)&+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?(.*)$',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final before = (m[2] ?? '').trim();
        final quote = (m[3] ?? '').trim();
        final ref = (m[4] ?? '').trim();
        final after = (m[5] ?? '').trim();

        final sb = StringBuffer();
        if (before.isNotEmpty) sb.writeln('$indent$before\n');
        sb.writeln('$indent> [QURAN] $quote');
        if (ref.isNotEmpty) sb.writeln('$indent> *__REF__$ref*');
        sb.writeln();
        if (after.isNotEmpty) sb.writeln('$indent$after\n');
        return sb.toString();
      },
    );

    // Hadith: %Hadith% or %%Hadith%% -> > [HADITH] Hadith
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)(.*?)%+([^%\r\n]+)%+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?(.*)$',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final before = (m[2] ?? '').trim();
        final quote = (m[3] ?? '').trim();
        final ref = (m[4] ?? '').trim();
        final after = (m[5] ?? '').trim();

        final sb = StringBuffer();
        if (before.isNotEmpty) sb.writeln('$indent$before\n');
        sb.writeln('$indent> [HADITH] $quote');
        if (ref.isNotEmpty) sb.writeln('$indent> *__REF__$ref*');
        sb.writeln();
        if (after.isNotEmpty) sb.writeln('$indent$after\n');
        return sb.toString();
      },
    );

    // Scholar's Saying: @Saying@ or @@Saying@@ -> > [SAYING] Saying
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)(.*?)@+([^@\r\n]+)@+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?(.*)$',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final before = (m[2] ?? '').trim();
        final quote = (m[3] ?? '').trim();
        final ref = (m[4] ?? '').trim();
        final after = (m[5] ?? '').trim();

        final sb = StringBuffer();
        if (before.isNotEmpty) sb.writeln('$indent$before\n');
        sb.writeln('$indent> [SAYING] $quote');
        if (ref.isNotEmpty) sb.writeln('$indent> *__REF__$ref*');
        sb.writeln();
        if (after.isNotEmpty) sb.writeln('$indent$after\n');
        return sb.toString();
      },
    );

    // Poetry: $Poetry$ or $$Poetry$$ -> > [POETRY] Poetry
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)(.*?)\$+([^$\r\n]+)\$+(?:[ \t]*(?:\r?\n[ \t]*)?\^+([^\^\r\n]+)\^+)?(.*)$',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final before = (m[2] ?? '').trim();
        final quote = (m[3] ?? '').trim();
        final ref = (m[4] ?? '').trim();
        final after = (m[5] ?? '').trim();

        final sb = StringBuffer();
        if (before.isNotEmpty) sb.writeln('$indent$before\n');
        sb.writeln('$indent> [POETRY] $quote');
        if (ref.isNotEmpty) sb.writeln('$indent> *__REF__$ref*');
        sb.writeln();
        if (after.isNotEmpty) sb.writeln('$indent$after\n');
        return sb.toString();
      },
    );

    // Standalone Reference: ^Ref^ or ^^Ref^^ -> > [REFERENCE] Ref
    text = text.replaceAllMapped(
      RegExp(
        r'^([ \t]*)(.*?)\^+([^\^\r\n]+)\^+(.*)$',
        multiLine: true,
      ),
      (m) {
        final indent = m[1] ?? '';
        final before = (m[2] ?? '').trim();
        final ref = (m[3] ?? '').trim();
        final after = (m[4] ?? '').trim();

        final sb = StringBuffer();
        if (before.isNotEmpty) sb.writeln('$indent$before\n');
        sb.writeln('$indent> [REFERENCE] $ref');
        if (after.isNotEmpty) sb.writeln('$indent$after\n');
        return sb.toString();
      },
    );

    return text;
  }

  /// Automatically indents sub-list items under parent title bullets ending with `:` or `؛`.
  static String autoIndentSubLists(String text) {
    if (text.isEmpty) return text;
    final lines = text.split('\n');
    final result = <String>[];
    final parentStack = <int>[];

    final bulletRegex =
        RegExp(r'^([ \t]*)([\*\-\+]|\d+\.|[\u0600-\u06FF]\.)[ \t]+(.*)$');

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      final match = bulletRegex.firstMatch(line);

      if (match != null) {
        final origIndent = match.group(1)!.length;
        final marker = match.group(2)!;
        final content = match.group(3)!.trim();

        final cleanContent = content.replaceAll(RegExp(r'[\*\_\s]+$'), '');
        final colonIdx = content.indexOf(RegExp(r'[:؛]'));
        bool isHeaderTitleBullet = false;

        if (colonIdx != -1) {
          final afterColon = content
              .substring(colonIdx + 1)
              .replaceAll(RegExp(r'[\*\_\s]+'), '');
          if (afterColon.isEmpty && RegExp(r'[:؛]$').hasMatch(cleanContent)) {
            isHeaderTitleBullet = true;
          }
        }

        int levelFromIndent = 0;
        if (origIndent > 0) {
          if (origIndent <= 3) {
            levelFromIndent = 1;
          } else if (origIndent <= 6) {
            levelFromIndent = 1;
          } else if (origIndent <= 10) {
            levelFromIndent = 2;
          } else if (origIndent <= 14) {
            levelFromIndent = 3;
          } else {
            levelFromIndent = (origIndent / 4).floor();
          }
        }

        int effectiveLevel = levelFromIndent;
        if (origIndent == 0 && parentStack.isNotEmpty) {
          effectiveLevel = parentStack.length;
        }

        while (parentStack.isNotEmpty && effectiveLevel <= parentStack.last) {
          parentStack.removeLast();
        }

        final indentStr = '    ' * effectiveLevel;
        result.add('$indentStr$marker $content');

        if (isHeaderTitleBullet) {
          parentStack.add(effectiveLevel);
        }
      } else {
        final trimmed = line.trim();
        if (trimmed.isEmpty ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('>') ||
            trimmed.startsWith('```')) {
          parentStack.clear();
        }
        result.add(line);
      }
    }

    return result.join('\n');
  }

  /// Parses the raw AI answer string into structured sections and items.
  static ParsedAnswer parse(String raw) {
    final preprocessed = preprocess(raw);
    final lines = preprocessed.split('\n');

    String? intro;
    final sections = <AnswerSection>[];
    AnswerSection? currentSection;

    final introBuffer = StringBuffer();
    bool foundFirstSection = false;

    final numberRegex = RegExp(r'^(\d+|[٠-٩]+|[أ-يA-Za-z])[\.\-\)]\s*');
    final parenthesizedNumberRegex = RegExp(r'^\((\d+|[٠-٩]+)\)\s*');

    AnswerItem? activeSubFrame;

    for (int i = 0; i < lines.length; i++) {
      final rawLine = lines[i];
      final cleanLine = rawLine.trim();

      final leadingSpaces = rawLine.length - rawLine.trimLeft().length;
      int indentLevel = (leadingSpaces / 2).floor();
      if (indentLevel > 3) indentLevel = 3;

      bool isMainHeader = false;
      bool isSubHeader = false;
      String headerTitle = '';

      if (cleanLine.startsWith('####')) {
        isSubHeader = true;
        headerTitle = cleanLine.replaceFirst(RegExp(r'^#+\s*'), '').trim();
      } else if (cleanLine.startsWith('#')) {
        isMainHeader = true;
        headerTitle = cleanLine.replaceFirst(RegExp(r'^#+\s*'), '').trim();
      } else if (cleanLine.startsWith('**') &&
          (cleanLine.endsWith('**') ||
              cleanLine.endsWith(':**') ||
              cleanLine.endsWith(':'))) {
        isMainHeader = true;
        headerTitle = cleanLine
            .replaceAll('**', '')
            .replaceAll('ZAD_FRAME_', '')
            .replaceAll('ZAD_TITLE_', '')
            .trim();
      }

      if (isMainHeader) {
        foundFirstSection = true;
        if (activeSubFrame != null) {
          currentSection?.items.add(activeSubFrame);
          activeSubFrame = null;
        }
        if (currentSection != null) sections.add(currentSection);
        currentSection = AnswerSection(title: headerTitle, items: []);
        continue;
      }

      if (isSubHeader) {
        if (activeSubFrame != null) {
          currentSection?.items.add(activeSubFrame);
        }
        activeSubFrame = AnswerItem(
          type: AnswerItemType.subFrame,
          text: headerTitle,
          childItems: [],
        );
        continue;
      }

      if (!foundFirstSection) {
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
        final targetList = activeSubFrame?.childItems ?? currentSection?.items;
        if (targetList == null) continue;

        if (cleanLine.isEmpty) {
          targetList.add(const AnswerItem(
            type: AnswerItemType.paragraph,
            text: '',
          ));
          continue;
        }

        final bulletMatch = RegExp(r'^[\*\-\+]\s+(.+)$').firstMatch(cleanLine);
        final numberedMatch = RegExp(r'^\d+\.\s*(.+)$').firstMatch(cleanLine);
        final quoteMatch = RegExp(r'^>\s*(.+)$').firstMatch(cleanLine);

        if (bulletMatch != null) {
          final content = bulletMatch.group(1)!.trim();
          bool isNumbered = numberRegex.hasMatch(content) ||
              parenthesizedNumberRegex.hasMatch(content);
          targetList.add(AnswerItem(
            type: AnswerItemType.listItem,
            text: content,
            isNumbered: isNumbered,
            indentLevel: indentLevel,
          ));
        } else if (numberedMatch != null ||
            numberRegex.hasMatch(cleanLine) ||
            parenthesizedNumberRegex.hasMatch(cleanLine)) {
          targetList.add(AnswerItem(
            type: AnswerItemType.listItem,
            text: cleanLine,
            isNumbered: true,
            indentLevel: indentLevel,
          ));
        } else if (quoteMatch != null) {
          final quoteBody = quoteMatch.group(1)!.trim();
          AnswerItemType qType = AnswerItemType.quote;
          String textToUse = quoteBody;
          String? refText;

          if (quoteBody.startsWith('[QURAN]')) {
            qType = AnswerItemType.quran;
            textToUse = quoteBody.replaceFirst('[QURAN]', '').trim();
          } else if (quoteBody.startsWith('[HADITH]')) {
            qType = AnswerItemType.hadith;
            textToUse = quoteBody.replaceFirst('[HADITH]', '').trim();
          } else if (quoteBody.startsWith('[SAYING]')) {
            qType = AnswerItemType.saying;
            textToUse = quoteBody.replaceFirst('[SAYING]', '').trim();
          } else if (quoteBody.startsWith('[POETRY]')) {
            qType = AnswerItemType.poetry;
            textToUse = quoteBody.replaceFirst('[POETRY]', '').trim();
          } else if (quoteBody.startsWith('[REFERENCE]')) {
            qType = AnswerItemType.reference;
            textToUse = quoteBody.replaceFirst('[REFERENCE]', '').trim();
          } else if (quoteBody.startsWith('*__REF__')) {
            refText =
                quoteBody.replaceAll('*__REF__', '').replaceAll('*', '').trim();
            if (targetList.isNotEmpty &&
                targetList.last.type != AnswerItemType.paragraph) {
              final lastItem = targetList.removeLast();
              targetList.add(AnswerItem(
                type: lastItem.type,
                text: lastItem.text,
                referenceText: refText,
                isNumbered: lastItem.isNumbered,
                indentLevel: lastItem.indentLevel,
                childItems: lastItem.childItems,
              ));
              continue;
            }
          }

          targetList.add(AnswerItem(
            type: qType,
            text: textToUse,
            referenceText: refText,
            indentLevel: indentLevel,
          ));
        } else {
          targetList.add(AnswerItem(
            type: AnswerItemType.paragraph,
            text: cleanLine,
            indentLevel: indentLevel,
          ));
        }
      }
    }

    if (activeSubFrame != null) {
      currentSection?.items.add(activeSubFrame);
    }
    if (currentSection != null) {
      sections.add(currentSection);
    }

    final introText = introBuffer.toString().trim();
    if (introText.isNotEmpty) intro = introText;

    return ParsedAnswer(intro: intro, sections: sections);
  }

  static String _normalizeArabicDigits(String input) {
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (int i = 0; i < 10; i++) {
      input = input.replaceAll(arabic[i], english[i]);
    }
    return input;
  }

  /// Strips citation markers from display text.
  static String stripCitationRefs(String text) => text
      .replaceAll(RegExp(r'\[ZAD_CIT:[^\]]+\]\(#cit-[^\]]+\)'), '')
      .replaceAll(RegExp(r'\s*\[[^\]]+\]'), '')
      .trim();

  /// Extracts citation keys referenced in a text.
  static List<String> extractCitationRefs(String text) {
    final refs = <String>[];
    final bracketPattern = RegExp(r'\[([^\]]+)\]');
    for (final match in bracketPattern.allMatches(text)) {
      final inner = match.group(1)!;
      final parts = inner
          .split(RegExp(r'[,،]+'))
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty);
      for (final part in parts) {
        final clean =
            part.replaceAll('cit_', '').replaceAll('ZAD_CIT:', '').trim();
        final normalized = _normalizeArabicDigits(clean);
        if (RegExp(r'^\d+$').hasMatch(normalized)) {
          refs.add(normalized);
        }
      }
    }
    return refs;
  }

  /// Parses rich text tokens into Flutter `InlineSpan` elements (TextSpan, WidgetSpan).
  ///
  /// [citationNames] is an optional map from normalized citation key (e.g. "1", "2")
  /// to the book/source display name. When provided, citation badges show
  /// the truncated book name instead of the raw number.
  static List<InlineSpan> parseRichText(
    String text,
    TextStyle baseStyle, {
    void Function(String citationRef)? onCitationTap,
    bool isDark = false,
    Map<String, String>? citationNames,
  }) {
    final List<InlineSpan> spans = [];
    final regex = RegExp(r'\*\*(.*?)\*\*|~~(.*?)~~|\[(.*?)\]');
    int start = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > start) {
        spans.add(TextSpan(
          text: text.substring(start, match.start),
          style: baseStyle,
        ));
      }

      final boldText = match.group(1);
      final strikethroughText = match.group(2);
      final citeText = match.group(3);

      if (boldText != null) {
        if (boldText.contains('ZAD_TITLE_') || boldText.contains('__TITLE__')) {
          final cleanTitle =
              boldText.replaceAll('ZAD_TITLE_', '').replaceAll('__TITLE__', '');
          spans.add(TextSpan(
            text: cleanTitle,
            style: baseStyle.copyWith(
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF6B21A8),
              decoration: TextDecoration.underline,
              decorationColor:
                  isDark ? const Color(0xFF34D399) : const Color(0xFFA855F7),
            ),
          ));
        } else if (boldText.contains('ZAD_BADGE_') ||
            boldText.contains('__BADGE__')) {
          final cleanBadge =
              boldText.replaceAll('ZAD_BADGE_', '').replaceAll('__BADGE__', '');
          spans.add(WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF10B981).withOpacity(0.15)
                    : const Color(0xFFF3E8FF),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF10B981).withOpacity(0.35)
                      : const Color(0xFFD8B4FE),
                  width: 1,
                ),
              ),
              child: Text(
                cleanBadge,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: (baseStyle.fontSize ?? 13) * 0.9,
                  fontWeight: FontWeight.bold,
                  color: isDark
                      ? const Color(0xFF34D399)
                      : const Color(0xFF7E22CE),
                ),
              ),
            ),
          ));
        } else if (boldText.contains('ZAD_FRAME_') ||
            boldText.contains('__FRAME__')) {
          final cleanFrame =
              boldText.replaceAll('ZAD_FRAME_', '').replaceAll('__FRAME__', '');
          spans.add(WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF10B981).withOpacity(0.12)
                    : const Color(0xFFFAF5FF),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF10B981).withOpacity(0.25)
                      : const Color(0xFFE9D8FD),
                  width: 1.2,
                ),
              ),
              child: Text(
                cleanFrame,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: (baseStyle.fontSize ?? 13) * 0.95,
                  fontWeight: FontWeight.w800,
                  color: isDark ? const Color(0xFF6EE7B7) : AppColors.primary,
                ),
              ),
            ),
          ));
        } else {
          spans.add(TextSpan(
            text: boldText,
            style: baseStyle.copyWith(
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFF10B981) : AppColors.primary,
            ),
          ));
        }
      } else if (strikethroughText != null) {
        if (strikethroughText.startsWith('«') &&
            strikethroughText.endsWith('»')) {
          spans.add(WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(vertical: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0F172A).withOpacity(0.9)
                    : const Color(0xFFFDFBF7),
                borderRadius: BorderRadius.circular(12),
                border: Border(
                  right: BorderSide(
                    color: isDark
                        ? const Color(0xFF34D399)
                        : const Color(0xFF7C3AED),
                    width: 4,
                  ),
                ),
              ),
              child: Text(
                strikethroughText,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: (baseStyle.fontSize ?? 13) * 1.05,
                  fontWeight: FontWeight.bold,
                  height: 1.8,
                  color: isDark
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFF1E1B4B),
                ),
              ),
            ),
          ));
        } else {
          spans.add(TextSpan(
            text: strikethroughText,
            style: baseStyle.copyWith(
              decoration: TextDecoration.lineThrough,
            ),
          ));
        }
      } else if (citeText != null) {
        final cleanCiteText = citeText.replaceAll('ZAD_CIT:', '');
        final parts = cleanCiteText
            .split(RegExp(r'[,،]+'))
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty)
            .toList();

        final rawRefs = <String>[];
        bool isValid = parts.isNotEmpty;

        for (final p in parts) {
          final clean = p.replaceAll('cit_', '').trim();
          final normalized = _normalizeArabicDigits(clean);
          if (RegExp(r'^\d+$').hasMatch(normalized)) {
            rawRefs.add(clean);
          } else {
            final rangeMatch = RegExp(
                    r'^(\d+|[\u0660-\u0669]+)\s*[\-\u2013]\s*(\d+|[\u0660-\u0669]+)$')
                .firstMatch(clean);
            if (rangeMatch != null) {
              final startNum =
                  int.parse(_normalizeArabicDigits(rangeMatch.group(1)!));
              final endNum =
                  int.parse(_normalizeArabicDigits(rangeMatch.group(2)!));
              if (startNum <= endNum && (endNum - startNum) <= 10) {
                for (int n = startNum; n <= endNum; n++) {
                  rawRefs.add(n.toString());
                }
                continue;
              }
            }
            isValid = false;
            break;
          }
        }

        if (isValid && rawRefs.isNotEmpty) {
          for (final displayRef in rawRefs) {
            final normalizedKey = _normalizeArabicDigits(displayRef);

            // Resolve display label: use book name if available, else fall back to number
            String displayLabel;
            if (citationNames != null &&
                citationNames.containsKey(normalizedKey)) {
              final fullName = citationNames[normalizedKey]!;
              displayLabel = fullName.length > 16
                  ? '${fullName.substring(0, 16)}...'
                  : fullName;
            } else {
              displayLabel = '[$displayRef]';
            }

            spans.add(
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: GestureDetector(
                  onTap: () {
                    if (onCitationTap != null) {
                      onCitationTap(normalizedKey);
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color.fromARGB(255, 200, 167, 231)
                          .withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      displayLabel,
                      style: baseStyle.copyWith(
                        color: const Color.fromARGB(255, 158, 77, 234),
                        fontWeight: FontWeight.bold,
                        fontSize: (baseStyle.fontSize ?? 11) * 0.8,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }
        } else {
          spans.add(TextSpan(
            text: '[$citeText]',
            style: baseStyle,
          ));
        }
      }
      start = match.end;
    }

    if (start < text.length) {
      spans.add(TextSpan(
        text: text.substring(start),
        style: baseStyle,
      ));
    }

    return spans;
  }
}
