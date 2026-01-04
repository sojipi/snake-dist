# LevelInfoDialog 详细 UI 设计方案

## 📱 整体界面结构

```
Canvas (1280x720)
└── LevelInfoDialog
    ├── Background (半透明遮罩)
    └── DialogPanel (主弹窗面板)
        ├── Header (顶部区域)
        │   ├── TitleLabel ("关卡信息")
        │   └── CloseButton (右上角X按钮)
        ├── Content (内容区域)
        │   ├── LevelInfoSection (关卡信息区)
        │   │   ├── LevelNameLabel (关卡名称)
        │   │   └── LevelDescLabel (关卡描述)
        │   ├── ExampleSection (示例牌型区)
        │   │   ├── ExampleTitleLabel ("示例牌型")
        │   │   └── ExampleTilesContainer
        │   │       └── ExampleTilesLayout (横向布局)
        │   └── HistorySection (弃牌历史区)
        │       ├── DiscardHistoryLabel ("弃牌历史")
        │       └── DiscardedTilesContainer
        │           └── DiscardedTilesLayout (网格布局)
        └── Footer (底部按钮区)
            └── ResumeButton ("继续游戏")
```

## 🎨 详细设计规格

### 1. Canvas 设置

- **分辨率**: 1280x720
- **适配模式**: SHOW_ALL
- **层级**: UI (524288)

### 2. LevelInfoDialog (根节点)

- **大小**: Full Screen (1280x720)
- **锚点**: Center
- **层级**: UI (524288)

### 3. Background (背景遮罩)

- **组件**: Sprite
- **大小**: Full Screen (1280x720)
- **颜色**: rgba(0, 0, 0, 150) - 半透明黑色
- **锚点**: Center
- **位置**: (0, 0)

### 4. DialogPanel (主弹窗)

- **组件**: Sprite + UITransform
- **大小**: 900x600
- **背景**: 圆角矩形，颜色 rgba(45, 45, 55, 255)
- **边框**: 2px，颜色 rgba(100, 150, 200, 255)
- **锚点**: Center
- **位置**: (0, 0)
- **动画**: 支持缩放动画

## 📋 Header 区域 (顶部)

### TitleLabel

- **组件**: Label
- **文本**: "关卡信息"
- **字体大小**: 32
- **颜色**: rgba(255, 255, 255, 255)
- **位置**: (-350, 250)
- **锚点**: Left-Center

### CloseButton

- **组件**: Button + Sprite
- **大小**: 40x40
- **背景**: 圆形，颜色 rgba(200, 60, 60, 255)
- **文本**: "×"
- **字体大小**: 24
- **位置**: (400, 250)
- **锚点**: Center

## 📖 Content 区域 (内容)

### LevelInfoSection (关卡信息区)

- **大小**: 800x100
- **位置**: (0, 150)
- **背景**: rgba(60, 60, 70, 255)
- **圆角**: 8px

#### LevelNameLabel

- **组件**: Label
- **字体大小**: 28
- **颜色**: rgba(255, 220, 100, 255) - 金黄色
- **位置**: (0, 20)
- **对齐**: Center
- **文本示例**: "Stage 1 - 断幺九入门"

#### LevelDescLabel

- **组件**: Label
- **字体大小**: 18
- **颜色**: rgba(200, 200, 200, 255)
- **位置**: (0, -20)
- **对齐**: Center
- **自动换行**: 启用
- **最大宽度**: 750
- **文本示例**: "学习断幺九的基本规则，只使用 2-8 的数牌组成和牌"

### ExampleSection (示例牌型区)

- **大小**: 800x150
- **位置**: (0, 0)
- **背景**: rgba(50, 80, 50, 255) - 深绿色

#### ExampleTitleLabel

- **组件**: Label
- **文本**: "目标牌型示例"
- **字体大小**: 22
- **颜色**: rgba(100, 255, 100, 255) - 亮绿色
- **位置**: (-350, 60)
- **锚点**: Left-Center

#### ExampleTilesContainer

- **大小**: 760x80
- **位置**: (0, 0)
- **组件**: Layout (Horizontal)

#### ExampleTilesLayout 设置

- **类型**: Horizontal
- **间距**: 8px
- **对齐**: Center
- **内边距**: Top:10, Bottom:10, Left:20, Right:20
- **子元素大小**: 自适应

### HistorySection (弃牌历史区)

- **大小**: 800x200
- **位置**: (0, -150)
- **背景**: rgba(80, 50, 50, 255) - 深红色

#### DiscardHistoryLabel

- **组件**: Label
- **文本**: "弃牌历史 (共 X 张)"
- **字体大小**: 22
- **颜色**: rgba(255, 150, 150, 255) - 浅红色
- **位置**: (-350, 80)
- **锚点**: Left-Center

