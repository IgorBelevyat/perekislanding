import { env } from '../../config/env';
import { logger } from '../../security/logger';
import { prisma } from '../../db/prisma';
import type { NPApiResponse } from './types';

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

/**
 * Log NP integration call to DB.
 */
async function logIntegration(
    action: string,
    requestMeta: Record<string, unknown>,
    responseMeta: Record<string, unknown>,
    success: boolean,
    errorMessage?: string,
) {
    try {
        await prisma.integrationLog.create({
            data: {
                provider: 'NOVAPOSHTA',
                action,
                requestMeta: requestMeta as any,
                responseMeta: responseMeta as any,
                status: success ? 'SUCCESS' : 'ERROR',
                errorMessage,
            },
        });
    } catch (err) {
        logger.error('Failed to log NP integration', { error: (err as Error).message });
    }
}

/**
 * Generic NP API call.
 */
export async function npApiCall<T>(
    modelName: string,
    calledMethod: string,
    methodProperties: Record<string, unknown>,
): Promise<NPApiResponse<T>> {
    const apiKey = env.NP_API_KEY;

    if (!apiKey) {
        logger.warn('NP API not configured — returning empty data');
        return { success: true, data: [], errors: [], warnings: ['NP_API_KEY not configured'] };
    }

    const body = {
        apiKey,
        modelName,
        calledMethod,
        methodProperties,
    };

    try {
        const response = await fetch(NP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000),
        });

        const data = (await response.json()) as NPApiResponse<T>;

        if (!data.success) {
            await logIntegration(calledMethod, { modelName, methodProperties }, { errors: data.errors }, false, data.errors.join('; '));
            throw new Error(`NP API error: ${data.errors.join('; ')}`);
        }

        await logIntegration(calledMethod, { modelName, calledMethod }, { count: data.data.length }, true);
        return data;
    } catch (err) {
        await logIntegration(calledMethod, { modelName, calledMethod }, {}, false, (err as Error).message);
        throw err;
    }
}
