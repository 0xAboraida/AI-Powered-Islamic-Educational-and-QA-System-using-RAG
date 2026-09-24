import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart' as intl;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:zaad/features/chatbot/domain/models/chat_response.dart';
import 'package:zaad/features/chatbot/presentation/pages/pdf_preview_screen.dart';
import 'package:zaad/features/chatbot/presentation/utils/answer_parser.dart';

class PdfExportService {
  static Future<void> generateAndExportPdf({
    required BuildContext context,
    required String questionText,
    required String domainName,
    required String fullAnswer,
    Map<String, CitationDTO>? citations,
  }) async {
    // Load Arabic Cairo fonts from assets
    final regularFontData =
        await rootBundle.load('assets/fonts/Cairo-Regular.ttf');
    final boldFontData = await rootBundle.load('assets/fonts/Cairo-Bold.ttf');
    final mediumFontData =
        await rootBundle.load('assets/fonts/Cairo-Medium.ttf');

    final ttfRegular = pw.Font.ttf(regularFontData);
    final ttfBold = pw.Font.ttf(boldFontData);
    final ttfMedium = pw.Font.ttf(mediumFontData);

    final pdf = pw.Document();

    final dateStr =
        intl.DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(DateTime.now());
    final refNumber =
        'ZAD-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';

    // Theme Colors
    final primaryViolet = PdfColor.fromHex('#4C1D95'); // Deep Imperial Violet
    final secondaryPurple = PdfColor.fromHex('#6B21A8'); // Royal Purple
    final accentGold = PdfColor.fromHex('#D97706'); // Warm Gold / Amber
    final softGoldBg = PdfColor.fromHex('#FFFBEB');
    final cardBg = PdfColor.fromHex('#FAF5FF'); // Soft purple tint
    final borderPurple = PdfColor.fromHex('#E9D8FD');
    final darkText = PdfColor.fromHex('#0F172A');
    final subText = PdfColor.fromHex('#475569');

    // Clean answer text without raw citation markers
    final cleanAnswer = AnswerParser.stripCitationRefs(fullAnswer);
    final answerLines = cleanAnswer.split('\n');

    pdf.addPage(
      pw.MultiPage(
        theme: pw.ThemeData.withFont(
          base: ttfRegular,
          bold: ttfBold,
        ),
        textDirection: pw.TextDirection.rtl,
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 32, vertical: 28),

        // ── Running Header (for pages after 1) ─────────────────────────
        header: (pw.Context context) {
          if (context.pageNumber == 1) return pw.SizedBox();
          return pw.Container(
            margin: const pw.EdgeInsets.only(bottom: 12),
            padding: const pw.EdgeInsets.only(bottom: 6),
            decoration: const pw.BoxDecoration(
              border: pw.Border(
                bottom: pw.BorderSide(color: PdfColors.grey300, width: 0.8),
              ),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'تطبيق زاد للعلوم الشرعية | مستخرج فتوى',
                  style: pw.TextStyle(
                    font: ttfMedium,
                    fontSize: 8.5,
                    color: subText,
                  ),
                  textDirection: pw.TextDirection.rtl,
                ),
                pw.Text(
                  'المرجع: #$refNumber',
                  style: pw.TextStyle(
                    font: ttfRegular,
                    fontSize: 8.5,
                    color: subText,
                  ),
                  textDirection: pw.TextDirection.rtl,
                ),
              ],
            ),
          );
        },

