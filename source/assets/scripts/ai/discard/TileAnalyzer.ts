import { _decorator, Component } from 'cc';
import { TileInfo, HandAnalysis, TileGroup, GroupType, TileEfficiency, WaitingInfo } from './DiscardTypes';

const { ccclass, property } = _decorator;

@ccclass('TileAnalyzer')
export class TileAnalyzer extends Component {
    
    /**
     * 分析手牌结构
     */
    public analyzeHand(handCards: string[]): HandAnalysis {
        // 转换为TileInfo格式
        const tiles = this.convertToTileInfo(handCards);
        
        console.log(`TileAnalyzer: 开始分析手牌，共${tiles.length}张牌`);
        
        // 分析牌组
        const groups = this.findGroups(tiles);
        
        // 找出对子
        const pairs = this.findPairs(tiles, groups);
        
        // 找出孤立牌
        const isolatedTiles = this.findIsolatedTiles(tiles, groups, pairs);
        
        // 计算向听数
        const shanten = this.calculateShanten(tiles);
        
        // 分析听牌情况
        const waitingInfo = this.analyzeWaiting(tiles, shanten);
        
        // 分析每张牌的效率
        const efficiency = this.analyzeTileEfficiency(tiles, groups, pairs, shanten);
        
        const analysis: HandAnalysis = {
            tiles,
            groups,
            pairs,
            isolatedTiles,
            waitingInfo,
            shanten,
            efficiency
        };
        
        console.log(`TileAnalyzer: 分析完成，向听数: ${shanten}, 听牌: ${waitingInfo.isWaiting}`);
        
        return analysis;
    }
    
    /**
     * 将字符串手牌转换为TileInfo
     */
    private convertToTileInfo(handCards: string[]): TileInfo[] {
        return handCards.map(card => this.parseTileString(card));
    }
    
    /**
     * 解析牌字符串
     */
    private parseTileString(tileStr: string): TileInfo {
        // 假设牌的格式如 "1m", "2p", "3s", "东", "南" 等
        const honorTiles = ['东', '南', '西', '北', '白', '发', '中'];
        const isHonor = honorTiles.indexOf(tileStr) !== -1;
        
        let suit = '';
        let value = 0;
        
        if (isHonor) {
            suit = '字';
            // 字牌的特殊数值映射
            const honorMap: {[key: string]: number} = {
                '东': 1, '南': 2, '西': 3, '北': 4,
                '白': 5, '发': 6, '中': 7
            };
            value = honorMap[tileStr] || 0;
        } else {
            // 数牌处理
            const lastChar = tileStr.slice(-1);
            const suitMap: {[key: string]: string} = {
                'm': '万', 'p': '筒', 's': '条'
            };
            
            suit = suitMap[lastChar] || '未知';
            value = parseInt(tileStr.slice(0, -1)) || 0;
        }
        
        const isTerminal = !isHonor && (value === 1 || value === 9);
        
        return {
            type: tileStr,
            suit,
            value,
            isHonor,
            isTerminal
        };
    }
    
    /**
     * 寻找已形成的牌组
     */
    private findGroups(tiles: TileInfo[]): TileGroup[] {
        const groups: TileGroup[] = [];
        const usedTiles = new Set<number>();
        
        // 按花色分组
        const suitGroups = this.groupBySuit(tiles);
        
        for (const [suit, suitTiles] of suitGroups) {
            if (suit === '字') {
                // 字牌只能组成刻子
                groups.push(...this.findTriplets(suitTiles, usedTiles));
            } else {
                // 数牌可以组成顺子和刻子
                groups.push(...this.findSequences(suitTiles, usedTiles));
                groups.push(...this.findTriplets(suitTiles, usedTiles));
            }
        }
        
        return groups;
    }
    
    /**
     * 按花色分组
     */
    private groupBySuit(tiles: TileInfo[]): Map<string, TileInfo[]> {
        const groups = new Map<string, TileInfo[]>();
        
        for (const tile of tiles) {
            if (!groups.has(tile.suit)) {
                groups.set(tile.suit, []);
            }
            groups.get(tile.suit)!.push(tile);
        }
        
        // 每组内按数值排序
        for (const [suit, suitTiles] of groups) {
            suitTiles.sort((a, b) => a.value - b.value);
        }
        
        return groups;
    }
    
