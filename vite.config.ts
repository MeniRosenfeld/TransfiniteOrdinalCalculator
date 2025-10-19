import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',
    publicDir: 'public',
    server: {
        port: 3000,
        strictPort: false,
        open: '/index-tests.html',
        host: '127.0.0.1',  // Use IP instead of localhost
        hmr: false  // Disable hot module reload (might fix Firefox issue)
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        emptyOutDir: false,  // Don't delete dist folder (avoid EBUSY errors when browser has files open)
        rollupOptions: {
            input: {
                main: './index.html',
                // Include test pages in build
                'tests/ordinal_enf_test': './tests/ordinal_enf_test.html',
                'tests/ordinal_calculator_test': './tests/ordinal_calculator_test.html'
            },
            output: {
                entryFileNames: 'assets/bundle.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name][extname]'
            }
        }
    }
});

