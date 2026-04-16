"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
            '@client': path_1.default.resolve(__dirname, './src'),
            '@local': path_1.default.resolve(__dirname, './'),
            '@server': path_1.default.resolve(__dirname, '../server'),
            '@shared': path_1.default.resolve(__dirname, '../shared'),
        },
    },
    server: {
        port: 3000,
        strictPort: false,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    query: ['@tanstack/react-query'],
                },
            },
        },
    },
});
