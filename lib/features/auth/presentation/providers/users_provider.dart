import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/users_service.dart';
import '../../data/models/registered_user_model.dart';

final usersProvider = FutureProvider.autoDispose<List<RegisteredUserModel>>((ref) async {
  return await UsersService.getAllUsers();
});

final usersSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

final filteredUsersProvider = Provider.autoDispose<List<RegisteredUserModel>>((ref) {
  final users = ref.watch(usersProvider).valueOrNull ?? [];
  final query = ref.watch(usersSearchQueryProvider);
  
  if (query.isEmpty) return users;
  return users.where((user) {
    return user.userName.contains(query) || user.userEmail.contains(query);
  }).toList();
});