    /**
     * 寻找顺子
     */
    private findSequences(suitTiles: TileInfo[], usedTiles: Set<number>): TileGroup[] {
        const sequences: TileGroup[] = [];
        
        // 简化的顺子查找逻辑
        for (let i = 0; i < suitTiles.length - 2; i++) {
            const tile1 = suitTiles[i];
            const tile2 = suitTiles[i + 1];
            const tile3 = suitTiles[i + 2];
            
            if (usedTiles.has(i) || usedTiles.has(i + 1) || usedTiles.has(i + 2)) {
                continue;
            }
            
            if (tile1.value + 1 === tile2.value && tile2.value + 1 === tile3.value) {
                sequences.push({
                    type: GroupType.SEQUENCE,
                    tiles: [tile1, tile2, tile3],
                    isComplete: true,
                    potential: 100
                });
                
                usedTiles.add(i);
                usedTiles.add(i + 1);
                usedTiles.add(i + 2);
            }
        }
        
        return sequences;
    }
    
    /**
     * 寻找刻子
     */
    private findTriplets(suitTiles: TileInfo[], usedTiles: Set<number>): TileGroup[] {
        const triplets: TileGroup[] = [];
        
        for (let i = 0; i < suitTiles.length - 2; i++) {
            if (usedTiles.has(i) || usedTiles.has(i + 1) || usedTiles.has(i + 2)) {
                continue;
            }
            
            const tile1 = suitTiles[i];
            const tile2 = suitTiles[i + 1];
            const tile3 = suitTiles[i + 2];
            
            if (tile1.value === tile2.value && tile2.value === tile3.value) {
                triplets.push({
                    type: GroupType.TRIPLET,
                    tiles: [tile1, tile2, tile3],
                    isComplete: true,
                    potential: 100
                });
                
                usedTiles.add(i);
                usedTiles.add(i + 1);
                usedTiles.add(i + 2);
            }
        }
        
        return triplets;
    }
    
    /**
     * 寻找对子
     */
    private findPairs(tiles: TileInfo[], existingGroups: TileGroup[]): TileInfo[] {
        const pairs: TileInfo[] = [];
        const usedTiles = this.getUsedTilesFromGroups(existingGroups);
        
        // 计算每种牌的数量
        const tileCount = new Map<string, TileInfo[]>();
        
        for (let i = 0; i < tiles.length; i++) {
            if (usedTiles.has(i)) continue;
            
            const tile = tiles[i];
            if (!tileCount.has(tile.type)) {
                tileCount.set(tile.type, []);
            }
            tileCount.get(tile.type)!.push(tile);
        }
        
        // 找出数量为2的牌作为对子
        for (const [type, typeTiles] of tileCount) {
            if (typeTiles.length >= 2) {
                pairs.push(typeTiles[0], typeTiles[1]);
            }
        }
        
        return pairs;
    }
    
    /**
     * 寻找孤立牌
     */
    private findIsolatedTiles(tiles: TileInfo[], groups: TileGroup[], pairs: TileInfo[]): TileInfo[] {
        const usedTiles = this.getUsedTilesFromGroups(groups);
        const pairTypes = new Set(pairs.map(p => p.type));
        
        const isolated: TileInfo[] = [];
        
        for (let i = 0; i < tiles.length; i++) {
            if (usedTiles.has(i)) continue;
            
            const tile = tiles[i];
            if (!pairTypes.has(tile.type)) {
                isolated.push(tile);
            }
        }
        
        return isolated;
    }
    
    /**
     * 从牌组中获取已使用的牌索引
     */
    private getUsedTilesFromGroups(groups: TileGroup[]): Set<number> {
        // 这里需要一个更复杂的映射逻辑
        // 暂时返回空集合，实际应用中需要跟踪牌的原始索引
        return new Set<number>();
    }
    
    /**
     * 计算向听数
     */
    private calculateShanten(tiles: TileInfo[]): number {
        // 简化的向听数计算
        // 实际应该使用标准的向听数算法
        
        if (tiles.length < 14) {
            return 14 - tiles.length; // 如果牌不够，向听数就是缺少的牌数
        }
        
        // 这里应该实现标准向听数算法
        // 暂时使用简化版本
        const tileCount = new Map<string, number>();
        
        for (const tile of tiles) {
            tileCount.set(tile.type, (tileCount.get(tile.type) || 0) + 1);
        }
        
        let pairs = 0;
        let sequences = 0;
        let triplets = 0;
        
        for (const [type, count] of tileCount) {
            if (count >= 3) triplets++;
            else if (count >= 2) pairs++;
        }
        
        // 简化计算：需要4个面子+1个雀头
        const completedGroups = triplets + sequences;
        const needGroups = 4 - completedGroups;
        const needPair = pairs > 0 ? 0 : 1;
        
        return Math.max(0, needGroups + needPair);
    }
    
