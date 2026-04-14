/**
 * Strategy Code Validator
 *
 * Validates Python strategy code for correctness and safety
 * before submission. Checks class structure, required methods,
 * and blocks dangerous imports.
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  line: number;
  message: string;
  severity: ValidationSeverity;
}

const DANGEROUS_MODULES = [
  'os',
  'subprocess',
  'socket',
  'shutil',
  'sys',
  'ctypes',
  'importlib',
  'eval',
  'exec',
  'pickle',
  'shelve',
  'marshal',
  'tempfile',
  'signal',
  'multiprocessing',
  'threading',
];

const DANGEROUS_IMPORT_PATTERN = new RegExp(
  `^\\s*(?:import|from)\\s+(${DANGEROUS_MODULES.join('|')})\\b`
);

const CLASS_STRATEGY_PATTERN = /^\s*class\s+(\w+)\s*\(\s*.*Strategy.*\)\s*:/;
const DEF_PATTERN = /^\s*def\s+(\w+)\s*\(/;

export function validateStrategy(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  let hasStrategyClass = false;
  let strategyClassName = '';
  let strategyClassLine = -1;
  let insideStrategyClass = false;
  let strategyClassIndent = 0;
  const foundMethods = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for dangerous imports
    const dangerousMatch = line.match(DANGEROUS_IMPORT_PATTERN);
    if (dangerousMatch) {
      errors.push({
        line: lineNum,
        message: `Dangerous import blocked: '${dangerousMatch[1]}' is not allowed for security reasons.`,
        severity: 'error',
      });
    }

    // Check for eval/exec calls
    if (/\b(eval|exec)\s*\(/.test(line) && !line.trimStart().startsWith('#')) {
      errors.push({
        line: lineNum,
        message: `Use of '${line.includes('eval') ? 'eval' : 'exec'}()' is not allowed for security reasons.`,
        severity: 'error',
      });
    }

    // Check for __import__ calls
    if (/__import__\s*\(/.test(line) && !line.trimStart().startsWith('#')) {
      errors.push({
        line: lineNum,
        message: `Use of '__import__()' is not allowed for security reasons.`,
        severity: 'error',
      });
    }

    // Detect Strategy subclass
    const classMatch = line.match(CLASS_STRATEGY_PATTERN);
    if (classMatch) {
      hasStrategyClass = true;
      strategyClassName = classMatch[1];
      strategyClassLine = lineNum;
      insideStrategyClass = true;
      strategyClassIndent = line.search(/\S/);
      continue;
    }

    // Track methods inside strategy class
    if (insideStrategyClass) {
      // Check if we've exited the class (non-empty line at same or lesser indent)
      if (line.trim().length > 0 && !line.trimStart().startsWith('#')) {
        const currentIndent = line.search(/\S/);
        if (currentIndent <= strategyClassIndent && !line.match(/^\s*@/)) {
          insideStrategyClass = false;
        }
      }

      if (insideStrategyClass) {
        const defMatch = line.match(DEF_PATTERN);
        if (defMatch) {
          foundMethods.add(defMatch[1]);
        }
      }
    }
  }

  // Check for Strategy class
  if (!hasStrategyClass) {
    errors.push({
      line: 1,
      message: 'Strategy class not found. Your code must define a class that extends Strategy.',
      severity: 'error',
    });
  } else {
    // Check required methods
    const hasRankAssets = foundMethods.has('rank_assets');
    const hasOptimizePortfolio = foundMethods.has('optimize_portfolio');

    if (!hasRankAssets && !hasOptimizePortfolio) {
      errors.push({
        line: strategyClassLine,
        message: `Class '${strategyClassName}' must implement at least one of: rank_assets, optimize_portfolio.`,
        severity: 'error',
      });
    }

    if (!foundMethods.has('name')) {
      errors.push({
        line: strategyClassLine,
        message: `Class '${strategyClassName}' is missing the 'name' property. Consider adding it for identification.`,
        severity: 'warning',
      });
    }
  }

  // Check for empty code
  if (code.trim().length === 0) {
    return [{
      line: 1,
      message: 'Strategy code is empty.',
      severity: 'error',
    }];
  }

  return errors;
}

/**
 * Convert ValidationSeverity to Monaco MarkerSeverity value.
 * Monaco MarkerSeverity: 1=Hint, 2=Info, 4=Warning, 8=Error
 */
export function toMonacoSeverity(severity: ValidationSeverity): number {
  switch (severity) {
    case 'error': return 8;
    case 'warning': return 4;
    case 'info': return 2;
  }
}
