/**
 * Appearance Menu Component
 *
 * Dropdown menu for quick access to theme, density, and custom color settings.
 * Renders in the header/navbar for easy configuration.
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $theme,
  $customColors,
  setTheme,
  setCustomColor,
  resetCustomColors,
  themeNames,
  type Theme,
  type CustomThemeColors,
} from '../../stores/theme';
import { $density, setDensity, densityNames, type Density } from '../../stores/density';

const themes: Theme[] = ['system', 'dashboard', 'modern', 'bloomberg', 'custom'];
const densities: Density[] = ['compact', 'comfortable', 'spacious'];

// Color options for custom theme
const colorOptions: { key: keyof CustomThemeColors; label: string; group: string }[] = [
  { key: 'accent', label: 'Accent', group: 'Brand' },
  { key: 'bgPrimary', label: 'Background', group: 'Backgrounds' },
  { key: 'bgSecondary', label: 'Surface', group: 'Backgrounds' },
  { key: 'bgTertiary', label: 'Hover', group: 'Backgrounds' },
  { key: 'textPrimary', label: 'Primary Text', group: 'Text' },
  { key: 'textSecondary', label: 'Secondary Text', group: 'Text' },
  { key: 'textMuted', label: 'Muted Text', group: 'Text' },
  { key: 'border', label: 'Border', group: 'Other' },
  { key: 'positive', label: 'Positive', group: 'Status' },
  { key: 'negative', label: 'Negative', group: 'Status' },
];

export function AppearanceMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const currentTheme = useStore($theme);
  const currentDensity = useStore($density);
  const customColors = useStore($customColors);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomizer(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    if (theme === 'custom') {
      setShowCustomizer(true);
    }
  };

  return (
    <div className="appearance-menu" ref={menuRef}>
      <button
        className="appearance-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch theme"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>

      {isOpen && (
        <div className="appearance-dropdown">
          {/* Theme Section */}
          <div className="dropdown-section">
            <div className="section-header">Theme</div>
            <div className="theme-options">
              {themes.map((theme) => (
                <button
                  key={theme}
                  className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme)}
                  data-testid={`quick-theme-${theme}`}
                >
                  <span className={`theme-preview ${theme}`} />
                  <span className="theme-name">{themeNames[theme]}</span>
                  {currentTheme === theme && (
                    <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Density Section */}
          <div className="dropdown-section">
            <div className="section-header">Interface Density</div>
            <div className="density-options">
              {densities.map((density) => (
                <button
                  key={density}
                  className={`density-option ${currentDensity === density ? 'active' : ''}`}
                  onClick={() => setDensity(density)}
                  data-testid={`quick-density-${density}`}
                >
                  <span className={`density-preview ${density}`}>
                    <span className="preview-line" />
                    <span className="preview-line" />
                    <span className="preview-line" />
                  </span>
                  <span className="density-name">{densityNames[density]}</span>
                  {currentDensity === density && (
                    <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Theme Editor */}
          {currentTheme === 'custom' && (
            <div className="dropdown-section">
              <div className="section-header">
                <span>Custom Colors</span>
                <button
                  className="toggle-customizer"
                  onClick={() => setShowCustomizer(!showCustomizer)}
                >
                  {showCustomizer ? 'Hide' : 'Edit'}
                </button>
              </div>

              {showCustomizer && (
                <div className="color-customizer">
                  {colorOptions.map((option) => (
                    <div key={option.key} className="color-option">
                      <label className="color-label">{option.label}</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={customColors[option.key]}
                          onChange={(e) => setCustomColor(option.key, e.target.value)}
                          className="color-input"
                        />
                        <span className="color-value">{customColors[option.key]}</span>
                      </div>
                    </div>
                  ))}
                  <button className="reset-btn" onClick={resetCustomColors}>
                    Reset to defaults
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .appearance-menu {
    position: relative;
  }

  .appearance-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all 0.2s;
  }

  .appearance-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .appearance-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 280px;
    max-height: 80vh;
    overflow-y: auto;
    background-color: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    animation: slideIn 0.15s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-section {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .dropdown-section:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    padding: 0 0.25rem;
  }

  .toggle-customizer {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    text-transform: none;
    letter-spacing: normal;
  }

  .toggle-customizer:hover {
    text-decoration: underline;
  }

  .theme-options,
  .density-options {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .theme-option,
  .density-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 0.5rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all 0.15s;
    text-align: left;
  }

  .theme-option:hover,
  .density-option:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .theme-option.active,
  .density-option.active {
    background-color: rgba(var(--accent-rgb), 0.1);
    color: var(--text-primary);
  }

  .theme-name,
  .density-name {
    flex: 1;
  }

  .check-icon {
    color: var(--accent);
    flex-shrink: 0;
  }

  /* Theme Previews */
  .theme-preview {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--border);
    flex-shrink: 0;
  }

  .theme-preview.system {
    background: linear-gradient(135deg, #f8f9fa 25%, #0f172a 25%, #0f172a 50%, #f8f9fa 50%, #f8f9fa 75%, #0f172a 75%);
    background-size: 8px 8px;
  }

  .theme-preview.dashboard {
    background: linear-gradient(135deg, #0f172a 50%, #3b82f6 50%);
  }

  .theme-preview.modern {
    background: linear-gradient(135deg, #ffffff 50%, #6366f1 50%);
  }

  .theme-preview.bloomberg {
    background: linear-gradient(135deg, #0a0a0a 50%, #ff8c00 50%);
  }

  .theme-preview.custom {
    background: linear-gradient(135deg, var(--bg-primary) 50%, var(--accent) 50%);
  }

  /* Density Previews */
  .density-preview {
    width: 28px;
    height: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 2px 4px;
    background-color: var(--bg-tertiary);
    border-radius: 3px;
    flex-shrink: 0;
  }

  .density-preview.compact {
    gap: 1px;
  }

  .density-preview.comfortable {
    gap: 2px;
  }

  .density-preview.spacious {
    gap: 3px;
  }

  .preview-line {
    height: 3px;
    background-color: var(--text-muted);
    border-radius: 1px;
    opacity: 0.5;
  }

  /* Color Customizer */
  .color-customizer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .color-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .color-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    flex: 1;
  }

  .color-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-input {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    background: none;
  }

  .color-input::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  .color-input::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }

  .color-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6875rem;
    color: var(--text-muted);
    min-width: 60px;
  }

  .reset-btn {
    margin-top: 0.5rem;
    padding: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;

export default AppearanceMenu;
