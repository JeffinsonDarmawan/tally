import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// The balance engine is pure logic — a Node environment, no DOM, is all it needs.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: false,
  },
})
