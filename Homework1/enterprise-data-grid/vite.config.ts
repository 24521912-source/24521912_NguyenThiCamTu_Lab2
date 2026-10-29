import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // globals: true để @testing-library/react tự cleanup DOM sau mỗi test
    globals: true,
  },
})
