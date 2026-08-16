import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages at https://<user>.github.io/<repo>/
// set VITE_BASE_PATH="/<repo>/" as a build-time env var (the included
// GitHub Actions workflow does this for you automatically).
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
