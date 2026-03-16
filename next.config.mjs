import nextra from 'nextra'

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
  }
})
