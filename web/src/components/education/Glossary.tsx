import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import glossaryData from '../../content/glossary.json';

type Category = 'all' | 'trading' | 'risk' | 'portfolio' | 'technical';

interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'trading', label: 'Trading' },
  { value: 'risk', label: 'Risk' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'technical', label: 'Technical' },
];

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  searchWrapper: {
    position: 'relative' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 'var(--space-3)',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4) var(--space-3) var(--space-10)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    fontFamily: 'inherit',
  },
  categoryFilters: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-2)',
  },
  categoryButton: (isActive: boolean) => ({
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500 as const,
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    fontFamily: 'inherit',
    backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-tertiary)',
    color: isActive ? 'white' : 'var(--text-secondary)',
  }),
  termsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  termItem: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    transition: 'border-color var(--transition-fast)',
  },
  termHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 'var(--space-4)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 500,
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    transition: 'background-color var(--transition-fast)',
  },
  termHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  categoryBadge: (category: string) => {
    const colorMap: Record<string, { bg: string; color: string }> = {
      trading: { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)' },
      risk: { bg: 'var(--negative-bg)', color: 'var(--negative)' },
      portfolio: { bg: 'var(--positive-bg)', color: 'var(--positive)' },
      technical: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    };
    const colors = colorMap[category] || { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
    return {
      padding: '0.125rem 0.5rem',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      borderRadius: 'var(--radius-sm)',
      backgroundColor: colors.bg,
      color: colors.color,
    };
  },
  termDefinition: {
    padding: '0 var(--space-4) var(--space-4) var(--space-4)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
    borderTop: '1px solid var(--border)',
    paddingTop: 'var(--space-4)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'var(--space-12) var(--space-4)',
    color: 'var(--text-muted)',
  },
  resultCount: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  },
};

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const filteredTerms = useMemo(() => {
    const entries = glossaryData as GlossaryEntry[];
    return entries
      .filter((entry) => {
        const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          query === '' ||
          entry.term.toLowerCase().includes(query) ||
          entry.definition.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, activeCategory]);

  const toggleTerm = (term: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
      }
      return next;
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <div style={styles.searchWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search terms or definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            aria-label="Search glossary"
          />
        </div>
        <div style={styles.categoryFilters}>
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              style={styles.categoryButton(activeCategory === value)}
              aria-pressed={activeCategory === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.resultCount}>
        {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'} found
      </div>

      {filteredTerms.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No terms match your search. Try a different query or category.</p>
        </div>
      ) : (
        <div style={styles.termsList}>
          {filteredTerms.map((entry) => {
            const isExpanded = expandedTerms.has(entry.term);
            return (
              <div key={entry.term} style={styles.termItem}>
                <button
                  onClick={() => toggleTerm(entry.term)}
                  style={styles.termHeader}
                  aria-expanded={isExpanded}
                >
                  <span style={styles.termHeaderLeft}>
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    {entry.term}
                  </span>
                  <span style={styles.categoryBadge(entry.category)}>
                    {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                  </span>
                </button>
                {isExpanded && (
                  <div style={styles.termDefinition}>{entry.definition}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
