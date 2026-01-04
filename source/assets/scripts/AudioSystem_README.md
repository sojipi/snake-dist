# 全局音频系统使用指南

## 🎵 系统概述

全局音频系统为Snake-Mahjong游戏提供完整的背景音乐和音效管理功能，支持跨场景音频播放、音量控制、开关设置等功能。

## 📁 文件结构

```
assets/scripts/
├── AudioManager.ts          # 核心音频管理器（单例）
├── AudioSettingsUI.ts       # 音频设置UI组件
├── AudioControlButton.ts    # 快速音频控制按钮
└── AudioSystem_README.md    # 使用说明文档

assets/prefabs/
└── AudioManager.prefab      # AudioManager预制体

assets/resources/audio/
├── bgm.mp3                  # 背景音乐
├── click.mp3                # 点击音效
├── collect.mp3              # 收集音效
├── win.mp3                  # 胜利音效
└── lose.mp3                 # 失败音效
```

## 🚀 快速开始

### 1. 添加AudioManager到场景

**方法一：使用预制体（推荐）**
1. 将 `assets/prefabs/AudioManager.prefab` 拖拽到场景中
2. AudioManager会自动初始化并跨场景保持

**方法二：手动创建**
1. 创建空节点，命名为"AudioManager"
2. 添加AudioManager组件
3. 组件会自动创建所需的AudioSource子节点

### 2. 在代码中使用

```typescript
import { AudioManager } from './AudioManager';

// 获取AudioManager实例
const audioManager = AudioManager.getInstance();

// 播放背景音乐
audioManager.playBGM('bgm');

// 播放音效
audioManager.playSFX('click');

// 控制音频开关
audioManager.setBGMEnabled(false);
audioManager.setSFXEnabled(true);
```

## 🎛️ 核心功能

### AudioManager（音频管理器）

**主要功能**：
- 单例模式，全局唯一实例
- 跨场景保持，音乐不中断
- 自动资源管理和缓存
- 本地设置保存和加载

**背景音乐控制**：
```typescript
// 播放BGM（支持淡入效果）
audioManager.playBGM('bgm', true);

// 停止BGM（支持淡出效果）
audioManager.stopBGM(true);

// 暂停/恢复BGM
audioManager.pauseBGM();
audioManager.resumeBGM();
```

**音效控制**：
```typescript
// 播放音效
audioManager.playSFX('click');

// 播放音效并指定音量
audioManager.playSFX('collect', 0.8);
```

**设置控制**：
```typescript
// 音频开关
audioManager.setBGMEnabled(true);
audioManager.setSFXEnabled(false);

// 音量控制（0-1）
audioManager.setBGMVolume(0.5);
audioManager.setSFXVolume(0.7);

// 获取当前状态
const isBGMOn = audioManager.isBGMEnabled();
const bgmVolume = audioManager.getBGMVolume();
```

### AudioSettingsUI（设置界面）

提供完整的音频设置UI界面，包括：
- BGM/音效开关切换
- 音量滑块控制
- 实时音量显示
- 测试音效按钮

**使用方法**：
1. 在UI场景中添加AudioSettingsUI组件
2. 绑定相应的UI控件（Toggle、Slider、Label等）
3. 组件会自动同步当前音频设置

### AudioControlButton（快速控制按钮）

可放置在任何场景的快速音频控制按钮：
- 支持BGM/音效独立控制
- 自动图标切换
- 可选音量控制面板

## 🎨 UI集成指南

### 在关卡选择页面添加音频控制

1. **添加音频控制按钮**：
```typescript
// 在LevelSelectManager中
import { AudioManager } from './AudioManager';

export class LevelSelectManager extends Component {
    @property(Button)
    bgmButton: Button = null!;
    
    start() {
        // 设置BGM按钮点击事件
        this.bgmButton.node.on(Button.EventType.CLICK, this.toggleBGM, this);
    }
    
    private toggleBGM() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            const currentState = audioManager.isBGMEnabled();
            audioManager.setBGMEnabled(!currentState);
        }
    }
}
```

2. **添加AudioControlButton组件**：
```typescript
// 直接在按钮节点上添加AudioControlButton组件
// 设置controlType为'BGM'或'SFX'
// 绑定开启/关闭状态的图标
```

