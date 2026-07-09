import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      pool: 'threads',
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      deps: {
        inline: [
          '@csstools/css-calc',
          '@asamuzakjp/css-color',
          'cssstyle',
          'jsdom',
          'parse5'
        ]
      },
      server: {
        deps: {
          inline: [
            '@csstools/css-calc',
            '@asamuzakjp/css-color',
            'cssstyle',
            'jsdom',
            'parse5'
          ]
        }
      }
    }
  })
)
