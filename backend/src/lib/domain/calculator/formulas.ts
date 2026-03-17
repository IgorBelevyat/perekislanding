import { CALC } from '../../config/constants';

/**
 * Server-side calculator formulas.
 * NEVER trust frontend calculations — always recompute on the server.
 *
 * Formula (from spec):
 *   V = L × W × H  (or direct volume)
 *   L(liters) = V × k
 *   C = CEILING(L / 4.17)
 *
 * Where:
 *   k = 0.5 (preventive), 0.7 (standard), 1.0 (shock)
 *   Canister: 5 kg, density ρ = 1.2 kg/L → 5 / 1.2 = 4.17 L per canister
 */

/**
 * Calculate volume from dimensions (L × W × H) in meters → m³.
 */
export function calculateVolume(L: number, W: number, H: number): number {
    return L * W * H;
}

/**
 * Calculate required liters of peroxide.
 * L = V × k
 */
export function calculateDosage(volumeM3: number, k: number): number {
    return Math.round(volumeM3 * k * 100) / 100; // round to 2 decimals
}

/**
 * Calculate how many 5kg canisters are needed.
 * C = CEILING(L / 4.17)
 */
export function calculateCanisters(litersNeeded: number): number {
    return Math.ceil(litersNeeded / CALC.CANISTER_LITERS);
}

/**
 * Full server-side calculation from input to result.
 */
export interface CalcResult {
    volumeM3: number;
    dosageLiters: number;
    requiredCanisters: number;
    canisterSizeKg: number;
    canisterSizeLiters: number;
}

export function fullCalculation(
    input: { L: number; W: number; H: number } | { V: number },
    k: number,
): CalcResult {
    const volumeM3 = 'V' in input
        ? input.V
        : calculateVolume(input.L, input.W, input.H);

    const dosageLiters = calculateDosage(volumeM3, k);
    const requiredCanisters = calculateCanisters(dosageLiters);

    return {
        volumeM3: Math.round(volumeM3 * 100) / 100,
        dosageLiters,
        requiredCanisters,
        canisterSizeKg: CALC.CANISTER_KG,
        canisterSizeLiters: CALC.CANISTER_LITERS,
    };
}
