// TODO: implement position sync service

export async function syncPositions(userId: string): Promise<void> {
  // TODO: implement position synchronization with broker API
}

export async function getLastPositionSync(userId: string): Promise<Date | null> {
  // TODO: implement last sync timestamp lookup
  return null;
}

export function isPositionSyncRunning(): boolean {
  // TODO: implement sync status check
  return false;
}