        // ── Running Footer ──────────────────────────────────────────────
        footer: (pw.Context context) {
          return pw.Container(
            margin: const pw.EdgeInsets.only(top: 12),
            padding: const pw.EdgeInsets.only(top: 8),
            decoration: const pw.BoxDecoration(
              border: pw.Border(
                top: pw.BorderSide(color: PdfColors.grey300, width: 0.8),
              ),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(
                  'زاد للعلوم الشرعية - جميع الحقوق محفوظة © ${DateTime.now().year}',
                  style: pw.TextStyle(
                    font: ttfRegular,
                    fontSize: 8,
                    color: PdfColors.grey600,
                  ),
                  textDirection: pw.TextDirection.rtl,
                ),
                pw.Text(
                  'صفحة ${context.pageNumber} من ${context.pagesCount}',
                  style: pw.TextStyle(
                    font: ttfBold,
                    fontSize: 8.5,
                    color: primaryViolet,
                  ),
                  textDirection: pw.TextDirection.rtl,
                ),
              ],
            ),
          );
        },

        // ── Main Page Content ───────────────────────────────────────────
        build: (pw.Context context) {
          return [
            // 🌟 1. Top Decorative Brand Banner
            pw.Container(
              width: double.infinity,
              decoration: pw.BoxDecoration(
                color: primaryViolet,
                borderRadius: pw.BorderRadius.circular(10),
              ),
              child: pw.Column(
                children: [
                  // Gold accent top bar
                  pw.Container(
                    height: 4,
                    decoration: pw.BoxDecoration(
                      color: accentGold,
                      borderRadius: const pw.BorderRadius.only(
                        topLeft: pw.Radius.circular(10),
                        topRight: pw.Radius.circular(10),
                      ),
                    ),
                  ),
                  pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(
                        horizontal: 20, vertical: 14),
                    child: pw.Column(
                      children: [
                        pw.Text(
                          'تطبيق زاد للعلوم الشرعية',
                          style: pw.TextStyle(
                            font: ttfBold,
                            fontSize: 20,
                            color: PdfColors.white,
                          ),
                          textDirection: pw.TextDirection.rtl,
                        ),
                        pw.SizedBox(height: 3),
                        pw.Text(
                          'مستخرج رسمي للإجابة والفتوى الشرعية والمصادر المعتمدة',
                          style: pw.TextStyle(
                            font: ttfMedium,
                            fontSize: 10.5,
                            color: PdfColor.fromHex('#F3E8FF'),
                          ),
                          textDirection: pw.TextDirection.rtl,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // 🌟 2. Metadata Grid Box
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: pw.BoxDecoration(
                color: cardBg,
                borderRadius: pw.BorderRadius.circular(8),
                border: pw.Border.all(color: borderPurple, width: 1),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Row(
                    children: [
                      pw.Text(
                        'المجال: ',
                        style: pw.TextStyle(
                            font: ttfBold, fontSize: 9.5, color: primaryViolet),
                        textDirection: pw.TextDirection.rtl,
                      ),
                      pw.Text(
                        domainName.isNotEmpty ? domainName : 'العلوم الشرعية',
                        style: pw.TextStyle(
                            font: ttfRegular, fontSize: 9.5, color: darkText),
                        textDirection: pw.TextDirection.rtl,
                      ),
                    ],
                  ),
                  pw.Row(
                    children: [
                      pw.Text(
                        'التاريخ: ',
                        style: pw.TextStyle(
                            font: ttfBold, fontSize: 9.5, color: primaryViolet),
                        textDirection: pw.TextDirection.rtl,
                      ),
                      pw.Text(
                        dateStr,
                        style: pw.TextStyle(
                            font: ttfRegular, fontSize: 9.5, color: darkText),
                        textDirection: pw.TextDirection.rtl,
                      ),
                    ],
                  ),
                  pw.Row(
                    children: [
                      pw.Text(
                        'رقم المرجع: ',
                        style: pw.TextStyle(
                            font: ttfBold, fontSize: 9.5, color: primaryViolet),
                        textDirection: pw.TextDirection.rtl,
                      ),
                      pw.Text(
                        '#$refNumber',
                        style: pw.TextStyle(
                            font: ttfRegular, fontSize: 9.5, color: darkText),
                        textDirection: pw.TextDirection.rtl,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 14),

            // 🌟 3. Question Section
            if (questionText.trim().isNotEmpty) ...[
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('#F3E8FF'),
                  borderRadius: pw.BorderRadius.circular(8),
                  border: pw.Border.all(color: borderPurple, width: 1),
                ),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Container(
                      width: 4,
                      height: 36,
                      decoration: pw.BoxDecoration(
                        color: secondaryPurple,
                        borderRadius: pw.BorderRadius.circular(2),
                      ),
                    ),
                    pw.SizedBox(width: 10),
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Row(
                            children: [
                              pw.Container(
                                width: 6,
                                height: 6,
                                decoration: pw.BoxDecoration(
                                  color: accentGold,
                                  shape: pw.BoxShape.circle,
                                ),
                              ),
                              pw.SizedBox(width: 6),
                              pw.Text(
                                'السؤال الوارد:',
                                style: pw.TextStyle(
                                  font: ttfBold,
                                  fontSize: 11.5,
                                  color: primaryViolet,
                                ),
                                textDirection: pw.TextDirection.rtl,
                              ),
                            ],
                          ),
                          pw.SizedBox(height: 6),
                          pw.Text(
                            questionText,
                            style: pw.TextStyle(
                              font: ttfRegular,
                              fontSize: 10.5,
                              lineSpacing: 3.5,
                              color: PdfColor.fromHex('#1E293B'),
                            ),
                            textDirection: pw.TextDirection.rtl,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 16),
            ],

            // 🌟 4. Answer Section Header
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 6),
              decoration: pw.BoxDecoration(
                border: pw.Border(
                  bottom: pw.BorderSide(color: accentGold, width: 1.5),
                ),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'البيان والإجابة الشرعية',
                    style: pw.TextStyle(
                      font: ttfBold,
                      fontSize: 13.5,
                      color: primaryViolet,
                    ),
                    textDirection: pw.TextDirection.rtl,
                  ),
                  pw.Text(
                    'مستخرج من تطبيق زاد',
                    style: pw.TextStyle(
                      font: ttfRegular,
                      fontSize: 9,
                      color: accentGold,
                    ),
                    textDirection: pw.TextDirection.rtl,
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 10),

            // 🌟 5. Formatted Body Paragraphs & Subheaders
            ...answerLines.map((line) {
              final trimmed = line.trim();
              if (trimmed.isEmpty) {
                return pw.SizedBox(height: 6);
              }

              // Check if line is a section header (e.g. ### or **)
              if (trimmed.startsWith('#') ||
                  (trimmed.startsWith('**') && trimmed.contains('**', 2))) {
                final cleanHeader =
                    trimmed.replaceAll(RegExp(r'^[#\*:]+|\*\*'), '').trim();
                return pw.Container(
                  margin: const pw.EdgeInsets.only(top: 10, bottom: 6),
                  padding: const pw.EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('#F3E8FF'),
                    borderRadius: pw.BorderRadius.circular(4),
                    border: pw.Border.all(color: borderPurple, width: 1),
                  ),
                  child: pw.Row(
                    mainAxisSize: pw.MainAxisSize.min,
                    children: [
                      pw.Container(
                        width: 3,
                        height: 12,
                        decoration: pw.BoxDecoration(
                          color: accentGold,
                          borderRadius: pw.BorderRadius.circular(1),
                        ),
                      ),
                      pw.SizedBox(width: 6),
                      pw.Text(
                        cleanHeader,
                        style: pw.TextStyle(
                          font: ttfBold,
                          fontSize: 11,
                          color: primaryViolet,
                        ),
                        textDirection: pw.TextDirection.rtl,
                      ),
                    ],
                  ),
                );
              }

              // Check if line is a bullet point (* or - or •)
              if (trimmed.startsWith('* ') ||
                  trimmed.startsWith('- ') ||
                  trimmed.startsWith('• ')) {
                final bulletText = trimmed.substring(2).trim();
                return pw.Padding(
                  padding:
                      const pw.EdgeInsets.only(bottom: 4, right: 8, left: 4),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        '◆ ',
                        style: pw.TextStyle(
                          font: ttfBold,
                          fontSize: 9,
                          color: accentGold,
                        ),
                        textDirection: pw.TextDirection.rtl,
                      ),
                      pw.Expanded(
                        child: pw.Text(
                          bulletText,
                          style: pw.TextStyle(
                            font: ttfRegular,
                            fontSize: 10,
                            lineSpacing: 3.5,
                            color: darkText,
                          ),
                          textDirection: pw.TextDirection.rtl,
                        ),
                      ),
                    ],
                  ),
                );
              }

              // Normal Body Paragraph
              return pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 5),
                child: pw.Text(
                  trimmed,
                  style: pw.TextStyle(
                    font: ttfRegular,
                    fontSize: 10,
                    lineSpacing: 4.0,
                    color: darkText,
                  ),
                  textDirection: pw.TextDirection.rtl,
                ),
              );
            }),

            // 🌟 6. Citations & Sources Section
            if (citations != null && citations.isNotEmpty) ...[
              pw.SizedBox(height: 18),
              pw.Container(
                padding: const pw.EdgeInsets.only(bottom: 6),
                decoration: pw.BoxDecoration(
                  border: pw.Border(
                    bottom: pw.BorderSide(color: accentGold, width: 1.5),
                  ),
                ),
                child: pw.Row(
                  children: [
                    pw.Text(
                      'المصادر والمراجع الفقهية المعتمدة',
                      style: pw.TextStyle(
                        font: ttfBold,
                        fontSize: 13,
                        color: primaryViolet,
                      ),
                      textDirection: pw.TextDirection.rtl,
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 10),
              ...citations.entries.map((entry) {
                final key = entry.key;
                final cit = entry.value;
                final madhhabStr = cit.madhhab.isNotEmpty ? cit.madhhab : 'عام';
                final authorStr = cit.author.isNotEmpty
                    ? 'المؤلف: ${cit.author}${cit.authorDeath.isNotEmpty ? " (توفى: ${cit.authorDeath})" : ""}'
                    : null;
                final locStr = (cit.part.isNotEmpty || cit.pageId > 0)
                    ? 'الجزء: ${cit.part.isNotEmpty ? cit.part : "-"} | الصفحة: ${cit.pageId > 0 ? cit.pageId : "-"}'
                    : null;

                return pw.Container(
                  width: double.infinity,
                  margin: const pw.EdgeInsets.only(bottom: 8),
                  padding: const pw.EdgeInsets.all(10),
                  decoration: pw.BoxDecoration(
                    color: cardBg,
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: borderPurple, width: 1),
                  ),
                  child: pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Container(
                        width: 3,
                        height: 40,
                        decoration: pw.BoxDecoration(
                          color: accentGold,
                          borderRadius: pw.BorderRadius.circular(2),
                        ),
                      ),
                      pw.SizedBox(width: 8),
                      pw.Expanded(
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text(
                                  '[$key] ${cit.bookTitle}',
                                  style: pw.TextStyle(
                                    font: ttfBold,
                                    fontSize: 10,
                                    color: primaryViolet,
                                  ),
                                  textDirection: pw.TextDirection.rtl,
                                ),
                                pw.Container(
                                  padding: const pw.EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: pw.BoxDecoration(
                                    color: softGoldBg,
                                    borderRadius: pw.BorderRadius.circular(4),
                                    border: pw.Border.all(
                                        color: PdfColor.fromHex('#FDE68A')),
                                  ),
                                  child: pw.Text(
                                    'مذهب $madhhabStr',
                                    style: pw.TextStyle(
                                      font: ttfBold,
                                      fontSize: 8,
                                      color: accentGold,
                                    ),
                                    textDirection: pw.TextDirection.rtl,
                                  ),
                                ),
                              ],
                            ),
                            if (authorStr != null) ...[
                              pw.SizedBox(height: 3),
                              pw.Text(
                                authorStr,
                                style: pw.TextStyle(
                                  font: ttfRegular,
                                  fontSize: 8.5,
                                  color: PdfColors.grey800,
                                ),
                                textDirection: pw.TextDirection.rtl,
                              ),
                            ],
                            if (locStr != null) ...[
                              pw.SizedBox(height: 2),
                              pw.Text(
                                locStr,
                                style: pw.TextStyle(
                                  font: ttfRegular,
                                  fontSize: 8.5,
                                  color: PdfColors.grey700,
                                ),
                                textDirection: pw.TextDirection.rtl,
                              ),
                            ],
                            if (cit.sourceUrl.isNotEmpty) ...[
                              pw.SizedBox(height: 3),
                              pw.Text(
                                'رابط المصدر الإلكتروني: ${cit.sourceUrl}',
                                style: pw.TextStyle(
                                  font: ttfRegular,
                                  fontSize: 8,
                                  color: PdfColor.fromHex('#2563EB'),
                                ),
                                textDirection: pw.TextDirection.rtl,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ];
        },
      ),
    );

    final pdfBytes = await pdf.save();
    final filename =
        'Zaad_Answer_${DateTime.now().millisecondsSinceEpoch}.pdf';

    if (context.mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PdfPreviewScreen(
            pdfBytes: pdfBytes,
            filename: filename,
            questionText: questionText,
          ),
        ),
      );
    }
  }
}