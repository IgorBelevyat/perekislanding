/**
 * Interprets the raw "Наличие" field from MoySklad and returns
 * a display-ready object for stock badges.
 *
 * Priority:
 * 1. If `availability` is present and non-empty → use its semantic value
 *    "+"        → in stock
 *    "-"        → out of stock
 *    "&"        → expected / awaiting
 *    digit(s)   → made to order, N days delivery
 * 2. If `availability` is empty/missing → fall back to `inStock` boolean
 */

/**
 * @param {string} availability - raw availability string from MoySklad ("+", "-", "&", "3", "", etc.)
 * @param {boolean} inStock     - derived boolean (fallback when availability is empty)
 * @returns {{ text: string, variant: 'in' | 'out' | 'expected' | 'order' }}
 */
export function getStockStatus(availability, inStock) {
    const raw = (availability ?? '').trim();

    if (raw === '+') {
        return { text: 'В наявності', variant: 'in' };
    }

    if (raw === '-') {
        return { text: 'Немає в наявності', variant: 'out' };
    }

    if (raw === '&') {
        return { text: 'Очікується', variant: 'expected' };
    }

    // Any digits → days to delivery (made to order)
    if (/^\d+$/.test(raw)) {
        const days = parseInt(raw, 10);
        const dayWord = getDayWord(days);
        return {
            text: `Під замовлення (${days} ${dayWord})`,
            variant: 'order',
        };
    }

    // Fallback: use the boolean inStock
    if (inStock) {
        return { text: 'В наявності', variant: 'in' };
    }

    return { text: 'Товар закінчився', variant: 'out' };
}

/**
 * Ukrainian pluralization for "день/дні/днів"
 */
function getDayWord(n) {
    const abs = Math.abs(n) % 100;
    const lastDigit = abs % 10;

    if (abs >= 11 && abs <= 19) return 'днів';
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дні';
    return 'днів';
}
