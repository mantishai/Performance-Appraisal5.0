import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',
    server: {
        port: 3000,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        target: 'es2015',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['chart.js', 'xlsx'],
                    core: ['./js/app.js', './js/api.js', './js/utils.js']
                }
            }
        }
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')
    },
    test: {
        globals: true,
        environment: 'jsdom'
    }
});