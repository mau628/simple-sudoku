// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: 'Simple Sudoku',
    }
  },
  compatibilityDate: '2025-07-15',
  css: [
    'bulma',
  ],
  devtools: { enabled: true },
  ssr: false,
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "bulma/sass/utilities" as *;'
        }
      }
    }
  }
})
