# GitHub Pages 部署指南

## 您的游戏已经上传到 GitHub！

**仓库地址:** https://github.com/gaomeng626/pixel-jrpg-game

## 启用 GitHub Pages 的步骤

由于权限限制,需要您手动完成以下简单步骤来启用 GitHub Pages:

### 方法一：通过网页设置（推荐，最简单）

1. 访问仓库设置页面: https://github.com/gaomeng626/pixel-jrpg-game/settings/pages

2. 在 "Build and deployment" 部分:
   - **Source**: 选择 "Deploy from a branch"
   - **Branch**: 选择 "master" 分支
   - **Folder**: 选择 "/ (root)"

3. 点击 **Save** 按钮

4. 等待 1-2 分钟,GitHub Pages 会自动部署

5. 部署完成后,您的游戏将可以通过以下地址访问:
   **https://gaomeng626.github.io/pixel-jrpg-game/**

### 方法二：通过 GitHub Actions（高级）

如果您想使用 GitHub Actions 自动部署:

1. 访问: https://github.com/gaomeng626/pixel-jrpg-game/settings/pages

2. 在 "Build and deployment" 部分:
   - **Source**: 选择 "GitHub Actions"

3. 创建文件 `.github/workflows/deploy.yml` 并添加以下内容:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 部署后的访问地址

完成上述步骤后,您的游戏将永久托管在:

**🎮 https://gaomeng626.github.io/pixel-jrpg-game/**

这个地址将永久有效,您可以随时访问和分享!

## 更新游戏

如果您需要更新游戏内容:

1. 修改本地文件
2. 提交更改: `git add . && git commit -m "Update game"`
3. 推送到 GitHub: `git push origin master`
4. GitHub Pages 会自动更新(1-2分钟后生效)

## 注意事项

- GitHub Pages 是完全免费的
- 支持自定义域名
- 每个仓库限制 1GB 大小
- 每月带宽限制 100GB(对于个人项目完全足够)
