// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { redirect: '/login' },
  },

  runtimeConfig: {
    public: {
      appName: 'MCE',
    },
  },

  devtools: {
    enabled: true,
  },
})
