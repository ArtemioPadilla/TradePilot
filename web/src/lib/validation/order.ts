/**
 * Order Validation Schema
 *
 * Validates order requests before submission.
 */

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OrderToValidate {
  symbol?: string;
  side?: string;
  type?: string;
  timeInForce?: string;
  qty?: number;
  notional?: number;
  limitPrice?: number;
  stopPrice?: number;
  trailPercent?: number;
  trailPrice?: number;
  extendedHours?: boolean;
}

// Valid order types
const VALID_ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'];

// Valid time in force values
const VALID_TIME_IN_FORCE = ['day', 'gtc', 'ioc', 'fok'];

// Valid sides
const VALID_SIDES = ['buy', 'sell'];

// Symbol regex (1-5 uppercase letters)
const SYMBOL_REGEX = /^[A-Z]{1,5}$/;

// Maximum values for safety
const MAX_QTY = 100000;
const MAX_NOTIONAL = 1000000;
const MAX_PRICE = 1000000;

/**
 * Validate a stock symbol
 */
export function validateSymbol(symbol: string | undefined): string | null {
  if (!symbol || typeof symbol !== 'string') {
    return 'Symbol is required';
  }

  const normalized = symbol.trim().toUpperCase();

  if (!SYMBOL_REGEX.test(normalized)) {
    return 'Symbol must be 1-5 uppercase letters';
  }

  return null;
}

/**
 * Validate order side
 */
export function validateSide(side: string | undefined): string | null {
  if (!side) {
    return 'Side is required (buy or sell)';
  }

  if (!VALID_SIDES.includes(side.toLowerCase())) {
    return `Side must be one of: ${VALID_SIDES.join(', ')}`;
  }

  return null;
}

/**
 * Validate order type
 */
export function validateOrderType(type: string | undefined): string | null {
  if (!type) {
    return 'Order type is required';
  }

  if (!VALID_ORDER_TYPES.includes(type.toLowerCase())) {
    return `Order type must be one of: ${VALID_ORDER_TYPES.join(', ')}`;
  }

  return null;
}

/**
 * Validate time in force
 */
export function validateTimeInForce(timeInForce: string | undefined): string | null {
  if (!timeInForce) {
    return 'Time in force is required';
  }

  if (!VALID_TIME_IN_FORCE.includes(timeInForce.toLowerCase())) {
    return `Time in force must be one of: ${VALID_TIME_IN_FORCE.join(', ')}`;
  }

  return null;
}

/**
 * Validate quantity
 */
export function validateQuantity(qty: number | undefined, notional: number | undefined): string | null {
  // Must have either qty or notional
  if (qty === undefined && notional === undefined) {
    return 'Either quantity or dollar amount is required';
  }

  if (qty !== undefined) {
    if (typeof qty !== 'number' || isNaN(qty)) {
      return 'Quantity must be a number';
    }

    if (qty <= 0) {
      return 'Quantity must be positive';
    }

    if (qty > MAX_QTY) {
      return `Quantity cannot exceed ${MAX_QTY.toLocaleString()}`;
    }

    if (!Number.isFinite(qty)) {
      return 'Quantity must be a finite number';
    }
  }

  if (notional !== undefined) {
    if (typeof notional !== 'number' || isNaN(notional)) {
      return 'Dollar amount must be a number';
    }

    if (notional <= 0) {
      return 'Dollar amount must be positive';
    }

    if (notional > MAX_NOTIONAL) {
      return `Dollar amount cannot exceed $${MAX_NOTIONAL.toLocaleString()}`;
    }

    if (!Number.isFinite(notional)) {
      return 'Dollar amount must be a finite number';
    }
  }

  return null;
}

/**
 * Validate limit price
 */