    /**
     * 分析听牌情况
     */
    private analyzeWaiting(tiles: TileInfo[], shanten: number): WaitingInfo {
        const isWaiting = shanten === 0;
        
        if (!isWaiting) {
            return {
                isWaiting: false,
                waitingTiles: [],
                waitingTileTypes: [],
                hanCount: 0,
                description: `还需要${shanten}张牌`
            };
        }
        
        // 如果听牌，分析等待什么牌
        const waitingTiles = this.calculateWaitingTiles(tiles);
        
        return {
            isWaiting: true,
            waitingTiles,
            waitingTileTypes: waitingTiles.map(t => t.type),
            hanCount: 1, // 简化处理，实际需要计算番数
            description: `听牌：等待 ${waitingTiles.map(t => t.type).join('、')}`
        };
    }
    
    /**
     * 计算等待的牌
     */
    private calculateWaitingTiles(tiles: TileInfo[]): TileInfo[] {
        // 简化实现，实际应该通过尝试每种可能的牌来判断是否和牌
        const waitingTiles: TileInfo[] = [];
        
        // 这里应该实现标准的听牌计算算法
        // 暂时返回空数组
        
        return waitingTiles;
    }
    
    /**
     * 分析每张牌的效率
     */
    private analyzeTileEfficiency(tiles: TileInfo[], groups: TileGroup[], pairs: TileInfo[], shanten: number): TileEfficiency[] {
        const efficiency: TileEfficiency[] = [];
        
        for (const tile of tiles) {
            const analysis = this.analyzeSingleTileEfficiency(tile, tiles, groups, pairs, shanten);
            efficiency.push(analysis);
        }
        
        // 按弃牌优先级排序
        efficiency.sort((a, b) => b.discardPriority - a.discardPriority);
        
        return efficiency;
    }
    
    /**
     * 分析单张牌的效率
     */
    private analyzeSingleTileEfficiency(tile: TileInfo, allTiles: TileInfo[], groups: TileGroup[], pairs: TileInfo[], shanten: number): TileEfficiency {
        let keepValue = 50;
        let discardPriority = 50;
        const reasons: string[] = [];
        
        // 孤立的幺九牌优先弃掉
        if ((tile.isTerminal || tile.isHonor) && this.isIsolated(tile, allTiles)) {
            discardPriority += 30;
            reasons.push("孤立的幺九牌");
        }
        
        // 中张牌有更高的留牌价值
        if (!tile.isTerminal && !tile.isHonor && tile.value >= 3 && tile.value <= 7) {
            keepValue += 20;
            discardPriority -= 20;
            reasons.push("中张牌有连接性");
        }
        
        // 如果是对子的一部分，降低弃牌优先级
        if (this.isPartOfPair(tile, pairs)) {
            discardPriority -= 25;
            reasons.push("是对子的一部分");
        }
        
        // 如果是未完成组合的一部分，降低弃牌优先级
        if (this.isPartOfIncompleteGroup(tile, allTiles)) {
            discardPriority -= 15;
            reasons.push("可能形成顺子");
        }
        
        return {
            tile,
            keepValue,
            discardPriority,
            reasons,
            improvesWaiting: false, // 简化处理
            futureValue: keepValue
        };
    }
    
    /**
     * 检查牌是否孤立
     */
    private isIsolated(tile: TileInfo, allTiles: TileInfo[]): boolean {
        if (tile.isHonor) {
            // 字牌检查是否有同类型的牌
            return allTiles.filter(t => t.type === tile.type).length === 1;
        }
        
        // 数牌检查相邻数值的牌
        const sameSuitTiles = allTiles.filter(t => t.suit === tile.suit);
        const hasAdjacent = sameSuitTiles.some(t => 
            Math.abs(t.value - tile.value) === 1 || t.value === tile.value
        );
        
        return !hasAdjacent;
    }
    
    /**
     * 检查是否是对子的一部分
     */
    private isPartOfPair(tile: TileInfo, pairs: TileInfo[]): boolean {
        return pairs.some(p => p.type === tile.type);
    }
    
    /**
     * 检查是否是未完成组合的一部分
     */
    private isPartOfIncompleteGroup(tile: TileInfo, allTiles: TileInfo[]): boolean {
        if (tile.isHonor) {
            // 字牌只能形成刻子
            const sameCount = allTiles.filter(t => t.type === tile.type).length;
            return sameCount >= 2;
        }
        
        // 数牌检查顺子可能性
        const sameSuitTiles = allTiles.filter(t => t.suit === tile.suit);
        
        // 检查是否可能形成顺子
        for (let offset = -2; offset <= 2; offset++) {
            if (offset === 0) continue;
            
            const adjacentValue = tile.value + offset;
            if (adjacentValue >= 1 && adjacentValue <= 9) {
                if (sameSuitTiles.some(t => t.value === adjacentValue)) {
                    return true;
                }
            }
        }
        
        return false;
    }
} 