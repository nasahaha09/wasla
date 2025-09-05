import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  base: '/Wasla/', // Replace 'wasla' with your actual GitHub repository name
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