export function validateLimitPrice(
  limitPrice: number | undefined,
  orderType: string | undefined
): string | null {
  const type = orderType?.toLowerCase();

  // Required for limit and stop_limit orders
  if (type === 'limit' || type === 'stop_limit') {
    if (limitPrice === undefined) {
      return 'Limit price is required for limit orders';
    }
  }

  if (limitPrice !== undefined) {
    if (typeof limitPrice !== 'number' || isNaN(limitPrice)) {
      return 'Limit price must be a number';
    }

    if (limitPrice <= 0) {
      return 'Limit price must be positive';
    }

    if (limitPrice > MAX_PRICE) {
      return `Limit price cannot exceed $${MAX_PRICE.toLocaleString()}`;
    }
  }

  return null;
}

/**
 * Validate stop price
 */
export function validateStopPrice(
  stopPrice: number | undefined,
  orderType: string | undefined
): string | null {
  const type = orderType?.toLowerCase();

  // Required for stop and stop_limit orders
  if (type === 'stop' || type === 'stop_limit') {
    if (stopPrice === undefined) {
      return 'Stop price is required for stop orders';
    }
  }

  if (stopPrice !== undefined) {
    if (typeof stopPrice !== 'number' || isNaN(stopPrice)) {
      return 'Stop price must be a number';
    }

    if (stopPrice <= 0) {
      return 'Stop price must be positive';
    }

    if (stopPrice > MAX_PRICE) {
      return `Stop price cannot exceed $${MAX_PRICE.toLocaleString()}`;
    }
  }

  return null;
}

/**
 * Validate trailing stop parameters
 */
export function validateTrailingStop(
  trailPercent: number | undefined,
  trailPrice: number | undefined,
  orderType: string | undefined
): string | null {
  const type = orderType?.toLowerCase();

  if (type === 'trailing_stop') {
    if (trailPercent === undefined && trailPrice === undefined) {
      return 'Trail percent or trail price is required for trailing stop orders';
    }

    if (trailPercent !== undefined && trailPrice !== undefined) {
      return 'Specify either trail percent or trail price, not both';
    }
  }

  if (trailPercent !== undefined) {
    if (typeof trailPercent !== 'number' || isNaN(trailPercent)) {
      return 'Trail percent must be a number';
    }

    if (trailPercent <= 0 || trailPercent > 100) {
      return 'Trail percent must be between 0 and 100';
    }
  }

  if (trailPrice !== undefined) {
    if (typeof trailPrice !== 'number' || isNaN(trailPrice)) {
      return 'Trail price must be a number';
    }

    if (trailPrice <= 0) {
      return 'Trail price must be positive';
    }
  }

  return null;
}

/**
 * Validate an order request
 */
export function validateOrder(order: OrderToValidate): OrderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validations
  const symbolError = validateSymbol(order.symbol);
  if (symbolError) errors.push(symbolError);

  const sideError = validateSide(order.side);
  if (sideError) errors.push(sideError);

  const typeError = validateOrderType(order.type);
  if (typeError) errors.push(typeError);

  const tifError = validateTimeInForce(order.timeInForce);
  if (tifError) errors.push(tifError);

  const qtyError = validateQuantity(order.qty, order.notional);
  if (qtyError) errors.push(qtyError);

  // Conditional validations
  const limitError = validateLimitPrice(order.limitPrice, order.type);
  if (limitError) errors.push(limitError);

  const stopError = validateStopPrice(order.stopPrice, order.type);
  if (stopError) errors.push(stopError);

  const trailingError = validateTrailingStop(
    order.trailPercent,
    order.trailPrice,
    order.type
  );
  if (trailingError) errors.push(trailingError);

  // Warnings (non-blocking)
  if (order.qty && order.qty > 1000) {
    warnings.push('Large order quantity - please verify');
  }

  if (order.notional && order.notional > 100000) {
    warnings.push('Large dollar amount - please verify');
  }

  if (order.extendedHours && order.type !== 'limit') {
    warnings.push('Extended hours trading typically requires limit orders');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default validateOrder;
