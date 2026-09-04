import { persistenceError, type ProfileRepository, type RewardReceiptRepository } from '@pixeldoro/application';

export const createStandardFocusCompletionReviewFixture = (
  scenario: string | undefined, enabled: boolean, profile: ProfileRepository, rewards: RewardReceiptRepository,
) => {
  let receiptFailure = enabled && scenario === 'standard_completion_receipt_failure_once';
  let profileFailure = enabled && scenario === 'standard_completion_profile_failure_once';
  let resultReadFailure = enabled && scenario === 'standard_completion_result_read_failure_once';
  const decoratedRewards: RewardReceiptRepository = {
    findById: (id) => rewards.findById(id),
    findBySessionId: (id) => rewards.findBySessionId(id),
    findBySessionIdInTransaction: (scope, id) => rewards.findBySessionIdInTransaction(scope, id),
    insertInTransaction: (scope, record) => {
      if (receiptFailure && record.reason === 'focus_completed') {
        receiptFailure = false;
        return Promise.resolve({ ok: false, error: persistenceError('PERSISTENCE_WRITE_FAILED', 'reward_transactions') });
      }
      return rewards.insertInTransaction(scope, record);
    },
  };
  const decoratedProfile: ProfileRepository = {
    find: () => profile.find(),
    findInTransaction: (scope) => profile.findInTransaction(scope),
    debitCatalogItemInTransaction: (scope, input) => profile.debitCatalogItemInTransaction(scope, input),
    applyProgressionInTransaction: (scope, input) => {
      if (profileFailure) {
        profileFailure = false;
        return Promise.resolve({ ok: false, error: persistenceError('PERSISTENCE_WRITE_FAILED', 'pet_profiles') });
      }
      return profile.applyProgressionInTransaction(scope, input);
    },
  };
  const resultRewards: RewardReceiptRepository = {
    ...decoratedRewards,
    findBySessionIdInTransaction: (scope, id) => {
      if (resultReadFailure) {
        resultReadFailure = false;
        return Promise.resolve({ ok: false, error: persistenceError('PERSISTENCE_QUERY_FAILED', 'reward_transactions') });
      }
      return rewards.findBySessionIdInTransaction(scope, id);
    },
  };
  return { profile: decoratedProfile, rewards: decoratedRewards, resultRewards };
};
