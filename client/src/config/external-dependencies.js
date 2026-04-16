"use strict";
/**
 * External Dependencies Configuration
 *
 * This file manages external CDN resources to reduce bundle size
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.preloadExternalDependencies = exports.loadExternalCSS = exports.loadExternalDependency = exports.EXTERNAL_DEPENDENCIES = void 0;
exports.EXTERNAL_DEPENDENCIES = {
    // UI Components (CDN)
    radixUI: {
        dialog: 'https://unpkg.com/@radix-ui/react-dialog@latest/dist/index.umd.js',
        dropdown: 'https://unpkg.com/@radix-ui/react-dropdown-menu@latest/dist/index.umd.js',
        tooltip: 'https://unpkg.com/@radix-ui/react-tooltip@latest/dist/index.umd.js',
        // Add more as needed
    },
    // Icons (CDN)
    icons: {
        lucide: 'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
        heroicons: 'https://cdn.jsdelivr.net/npm/heroicons@2.0.18/24/outline/index.js',
    },
    // Animation (CDN)
    animation: {
        framerMotion: 'https://unpkg.com/framer-motion@latest/dist/framer-motion.umd.js',
        lottie: 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
    },
    // Charts (CDN)
    charts: {
        chartjs: 'https://cdn.jsdelivr.net/npm/chart.js',
        d3: 'https://d3js.org/d3.v7.min.js',
    },
    // Utilities (CDN)
    utilities: {
        reactQuery: 'https://unpkg.com/@tanstack/react-query@latest/build/umd/index.production.min.js',
        axios: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
        moment: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js',
    },
    // Styling (CDN)
    styling: {
        tailwind: 'https://cdn.tailwindcss.com',
        // Glassmorphism styles are now consolidated in design-system.css
    }
};
/**
 * Load external dependency from CDN
 */
var loadExternalDependency = function (url) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function () { return resolve(); };
        script.onerror = function () { return reject(new Error("Failed to load ".concat(url))); };
        document.head.appendChild(script);
    });
};
exports.loadExternalDependency = loadExternalDependency;
/**
 * Load external CSS from CDN
 */
var loadExternalCSS = function (url) {
    return new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = function () { return resolve(); };
        link.onerror = function () { return reject(new Error("Failed to load CSS ".concat(url))); };
        document.head.appendChild(link);
    });
};
exports.loadExternalCSS = loadExternalCSS;
/**
 * Preload external dependencies for better performance
 */
var preloadExternalDependencies = function () {
    var criticalDependencies = [
        exports.EXTERNAL_DEPENDENCIES.icons.lucide,
        // Glassmorphism styles are now in design-system.css, not loaded from CDN
    ];
    criticalDependencies.forEach(function (url) {
        if (!url)
            return; // Skip undefined URLs
        var link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = url.endsWith('.css') ? 'style' : 'script';
        document.head.appendChild(link);
    });
};
exports.preloadExternalDependencies = preloadExternalDependencies;
