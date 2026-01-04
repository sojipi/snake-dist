# 排行榜弹窗UI配置示例

## 预制体结构建议

```
RankListDialog (Node)
├── DialogPanel (Node)
│   ├── Background (Sprite)
│   ├── TitleLabel (Label) - "闯关排行榜"
│   ├── CloseButton (Button)
│   ├── RecommendButton (Button) - "推荐朋友" ← 新添加
│   ├── ScrollView (ScrollView)
│   │   └── Content (Node with Layout)
│   │       └── [RankItem instances]
│   └── EmptyLabel (Label) - 空状态提示
└── RankListDialog (Component)
```

## 组件配置步骤

### 1. 添加推荐按钮节点
1. 在 `DialogPanel` 下创建新的按钮节点
2. 命名为 `RecommendButton`
3. 添加 `Button` 组件和 `Sprite` 组件

### 2. 按钮样式设置
```
Button Component:
├── Target: RecommendButton
├── Transition: COLOR_TINT
├── Normal Color: #FFFFFF
├── Pressed Color: #CCCCCC
└── Hover Color: #EEEEEE

Sprite Component:
├── Type: SIMPLE
├── Sprite Frame: 按钮背景图片
└── Color: #4CAF50 (微信绿色)
```

### 3. 按钮文本配置
在 `RecommendButton` 下添加 `Label` 子节点：
```
Label Component:
├── String: "推荐朋友"
├── Font Size: 24
├── Color: #FFFFFF
└── Horizontal Align: CENTER
```

### 4. 位置布局
建议的按钮位置（相对于 DialogPanel）：
```
CloseButton:     Position: (200, -300, 0)
RecommendButton: Position: (50, -300, 0)
```

或者使用 Layout 组件自动排列：
```
ButtonContainer (Node with Layout)
├── Layout.Type: HORIZONTAL
├── Layout.SpacingX: 20
├── RecommendButton
└── CloseButton
```

## RankListDialog 组件配置

### 1. 拖拽关联
将创建的 `RecommendButton` 节点拖拽到 `RankListDialog` 组件的 `Recommend Button` 属性框中。

### 2. 属性检查
确保以下属性都已正确配置：
- ✅ Dialog Panel
- ✅ Rank Scroll View
- ✅ Rank Content
- ✅ Rank Item Prefab
- ✅ Close Button
- ✅ **Recommend Button** ← 新添加
- ✅ Title Label
- ✅ Empty Label

## 样式建议

### 1. 按钮设计
- **尺寸**: 120x40 像素
- **圆角**: 8px
- **背景色**: #4CAF50 (微信绿色) 或 #FF9800 (橙色)
- **文字色**: #FFFFFF
- **字体大小**: 18-24px

### 2. 图标选择
可以在按钮中添加图标：
- 分享图标 📤
- 好友图标 👥
- 邀请图标 ✉️

### 3. 动画效果
```typescript
// 按钮点击动画
button.node.on(Button.EventType.CLICK, () => {
    // 缩放动画
    tween(button.node)
        .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
        .to(0.1, { scale: new Vec3(1, 1, 1) })
        .start();
});
```

## 响应式布局

### 1. 不同屏幕适配
```typescript
// 根据屏幕宽度调整按钮位置
const screenWidth = view.getVisibleSize().width;
if (screenWidth < 750) {
    // 小屏幕：垂直排列
    recommendButton.setPosition(0, -260, 0);
    closeButton.setPosition(0, -320, 0);
} else {
    // 大屏幕：水平排列
    recommendButton.setPosition(-60, -300, 0);
    closeButton.setPosition(60, -300, 0);
}
```

### 2. 安全区域适配
```typescript
// 考虑刘海屏等安全区域
const safeArea = sys.getSafeAreaRect();
const bottomOffset = safeArea.y > 0 ? 20 : 0;
buttonContainer.y -= bottomOffset;
```

## 测试清单

### 1. 基础功能测试
- [ ] 按钮正确显示
- [ ] 点击事件正确触发
- [ ] 微信环境检测正常
- [ ] 非微信环境提示正常

### 2. UI测试
- [ ] 按钮样式符合设计
- [ ] 按钮位置合理
- [ ] 文字清晰可读
- [ ] 点击反馈明显

### 3. 兼容性测试
- [ ] 不同屏幕尺寸适配
- [ ] 不同微信版本兼容
- [ ] 横竖屏切换正常

### 4. 用户体验测试
- [ ] 操作流畅自然
- [ ] 错误提示友好
- [ ] 成功反馈明确

## 完整配置代码示例

```typescript
// 在 RankListDialog.ts 中
@ccclass('RankListDialog')
export class RankListDialog extends Component {
    @property(Button)
    recommendButton: Button = null!;
    
    // 其他属性...
    
    private initUI() {
        // 推荐按钮事件绑定
        if (this.recommendButton) {
            this.recommendButton.node.on(Button.EventType.CLICK, this.onRecommendButtonClicked, this);
        }
        
        // 其他初始化...
    }
    
    private onRecommendButtonClicked() {
        this.recommendGameToFriend();
    }
    
    // 其他方法...
}
```

通过以上配置，排行榜弹窗将拥有一个功能完整、样式美观的推荐朋友按钮。