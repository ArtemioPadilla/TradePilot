/**
 * Strategies Service
 *
 * Firestore operations for trading strategies.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../firebase';
import type {
  Strategy,
  StrategyConfig,
  StrategyStatus,
  StrategySummary,
  StrategyType,
} from '../../types/strategies';

/**
 * Get Firestore strategies collection reference for current user
 */
function getStrategiesCollection() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  return collection(db, `users/${user.uid}/strategies`);
}

/**
 * Convert Firestore document to Strategy
 */
function docToStrategy(doc: { id: string; data: () => Record<string, unknown> }): Strategy {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId as string,
    name: data.name as string,
    description: data.description as string || '',
    config: data.config as StrategyConfig,
    status: data.status as StrategyStatus,
    code: data.code as string | undefined,
    tags: (data.tags as string[]) || [],
    isFavorite: data.isFavorite as boolean || false,
    isPublic: data.isPublic as boolean || false,
    authorVisible: data.authorVisible as boolean || false,
    allowCopy: data.allowCopy as boolean || false,
    copyCount: data.copyCount as number || 0,
    copiedFrom: data.copiedFrom as string | undefined,
    lastBacktestId: data.lastBacktestId as string | undefined,
    lastBacktestReturn: data.lastBacktestReturn as number | undefined,
    lastBacktestSharpe: data.lastBacktestSharpe as number | undefined,
    linkedAccounts: (data.linkedAccounts as string[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    lastRunAt: (data.lastRunAt as Timestamp)?.toDate(),
  };
}

/**
 * Convert Strategy to StrategySummary
 */
function strategyToSummary(strategy: Strategy): StrategySummary {
  return {
    id: strategy.id,
    name: strategy.name,
    type: strategy.config.type,
    status: strategy.status,
    description: strategy.description,
    lastBacktestReturn: strategy.lastBacktestReturn,
    lastBacktestSharpe: strategy.lastBacktestSharpe,
    isFavorite: strategy.isFavorite,
    isPublic: strategy.isPublic,
    linkedAccountCount: strategy.linkedAccounts.length,
    updatedAt: strategy.updatedAt,
  };
}

/**
 * Get all strategies for current user
 */
export async function getStrategies(options?: {
  status?: StrategyStatus;
  type?: StrategyType;
  favoritesOnly?: boolean;
  maxResults?: number;
}): Promise<Strategy[]> {
  const strategiesRef = getStrategiesCollection();
  let q = query(strategiesRef, orderBy('updatedAt', 'desc'));

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  if (options?.type) {
    q = query(q, where('config.type', '==', options.type));
  }

  if (options?.favoritesOnly) {
    q = query(q, where('isFavorite', '==', true));
  }

  if (options?.maxResults) {
    q = query(q, limit(options.maxResults));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToStrategy);
}

/**
 * Get strategy summaries for list display
 */
export async function getStrategySummaries(options?: {
  status?: StrategyStatus;
  type?: StrategyType;
  favoritesOnly?: boolean;
}): Promise<StrategySummary[]> {
  const strategies = await getStrategies(options);
  return strategies.map(strategyToSummary);
}

/**
 * Get a single strategy by ID
 */
export async function getStrategy(strategyId: string): Promise<Strategy | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const strategyRef = doc(db, `users/${user.uid}/strategies/${strategyId}`);
  const strategyDoc = await getDoc(strategyRef);

  if (!strategyDoc.exists()) {
    return null;
  }

  return docToStrategy({ id: strategyDoc.id, data: () => strategyDoc.data() as Record<string, unknown> });
}

/**
 * Create a new strategy
 */
export async function createStrategy(data: {
  name: string;
  description?: string;
  config: StrategyConfig;
  code?: string;
  tags?: string[];
}): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const strategiesRef = getStrategiesCollection();

  const strategyData = {
    userId: user.uid,
    name: data.name,
    description: data.description || '',
    config: data.config,
    status: 'draft' as StrategyStatus,
    code: data.code,
    tags: data.tags || [],
    isFavorite: false,
    isPublic: false,
    authorVisible: false,
    allowCopy: false,
    copyCount: 0,
    linkedAccounts: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(strategiesRef, strategyData);
  return docRef.id;
}

/**
 * Update an existing strategy
 */
