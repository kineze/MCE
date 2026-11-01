// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  // The site is light only, so Nuxt UI's colour mode integration is off.
  ui: {
    colorMode: false,
  },

  // Display headings use Montserrat, the closest open match to the festival cover's type.
  // @nuxt/fonts downloads it at build time and serves it from this site.
  fonts: {
    families: [
      { name: 'Montserrat', provider: 'google', weights: [700, 800, 900] },
    ],
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/brand/mce-icon-64.png' },
        { rel: 'apple-touch-icon', href: '/brand/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#0398aa' },
      ],
    },
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
