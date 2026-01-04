# 排行榜推荐朋友功能说明

## 功能概述
在排行榜弹窗中添加了"推荐朋友"按钮，使用微信小游戏的推荐功能 `wx.recommendGame`，让玩家可以方便地向朋友推荐游戏。

## 功能特性

### 1. 推荐按钮
- 位置：排行榜弹窗中，通常与关闭按钮并列
- 功能：点击后调用微信小游戏推荐API
- 文本建议：`推荐朋友` 或 `邀请好友`

### 2. 环境兼容性
- **微信小游戏环境**：使用 `wx.recommendGame` API
- **非微信环境**：显示提示信息，告知用户需在微信中使用
- **API兼容性检查**：自动检测当前微信版本是否支持推荐功能

### 3. 错误处理
- **用户取消**（errCode: 4）：用户取消了推荐操作
- **系统错误**（errCode: 1）：系统错误，建议稍后再试
- **网络错误**（errCode: 2）：网络连接问题
- **未知错误**：其他异常情况的通用处理

## 技术实现

### 1. 组件属性添加
在 `RankListDialog.ts` 中添加：
```typescript
@property(Button)
recommendButton: Button = null!;
```

### 2. 事件绑定
在 `initUI()` 方法中：
```typescript
if (this.recommendButton) {
    this.recommendButton.node.on(Button.EventType.CLICK, this.onRecommendButtonClicked, this);
}
```

### 3. 核心功能实现
```typescript
private recommendGameToFriend() {
    // 环境检查
    if (typeof wx === 'undefined') {
        // 非微信环境处理
        return;
    }
    
    // API支持检查
    if (typeof (wx as any).recommendGame !== 'function') {
        // 版本不支持处理
        return;
    }
    
    // 调用推荐API
    (wx as any).recommendGame({
        success: (res: any) => {
            // 推荐成功处理
        },
        fail: (error: any) => {
            // 错误处理
        }
    });
}
```

## 微信API参考

### wx.recommendGame(Object object)
推荐好友来玩当前小游戏

**参数说明：**
- `success`：接口调用成功的回调函数
- `fail`：接口调用失败的回调函数
- `complete`：接口调用结束的回调函数

**错误码：**
- `1`：系统错误
- `2`：网络错误  
- `4`：用户取消

**基础库版本要求：** >= 2.9.0

**官方文档：** https://developers.weixin.qq.com/minigame/dev/guide/open-ability/game-evaluate.html

## 使用方法

### 1. UI配置
1. 在排行榜弹窗预制体中添加推荐按钮
2. 将按钮拖拽到 `RankListDialog` 组件的 `recommendButton` 属性
3. 设置按钮文本和样式

### 2. 测试验证
使用提供的 `RecommendTest.ts` 测试脚本：
1. 添加测试组件到场景
2. 配置测试按钮
3. 点击测试验证功能

### 3. 部署注意事项
- 确保游戏已在微信公众平台注册
- 推荐功能需要在真实的微信环境中测试
- 开发工具中可能无法完全模拟推荐功能

## UI设计建议

### 1. 按钮样式
- 使用醒目但不突兀的颜色
- 建议使用微信绿色主题色
- 图标可以使用分享或好友相关的图标

### 2. 按钮位置
```
[排行榜标题]
[排行榜内容]
[推荐朋友] [关闭按钮]
```

### 3. 交互反馈
- 点击时提供触感反馈
- 显示加载状态
- 成功/失败后给予明确提示

## 错误处理策略

### 1. 环境检查
```typescript
if (typeof wx === 'undefined') {
    this.showRecommendMessage("请在微信小游戏中使用推荐功能");
    return;
}
```

### 2. API支持检查
```typescript
if (typeof (wx as any).recommendGame !== 'function') {
    this.showRecommendMessage("当前微信版本不支持推荐功能，请更新微信后重试");
    return;
}
```

### 3. 错误信息映射
```typescript
let errorMessage = "推荐失败，请稍后再试";
if (error.errCode === 4) {
    errorMessage = "用户取消了推荐操作";
} else if (error.errCode === 1) {
    errorMessage = "系统错误，请稍后再试";
} else if (error.errCode === 2) {
    errorMessage = "网络错误，请检查网络连接";
}
```

## 最佳实践

### 1. 用户体验
- 不要过度弹出推荐请求
- 在合适的时机引导用户推荐（如达成成就时）
- 提供推荐激励（如奖励道具）

### 2. 数据统计
- 记录推荐按钮点击次数
- 统计推荐成功率
- 分析推荐功能的转化效果

### 3. 版本兼容
- 始终检查API可用性
- 提供降级方案
- 考虑不同微信版本的兼容性

## 相关文件

### 新增文件
- `RecommendTest.ts` - 推荐功能测试脚本
- `RankList_Recommend_Guide.md` - 本说明文档

### 修改文件
- `RankListDialog.ts` - 添加推荐按钮和功能

### 预制体配置
需要在排行榜弹窗预制体中：
1. 添加推荐按钮节点
2. 配置按钮组件
3. 关联到 RankListDialog 组件

通过以上配置，排行榜弹窗将具备完整的推荐朋友功能，提升游戏的社交传播能力。