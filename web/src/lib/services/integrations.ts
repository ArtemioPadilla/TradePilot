// TODO: implement integration service

export function getIntegrationService() {
  return {
    getConnectedSources: async () => [],
    connect: async (adapterId: string, credentials: any) => ({
      success: false as const,
      error: 'Not implemented',
    }),
    disconnect: async (adapterId: string) => {},
    syncAll: async () => {},
    getLastSyncTime: () => null as Date | null,
    getSyncStatus: () => 'idle' as const,
  };
}
