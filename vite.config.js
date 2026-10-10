import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' يخلي الموقع يشتغل على أي استضافة (GitHub Pages / Netlify / Vercel)
export default defineConfig({ plugins: [react()], base: './' });
