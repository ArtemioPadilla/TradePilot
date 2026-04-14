// TODO: implement account sync service

export function getAccountSyncService() {
  return {
    syncAccounts: async (userId: string) => {},
    getLastSync: async (userId: string) => null as Date | null,
    isRunning: () => false,
  };
}
