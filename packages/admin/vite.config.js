var _a, _b, _c;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: (_a = process.env.VITE_API_BASE_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3000',
                changeOrigin: true,
            },
            '/auth': {
                target: (_b = process.env.VITE_API_BASE_URL) !== null && _b !== void 0 ? _b : 'http://localhost:3000',
                changeOrigin: true,
            },
            '/admin': {
                target: (_c = process.env.VITE_API_BASE_URL) !== null && _c !== void 0 ? _c : 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
});
