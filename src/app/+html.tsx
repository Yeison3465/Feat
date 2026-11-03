import { ScrollViewStyleReset } from 'expo-router/html'
import { type PropsWithChildren } from 'react'

/**
 * Este archivo configura el template HTML raíz en web para Expo Router.
 * Evita cualquier destello blanco (FOUC / flash) estableciendo el background
 * #060709 antes de que cargue el bundle de JavaScript.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es" className="dark" style={{ backgroundColor: '#060709', colorScheme: 'dark' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#060709" />
        <title>FEAT — Cartera Privada</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #root {
              background-color: #060709 !important;
              color: #ffffff;
              color-scheme: dark;
              margin: 0;
              padding: 0;
              height: 100%;
            }
          `
        }} />
      </head>
      <body style={{ backgroundColor: '#060709', colorScheme: 'dark' }}>{children}</body>
    </html>
  )
}

