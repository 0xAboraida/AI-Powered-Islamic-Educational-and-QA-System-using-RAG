import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:printing/printing.dart';
import 'package:file_saver/file_saver.dart';
import 'package:file_picker/file_picker.dart';
import 'package:zaad/core/utils/app_colors/app_colors.dart';

class PdfPreviewScreen extends StatelessWidget {
  final Uint8List pdfBytes;
  final String filename;
  final String? questionText;

  const PdfPreviewScreen({
    super.key,
    required this.pdfBytes,
    required this.filename,
    this.questionText,
  });

  Future<void> _savePdfToDevice(BuildContext context) async {
    try {
      if (!kIsWeb &&
          (Platform.isWindows || Platform.isLinux || Platform.isMacOS)) {
        // Desktop platforms: native Save As dialog
        final String? outputFile = await FilePicker.saveFile(
          dialogTitle: 'اختر مكان حفظ ملف الـ PDF',
          fileName: filename,
          type: FileType.custom,
          allowedExtensions: ['pdf'],
        );

        if (outputFile != null) {
          final file = File(outputFile);
          await file.writeAsBytes(pdfBytes);
          if (context.mounted) {
            _showToast(
              context,
              'تم حفظ الملف بنجاح في:\n$outputFile',
              isSuccess: true,
            );
          }
        }
      } else {
        // Mobile / Web: native file saver / document picker
        final String? resultPath = await FileSaver.instance.saveAs(
          name: filename.replaceAll('.pdf', ''),
          ext: 'pdf',
          mimeType: MimeType.pdf,
          bytes: pdfBytes,
        );

        if (resultPath != null && resultPath.isNotEmpty) {
          if (context.mounted) {
            _showToast(
              context,
              'تم حفظ الملف بنجاح 📄✨',
              isSuccess: true,
            );
          }
        }
      }
    } catch (e) {
      if (context.mounted) {
        _showToast(
          context,
          'حدث خطأ أثناء حفظ الملف: $e',
          isSuccess: false,
        );
      }
    }
  }

  void _showToast(
    BuildContext context,
    String message, {
    required bool isSuccess,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                message,
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(width: 8.w),
            Icon(
              isSuccess
                  ? Icons.check_circle_outline_rounded
                  : Icons.error_outline_rounded,
              color: isSuccess ? Colors.greenAccent : Colors.redAccent,
            ),
          ],
        ),
        backgroundColor:
            isSuccess ? const Color(0xFF1E293B) : Colors.red.shade800,
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10.r),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkPrimary : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'معاينة تقرير الفتوى (PDF)',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 18.sp,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppColors.primary,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Banner informing the user
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1B2436) : const Color(0xFFF1F5F9),
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? Colors.white.withOpacity(0.08)
                      : const Color(0xFFE2E8F0),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    'يمكنك معاينة التقرير أدناه، أو الضغط على "تنزيل وحفظ في الجهاز" لاختيار مكان حفظ الملف مباشرًة.',
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 12.sp,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                ),
                SizedBox(width: 8.w),
                Icon(
                  Icons.info_outline_rounded,
                  color: AppColors.primary,
                  size: 20.sp,
                ),
              ],
            ),
          ),

          // PDF Preview Widget
          Expanded(
            child: PdfPreview(
              build: (format) async => pdfBytes,
              allowPrinting: true,
              allowSharing: true,
              canChangeOrientation: false,
              canChangePageFormat: false,
              pdfFileName: filename,
              actions: [
                IconButton(
                  onPressed: () => _savePdfToDevice(context),
                  icon: const Icon(Icons.download_rounded, color: Colors.white),
                  tooltip: 'تنزيل وحفظ في الجهاز',
                ),
              ],
            ),
          ),

          // Prominent Bottom Action Bar
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131A29) : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.3 : 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Share Button
                Expanded(
                  flex: 2,
                  child: OutlinedButton.icon(
                    onPressed: () => Printing.sharePdf(
                      bytes: pdfBytes,
                      filename: filename,
                    ),
                    icon: Icon(
                      Icons.share_rounded,
                      size: 18.sp,
                      color: isDark ? Colors.white : AppColors.primary,
                    ),
                    label: Text(
                      'مشاركة',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 13.sp,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white : AppColors.primary,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 12.h),
                      side: BorderSide(
                        color: isDark ? Colors.white24 : AppColors.primary,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                // Primary Download & Save Button
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: AppColors.buttonGradient,
                      borderRadius: BorderRadius.circular(10.r),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () => _savePdfToDevice(context),
                      icon: Icon(
                        Icons.download_rounded,
                        size: 20.sp,
                        color: Colors.white,
                      ),
                      label: Text(
                        'تنزيل وحفظ في الجهاز',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13.sp,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: EdgeInsets.symmetric(vertical: 12.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10.r),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