#### DiscardedTilesContainer

- **大小**: 760x140
- **位置**: (0, -20)
- **组件**: Layout (Grid)

#### DiscardedTilesLayout 设置

- **类型**: Grid
- **约束类型**: Fixed Column Count
- **列数**: 10
- **间距**: X:8, Y:12
- **对齐**: Center
- **内边距**: Top:10, Bottom:10, Left:20, Right:20

## 🔘 Footer 区域 (底部按钮)

### ResumeButton

- **组件**: Button + Sprite + Label
- **大小**: 200x50
- **背景**: 渐变色 rgba(100, 200, 100, 255) -> rgba(80, 180, 80, 255)
- **边框**: 2px，颜色 rgba(150, 255, 150, 255)
- **圆角**: 25px
- **位置**: (0, -250)
- **锚点**: Center

#### ResumeButton 文本

- **文本**: "继续游戏"
- **字体大小**: 24
- **颜色**: rgba(255, 255, 255, 255)
- **对齐**: Center

#### ResumeButton 悬停效果

- **悬停**: 缩放 1.05 倍
- **按下**: 缩放 0.95 倍
- **颜色变化**: 稍微变亮

## 🎲 MiniTile (小麻将牌) 设计

### 示例牌型区域的牌

- **大小**: 40x56 (缩放 0.6 倍)
- **边框**: 1px，颜色 rgba(255, 255, 255, 100)
- **阴影**: 向右下偏移 2px，rgba(0, 0, 0, 100)

### 弃牌历史区域的牌

- **大小**: 35x49 (缩放 0.5 倍)
- **边框**: 1px，颜色 rgba(255, 200, 200, 150)
- **序号标签**:
  - 位置: 牌的正上方 15px
  - 大小: 20x20 圆形
  - 背景: rgba(255, 255, 0, 200)
  - 文字: 12px，黑色
  - 文本: 弃牌序号 (1, 2, 3...)

## 🎬 动画效果

### 显示动画

```javascript
// 1. 背景渐入
Background: opacity 0 -> 150, duration 0.2s

// 2. 面板弹出
DialogPanel:
  - scale (0,0,1) -> (1.1,1.1,1), duration 0.3s, easing: backOut
  - scale (1.1,1.1,1) -> (1,1,1), duration 0.1s, easing: backOut
```

### 隐藏动画

```javascript
// 面板缩小
DialogPanel: scale (1,1,1) -> (0,0,1), duration 0.2s, easing: backIn

// 背景渐出
Background: opacity 150 -> 0, duration 0.2s
```

### 微交互动画

- **按钮悬停**: 缩放 1.05 倍，duration 0.1s
- **按钮按下**: 缩放 0.95 倍，duration 0.05s
- **牌片悬停**: 轻微上浮 2px，duration 0.1s

## 🎨 配色方案

### 主色调

- **主背景**: #2D2D37 (深灰蓝)
- **次背景**: #3C3C46 (中等灰蓝)
- **边框高亮**: #64ADEE (蓝色)

### 功能色彩

- **成功/示例**: #64DD17 (绿色)
- **警告/历史**: #FF5722 (橙红色)
- **信息/标题**: #FFD700 (金黄色)
- **文本主色**: #FFFFFF (白色)
- **文本次色**: #C8C8C8 (浅灰)

### 透明度规范

- **背景遮罩**: 60% 透明度
- **悬停效果**: 80% 透明度
- **阴影效果**: 40% 透明度

## 📱 响应式适配

### 不同分辨率适配

- **1920x1080**: DialogPanel 放大到 1200x800
- **1280x720**: DialogPanel 标准大小 900x600
- **960x540**: DialogPanel 缩小到 700x450

### 自适应内容

- **示例牌型**: 根据牌数自动调整布局
- **弃牌历史**: 超过 10 列自动换行
- **文本描述**: 自动换行适配容器宽度

## 🔧 Unity 预制体设置

### 创建步骤

1. 创建 UI Canvas
2. 创建 LevelInfoDialog 空对象
3. 按照结构层级创建所有子对象
4. 配置各组件属性
5. 设置 Layout 和 ContentSizeFitter
6. 绑定 LevelInfoDialog 脚本
7. 配置所有 @property 引用
8. 保存为预制体

### 必要组件配置

- **所有 Button**: Transition = Scale, Scale Multiplier = 1.05
- **所有 Layout**: Update Layout = 启用
- **所有 Label**: Rich Text = 启用，Overflow = 适当设置
- **ScrollView** (如需要): Inertia = 启用，Elastic = 启用

这个设计提供了一个专业、美观且功能完整的关卡信息弹窗，包含了现代 UI 设计的最佳实践。
