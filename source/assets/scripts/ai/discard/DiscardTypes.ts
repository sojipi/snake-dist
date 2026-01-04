import { Node } from 'cc';

// 牌的基本信息
export interface TileInfo {
    type: string;           // 牌型 (如 "1m", "2p", "东" 等)
    suit: string;          // 花色 (筒/条/万/字)
    value: number;         // 数值 (1-9, 字牌为特殊值)
    isHonor: boolean;      // 是否为字牌
    isTerminal: boolean;   // 是否为幺九牌
    node?: Node;           // 对应的节点(如果有)
}

// 听牌信息
export interface WaitingInfo {
    isWaiting: boolean;           // 是否听牌
    waitingTiles: TileInfo[];     // 等待的牌
    waitingTileTypes: string[];   // 等待的牌型字符串
    hanCount: number;             // 番数
    description: string;          // 听牌描述
}

// 牌效分析结果
export interface TileEfficiency {
    tile: TileInfo;
    keepValue: number;        // 保留价值 (0-100)
    discardPriority: number;  // 弃牌优先级 (数值越高越应该弃)
    reasons: string[];        // 分析原因
    improvesWaiting: boolean; // 是否改善听牌
    futureValue: number;      // 未来价值评估
}

// 弃牌决策结果
export interface DiscardDecision {
    recommendedTile: TileInfo | null;
    confidence: number;       // 决策信心度 (0-100)
    reasoning: string;        // 决策推理
    alternatives: TileInfo[]; // 备选方案
    strategy: DiscardStrategy;
}

// 弃牌策略枚举
export enum DiscardStrategy {
    SAFETY_FIRST = "safety_first",           // 安全优先
    SPEED_FIRST = "speed_first",             // 速度优先  
    VALUE_FIRST = "value_first",             // 价值优先
    BALANCED = "balanced",                   // 平衡策略
    DEFENSIVE = "defensive"                  // 防守策略
}

// 手牌分析结果
export interface HandAnalysis {
    tiles: TileInfo[];
    groups: TileGroup[];          // 已形成的组合
    pairs: TileInfo[];            // 对子
    isolatedTiles: TileInfo[];    // 孤立牌
    waitingInfo: WaitingInfo;     // 听牌信息
    shanten: number;              // 向听数
    efficiency: TileEfficiency[]; // 每张牌的效率分析
}

// 牌组类型
export interface TileGroup {
    type: GroupType;
    tiles: TileInfo[];
    isComplete: boolean;
    potential: number;  // 潜力值
}

export enum GroupType {
    SEQUENCE = "sequence",    // 顺子
    TRIPLET = "triplet",     // 刻子
    PAIR = "pair",           // 对子
    PARTIAL_SEQUENCE = "partial_sequence", // 不完整顺子
    PARTIAL_TRIPLET = "partial_triplet"    // 不完整刻子
}

// AI配置
export interface DiscardAIConfig {
    strategy: DiscardStrategy;
    aggressiveness: number;   // 激进程度 (0-100)
    safetyLevel: number;      // 安全级别 (0-100)
    targetYaku: string[];     // 目标役种
    enableDefense: boolean;   // 是否启用防守
    maxThinkingTime: number;  // 最大思考时间(毫秒)
}

// 危险牌分析
export interface DangerAnalysis {
    tile: TileInfo;
    dangerLevel: number;      // 危险等级 (0-100)
    reasons: string[];        // 危险原因
    relatedOpponents: string[]; // 相关对手
}

// 弃牌历史记录
export interface DiscardHistory {
    tile: TileInfo;
    turn: number;
    player: string;
    reasoning: string;
    timestamp: number;
} 