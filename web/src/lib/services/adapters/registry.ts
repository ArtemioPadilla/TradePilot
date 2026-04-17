/**
 * Adapter Registry
 *
 * Plugin system for source adapters. New sources register here.
 * Components discover available adapters through this registry.
 *
 * @module adapters/registry
 */

import type { DataSource, AssetClass } from '../../../types/assets';
import type { SourceAdapter, AdapterInfo, AdapterCapabilities } from './types';

// ============================================================================
// Adapter Factory Type
// ============================================================================

/**
 * Factory function that creates adapter instances
 */
export type AdapterFactory<T = unknown> = () => SourceAdapter<T>;

// ============================================================================
// Adapter Metadata
// ============================================================================

interface AdapterMetadata {
  factory: AdapterFactory;
  status: 'available' | 'coming_soon' | 'deprecated';
}

// ============================================================================
// Adapter Registry
// ============================================================================

/**
 * AdapterRegistry - Central registry for all source adapters
 *
 * Usage:
 * - Register adapters: adapterRegistry.register('alpaca', () => new AlpacaAdapter())
 * - Get adapter: adapterRegistry.get('alpaca')
 * - List available: adapterRegistry.list()
 * - Get UI info: adapterRegistry.getInfo()
 */
class AdapterRegistry {
  private adapters = new Map<DataSource, AdapterMetadata>();
  private instances = new Map<DataSource, SourceAdapter>();

  /**
   * Register an adapter factory
   *
   * @param source - Data source ID
   * @param factory - Factory function to create adapter instances
   * @param status - Availability status
   */
  register(
    source: DataSource,
    factory: AdapterFactory,
    status: 'available' | 'coming_soon' | 'deprecated' = 'available'
  ): void {
    this.adapters.set(source, { factory, status });
  }

  /**
   * Get an adapter instance
   * Creates a new instance if one doesn't exist
   *
   * @param source - Data source ID
   * @returns Adapter instance or null if not registered
   */
  get<T = unknown>(source: DataSource): SourceAdapter<T> | null {
    // Return cached instance if available
    if (this.instances.has(source)) {
      return this.instances.get(source) as SourceAdapter<T>;
    }

    // Create new instance
    const metadata = this.adapters.get(source);
    if (!metadata) {
      return null;
    }

    const instance = metadata.factory();
    this.instances.set(source, instance);
    return instance as SourceAdapter<T>;
  }

  /**
   * Get a fresh adapter instance (not cached)
   * Useful for testing or when you need a clean state
   *
   * @param source - Data source ID
   * @returns New adapter instance or null if not registered
   */
  create<T = unknown>(source: DataSource): SourceAdapter<T> | null {
    const metadata = this.adapters.get(source);
    if (!metadata) {
      return null;
    }
    return metadata.factory() as SourceAdapter<T>;
  }

  /**
   * Clear cached instance for a source
   * Next get() will create a fresh instance
   *
   * @param source - Data source ID
   */
  clearInstance(source: DataSource): void {
    const instance = this.instances.get(source);
    if (instance) {
      // Disconnect before clearing
      instance.disconnect().catch(console.error);
      this.instances.delete(source);
    }
  }

  /**
   * Clear all cached instances
   */
  clearAllInstances(): void {
    for (const source of this.instances.keys()) {
      this.clearInstance(source);
    }
  }

  /**
   * Check if an adapter is registered
   *
   * @param source - Data source ID
   */
  has(source: DataSource): boolean {
    return this.adapters.has(source);
  }

  /**
   * List all registered adapter IDs
   *
   * @param filter - Optional filter
   */
  list(filter?: {
    status?: 'available' | 'coming_soon' | 'deprecated';
    assetClass?: AssetClass;
  }): DataSource[] {
    const sources: DataSource[] = [];

    for (const [source, metadata] of this.adapters) {
      // Filter by status
      if (filter?.status && metadata.status !== filter.status) {
        continue;
      }

      // Filter by asset class (requires instantiating adapter)
      if (filter?.assetClass) {
        const adapter = this.get(source);
        if (!adapter?.supportedAssetClasses.includes(filter.assetClass)) {
          continue;
        }
      }

      sources.push(source);
    }

    return sources;
  }

  /**
   * Get adapter info for UI display
   * Creates temporary instances to extract metadata
   */
  getInfo(): AdapterInfo[] {
    const info: AdapterInfo[] = [];

    for (const [source, metadata] of this.adapters) {
      const adapter = this.get(source);
      if (adapter) {
        info.push({
          id: adapter.id,
          displayName: adapter.displayName,
          description: adapter.description,
          icon: adapter.icon,
          supportedAssetClasses: adapter.supportedAssetClasses,
          capabilities: adapter.capabilities,
          status: metadata.status,
        });
      }
    }

    return info;
  }

  /**
   * Get info for a specific adapter
   *
   * @param source - Data source ID
   */
  getAdapterInfo(source: DataSource): AdapterInfo | null {
    const metadata = this.adapters.get(source);
    if (!metadata) {
      return null;
    }

    const adapter = this.get(source);
    if (!adapter) {
      return null;
    }

    return {
      id: adapter.id,
      displayName: adapter.displayName,
      description: adapter.description,
      icon: adapter.icon,
      supportedAssetClasses: adapter.supportedAssetClasses,
      capabilities: adapter.capabilities,
      status: metadata.status,
    };
  }

  /**
   * Get adapter for a specific asset class
   *
   * @param assetClass - Asset class to find adapter for
   * @returns First available adapter that supports the asset class
   */
  getForAssetClass(assetClass: AssetClass): SourceAdapter | null {
    for (const [source, metadata] of this.adapters) {
      if (metadata.status !== 'available') {
        continue;
      }

      const adapter = this.get(source);
      if (adapter?.supportedAssetClasses.includes(assetClass)) {
        return adapter;
      }
    }

    return null;
  }

  /**
   * Get all adapters that support a specific asset class
   *
   * @param assetClass - Asset class to find adapters for
   */
  getAllForAssetClass(assetClass: AssetClass): SourceAdapter[] {
    const adapters: SourceAdapter[] = [];

    for (const source of this.list({ status: 'available' })) {
      const adapter = this.get(source);
      if (adapter?.supportedAssetClasses.includes(assetClass)) {
        adapters.push(adapter);
      }
    }

    return adapters;
  }

  /**
   * Get count of registered adapters
   */
  get size(): number {
    return this.adapters.size;
  }

  /**
   * Unregister an adapter
   * Primarily for testing
   *
   * @param source - Data source ID
   */
  unregister(source: DataSource): void {
    this.clearInstance(source);
    this.adapters.delete(source);
  }

  /**
   * Clear all registrations
   * Primarily for testing
   */
  clear(): void {
    this.clearAllInstances();
    this.adapters.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Global adapter registry instance
 */
export const adapterRegistry = new AdapterRegistry();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get adapter by ID (convenience function)
 */
export function getAdapter<T = unknown>(source: DataSource): SourceAdapter<T> | null {
  return adapterRegistry.get<T>(source);
}

/**
 * Get all available adapters
 */
export function getAvailableAdapters(): AdapterInfo[] {
  return adapterRegistry.getInfo().filter(a => a.status === 'available');
}

/**
 * Check if a source is available
 */
export function isSourceAvailable(source: DataSource): boolean {
  const info = adapterRegistry.getAdapterInfo(source);
  return info?.status === 'available';
}
