// TODO: implement watchlist service

export async function getWatchlist(userId: string): Promise<any[]> {
  // TODO: implement Firestore watchlist query
  return [];
}

export async function addToWatchlist(userId: string, item: any): Promise<string> {
  // TODO: implement add to watchlist
  return 'mock-watchlist-item-id';
}

export async function removeFromWatchlistBySymbol(userId: string, symbol: string): Promise<void> {
  // TODO: implement remove from watchlist
}

export function subscribeToWatchlist(
  userId: string,
  callback: (items: any[]) => void,
): () => void {
  // TODO: implement real-time watchlist subscription
  callback([]);
  return () => {
    // TODO: unsubscribe from Firestore listener
  };
}

export async function updateWatchlistItem(
  userId: string,
  itemId: string,
  data: any,
): Promise<void> {
  // TODO: implement watchlist item update
}
