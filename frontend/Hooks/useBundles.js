import { useState, useEffect } from 'react';
import { api } from '../Api/api';

// Module-level cache so multiple components share the same data
let cachedBundles = null;
let fetchPromise = null;

function fetchBundlesOnce() {
    if (cachedBundles) return Promise.resolve(cachedBundles);
    if (fetchPromise) return fetchPromise;

    fetchPromise = api.getBundles()
        .then(data => {
            cachedBundles = data.bundles || [];
            return cachedBundles;
        })
        .catch(err => {
            console.error('Failed to fetch bundles:', err);
            fetchPromise = null; // Allow retry on failure
            return [];
        });

    return fetchPromise;
}

/**
 * Shared hook for bundle data.
 * Both CalculatorResult and BundlesBlock use this
 * to avoid duplicate API calls.
 */
export function useBundles() {
    const [bundles, setBundles] = useState(cachedBundles || []);
    const [isLoading, setIsLoading] = useState(!cachedBundles);

    useEffect(() => {
        let isMounted = true;
        fetchBundlesOnce().then(data => {
            if (isMounted) {
                setBundles(data);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    return { bundles, isLoading };
}

/**
 * Lookup a bundle by its id.
 */
export function getBundleById(bundles, id) {
    return bundles.find(b => b.id === id) || null;
}
