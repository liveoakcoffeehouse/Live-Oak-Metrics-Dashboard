import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using a relative base ('./') means the built app works when served from
// https://<user>.github.io/<repo-name>/ without you having to hardcode the
// repo name here. If you ever host it at a custom domain or the root of
// your github.io site, this still works.
export default defineConfig({
  plugins: [react()],
  base: './',
})
