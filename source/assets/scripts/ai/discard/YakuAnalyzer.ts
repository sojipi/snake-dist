import { _decorator, Component } from 'cc';
import { TileInfo, TileEfficiency, HandAnalysis } from './DiscardTypes';

const { ccclass, property } = _decorator;

/**
 * 役种分析器 - 专门处理目标役种相关的弃牌分析
 */
@ccclass('YakuAnalyzer')
export class YakuAnalyzer extends Component {
    
    /**
     * 根据目标役种调整弃牌效率
     */
    public analyzeYakuCompatibility(targetYaku: string, efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        // 🔥 检查是否是AI角色，如果是AI角色则使用通用策略
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        
        if (aiCharacter) {
            console.log("YakuAnalyzer: AI角色使用通用弃牌策略，不考虑特定役种");
            return this.applyGeneralStrategy(efficiency, handAnalysis);
        }
        
        if (!targetYaku) {
            console.log("YakuAnalyzer: 没有设置目标役种，跳过役种分析");
            return efficiency;
        }
        
        console.log(`YakuAnalyzer: 分析目标役种 - ${targetYaku}`);
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            const tile = eff.tile;
            
            // 根据不同役种调整弃牌优先级
            const yakuAdjustment = this.getYakuAdjustment(targetYaku, tile, handAnalysis);
            adjusted.discardPriority += yakuAdjustment.priority;
            if (yakuAdjustment.reason) {
                adjusted.reasons.push(yakuAdjustment.reason);
            }
            
            return adjusted;
        });
    }
    
    /**
     * 🔥 新增：AI角色的通用弃牌策略（不考虑特定役种）
     */
    private applyGeneralStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("YakuAnalyzer: 应用AI角色通用弃牌策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            const tile = eff.tile;
            const tileNum = this.convertTileStringToNumber(tile.type);
            
            // 通用策略：优先弃掉孤立牌和边缘牌
            if (this.isIsolatedTile(tileNum, handAnalysis)) {
                adjusted.discardPriority += 30;
                adjusted.reasons.push("通用策略：孤立牌优先弃掉");
            }
            
            // 优先弃掉边缘牌（1、9、字牌）
            if (this.isTerminalOrHonor(tileNum)) {
                adjusted.discardPriority += 20;
                adjusted.reasons.push("通用策略：边缘牌优先弃掉");
            }
            
            // 保留中张牌（2-8）
            if (this.isMiddleTile(tileNum)) {
                adjusted.discardPriority -= 15;
                adjusted.reasons.push("通用策略：保留中张牌");
            }
            
            // 如果有多张相同的牌，优先弃掉多余的
            const tileCount = this.getTileCountInHand(tileNum, handAnalysis);
            if (tileCount > 2) {
                adjusted.discardPriority += 25;
                adjusted.reasons.push("通用策略：弃掉多余牌");
            }
            
            return adjusted;
        });
    }
    
    /**
     * 🔥 新增：判断是否为孤立牌
     */
    private isIsolatedTile(tileNum: number, handAnalysis: HandAnalysis): boolean {
        // 字牌不算孤立
        if (this.isHonorTile(tileNum)) {
            return false;
        }
        
        // 检查是否有相邻的牌
        const hasAdjacent = this.hasAdjacentTiles(tileNum, handAnalysis);
        return !hasAdjacent;
    }
    
    /**
     * 获取役种相关的弃牌调整
     */
    private getYakuAdjustment(targetYaku: string, tile: TileInfo, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        const tileNum = this.convertTileStringToNumber(tile.type);
        
        console.log(`YakuAnalyzer.getYakuAdjustment: 牌型"${tile.type}" -> 数字编码${tileNum}, 目标役种: ${targetYaku}`);
        
        switch (targetYaku) {
            case 'tanyao': // 断幺九
                return this.getTanyaoAdjustment(tileNum);
                
            case 'pinfu': // 平和
                return this.getPinfuAdjustment(tileNum, handAnalysis);
                
            case 'chinitsu': // 清一色
                return this.getChinitsuAdjustment(tileNum, handAnalysis);
                
            case 'honitsu': // 混一色  
                return this.getHonitsuAdjustment(tileNum, handAnalysis);
                
            case 'toitoi': // 对对和
                return this.getToitoiAdjustment(tileNum, handAnalysis);
                
            case 'yakuhai': // 役牌
                return this.getYakuhaiAdjustment(tileNum);
                
            case 'chanta': // 混全带幺九
                return this.getChantaAdjustment(tileNum);
                
            case 'junchan': // 纯全带幺九
                return this.getJunchanAdjustment(tileNum);
                
            case 'chitoitsu': // 七对子
                return this.getChitoitsuAdjustment(tileNum, handAnalysis);
                
            default:
                console.log(`YakuAnalyzer: 未识别的役种 ${targetYaku}`);
                return { priority: 0, reason: '' };
        }
    }
    
    /**
     * 将牌型字符串转换为数字编码
     */
    private convertTileStringToNumber(tileStr: string): number {
        // 如果已经是数字，直接返回
        if (!isNaN(Number(tileStr))) {
            return parseInt(tileStr);
        }
        
        // 处理字牌
        const honorMap: {[key: string]: number} = {
            '中': 19, '发': 20, '白': 21,
            '东': 31, '南': 32, '西': 33, '北': 34
        };
        
        if (honorMap[tileStr]) {
            return honorMap[tileStr];
        }
        
        // 处理数牌
        if (tileStr.length >= 2) {
            const value = parseInt(tileStr.slice(0, -1));
            const suit = tileStr.slice(-1);
            
            if (suit === 'p') {
                // 饼子：1p-9p -> 1-9
                return value;
            } else if (suit === 's') {
                // 条子：1s-9s -> 10-18
                return value + 9;
            } else if (suit === 'm') {
                // 万子：1m-9m -> 22-30
                return value + 21;
            }
        }
        
        console.warn(`YakuAnalyzer: 无法转换牌型字符串 "${tileStr}"`);
        return parseInt(tileStr) || 0;
    }
    
    /**
     * 断幺九调整：优先弃掉幺九牌和字牌
     */
    private getTanyaoAdjustment(tileNum: number): { priority: number, reason: string } {
        const isTerminalOrHonor = this.isTerminalOrHonor(tileNum);
        
        console.log(`YakuAnalyzer.getTanyaoAdjustment: 牌编码${tileNum}, 是否幺九/字牌: ${isTerminalOrHonor}`);
        console.log(`  - 是否幺九牌: ${this.isTerminal(tileNum)}`);
        console.log(`  - 是否字牌: ${this.isHonorTile(tileNum)}`);
        console.log(`  - 是否中张牌: ${this.isMiddleTile(tileNum)}`);
            
        if (isTerminalOrHonor) {
            console.log(`  -> 决策：断幺九无用牌，必须弃掉，优先级+80`);
            return { priority: 80, reason: "断幺九：幺九牌/字牌完全无用，必须弃掉" };
        }
        
        console.log(`  -> 决策：断幺九有用牌，强烈保留，优先级-40`);
        return { priority: -40, reason: "断幺九：保留有用的中张牌" };
    }
    
    /**
     * 平和调整：避免刻子，保留顺子材料，避免役牌做雀头
     */
    private getPinfuAdjustment(tileNum: number, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        // 字牌对平和完全无用
        if (this.isHonorTile(tileNum)) {
            return { priority: 70, reason: "平和：字牌完全无用，必须弃掉" };
        }
        
        // 检查是否有多张相同的牌（可能形成刻子，不利于平和）
        if (this.getTileCountInHand(tileNum, handAnalysis) >= 3) {
            return { priority: 50, reason: "平和：避免刻子，弃掉多余牌" };
        }
        
        // 中张牌更有利于组成顺子，强烈保留
        if (this.isMiddleTile(tileNum)) {
            return { priority: -30, reason: "平和：强烈保留中张顺子材料" };
        }
        
        return { priority: 0, reason: "" };
    }
    
    /**
     * 清一色调整：只保留一种花色
     */
    private getChinitsuAdjustment(tileNum: number, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        // 字牌对清一色完全无用
        if (this.isHonorTile(tileNum)) {
            return { priority: 90, reason: "清一色：字牌完全无用，必须弃掉" };
        }
        
        // 分析手牌中哪种花色最多
        const suitCounts = this.getSuitCounts(handAnalysis);
        const dominantSuit = this.getDominantSuit(suitCounts);
        const tileSuit = this.getTileSuit(tileNum);
        
        if (tileSuit !== dominantSuit) {
            return { priority: 60, reason: "清一色：非主花色完全无用，必须弃掉" };
        }
        
        return { priority: -50, reason: "清一色：主花色牌，强烈保留" };
    }
    
    /**
     * 混一色调整：保留一种花色+字牌
     */
    private getHonitsuAdjustment(tileNum: number, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        // 分析主花色
        const suitCounts = this.getSuitCounts(handAnalysis);
        const dominantSuit = this.getDominantSuit(suitCounts);
        const tileSuit = this.getTileSuit(tileNum);
        
        // 非主花色的数牌完全无用
        if (tileSuit >= 0 && tileSuit !== dominantSuit) {
            return { priority: 60, reason: "混一色：非主花色完全无用，必须弃掉" };
        }
        
        // 字牌可以适度保留，但不是重点
        if (this.isHonorTile(tileNum)) {
            return { priority: 10, reason: "混一色：字牌可选，适度弃掉" };
        }
        
        return { priority: -30, reason: "混一色：主花色牌，强烈保留" };
    }
    
    /**
     * 对对和调整：优先保留已有对子，弃掉孤立牌
     */
    private getToitoiAdjustment(tileNum: number, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        const tileCount = this.getTileCountInHand(tileNum, handAnalysis);
        
        if (tileCount >= 2) {
            return { priority: -30, reason: "对对和：保留对子/刻子" };
        }
        
        if (tileCount === 1 && !this.hasAdjacentTiles(tileNum, handAnalysis)) {
            return { priority: 25, reason: "对对和：弃掉孤立牌" };
        }
        
        return { priority: 0, reason: "" };
    }
    
    /**
     * 役牌调整：保留风牌和三元牌
     */
    private getYakuhaiAdjustment(tileNum: number): { priority: number, reason: string } {
        // 风牌：31-34(东南西北)，三元牌：19-21(中发白)
        if (this.isYakuhaiTile(tileNum)) {
            return { priority: -50, reason: "役牌：保留风牌/三元牌" };
        }
        
        return { priority: 50, reason: "役牌：优先弃掉数牌" };
    }
    
    /**
     * 混全带幺九调整：每组都要包含幺九牌或字牌
     */
    private getChantaAdjustment(tileNum: number): { priority: number, reason: string } {
        if (this.isTerminalOrHonor(tileNum)) {
            return { priority: -20, reason: "混全：保留幺九牌/字牌" };
        }
        
        if (this.isMiddleTile(tileNum)) {
            return { priority: 15, reason: "混全：中张牌不利" };
        }
        
        return { priority: 0, reason: "" };
    }
    
    /**
     * 纯全带幺九调整：每组都要包含幺九牌，不要字牌
     */
    private getJunchanAdjustment(tileNum: number): { priority: number, reason: string } {
        // 字牌对纯全完全无用
        if (this.isHonorTile(tileNum)) {
            return { priority: 90, reason: "纯全：字牌完全无用，必须弃掉" };
        }
        
        if (this.isTerminal(tileNum)) {
            return { priority: -50, reason: "纯全：幺九牌必需，强烈保留" };
        }
        
        if (this.isMiddleTile(tileNum)) {
            return { priority: 30, reason: "纯全：中张牌不利，适度弃掉" };
        }
        
        return { priority: 0, reason: "" };
    }
    
    /**
     * 七对子调整：保留已有的对子
     */
    private getChitoitsuAdjustment(tileNum: number, handAnalysis: HandAnalysis): { priority: number, reason: string } {
        const tileCount = this.getTileCountInHand(tileNum, handAnalysis);
        
        if (tileCount === 2) {
            return { priority: -40, reason: "七对子：保留对子" };
        }
        
        if (tileCount === 1) {
            return { priority: 20, reason: "七对子：弃掉孤立牌" };
        }
        
        if (tileCount >= 3) {
            return { priority: 30, reason: "七对子：弃掉多余的牌" };
        }
        
        return { priority: 0, reason: "" };
    }
    
    // === 牌型判断辅助方法 ===
    
    /**
     * 检查是否是幺九牌或字牌
     */
    private isTerminalOrHonor(tileNum: number): boolean {
        return this.isTerminal(tileNum) || this.isHonorTile(tileNum);
    }
    
    /**
     * 检查是否是幺九牌
     */
    private isTerminal(tileNum: number): boolean {
        return tileNum === 1 || tileNum === 9 ||     // 饼子1,9
               tileNum === 10 || tileNum === 18 ||   // 条子1,9
               tileNum === 22 || tileNum === 30;     // 万子1,9
    }
    
    /**
     * 检查是否是字牌
     */
    private isHonorTile(tileNum: number): boolean {
        return (tileNum >= 19 && tileNum <= 21) ||   // 中发白
               (tileNum >= 31 && tileNum <= 34);     // 东南西北
    }
    
    /**
     * 检查是否是役牌
     */
    private isYakuhaiTile(tileNum: number): boolean {
        return (tileNum >= 31 && tileNum <= 34) ||   // 风牌：东南西北
               (tileNum >= 19 && tileNum <= 21);     // 三元牌：中发白
    }
    
    /**
     * 检查是否是中张牌
     */
    private isMiddleTile(tileNum: number): boolean {
        return (tileNum >= 3 && tileNum <= 7) ||     // 饼子3-7
               (tileNum >= 12 && tileNum <= 16) ||   // 条子3-7
               (tileNum >= 24 && tileNum <= 28);     // 万子3-7
    }
    
    /**
     * 获取牌的花色
     */
    private getTileSuit(tileNum: number): number {
        if (tileNum >= 1 && tileNum <= 9) return 0;   // 饼子
        if (tileNum >= 10 && tileNum <= 18) return 1; // 条子
        if (tileNum >= 22 && tileNum <= 30) return 2; // 万子
        return -1; // 字牌
    }
    
    /**
     * 统计各花色的牌数
     */
    private getSuitCounts(handAnalysis: HandAnalysis): number[] {
        const counts = [0, 0, 0]; // 饼、条、万
        
        for (const eff of handAnalysis.efficiency) {
            const tileNum = this.convertTileStringToNumber(eff.tile.type);
            const suit = this.getTileSuit(tileNum);
            if (suit >= 0 && suit <= 2) {
                counts[suit]++;
            }
        }
        
        return counts;
    }
    
    /**
     * 获取最多的花色
     */
    private getDominantSuit(suitCounts: number[]): number {
        let maxCount = 0;
        let dominantSuit = 0;
        
        for (let i = 0; i < suitCounts.length; i++) {
            if (suitCounts[i] > maxCount) {
                maxCount = suitCounts[i];
                dominantSuit = i;
            }
        }
        
        return dominantSuit;
    }
    
    /**
     * 获取手牌中某张牌的数量
     */
    private getTileCountInHand(tileNum: number, handAnalysis: HandAnalysis): number {
        // 简化实现：通过分析tileEfficiency来估算
        const found = handAnalysis.efficiency.find(eff => this.convertTileStringToNumber(eff.tile.type) === tileNum);
        return found ? 1 : 0;
    }
    
    /**
     * 检查是否有相邻的牌（用于顺子判断）
     */
    private hasAdjacentTiles(tileNum: number, handAnalysis: HandAnalysis): boolean {
        // 检查同花色的相邻牌
        const suit = this.getTileSuit(tileNum);
        if (suit < 0) return false; // 字牌没有相邻牌
        
        const adjacentNums = [tileNum - 1, tileNum + 1];
        return adjacentNums.some(adjNum => {
            const adjSuit = this.getTileSuit(adjNum);
            if (adjSuit !== suit) return false;
            return handAnalysis.efficiency.some(eff => this.convertTileStringToNumber(eff.tile.type) === adjNum);
        });
    }
} 