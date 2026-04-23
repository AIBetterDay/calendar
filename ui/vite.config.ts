import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwind()],
  base: './',
  // Force a single copy of these libs across the bundle. Without this, the
  // connector pulls react-i18next@15 from its own deps while
  // `@better/connector-calendar` resolves react-i18next@17 from its nested
  // node_modules → two i18n instances, and the calendar's `useTranslation()`
  // hook reads from an instance that was never `init()`-ed, so all keys come
  // back as raw strings (e.g. the header showing "calendar.today" instead of
  // "今天"). React/ReactDOM are deduped for the same "two-React" reason.
  resolve: {
    dedupe: ['react', 'react-dom', 'react-i18next', 'i18next'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
  },
});
