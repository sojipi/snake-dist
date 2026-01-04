import { Vec3, Node } from 'cc';

// 移动方向枚举
export enum Direction {
    UP = 0,
    DOWN = 1,
    LEFT = 2,
    RIGHT = 3
}

// AI状态枚举
export enum AIState {
    IDLE = 0,
    SEEKING_TARGET = 1,
    MOVING_TO_TARGET = 2,
    EXPLORING = 3,
    STUCK = 4
}

// 🔥 新增：角色类型枚举
export enum CharacterType {
    SNAKE = 'snake',
    ENEMY = 'enemy',
    NPC = 'npc'
}

// 🔥 新增：角色配置接口
export interface CharacterConfig {
    id: string;
    type: CharacterType;
    name: string;
    controllerNode: Node;
    aiConfig: AIConfig;
    enabled: boolean;
    priority: number; // 优先级，数字越小优先级越高
}

// 🔥 新增：AI角色接口
export interface IAICharacter {
    getId(): string;
    getType(): CharacterType;
    getName(): string;
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
    getConfig(): CharacterConfig;
    getCurrentState(): AIState;
    getCurrentTarget(): Node | null;
    startAI(): void;
    stopAI(): void;
    update(deltaTime: number): void;
    destroy(): void;
}

// 🔥 新增：多AI管理器状态
export interface MultiAIManagerState {
    totalCharacters: number;
    activeCharacters: number;
    charactersById: Map<string, IAICharacter>;
    updateQueue: string[];
    isRunning: boolean;
}

// 目标评估结果接口
export interface TargetEvaluation {
    target: Node;
    score: number;
    distance: number;
    reason: string;
    characterId?: string; // 🔥 新增：角色ID
}

// 路径规划结果接口
export interface PathPlanResult {
    direction: Direction;
    isSafe: boolean;
    reason: string;
    alternatives: Direction[];
    characterId?: string; // 🔥 新增：角色ID
}

// AI配置接口
export interface AIConfig {
    decisionInterval: number;
    searchRadius: number;
    speedMultiplier: number;
    obstacleDetectionRange: number;
    maxHistoryLength: number;
    stuckThreshold: number;
    explorationBias: number;
    // 🔥 新增：角色特定配置
    characterId?: string;
    avoidOtherCharacters?: boolean;
    cooperationMode?: boolean;
}

// 移动历史记录
export interface MovementHistory {
    position: Vec3;
    timestamp: number;
    direction: Direction;
    characterId?: string; // 🔥 新增：角色ID
}

// 目标跟踪信息
export interface TargetTracking {
    target: Node | null;
    distance: number;
    stuckCounter: number;
    lastPosition: Vec3;
    approachHistory: number[];
    characterId?: string; // 🔥 新增：角色ID
}

// 方向安全性检查结果
export interface DirectionSafety {
    direction: Direction;
    safe: boolean;
    reason: string;
    testPosition: Vec3;
    score: number;
    characterId?: string; // 🔥 新增：角色ID
}

// 游戏边界信息
export interface GameBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

// AI决策上下文
export interface DecisionContext {
    snakePosition: Vec3;
    currentTarget: Node | null;
    availableTargets: Node[];
    gameBounds: GameBounds;
    handCardCount: number;
    maxHandCards: number;
    lastDirection: Direction;
    pathHistory: Vec3[];
    // 🔥 新增：角色相关上下文
    characterId?: string;
    otherCharacters?: Vec3[]; // 其他角色位置
    cooperationMode?: boolean;
    avoidOtherCharacters?: boolean;
} 