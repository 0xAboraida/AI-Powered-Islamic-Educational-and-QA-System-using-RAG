import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/feedback_service.dart';
import '../../data/models/feedback_model.dart';

final feedbacksProvider = FutureProvider.autoDispose<List<FeedbackModel>>((ref) async {
  return await FeedbackService.getAllFeedbacks();
});

final feedbackFilterProvider = StateProvider.autoDispose<String>((ref) => 'all'); // 'all', 'like', 'dislike'
final feedbackSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

final filteredFeedbacksProvider = Provider.autoDispose<List<FeedbackModel>>((ref) {
  final feedbacks = ref.watch(feedbacksProvider).valueOrNull ?? [];
  final filter = ref.watch(feedbackFilterProvider);
  final query = ref.watch(feedbackSearchQueryProvider);
  
  return feedbacks.where((item) {
    final matchesFilter = filter == 'all' || item.rating == filter;
    final matchesSearch = query.isEmpty ||
        item.userName.contains(query) ||
        item.userEmail.contains(query) ||
        item.questionText.contains(query) ||
        item.domainName.contains(query);
    return matchesFilter && matchesSearch;
  }).toList();
});
