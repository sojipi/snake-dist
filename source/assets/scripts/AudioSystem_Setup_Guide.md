# 🎵 音频系统集成指南

## 📋 Cocos Creator 编辑器操作步骤

### 第一步：添加AudioManager到场景

#### 方法一：使用预制体（推荐）
1. 在**资源管理器**中找到 `assets/prefabs/AudioManager.prefab`
2. 将预制体拖拽到**层级管理器**的根节点下
3. AudioManager会自动初始化并跨场景保持

#### 方法二：手动创建
1. 在**层级管理器**中右键 → **创建** → **创建空节点**
2. 将节点重命名为"AudioManager"
3. 选中AudioManager节点，在**属性检查器**中点击**添加组件**
4. 搜索并添加"AudioManager"组件
5. 组件会自动创建BGM和SFX的AudioSource子节点

### 第二步：配置音频资源

#### 添加音频文件
1. 将音频文件（mp3, ogg, wav格式）放入 `assets/resources/audio/` 目录
2. 确保文件命名规范：
   - `bgm.mp3` - 背景音乐
   - `click.mp3` - 点击音效
   - `collect.mp3` - 收集音效
   - `win.mp3` - 胜利音效
   - `lose.mp3` - 失败音效

#### 检查资源导入
1. 选中音频文件，在**属性检查器**中确认导入设置
2. 建议设置：
   - **Load Mode**: Web Audio
   - **Download Mode**: DOM Audio（移动端）

### 第三步：在关卡选择场景添加音频控制

#### 添加音频控制按钮
1. 打开 `LevelScene.scene`
2. 在UI Canvas下创建音频控制按钮：
   ```
   Canvas
   └── AudioControls
       ├── BGMButton (Button组件)
       └── SFXButton (Button组件)
   ```

#### 配置LevelSelectManager
1. 选中LevelSelectManager节点
2. 在**属性检查器**中找到LevelSelectManager组件
3. 将创建的BGMButton和SFXButton拖拽到对应字段：
   - **Bgm Button** → BGMButton节点
   - **Sfx Button** → SFXButton节点

#### 设置按钮图标（可选）
1. 准备音频开启/关闭状态的图标
2. 将图标设置为按钮的Sprite Frame
3. 系统会自动根据音频状态切换颜色（白色=开启，灰色=关闭）

### 第四步：在游戏场景添加音频控制

#### 使用AudioControlButton预制体
1. 将 `assets/prefabs/AudioControlButton.prefab` 拖拽到GameScene的UI中
2. 选中AudioControlButton节点
3. 在**属性检查器**中配置AudioControlButton组件：
   - **Control Type**: 选择"BGM"或"SFX"
   - **Enabled Icon**: 音频开启时的图标
   - **Disabled Icon**: 音频关闭时的图标

#### 创建设置面板（可选）
1. 创建设置面板UI结构：
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

2. 在设置面板节点上添加AudioSettingsUI组件
3. 将所有UI控件拖拽到AudioSettingsUI组件的对应字段

### 第五步：验证音频系统

#### 测试步骤
1. **运行游戏**：点击**预览**按钮
2. **测试BGM**：
   - 确认背景音乐自动播放
   - 点击BGM按钮测试开关功能
3. **测试音效**：
   - 点击各种按钮确认有点击音效
   - 测试音效开关功能
4. **测试跨场景**：
   - 切换场景确认音乐不中断
   - 确认音频设置在场景间保持

#### 常见问题排查
1. **没有声音**：
   - 检查AudioManager是否在场景中
   - 确认音频文件路径正确
   - 检查浏览器音频权限

2. **音频中断**：
   - 确认AudioManager使用了跨场景保持
   - 检查是否有多个AudioManager实例

3. **按钮无响应**：
   - 确认按钮事件绑定正确
   - 检查AudioManager组件是否正常初始化

## 🎮 游戏内使用说明

### 玩家操作
- **BGM按钮**：点击切换背景音乐开关
- **音效按钮**：点击切换音效开关
- **音量滑块**：拖拽调节音量大小
- **设置保存**：所有设置自动保存到本地

### 开发者接口
```typescript
// 获取AudioManager实例
const audioManager = AudioManager.getInstance();

// 播放背景音乐
audioManager.playBGM('bgm');

// 播放音效
audioManager.playSFX('click');

// 控制音频开关
audioManager.setBGMEnabled(false);
audioManager.setSFXEnabled(true);

// 调节音量
audioManager.setBGMVolume(0.5);
audioManager.setSFXVolume(0.7);
```

## 📱 移动端注意事项

### 音频权限
- 移动端浏览器需要用户交互后才能播放音频
- 建议在游戏开始界面添加"开始游戏"按钮
- 在用户首次点击时初始化音频

### 性能优化
- 使用压缩音频格式（mp3, ogg）
- 控制音频文件大小
- 避免同时播放过多音效

## 🔧 自定义扩展

### 添加新音效
1. 将音频文件放入 `assets/resources/audio/`
2. 在代码中调用：`audioManager.playSFX('新文件名')`

### 修改预加载列表
在AudioManager.ts中修改：
```typescript
const audioFiles = ['bgm', 'click', 'collect', 'win', 'lose', '新音效'];
```

### 自定义UI样式
- 修改按钮图标和颜色
- 调整音量滑块样式
- 添加音频可视化效果

## ✅ 完成检查清单

- [ ] AudioManager预制体已添加到场景
- [ ] 音频文件已放入正确目录
- [ ] LevelSelectManager已配置音频按钮
- [ ] GameScene已添加音频控制
- [ ] 测试所有音频功能正常
- [ ] 跨场景音频保持正常
- [ ] 移动端兼容性测试通过
