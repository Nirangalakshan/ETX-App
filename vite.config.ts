// import { defineConfig } from 'vite'
// import path from 'node:path'
// import electron from 'vite-plugin-electron/simple'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     tailwindcss(),
//     react(),
//     electron({
//       main: {
//         // Shortcut of `build.lib.entry`.
//         entry: 'electron/main.ts',
//       },
//       preload: {
//         // Shortcut of `build.rollupOptions.input`.
//         // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
//         input: path.join(__dirname, 'electron/preload.ts'),
//       },
//       // Ployfill the Electron and Node.js API for Renderer process.
//       // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
//       // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
//       renderer: process.env.NODE_ENV === 'test'
//         // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
//         ? undefined
//         : {},
//     }),
//   ],
// })










import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron({
      main: {
        // Entry point for the main process
        entry: 'electron/main.ts',
      },
      preload: {
        // Input for the preload script
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Configure renderer process to polyfill Electron/Node.js APIs if needed
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {
            // Optional: Customize polyfills or additional options
            // See: https://github.com/electron-vite/vite-plugin-electron-renderer
          },
    }),
  ],
  // Set base to './' for relative paths, compatible with Electron's file:// protocol
  base: './',
  // Configure build output
  build: {
    outDir: 'dist', // Ensure output goes to 'dist' as per electron-builder.json5
    emptyOutDir: true, // Clear outDir before building
    rollupOptions: {
      // Ensure all assets are included in the build
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  // Resolve paths for imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Optional: Alias for src directory
    },
  },
  // Public directory for static assets (e.g., vite.svg)
  publicDir: 'public',
});