import 'package:flutter/material.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';

late TutorialCoachMark tutorialCoachMark;

void showTutorial(BuildContext context, GlobalKey searchKey) {
  tutorialCoachMark = TutorialCoachMark(
      targets: [
        TargetFocus(
          identify: "search",
          keyTarget: searchKey,
          contents: [
            TargetContent(
              align: ContentAlign.top,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1F1F1F),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "🎙️ Zaad AI Voice",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      "ابدأ محادثة صوتية مباشرة مع Zaad AI.\n"
                      "تحدث بشكل طبيعي وسيقوم المساعد بالاستماع والرد عليك صوتيًا.",
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            )
          ],
        ),
      ],
      colorShadow: Colors.black,
      opacityShadow: 0.8,
      hideSkip: false,
    
      textSkip: "Skip");

  tutorialCoachMark.show(context: context);
}
