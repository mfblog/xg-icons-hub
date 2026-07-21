---
name: ui-optimization-minimal-flat
overview: 在保持现有功能不变的前提下，将 UI 转向极简扁平风格，增加微交互，并优化移动端适配。
design:
  architecture:
    framework: html
  styleKeywords:
    - 极简扁平
    - 黑白灰
    - 1px 边框
    - 小圆角
    - 无阴影无模糊
    - 错峰入场动画
    - 单一强调色
    - 高可读性
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 13px
      weight: 500
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#18181B"
      - "#3B82F6"
      - "#2563EB"
    background:
      - "#FFFFFF"
      - "#FAFAFA"
      - "#0A0A0A"
      - "#141414"
    text:
      - "#18181B"
      - "#71717A"
      - "#FAFAFA"
      - "#A1A1AA"
    functional:
      - "#E5E5E5"
      - "#262626"
      - "#18181B"
      - "#3B82F6"
todos:
  - id: rewrite-css-tokens
    content: 重写 style.css 设计令牌与全局基础样式为极简扁平体系（含深浅双主题）
    status: completed
  - id: restyle-components
    content: 重构侧栏、搜索框、分类导航、图标卡片、Toast、回顶按钮样式及入场动画
    status: completed
    dependencies:
      - rewrite-css-tokens
  - id: enhance-html-icons
    content: 调整 index.html：emoji 替换为内联 SVG 图标并补充 aria 属性
    status: completed
    dependencies:
      - rewrite-css-tokens
  - id: add-micro-interactions
    content: 在 script.js 中为卡片渲染注入错峰入场延迟并联动主题图标切换
    status: completed
    dependencies:
      - restyle-components
      - enhance-html-icons
  - id: polish-mobile-adaptation
    content: 优化移动端触控目标、吸顶头部与安全区适配
    status: completed
    dependencies:
      - restyle-components
  - id: verify-ui-screenshots
    content: 使用 [skill:playwright-cli] 截取多视口多主题截图验证 UI 效果
    status: completed
    dependencies:
      - add-micro-interactions
      - polish-mobile-adaptation
---

## 用户需求

在功能完全不变的前提下，对 XG-icons 图标托管站进行 UI 界面优化。用户明确三个方向：转向极简扁平风格、增加微交互、加强移动端适配。

## 产品概述

XG-icons 是一个自托管图标库站点，提供图标浏览、搜索、分类筛选与一键复制链接功能。当前 UI 为 Apple Glassmorphism 风格（半透明模糊、柔和阴影、大圆角），本次改造将其升级为干净利落的极简扁平设计，同时保留全部交互功能。

## 核心功能（保持不变）

- 图标网格展示：按分类组织，全部/单分类切换，名称两行截断
- 搜索过滤：实时过滤 + 清空按钮
- 分类筛选：桌面端侧边栏列表，移动端下拉选择器
- 深浅色主题切换（localStorage 持久化）
- 点击卡片复制图标 URL，Toast 反馈
- 回到顶部按钮、Logo 点击回顶
- 响应式布局（桌面侧边栏 / 平板顶栏 / 手机多列网格）

## 视觉优化目标

- 极简扁平：去除毛玻璃模糊与弥散阴影，改用纯色背景 + 1px 细边框 + 小圆角；黑白灰为主、单一强调色点缀
- 微交互：卡片入场错峰淡入、悬停轻微位移与边框高亮、按钮按压反馈、搜索框聚焦过渡、Toast 弹性滑入、主题切换图标过渡
- 移动端：加大触控目标、吸顶头部优化、安全区适配、更紧凑的网格间距

## 技术栈

- 纯静态前端：原生 HTML + CSS + JavaScript（无框架、无构建依赖，与现有项目一致）
- 样式核心：CSS Custom Properties 设计令牌（沿用现有 `:root` / `[data-theme="dark"]` 双主题方案）
- 动画：CSS transition/animation 为主，JS 仅负责注入错峰延迟与状态类，零第三方库

## 实现方案

### 总体策略

以 `static/style.css` 全面重写为主，对 `views/index.html` 做小幅结构增强（用内联 SVG 图标替换 emoji、补充必要的 class/hook），`static/script.js` 仅在渲染卡片与主题切换处追加少量微交互逻辑。所有 DOM id、class 命名、JS 事件绑定与 API 调用保持不变，确保零功能回归。

### 关键技术决策

1. **扁平化令牌重构**：移除 `--backdrop-blur`、弱化阴影体系（保留 hover 单层浅阴影），边框统一 1px `var(--border-color)`，圆角从 10/18/24px 收敛为 8/10/12px；侧栏背景由半透明改为纯色，用右边框分隔。
2. **微交互实现方式**：

- 卡片入场：JS 渲染时为每张卡片注入 `style.animation-delay`（按索引错峰，上限约 300ms），CSS 定义 `fadeInUp` 关键帧；增量渲染（搜索过滤）同样生效。复杂度 O(n)，仅一次样式写入，无重排风险。
- 悬停/按压：`transform: translateY(-2px)` + 边框颜色加深，`:active` 回弹 `scale(0.98)`；使用 `transform` 与 `opacity`，仅触发合成层，性能最优。
- 主题切换：SVG 太阳/月亮图标旋转淡入淡出（CSS class 切换 + transition）。
- 尊重无障碍：媒体查询 `prefers-reduced-motion: reduce` 时禁用所有动画。