export async function updateStrategy(
  strategyId: string,
  data: Partial<{
    name: string;
    description: string;
    config: StrategyConfig;
    code: string;
    tags: string[];
    status: StrategyStatus;
    isPublic: boolean;
    authorVisible: boolean;
    allowCopy: boolean;
    linkedAccounts: string[];
  }>
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const strategyRef = doc(db, `users/${user.uid}/strategies/${strategyId}`);

  await updateDoc(strategyRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(strategyId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const strategyRef = doc(db, `users/${user.uid}/strategies/${strategyId}`);

  await deleteDoc(strategyRef);
}

/**
 * Duplicate a strategy
 */
export async function duplicateStrategy(strategyId: string, newName?: string): Promise<string> {
  const strategy = await getStrategy(strategyId);

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  return createStrategy({
    name: newName || `${strategy.name} (Copy)`,
    description: strategy.description,
    config: strategy.config,
    code: strategy.code,
    tags: strategy.tags,
  });
}

/**
 * Toggle strategy favorite status
 */
export async function toggleStrategyFavorite(strategyId: string): Promise<boolean> {
  const strategy = await getStrategy(strategyId);

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  const newValue = !strategy.isFavorite;
  await updateStrategy(strategyId, { isFavorite: newValue } as Record<string, unknown>);
  return newValue;
}

/**
 * Update strategy status
 */
export async function updateStrategyStatus(
  strategyId: string,
  status: StrategyStatus
): Promise<void> {
  await updateStrategy(strategyId, { status });
}

/**
 * Link account to strategy for live trading
 */
export async function linkAccountToStrategy(
  strategyId: string,
  accountId: string
): Promise<void> {
  const strategy = await getStrategy(strategyId);

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  if (!strategy.linkedAccounts.includes(accountId)) {
    const linkedAccounts = [...strategy.linkedAccounts, accountId];
    await updateStrategy(strategyId, { linkedAccounts });
  }
}

/**
 * Unlink account from strategy
 */
export async function unlinkAccountFromStrategy(
  strategyId: string,
  accountId: string
): Promise<void> {
  const strategy = await getStrategy(strategyId);

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  const linkedAccounts = strategy.linkedAccounts.filter((id) => id !== accountId);
  await updateStrategy(strategyId, { linkedAccounts });
}

/**
 * Update strategy backtest results
 */
export async function updateStrategyBacktestResults(
  strategyId: string,
  backtestId: string,
  totalReturn: number,
  sharpeRatio: number
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const strategyRef = doc(db, `users/${user.uid}/strategies/${strategyId}`);

  await updateDoc(strategyRef, {
    lastBacktestId: backtestId,
    lastBacktestReturn: totalReturn,
    lastBacktestSharpe: sharpeRatio,
    lastRunAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to strategies updates
 */
export function subscribeToStrategies(
  callback: (strategies: Strategy[]) => void,
  options?: {
    status?: StrategyStatus;
  }
): () => void {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    callback([]);
    return () => {};
  }

  const db = getFirebaseDb();
  const strategiesRef = collection(db, `users/${user.uid}/strategies`);
  let q = query(strategiesRef, orderBy('updatedAt', 'desc'));

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const strategies = snapshot.docs.map(docToStrategy);
    callback(strategies);
  });

  return unsubscribe;
}

/**
 * Create strategy from template
 */
export async function createStrategyFromTemplate(
  templateId: string,
  name: string,
  description?: string
): Promise<string> {
  // Import templates dynamically to avoid circular dependency
  const { STRATEGY_TEMPLATES } = await import('../../types/strategies');

  const template = STRATEGY_TEMPLATES.find((t) => t.id === templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  return createStrategy({
    name,
    description: description || template.description,
    config: {
      type: template.type,
      parameters: template.config.parameters || {},
      universe: template.config.universe || 'sp500',
      customSymbols: template.config.customSymbols,
      rebalanceFrequency: template.config.rebalanceFrequency || 'monthly',
    },
    code: template.code,
    tags: [template.type, template.category],
  });
}

/**
 * Get strategy count by status
 */
export async function getStrategyCountByStatus(): Promise<Record<StrategyStatus, number>> {
  const strategies = await getStrategies();

  const counts: Record<StrategyStatus, number> = {
    draft: 0,
    active: 0,
    paused: 0,
    archived: 0,
  };

  strategies.forEach((s) => {
    counts[s.status]++;
  });

  return counts;
}

// =============================================================================
// Public Strategy Functions (Social Features)
// =============================================================================

import type { PublicStrategy, StrategyShareSettings } from '../../types/strategies';

/**
 * Get public strategies collection reference
 */
function getPublicStrategiesCollection() {
  const db = getFirebaseDb();
  return collection(db, 'strategies_public');
}

/**
 * Update strategy share settings
 */
export async function updateStrategyShareSettings(
  strategyId: string,
  settings: StrategyShareSettings
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const strategyRef = doc(db, `users/${user.uid}/strategies/${strategyId}`);

  // Update the strategy with share settings
  await updateDoc(strategyRef, {
    isPublic: settings.isPublic,
    authorVisible: settings.authorVisible,
    allowCopy: settings.allowCopy,
    updatedAt: serverTimestamp(),
  });

  // Sync to/from public collection
  if (settings.isPublic) {
    await publishStrategyToPublic(strategyId);
  } else {
    await unpublishStrategy(strategyId);
  }
}

/**
 * Publish a strategy to the public collection
 */
export async function publishStrategyToPublic(strategyId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const strategy = await getStrategy(strategyId);

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  const db = getFirebaseDb();

  // Get user display name if author is visible
  let authorName: string | undefined;
  if (strategy.authorVisible) {
    const userDoc = await getDoc(doc(db, `users/${user.uid}`));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      authorName = userData.displayName || userData.email?.split('@')[0];
    }
  }

  const publicStrategyData: Omit<PublicStrategy, 'id'> = {
    originalStrategyId: strategyId,
    userId: user.uid,
    authorName,
    authorVisible: strategy.authorVisible,
    allowCopy: strategy.allowCopy,
    name: strategy.name,
    description: strategy.description,
    type: strategy.config.type,
    config: strategy.config,
    tags: strategy.tags,
    lastBacktestReturn: strategy.lastBacktestReturn,
    lastBacktestSharpe: strategy.lastBacktestSharpe,
    copyCount: strategy.copyCount,
    viewCount: 0,
    publishedAt: new Date(),
    updatedAt: new Date(),
  };

  // Use the same ID as the original strategy for easy lookup
  const publicRef = doc(db, `strategies_public/${strategyId}`);
  const existingDoc = await getDoc(publicRef);

  if (existingDoc.exists()) {
    // Update existing
    await updateDoc(publicRef, {
      ...publicStrategyData,
      viewCount: existingDoc.data().viewCount || 0,
      publishedAt: existingDoc.data().publishedAt,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new
    const { setDoc } = await import('firebase/firestore');
    await setDoc(publicRef, {
      ...publicStrategyData,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Unpublish a strategy (remove from public collection)
 */
export async function unpublishStrategy(strategyId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const db = getFirebaseDb();
  const publicRef = doc(db, `strategies_public/${strategyId}`);
  const existingDoc = await getDoc(publicRef);

  if (existingDoc.exists()) {
    // Verify ownership
    const data = existingDoc.data();
    if (data.userId !== user.uid) {
      throw new Error('Not authorized to unpublish this strategy');
    }
    await deleteDoc(publicRef);
  }
}

/**
 * Get public strategies for browsing
 */
export async function getPublicStrategies(options?: {
  type?: StrategyType;
  sortBy?: 'copyCount' | 'return' | 'sharpe' | 'recent';
  maxResults?: number;
  searchQuery?: string;
}): Promise<PublicStrategy[]> {
  const db = getFirebaseDb();
  const publicRef = collection(db, 'strategies_public');

  // Build query based on sort option
  let q;
  switch (options?.sortBy) {
    case 'copyCount':
      q = query(publicRef, orderBy('copyCount', 'desc'));
      break;
    case 'return':
      q = query(publicRef, orderBy('lastBacktestReturn', 'desc'));
      break;
    case 'sharpe':
      q = query(publicRef, orderBy('lastBacktestSharpe', 'desc'));
      break;
    default:
      q = query(publicRef, orderBy('publishedAt', 'desc'));
  }

  if (options?.type) {
    q = query(q, where('type', '==', options.type));
  }

  if (options?.maxResults) {
    q = query(q, limit(options.maxResults));
  }

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      originalStrategyId: data.originalStrategyId as string,
      userId: data.userId as string,
      authorName: data.authorName as string | undefined,
      authorVisible: data.authorVisible as boolean,
      allowCopy: data.allowCopy as boolean,
      name: data.name as string,
      description: data.description as string,
      type: data.type as StrategyType,
      config: data.config as StrategyConfig,
      tags: (data.tags as string[]) || [],
      lastBacktestReturn: data.lastBacktestReturn as number | undefined,
      lastBacktestSharpe: data.lastBacktestSharpe as number | undefined,
      lastBacktestMaxDrawdown: data.lastBacktestMaxDrawdown as number | undefined,
      copyCount: data.copyCount as number || 0,
      viewCount: data.viewCount as number || 0,
      publishedAt: (data.publishedAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as PublicStrategy;
  });

  // Client-side search filter
  if (options?.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  return results;
}

/**
 * Get a single public strategy by ID
 */
export async function getPublicStrategy(strategyId: string): Promise<PublicStrategy | null> {
  const db = getFirebaseDb();
  const publicRef = doc(db, `strategies_public/${strategyId}`);
  const docSnapshot = await getDoc(publicRef);

  if (!docSnapshot.exists()) {
    return null;
  }

  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    originalStrategyId: data.originalStrategyId as string,
    userId: data.userId as string,
    authorName: data.authorName as string | undefined,
    authorVisible: data.authorVisible as boolean,
    allowCopy: data.allowCopy as boolean,
    name: data.name as string,
    description: data.description as string,
    type: data.type as StrategyType,
    config: data.config as StrategyConfig,
    tags: (data.tags as string[]) || [],
    lastBacktestReturn: data.lastBacktestReturn as number | undefined,
    lastBacktestSharpe: data.lastBacktestSharpe as number | undefined,
    lastBacktestMaxDrawdown: data.lastBacktestMaxDrawdown as number | undefined,
    copyCount: data.copyCount as number || 0,
    viewCount: data.viewCount as number || 0,
    publishedAt: (data.publishedAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * Copy/fork a public strategy to user's collection
 */
export async function copyPublicStrategy(
  publicStrategyId: string,
  newName?: string
): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const publicStrategy = await getPublicStrategy(publicStrategyId);

  if (!publicStrategy) {
    throw new Error('Public strategy not found');
  }

  if (!publicStrategy.allowCopy) {
    throw new Error('This strategy does not allow copying');
  }

  // Create the new strategy in user's collection
  const strategiesRef = getStrategiesCollection();

  const strategyData = {
    userId: user.uid,
    name: newName || `${publicStrategy.name} (Copy)`,
    description: publicStrategy.description,
    config: publicStrategy.config,
    status: 'draft' as StrategyStatus,
    tags: [...publicStrategy.tags, 'forked'],
    isFavorite: false,
    isPublic: false,
    authorVisible: false,
    allowCopy: false,
    copyCount: 0,
    copiedFrom: publicStrategyId,
    linkedAccounts: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(strategiesRef, strategyData);

  // Increment copy count on the public strategy
  const db = getFirebaseDb();
  const publicRef = doc(db, `strategies_public/${publicStrategyId}`);
  const { increment } = await import('firebase/firestore');
  await updateDoc(publicRef, {
    copyCount: increment(1),
  });

  // Also update the original strategy's copy count
  const originalStrategyRef = doc(
    db,
    `users/${publicStrategy.userId}/strategies/${publicStrategy.originalStrategyId}`
  );
  await updateDoc(originalStrategyRef, {
    copyCount: increment(1),
  }).catch(() => {
    // Ignore if original strategy doesn't exist
  });

  return docRef.id;
}

/**
 * Increment view count for a public strategy
 */
export async function incrementPublicStrategyViews(strategyId: string): Promise<void> {
  const db = getFirebaseDb();
  const publicRef = doc(db, `strategies_public/${strategyId}`);
  const { increment } = await import('firebase/firestore');

  await updateDoc(publicRef, {
    viewCount: increment(1),
  }).catch(() => {
    // Ignore if strategy doesn't exist
  });
}
