# 加载界面系统使用说明

## 概述
为Snake Mahjong游戏创建的专业加载界面系统，提供流畅的用户体验和丰富的功能。

## 文件结构
```
assets/
├── scenes/
│   └── LoadingScene.scene          # 加载场景
├── scripts/
│   ├── LoadingManager.ts           # 主要加载管理器
│   └── LoadingAnimation.ts         # 加载动画组件
└── prefabs/
    └── LoadingUI.prefab            # 加载界面UI预制体
```

## 功能特性

### 1. 智能进度控制
- 模拟真实的加载过程
- 可配置的最小/最大加载时间
- 平滑的进度条动画

### 2. 游戏提示轮播
- 10条精心设计的游戏提示
- 每3秒自动切换
- 淡入淡出动画效果

### 3. 加载阶段显示
- 6个不同的加载阶段
- 随机时间间隔更新
- 模拟真实的资源加载过程

### 4. 视觉效果
- 麻将主题的配色方案
- Logo缩放动画
- 标题金色高亮显示

### 5. 系统信息显示
- 自动检测平台信息
- 显示游戏版本
- 输出详细的系统日志

## 配置选项

### LoadingManager 属性
- `targetScene`: 加载完成后跳转的场景（默认: "LevelScene"）
- `minLoadingTime`: 最小加载时间（默认: 2秒）
- `maxLoadingTime`: 最大加载时间（默认: 4秒）
- `showVersionInfo`: 是否显示版本信息（默认: true）
- `enableLoadingSound`: 是否启用加载音效（默认: false）

### LoadingAnimation 属性
- `rotationSpeed`: 旋转速度（默认: 360度/秒）
- `dotsInterval`: 点点动画间隔（默认: 0.5秒）

## 使用方法

### 1. 基本使用
加载场景已设置为项目启动场景，游戏启动时会自动显示。

### 2. 自定义目标场景
```typescript
const loadingManager = this.getComponent(LoadingManager);
loadingManager.setTargetScene("CustomScene");
```

### 3. 添加自定义游戏提示
```typescript
const loadingManager = this.getComponent(LoadingManager);
loadingManager.addGameTip("这是一条自定义提示");
```

### 4. 调整加载时间
```typescript
const loadingManager = this.getComponent(LoadingManager);
loadingManager.setLoadingTimeRange(1.5, 3.0); // 1.5-3秒
```

## 游戏提示内容
1. 收集相同的麻将牌可以组成对子
2. 手牌满14张时需要弃牌才能继续收集
3. 完成目标牌型即可通关
4. 使用方向键或点击按钮控制贪食蛇移动
5. 按I键可以查看当前关卡信息
6. 按L键可以开启AI自动控制
7. 按F键可以手动弃牌
8. 合理规划路线，避免撞到边界
9. 观察场上的麻将牌分布，制定收集策略
10. 每个关卡都有特定的目标牌型要求

## 加载阶段
1. 初始化游戏引擎...
2. 加载游戏资源...
3. 准备麻将牌库...
4. 初始化关卡数据...
5. 配置游戏设置...
6. 准备就绪...

## 技术实现

### 进度控制算法
使用平滑插值算法确保进度条动画流畅：
```typescript
const smoothProgress = currentProgress + (targetProgress - currentProgress) * 0.1;
```

### 动画系统
- 使用Cocos Creator的tween系统
- 支持链式动画和循环动画
- 自动清理资源避免内存泄漏

### 场景管理
- 自动检测加载完成
- 平滑的场景切换
- 错误处理和回退机制

## 扩展建议

### 1. 添加音效支持
```typescript
// 在LoadingManager中添加音效播放
if (this.enableLoadingSound && this.loadingAudioSource) {
    this.loadingAudioSource.play();
}
```

### 2. 网络资源加载
可以扩展为真实的网络资源加载器：
```typescript
// 示例：加载远程资源
private async loadRemoteAssets() {
    const assets = ['texture1.png', 'audio1.mp3'];
    for (let i = 0; i < assets.length; i++) {
        await this.loadAsset(assets[i]);
        this.updateProgress((i + 1) / assets.length);
    }
}
```

### 3. 本地化支持
添加多语言支持：
```typescript
// 根据系统语言选择提示文本
private getLocalizedTips(): string[] {
    const language = sys.language;
    return language === 'zh' ? this.chineseTips : this.englishTips;
}
```

## 注意事项
1. 确保所有UI组件正确绑定
2. 加载时间不宜过长，影响用户体验
3. 游戏提示应该简洁明了
4. 定期更新提示内容保持新鲜感
5. 测试不同设备上的显示效果

## 故障排除

### 常见问题
1. **加载界面不显示**: 检查场景配置和组件绑定
2. **进度条不动**: 检查ProgressBar组件设置
3. **文本不更新**: 检查Label组件引用
4. **动画不流畅**: 检查设备性能和动画参数

### 调试方法
- 查看控制台日志输出
- 检查组件属性配置
- 使用Cocos Creator调试工具
- 测试不同的加载时间设置
