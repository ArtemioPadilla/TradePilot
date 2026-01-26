/**
 * Appearance Settings Form Component
 *
 * Manages theme and density preferences for the application.
 */

import { useStore } from '@nanostores/react';
import {
  $theme,
  $resolvedTheme,
  $customColors,
  setTheme,
  setCustomColor,
  resetCustomColors,
  themeNames,
  type Theme,
  type CustomThemeColors,
} from '../../stores/theme';
import { $density, setDensity, densityNames, densityDescriptions, type Density } from '../../stores/density';

const themes: Theme[] = ['system', 'dashboard', 'modern', 'bloomberg', 'custom'];
const densities: Density[] = ['compact', 'comfortable', 'spacious'];

// Color options for custom theme editor
const colorOptions: { key: keyof CustomThemeColors; label: string; description: string }[] = [
  { key: 'accent', label: 'Accent Color', description: 'Primary brand color for buttons and highlights' },
  { key: 'bgPrimary', label: 'Background', description: 'Main page background' },
  { key: 'bgSecondary', label: 'Surface', description: 'Cards, sidebar, and elevated surfaces' },
  { key: 'bgTertiary', label: 'Hover', description: 'Hover states and subtle backgrounds' },
  { key: 'textPrimary', label: 'Primary Text', description: 'Main text and headings' },
  { key: 'textSecondary', label: 'Secondary Text', description: 'Descriptions and labels' },
  { key: 'textMuted', label: 'Muted Text', description: 'Hints and placeholder text' },
  { key: 'border', label: 'Border', description: 'Dividers and outlines' },
  { key: 'positive', label: 'Positive', description: 'Success states and gains' },
  { key: 'negative', label: 'Negative', description: 'Error states and losses' },
];