### 在游戏页面添加设置面板

1. **创建设置面板UI**：
```
SettingsPanel
├── BGMToggle (Toggle组件)
├── SFXToggle (Toggle组件)
├── BGMVolumeSlider (Slider组件)
├── SFXVolumeSlider (Slider组件)
├── BGMVolumeLabel (Label组件)
├── SFXVolumeLabel (Label组件)
└── TestSFXButton (Button组件)
```

2. **添加AudioSettingsUI组件**：
```typescript
// 在设置面板节点上添加AudioSettingsUI组件
// 将所有UI控件拖拽到对应的属性字段
```

## 🔧 自定义配置

### 添加新的音频文件

1. 将音频文件放入 `assets/resources/audio/` 目录
2. 支持的格式：mp3, ogg, wav
3. 在代码中直接使用文件名（不含扩展名）：

```typescript
// 播放新添加的音频
audioManager.playBGM('new_bgm');
audioManager.playSFX('new_sound');
```

### 预加载音频列表

在AudioManager.ts中修改预加载列表：

```typescript
private preloadAudioClips() {
    // 添加需要预加载的音频文件名
    const audioFiles = [
        'bgm', 'click', 'collect', 'win', 'lose',
        'new_bgm', 'new_sound'  // 添加新文件
    ];
    // ...
}
```

### 自定义音频设置键名

```typescript
// 在AudioManager中修改存储键名
private static readonly BGM_ENABLED_KEY = 'game_bgm_enabled';
private static readonly SFX_ENABLED_KEY = 'game_sfx_enabled';
```

## 🎯 场景集成示例

### LoadingScene（加载场景）

```typescript
// 在LoadingManager中添加音频初始化
export class LoadingManager extends Component {
    start() {
        // 确保AudioManager已初始化
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playBGM('bgm', true); // 淡入播放BGM
        }
    }
}
```

### LevelScene（关卡选择场景）

```typescript
export class LevelSelectManager extends Component {
    @property(AudioControlButton)
    bgmControlButton: AudioControlButton = null!;
    
    start() {
        // BGM控制按钮会自动同步状态
        // 无需额外代码
    }
    
    private onLevelSelected() {
        // 播放选择音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
    }
}
```

### GameScene（游戏场景）

```typescript
export class GameManager extends Component {
    start() {
        // 游戏开始时可以切换BGM
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playBGM('game_bgm');
        }
    }
    
    private onGameWin() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('win');
        }
    }
    
    private onGameLose() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('lose');
        }
    }
}
```

## 🐛 常见问题

### 1. AudioManager未找到
**问题**：`AudioManager.getInstance()` 返回null
**解决**：确保场景中有AudioManager预制体或AudioManager组件

### 2. 音频文件无法播放
**问题**：调用播放方法但没有声音
**解决**：
- 检查音频文件是否在 `assets/resources/audio/` 目录
- 确认文件名拼写正确
- 检查音频开关是否开启

### 3. 跨场景音乐中断
**问题**：切换场景时音乐停止
**解决**：确保AudioManager使用了 `game.addPersistRootNode(this.node)`

### 4. 设置不保存
**问题**：重启游戏后音频设置重置
**解决**：检查浏览器是否支持localStorage，确认设置保存逻辑正常

## 📱 移动端适配

### 音频权限处理

```typescript
// 在游戏开始时请求音频权限
export class GameStart extends Component {
    start() {
        // 移动端需要用户交互后才能播放音频
        this.node.on(Node.EventType.TOUCH_START, this.enableAudio, this);
    }
    
    private enableAudio() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playBGM('bgm');
        }
        this.node.off(Node.EventType.TOUCH_START, this.enableAudio, this);
    }
}
```

### 性能优化

- 音频文件建议使用压缩格式（mp3, ogg）
- 控制同时播放的音效数量
- 及时释放不需要的音频资源

## 🔄 版本更新

### v1.0.0
- 基础音频管理功能
- BGM和音效分离控制
- 本地设置保存
- 跨场景音频保持

### 后续计划
- 音频淡入淡出动画优化
- 更多音效类型支持
- 音频可视化效果
- 动态音频加载优化
