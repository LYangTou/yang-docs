import path from 'node:path'
import { createRequire } from 'node:module'
import nextra from 'nextra'

const require = createRequire(import.meta.url)
const nextraDir = path.dirname(require.resolve('nextra/package.json'))
const remarkMermaidPackageJson = require.resolve(
  '@theguild/remark-mermaid/package.json',
  { paths: [nextraDir] }
)
const remarkMermaidComponent = path.join(
  path.dirname(remarkMermaidPackageJson),
  'dist',
  'mermaid.js'
)

const withNextra = nextra({
  latex: true,
  search: {
    codeblocks: true
  },
  contentDirBasePath: '/docs'
})

export default withNextra({
  reactStrictMode: true,
  // 静态导出，适合 GitHub Pages
  output: 'export',
  // GitHub Pages 仓库名
  basePath: '/yang-docs',
  trailingSlash: true,
  images: {
    // 导出静态时禁用 Image 优化，避免依赖服务端
    unoptimized: true
  },
  webpack(config) {
    config.resolve.alias['@theguild/remark-mermaid/mermaid'] = remarkMermaidComponent
    return config
  }
})
