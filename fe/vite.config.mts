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
      // KHÔNG override entry/chunkFileNames: zmp-vite-plugin đặt hậu tố `.module.js`
      // để Zalo nạp script dưới dạng ES module. Đổi tên thành `.js` khiến Zalo nạp
      // như classic script → lỗi "cannot use import.meta outside a module".
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
      esbuildOptions: {
        target: 'es2015',
      },
    },
  });
};
