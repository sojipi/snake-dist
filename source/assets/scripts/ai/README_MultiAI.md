# 多角色 AI 系统改造说明

## 概述

本次改造将原有的单角色 AI 系统升级为支持多个角色独立运行的多角色 AI 系统。新系统保持了向后兼容性，同时提供了强大的多角色管理功能。

## 主要改造内容

### 1. 新增核心类

#### `AITypes.ts` - 类型定义扩展

- 新增 `CharacterType` 枚举：支持蛇、敌人、NPC 等角色类型
- 新增 `CharacterConfig` 接口：角色配置信息
- 新增 `IAICharacter` 接口：AI 角色通用接口
- 新增 `MultiAIManagerState` 接口：管理器状态信息
- 扩展现有接口：添加 `characterId` 字段支持多角色标识

#### `AICharacter.ts` - AI 角色类

- 代表单个 AI 角色的完整实现
- 实现 `IAICharacter` 接口
- 包含独立的 AI 状态和决策逻辑
- 支持角色间协作和避让功能

#### `MultiAIManager.ts` - 多角色 AI 管理器

- 管理所有 AI 角色的生命周期
- 轮询更新策略，避免性能问题
- 提供角色间避让和协作功能
- 单例模式，确保全局唯一性

#### `MultiAIExample.ts` - 使用示例

- 完整的使用示例和最佳实践
- 展示如何创建、配置和管理多个 AI 角色
- 提供各种功能演示方法

### 2. 现有类改造

#### `SnakeAI.ts` - 兼容性适配

- 保持原有 API 不变，确保向后兼容
- 新增 `useMultiAI` 开关，可选择使用传统 AI 或多角色 AI
- 智能代理：在多角色模式下自动将调用转发给对应的 AICharacter
- 新增多角色专用方法：协作模式、避让模式等

## 主要功能特性

### 1. 独立角色运行

- 每个角色拥有独立的 AI 状态和决策逻辑
- 角色间互不干扰，各自独立更新
- 支持不同角色类型的差异化配置

### 2. 智能更新调度

- 轮询更新策略，避免所有角色同时计算
- 可配置的更新间隔和批量大小
- 按优先级排序的更新队列

### 3. 角色间交互

- **避让功能**：角色可以避开其他角色
- **协作功能**：角色可以协同工作
- **位置共享**：实时获取其他角色位置信息

### 4. 动态管理

- 运行时动态添加/移除角色
- 启用/禁用指定角色
- 批量配置多个角色

### 5. 向后兼容

- 原有的 SnakeAI 代码无需修改即可使用
- 可通过开关在传统 AI 和多角色 AI 间切换
- 平滑的迁移路径

## 使用方法

### 基本使用（推荐方式）

```typescript
// 1. 创建多角色AI管理器
const managerNode = new Node("MultiAIManager");
const multiAIManager = managerNode.addComponent(MultiAIManager);

// 2. 配置管理器参数
multiAIManager.enableMultiAI = true;
multiAIManager.updateInterval = 0.1;
multiAIManager.maxCharacters = 5;
multiAIManager.avoidanceDistance = 60;

// 3. 创建角色配置
const config = multiAIManager.createDefaultCharacterConfig(
  "character_1",
  "AI角色1",
  CharacterType.SNAKE,
  characterNode,
  {
    enabled: true,
    priority: 1,
  }
);

// 4. 添加角色
const character = multiAIManager.addCharacter(config);

// 5. 配置角色AI参数
if (character instanceof AICharacter) {
  character.setDecisionInterval(0.3);
  character.setSearchRadius(500);
  character.setCooperationMode(true);
  character.setAvoidOtherCharacters(true);
}
```

### 传统 SnakeAI 升级使用

```typescript
// 1. 在SnakeAI组件上启用多角色模式
const snakeAI = node.getComponent(SnakeAI);
snakeAI.useMultiAI = true;
snakeAI.characterName = "主角蛇";
snakeAI.characterType = CharacterType.SNAKE;

// 2. 确保场景中有MultiAIManager
// 如果没有，SnakeAI会自动回退到传统模式

// 3. 正常使用SnakeAI的API
snakeAI.enableAI = true;
snakeAI.setDecisionInterval(0.3);
snakeAI.setCooperationMode(true); // 多角色专用功能
```

