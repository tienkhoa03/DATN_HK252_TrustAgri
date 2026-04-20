import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    base: "",
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0,
      // Performance optimizations
      rollupOptions: {
        output: {
          // Optimize chunk file names
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000, // 1MB warning
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        format: {
          comments: false, // Remove comments
        },
      },
      // Source maps for debugging (disable in production)
      sourcemap: false,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'zmp-sdk', 'zmp-ui', 'jotai'],
    },
  });
};