export function AppearanceSettingsForm() {
  const currentTheme = useStore($theme);
  const resolvedTheme = useStore($resolvedTheme);
  const currentDensity = useStore($density);
  const customColors = useStore($customColors);

  return (
    <div className="appearance-settings" data-testid="appearance-settings">
      {/* Theme Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          Theme
        </h3>
        <p className="section-description">
          Choose how TradePilot looks. Select a theme or use your system preference.
        </p>

        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
              onClick={() => setTheme(theme)}
              aria-pressed={currentTheme === theme}
              data-testid={`theme-${theme}`}
            >
              <div className={`theme-preview theme-preview-${theme}`}>
                <div className="preview-sidebar" />
                <div className="preview-content">
                  <div className="preview-header" />
                  <div className="preview-cards">
                    <div className="preview-card" />
                    <div className="preview-card" />
                  </div>
                </div>
              </div>
              <span className="theme-name">{themeNames[theme]}</span>
              {theme === 'system' && (
                <span className="theme-hint">Currently: {themeNames[resolvedTheme]}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Interface Density Section */}
      <section className="settings-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
          </svg>
          Interface Density
        </h3>
        <p className="section-description">
          Control the spacing and compactness of the interface elements.
        </p>

        <div className="density-options" role="radiogroup" aria-label="Display density">
          {densities.map((density) => (
            <label
              key={density}
              className={`density-option ${currentDensity === density ? 'active' : ''}`}
              data-testid={`density-${density}`}
            >
              <input
                type="radio"
                name="density"
                value={density}
                checked={currentDensity === density}
                onChange={() => setDensity(density)}
                className="visually-hidden"
              />
              <div className={`density-preview density-preview-${density}`}>
                <div className="preview-row" />
                <div className="preview-row" />
                <div className="preview-row" />
              </div>
              <div className="density-info">
                <span className="density-name">{densityNames[density]}</span>
                <span className="density-description">{densityDescriptions[density]}</span>
              </div>
              <div className="density-check">
                {currentDensity === density && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Custom Theme Editor - Only shown when custom theme is selected */}
      {currentTheme === 'custom' && (
        <section className="settings-section" data-testid="custom-theme-editor">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
            </svg>
            Custom Colors
          </h3>
          <p className="section-description">
            Customize every color in your theme. Changes are applied instantly.
          </p>

          <div className="color-editor">
            {colorOptions.map((option) => (
              <div key={option.key} className="color-field">
                <div className="color-field-info">
                  <label className="color-field-label" htmlFor={`color-${option.key}`}>
                    {option.label}
                  </label>
                  <span className="color-field-description">{option.description}</span>
                </div>
                <div className="color-field-input">
                  <input
                    type="color"
                    id={`color-${option.key}`}
                    value={customColors[option.key]}
                    onChange={(e) => setCustomColor(option.key, e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={customColors[option.key]}
                    onChange={(e) => setCustomColor(option.key, e.target.value)}
                    className="color-hex-input"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="reset-colors-btn"
              onClick={resetCustomColors}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset to defaults
            </button>
          </div>
        </section>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .appearance-settings {
    max-width: 600px;
  }

  .settings-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .settings-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .settings-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.375rem 0;
  }

  .settings-section h3 svg {
    color: var(--text-muted, #6b7280);
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    margin: 0 0 1.25rem 0;
  }

  /* Theme Grid */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .theme-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.625rem;
    padding: 0.75rem;
    background: none;
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-option:hover {
    border-color: var(--text-muted, #6b7280);
  }

  .theme-option.active {
    border-color: var(--accent, #6366f1);
    background-color: rgba(var(--accent-rgb, 99, 102, 241), 0.05);
  }

  .theme-preview {
    width: 100%;
    height: 64px;
    border-radius: var(--radius-sm, 0.25rem);
    overflow: hidden;
    display: flex;
    position: relative;
  }

  .theme-preview-system {
    background: linear-gradient(135deg, #1e293b 50%, #f8fafc 50%);
  }

  .theme-preview-dashboard {
    background-color: #0f172a;
  }

  .theme-preview-dashboard .preview-sidebar {
    background-color: #1e293b;
  }

  .theme-preview-dashboard .preview-header {
    background-color: #1e293b;
  }

  .theme-preview-dashboard .preview-card {
    background-color: #1e293b;
  }

  .theme-preview-modern {
    background-color: #f8fafc;
  }

  .theme-preview-modern .preview-sidebar {
    background-color: #ffffff;
    border-right: 1px solid #e2e8f0;
  }

  .theme-preview-modern .preview-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .theme-preview-modern .preview-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
  }

  .theme-preview-bloomberg {
    background-color: #0a0a0a;
  }

  .theme-preview-bloomberg .preview-sidebar {
    background-color: #1a1a1a;
  }

  .theme-preview-bloomberg .preview-header {
    background-color: #1a1a1a;
  }

  .theme-preview-bloomberg .preview-card {
    background-color: #1a1a1a;
    border: 1px solid #333;
  }

  .theme-preview-custom {
    background-color: var(--bg-primary, #0f172a);
  }

  .theme-preview-custom .preview-sidebar {
    background-color: var(--bg-secondary, #1e293b);
  }

  .theme-preview-custom .preview-header {
    background-color: var(--bg-secondary, #1e293b);
  }

  .theme-preview-custom .preview-card {
    background-color: var(--bg-secondary, #1e293b);
    border: 1px solid var(--border, #334155);
  }

  .theme-preview-custom::after {
    content: '';
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 12px;
    height: 12px;
    background-color: var(--accent, #6366f1);
    border-radius: 50%;
  }

  .preview-sidebar {
    width: 20%;
    height: 100%;
  }

  .preview-content {
    flex: 1;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .preview-header {
    height: 8px;
    border-radius: 2px;
  }

  .preview-cards {
    display: flex;
    gap: 4px;
    flex: 1;
  }

  .preview-card {
    flex: 1;
    border-radius: 2px;
  }

  .theme-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .theme-hint {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  /* Density Options */
  .density-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .density-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-lg, 0.5rem);
    cursor: pointer;
    transition: all 0.2s;
  }

  .density-option:hover {
    border-color: var(--text-muted, #6b7280);
  }

  .density-option.active {
    border-color: var(--accent, #6366f1);
    background-color: rgba(var(--accent-rgb, 99, 102, 241), 0.05);
  }

  .density-preview {
    width: 48px;
    height: 36px;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-sm, 0.25rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 4px;
    flex-shrink: 0;
  }

  .density-preview .preview-row {
    height: 4px;
    background-color: var(--text-muted, #6b7280);
    border-radius: 2px;
    opacity: 0.5;
  }

  .density-preview-compact {
    gap: 3px;
  }

  .density-preview-comfortable {
    gap: 5px;
  }

  .density-preview-spacious {
    gap: 7px;
  }

  .density-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .density-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
  }

  .density-description {
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
  }

  .density-check {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent, #6366f1);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 640px) {
    .theme-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Color Editor */
  .color-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .color-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
    background-color: var(--bg-tertiary, #f3f4f6);
    border-radius: var(--radius-md, 0.5rem);
  }

  .color-field-info {
    flex: 1;
    min-width: 0;
  }

  .color-field-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #111827);
    margin-bottom: 0.125rem;
  }

  .color-field-description {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .color-field-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .color-picker {
    width: 36px;
    height: 36px;
    padding: 0;
    border: 2px solid var(--border, #e5e7eb);
    border-radius: var(--radius-sm, 0.25rem);
    cursor: pointer;
    background: none;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 3px;
  }

  .color-picker::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }

  .color-hex-input {
    width: 80px;
    padding: 0.5rem;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    color: var(--text-primary, #111827);
    background-color: var(--bg-secondary, #ffffff);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-sm, 0.25rem);
    text-transform: uppercase;
  }

  .color-hex-input:focus {
    outline: none;
    border-color: var(--accent, #6366f1);
  }

  .reset-colors-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6b7280);
    background: none;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: var(--radius-md, 0.5rem);
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-colors-btn:hover {
    background-color: var(--bg-tertiary, #f3f4f6);
    color: var(--text-primary, #111827);
    border-color: var(--text-muted, #6b7280);
  }

  @media (max-width: 640px) {
    .color-field {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .color-field-input {
      width: 100%;
    }

    .color-hex-input {
      flex: 1;
    }
  }
`;

export default AppearanceSettingsForm;
