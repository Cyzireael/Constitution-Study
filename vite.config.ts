import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { appConfig } from './src/config/app'
import { buildThemeBootstrapScript } from './src/core/themeBootstrap'

function courseMaterialHeadersPlugin(): Plugin {
  const attach = (middlewares: { use: (handler: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void) => void }, publicDir: string | false, base: string) => {
    middlewares.use((req, res, next) => {
      let pathname: string
      try {
        pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
      } catch {
        next()
        return
      }
      const basePath = base === '/' ? '' : base.replace(/\/$/, '')
      const assetUrlPath = basePath && pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname
      const assetPath = publicDir ? resolve(publicDir, `.${assetUrlPath}`) : ''
      const assetRelativePath = publicDir && assetPath ? relative(publicDir, assetPath) : '..'
      const isPublicAsset = Boolean(publicDir && assetRelativePath && !assetRelativePath.startsWith('..') && existsSync(assetPath))
      const assetUrlLower = assetUrlPath.toLowerCase()
      const contentType = isPublicAsset && assetUrlLower.startsWith('/course-materials/') && assetUrlLower.endsWith('.pptx')
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : isPublicAsset && assetUrlLower.startsWith('/course-materials/') && assetUrlLower.endsWith('.pdf') ? 'application/pdf' : undefined

      if (contentType) {
        const headers = {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, no-store',
        }
        const protectedHeaderNames = new Set(Object.keys(headers).map((name) => name.toLowerCase()))
        const originalSetHeader = res.setHeader.bind(res)
        res.setHeader = ((name: string, value: number | string | readonly string[]) => {
          const protectedName = Object.keys(headers).find((header) => header.toLowerCase() === name.toLowerCase())
          return originalSetHeader(protectedName ?? name, protectedName ? headers[protectedName as keyof typeof headers] : value)
        }) as typeof res.setHeader

        const originalWriteHead = res.writeHead.bind(res)
        res.writeHead = ((...args: Parameters<typeof res.writeHead>) => {
          const lastArg = args[args.length - 1]
          if (lastArg && typeof lastArg === 'object') {
            const filteredHeaders = Object.fromEntries(Object.entries(lastArg).filter(([name]) => !protectedHeaderNames.has(name.toLowerCase())))
            args[args.length - 1] = { ...filteredHeaders, ...headers } as typeof lastArg
          } else {
            for (const [name, value] of Object.entries(headers)) originalSetHeader(name, value)
          }
          return originalWriteHead(...args)
        }) as typeof res.writeHead
      }

      next()
    })
  }

  return {
    name: 'course-material-response-headers',
    configureServer(server) {
      attach(server.middlewares, server.config.publicDir, server.config.base)
    },
    configurePreviewServer(server) {
      attach(server.middlewares, server.config.publicDir, server.config.base)
    },
  }
}

function appMetadataPlugin(): Plugin {
  return {
    name: 'app-metadata',
    transformIndexHtml(html) {
      const safeName = appConfig.displayName.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
      const safeDescription = appConfig.description.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
      return {
        html: html.replace('__APP_NAME__', safeName).replace('__APP_DESCRIPTION__', safeDescription),
        tags: [{ tag: 'script', children: buildThemeBootstrapScript(), injectTo: 'head-prepend' }],
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Constitution-Study/' : '/',
  plugins: [react(), appMetadataPlugin(), courseMaterialHeadersPlugin()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
}))