### 批量管理角色

```typescript
// 批量添加多个角色
const configs = [
  multiAIManager.createDefaultCharacterConfig(
    "snake_1",
    "蛇1",
    CharacterType.SNAKE,
    node1
  ),
  multiAIManager.createDefaultCharacterConfig(
    "enemy_1",
    "敌人1",
    CharacterType.ENEMY,
    node2
  ),
  multiAIManager.createDefaultCharacterConfig(
    "npc_1",
    "NPC1",
    CharacterType.NPC,
    node3
  ),
];

const characters = multiAIManager.addCharacters(configs);

// 批量配置角色
characters.forEach((character, index) => {
  if (character instanceof AICharacter) {
    character.setDecisionInterval(0.3 + index * 0.1);
    character.setAvoidOtherCharacters(true);
    character.setCooperationMode(index % 2 === 0);
  }
});
```

## 系统架构

```
MultiAIManager (管理器)
├── AICharacter (角色1)
│   ├── TargetSelector
│   ├── PathFinder
│   ├── MovementController
│   └── AutoDiscardAI
├── AICharacter (角色2)
│   ├── TargetSelector
│   ├── PathFinder
│   ├── MovementController
│   └── AutoDiscardAI
└── AICharacter (角色N)
    ├── TargetSelector
    ├── PathFinder
    ├── MovementController
    └── AutoDiscardAI
```

## 配置参数说明

### MultiAIManager 参数

- `enableMultiAI`: 是否启用多角色 AI 系统
- `updateInterval`: AI 更新间隔时间（秒）
- `maxCharacters`: 最大角色数量
- `avoidanceDistance`: 角色间避让距离

### CharacterConfig 参数

- `id`: 角色唯一标识
- `type`: 角色类型（SNAKE/ENEMY/NPC）
- `name`: 角色名称
- `controllerNode`: 角色控制器节点
- `enabled`: 是否启用
- `priority`: 更新优先级（数字越小优先级越高）
- `aiConfig`: AI 配置参数

### AIConfig 参数

- `decisionInterval`: 决策间隔时间
- `searchRadius`: 搜索半径
- `speedMultiplier`: 速度倍数
- `avoidOtherCharacters`: 是否避让其他角色
- `cooperationMode`: 是否启用协作模式

## 性能优化

1. **轮询更新**：避免所有角色同时更新，分批处理
2. **优先级队列**：重要角色优先更新
3. **可配置参数**：根据需要调整更新频率和范围
4. **智能清理**：自动清理无效角色和资源

## 调试和监控

```typescript
// 获取管理器统计信息
const stats = multiAIManager.getManagerStats();
console.log("总角色数量:", stats.totalCharacters);
console.log("活跃角色数量:", stats.activeCharacters);

// 获取角色详细信息
stats.characterStats.forEach((char) => {
  console.log(`角色 ${char.name}: ${char.enabled ? "启用" : "禁用"}`);
  console.log(`AI状态: ${char.aiStats.state}`);
});
```

## 注意事项

1. **场景设置**：使用多角色 AI 前，确保场景中有 MultiAIManager 组件
2. **角色 ID**：每个角色必须有唯一的 ID
3. **性能考虑**：角色数量过多时，适当调整更新间隔
4. **兼容性**：传统 SnakeAI 代码可以无缝升级

## 常见问题

**Q: 如何从传统 AI 切换到多角色 AI？**
A: 在 SnakeAI 组件上设置 `useMultiAI = true`，并确保场景中有 MultiAIManager。

**Q: 多个角色会互相冲突吗？**
A: 不会，每个角色都有独立的 AI 实例，同时支持避让功能。

**Q: 如何实现角色协作？**
A: 启用 `cooperationMode` 并实现自定义的协作逻辑。

**Q: 性能影响如何？**
A: 采用轮询更新和优先级队列，性能影响可控，可通过参数调优。

## 未来扩展

- [ ] 角色组队系统
- [ ] 更复杂的协作策略
- [ ] AI 行为树支持
- [ ] 网络同步支持