3. **移动端适配**：触控目标最小 40px；搜索行吸顶并压缩头部留白；`env(safe-area-inset-bottom)` 适配刘海屏底部；Toast 与回顶按钮避开安全区；480px 以下维持 4 列、359px 以下 3 列的现有断点逻辑。
4. **图标替换**：主题切换（🌓）与回顶（👆）的 emoji 替换为内联 SVG，保证跨平台渲染一致，符合极简风格。

### 性能与兼容性

- 纯 CSS 动画 + `will-change` 谨慎使用（仅入场动画期间），避免长驻合成层占用内存
- 错峰延迟通过内联 `animation-delay` 一次性设置，不监听 scroll，无 JS 性能负担
- 保留现有媒体查询断点（1024/480/359px），向后兼容；不改动服务端与构建脚本（server/、build.js、wrangler.jsonc）

## 架构设计

单页静态应用，三层结构不变：

```
视图层 views/index.html  →  样式层 static/style.css  →  交互层 static/script.js
```

数据流不变：fetch `/api/config.json` 与 `/api/icons.json` → 渲染分类与卡片 → 用户交互（搜索/筛选/复制）。

## 目录结构

仅涉及 3 个前端文件，其余文件（server/、build.js、Dockerfile 等）不受影响：

```
xg-icons-hub/
├── views/
│   └── index.html      # [MODIFY] 结构增强：emoji 替换为内联 SVG 图标（主题切换、回顶）；搜索框前置放大镜 SVG；为入场动画与状态切换补充必要的 class/aria 属性；不改变任何 id 与 JS 引用关系
├── static/
│   ├── style.css       # [MODIFY] 全面重写：设计令牌扁平化（去模糊/去弥散阴影/1px 边框/小圆角）；侧栏、搜索框、分类列表、图标卡片、Toast、回顶按钮全部按极简扁平风格重构；新增 fadeInUp 入场关键帧、focus-visible 焦点环、prefers-reduced-motion 降级；移动端安全区与触控目标优化
│   └── script.js       # [MODIFY] 微交互增量：createIconCard 渲染时按索引注入 animation-delay 实现错峰入场；主题切换时切换 SVG 图标显隐状态；不改动数据获取、搜索、分类、复制等任何既有逻辑
└── views/
    └── test_layout.html # 仅引用 style.css，随新样式自然生效，无需修改
```

## 实施注意事项

- **回归红线**：不得修改任何 DOM id（`iconGrid`、`searchInput`、`themeToggle`、`categoryList`、`mobileCategorySelect`、`toast`、`backToTop` 等），script.js 中的选择器与事件流保持原样
- **搜索重渲染**：`renderIcons()` 每次清空重建卡片，入场动画需在重建时重新触发（靠新节点动画自然生效，延迟按当前批次索引计算）
- **暗色模式**：扁平风格下暗色边框对比度需提高（如 #262626），避免卡片与背景融为一体
- **动画降级**：所有关键帧动画包裹在 `@media (prefers-reduced-motion: no-preference)` 中

## 设计风格：极简扁平（Minimal Flat）

以「内容即界面」为原则，去除一切装饰性元素：无毛玻璃、无弥散阴影、无渐变，依靠精确的分割线、留白与排版建立秩序感。

### 布局

- **桌面端**：左侧固定 260px 纯色侧栏（白/近黑），与主区间 1px 分割线；主区最大宽度自适应，图标网格 `minmax(110px, 1fr)`，间距收紧至 16px，视觉更整齐
- **侧栏内部**：Logo + 标题居上，搜索框紧随其下，分类列表纵向排列（激活项左侧 2px 强调色指示条 + 浅底色块），底部 footer 细线分隔
- **移动端**：侧栏折叠为吸顶头部（Logo 行 + 搜索/分类行），搜索框与分类下拉等高（40px），头部底部 1px 分割线，滚动时保持纯色背景保证可读性

### 组件细节

- **图标卡片**：纯白/深色纯色底，1px 中性边框，10px 圆角；悬停时边框加深 + 上移 2px + 图标放大 1.15 倍；按压 scale(0.98) 回弹；分类角标保持悬停显现
- **搜索框**：浅灰填充底（无描边），聚焦时 2px 强调色焦点环 + 背景提亮，左侧放大镜 SVG，右侧圆形清空按钮
- **主题切换/回顶按钮**：线性 SVG 图标（1.5px 描边），悬停浅灰圆形底衬，回顶按钮白底 1px 边框 + 浅阴影
- **Toast**：近黑纯色胶囊，无模糊，底部居中弹性滑入

### 交互动效

- 页面加载/切换分类/搜索时，卡片自下而上错峰淡入（每张递增 20ms，封顶 300ms）
- 主题切换：太阳/月亮图标旋转 180° 交叉淡入
- 分类切换：激活指示条 200ms 滑动过渡
- 所有过渡统一 `cubic-bezier(0.4, 0, 0.2, 1)`，时长 150-250ms

### 响应式

- ≥1025px 桌面侧栏布局；≤1024px 吸顶头部 + 自适应网格；≤480px 固定 4 列；≤359px 固定 3 列；全面适配 `safe-area-inset`

## Agent Extensions

### Skill

- **playwright-cli**
- Purpose: 实现完成后启动本地服务，用浏览器自动化截取桌面端（浅色/深色）与移动端视口的页面截图，验证极简扁平样式、入场动画与响应式布局
- Expected outcome: 获得多组视口/主题下的真实渲染截图，确认无样式回归、动画正常、移动端适配生效