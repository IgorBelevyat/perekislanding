import { useState, useEffect } from 'react';
import { api } from '../Api/api';

// Module-level cache so multiple components share the same data
let cachedData = null;
let fetchPromise = null;

function fetchBundlesOnce() {
    if (cachedData) return Promise.resolve(cachedData);
    if (fetchPromise) return fetchPromise;

    fetchPromise = api.getBundles()
        .then(data => {
            cachedData = {
                bundles: data.bundles || [],
                peroxideImageUrl: data.peroxideImageUrl || null,
                peroxideInStock: data.peroxideInStock ?? true,
                peroxideAvailability: data.peroxideAvailability || '',
                pricesConsistent: data.pricesConsistent ?? true,
            };
            return cachedData;
        })
        .catch(err => {
            console.error('Failed to fetch bundles:', err);
            fetchPromise = null; // Allow retry on failure
            return {
                bundles: [],
                peroxideImageUrl: null,
                peroxideInStock: true,
                peroxideAvailability: '',
                pricesConsistent: true,
            };
        });

    return fetchPromise;
}

/**
 * Shared hook for bundle data.
 * Both CalculatorResult and BundlesBlock use this
 * to avoid duplicate API calls.
 */
export function useBundles() {
    const [data, setData] = useState(cachedData || {
        bundles: [],
        peroxideImageUrl: null,
        peroxideInStock: true,
        peroxideAvailability: '',
        pricesConsistent: true,
    });
    const [isLoading, setIsLoading] = useState(!cachedData);

    useEffect(() => {
        let isMounted = true;
        fetchBundlesOnce().then(result => {
            if (isMounted) {
                setData(result);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    return {
        bundles: data.bundles,
        peroxideImageUrl: data.peroxideImageUrl,
        peroxideInStock: data.peroxideInStock,
        peroxideAvailability: data.peroxideAvailability,
        pricesConsistent: data.pricesConsistent,
        isLoading,
    };
}

/**
 * Lookup a bundle by its id.
 */
export function getBundleById(bundles, id) {
    return bundles.find(b => b.id === id) || null;
}
