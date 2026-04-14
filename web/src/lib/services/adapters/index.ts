import type { AdapterInfo } from './types';

export {
  type AdapterInfo,
  type ConnectionResult,
  type PortfolioHistoryPoint,
  type ExternalOrder,
} from './types';

// TODO: implement adapter registry

export const adapterRegistry = {
  getAdapter: (id: string) => null,
  register: (adapter: any) => {},
};

export function getAvailableAdapters(): AdapterInfo[] {
  // TODO: return registered adapters
  return [];
}
