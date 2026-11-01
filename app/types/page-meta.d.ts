declare module '#app' {
  interface PageMeta {
    /** Permission key required to open the page. The middleware returns 403 without it. */
    permission?: string
  }
}

export {}
