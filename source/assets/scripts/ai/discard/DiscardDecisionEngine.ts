import { _decorator, Component } from 'cc';
import { TileAnalyzer } from './TileAnalyzer';
import { YakuAnalyzer } from './YakuAnalyzer';
import { 
    DiscardDecision, 
    DiscardStrategy, 
    DiscardAIConfig, 
    HandAnalysis, 
    TileInfo, 
    TileEfficiency,
    DangerAnalysis 
} from './DiscardTypes';

const { ccclass, property } = _decorator;

/**
 * 弃牌决策引擎 - 负责分析手牌并做出弃牌决策
 */
@ccclass('DiscardDecisionEngine')
export class DiscardDecisionEngine extends Component {
    
    private tileAnalyzer: TileAnalyzer = null!;
    private yakuAnalyzer: YakuAnalyzer = null!;
    private config: DiscardAIConfig = {
        strategy: DiscardStrategy.BALANCED,
        aggressiveness: 50,
        safetyLevel: 70,
        targetYaku: [],
        enableDefense: true,
        maxThinkingTime: 3000
    };
    
    onLoad() {
        this.tileAnalyzer = this.node.addComponent(TileAnalyzer);
        this.yakuAnalyzer = this.node.addComponent(YakuAnalyzer);
        console.log("DiscardDecisionEngine: 弃牌决策引擎初始化完成");
    }
    
    /**
     * 做出弃牌决策
     */
    public makeDiscardDecision(handCards: string[]): DiscardDecision {
        console.log(`DiscardDecisionEngine: 开始弃牌决策，策略: ${this.config.strategy}`);
        
        const startTime = Date.now();
        
        // 分析手牌
        const handAnalysis = this.tileAnalyzer.analyzeHand(handCards);
        
        // 根据策略调整分析结果
        const adjustedEfficiency = this.applyStrategy(handAnalysis);
        
        // 考虑安全因素
        const safetyAdjusted = this.applySafetyConsiderations(adjustedEfficiency, handAnalysis);
        
        // 选择最佳弃牌
        const bestTile = this.selectBestDiscardTile(safetyAdjusted);
        
        // 生成备选方案
        const alternatives = this.generateAlternatives(safetyAdjusted, bestTile);
        
        // 计算决策信心度
        const confidence = this.calculateConfidence(bestTile, safetyAdjusted, handAnalysis);
        
        // 生成推理说明
        const reasoning = this.generateReasoning(bestTile, handAnalysis, safetyAdjusted);
        
        const elapsedTime = Date.now() - startTime;
        console.log(`DiscardDecisionEngine: 决策完成，耗时 ${elapsedTime}ms`);
        
        return {
            recommendedTile: bestTile,
            confidence,
            reasoning,
            alternatives,
            strategy: this.config.strategy
        };
    }
    
    /**
     * 根据策略调整牌效分析
     */
    private applyStrategy(handAnalysis: HandAnalysis): TileEfficiency[] {
        const efficiency = [...handAnalysis.efficiency];
        
        switch (this.config.strategy) {
            case DiscardStrategy.SAFETY_FIRST:
                return this.applySafetyFirstStrategy(efficiency, handAnalysis);
            
            case DiscardStrategy.SPEED_FIRST:
                return this.applySpeedFirstStrategy(efficiency, handAnalysis);
            
            case DiscardStrategy.VALUE_FIRST:
                return this.applyValueFirstStrategy(efficiency, handAnalysis);
            
            case DiscardStrategy.DEFENSIVE:
                return this.applyDefensiveStrategy(efficiency, handAnalysis);
            
            case DiscardStrategy.BALANCED:
            default:
                return this.applyBalancedStrategy(efficiency, handAnalysis);
        }
    }
    
    /**
     * 安全优先策略
     */
    private applySafetyFirstStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用安全优先策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            
            // 危险牌大幅增加弃牌优先级
            if (this.isDangerousTile(eff.tile)) {
                adjusted.discardPriority += 40;
                adjusted.reasons.push("安全策略：危险牌优先弃掉");
            }
            
            // 安全牌降低弃牌优先级
            if (this.isSafeTile(eff.tile)) {
                adjusted.discardPriority -= 20;
                adjusted.reasons.push("安全策略：保留安全牌");
            }
            
            return adjusted;
        });
    }
    
    /**
     * 速度优先策略
     */
    private applySpeedFirstStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用速度优先策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            
            // 优先弃掉进张慢的牌
            if (this.isSlowTile(eff.tile, handAnalysis)) {
                adjusted.discardPriority += 25;
                adjusted.reasons.push("速度策略：进张慢的牌");
            }
            
            // 保留进张快的牌
            if (this.isFastTile(eff.tile, handAnalysis)) {
                adjusted.discardPriority -= 30;
                adjusted.reasons.push("速度策略：保留进张快的牌");
            }
            
            return adjusted;
        });
    }
    
    /**
     * 价值优先策略
     */
    private applyValueFirstStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用价值优先策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            
            // 优先弃掉低价值牌
            if (this.isLowValueTile(eff.tile, handAnalysis)) {
                adjusted.discardPriority += 20;
                adjusted.reasons.push("价值策略：低价值牌");
            }
            
            // 保留高价值牌
            if (this.isHighValueTile(eff.tile, handAnalysis)) {
                adjusted.discardPriority -= 25;
                adjusted.reasons.push("价值策略：保留高价值牌");
            }
            
            return adjusted;
        });
    }
    
    /**
     * 防守策略
     */
    private applyDefensiveStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用防守策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            
            // 极度优先弃掉危险牌
            if (this.isDangerousTile(eff.tile)) {
                adjusted.discardPriority += 60;
                adjusted.reasons.push("防守策略：危险牌必须弃掉");
            }
            
            // 保守处理中等价值牌
            adjusted.discardPriority += 10;
            adjusted.reasons.push("防守策略：保守处理");
            
            return adjusted;
        });
    }
    
    /**
     * 平衡策略
     */
    private applyBalancedStrategy(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用平衡策略");
        
        return efficiency.map(eff => {
            const adjusted = { ...eff };
            
            // 平衡考虑各种因素
            let adjustment = 0;
            
            if (this.isDangerousTile(eff.tile)) {
                adjustment += 20;
                adjusted.reasons.push("平衡策略：适度避免危险牌");
            }
            
            if (this.isSlowTile(eff.tile, handAnalysis)) {
                adjustment += 15;
                adjusted.reasons.push("平衡策略：进张较慢");
            }
            
            if (this.isLowValueTile(eff.tile, handAnalysis)) {
                adjustment += 10;
                adjusted.reasons.push("平衡策略：价值较低");
            }
            
            adjusted.discardPriority += adjustment;
            
            return adjusted;
        });
    }
    
    /**
     * 应用安全考量
     */
    private applySafetyConsiderations(efficiency: TileEfficiency[], handAnalysis: HandAnalysis): TileEfficiency[] {
        console.log("DiscardDecisionEngine: 应用安全考量");
        
        // 🔥 新增：应用目标役种考量
        let yakuAdjusted = efficiency;
        
        // 🔥 检查是否是AI角色，如果是AI角色则不设置目标役种
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        
        if (aiCharacter) {
            console.log("DiscardDecisionEngine: AI角色，使用通用弃牌策略，不设置目标役种");
            // AI角色直接使用YakuAnalyzer的通用策略
            yakuAdjusted = this.yakuAnalyzer.analyzeYakuCompatibility(
                '', // 空字符串表示使用通用策略
                efficiency, 
                handAnalysis
            );
        } else if (this.config.targetYaku && this.config.targetYaku.length > 0) {
            // 玩家角色使用目标役种
            yakuAdjusted = this.yakuAnalyzer.analyzeYakuCompatibility(
                this.config.targetYaku[0], 
                efficiency, 
                handAnalysis
            );
        }
        
        return yakuAdjusted.map(eff => {
            const adjusted = { ...eff };
            
            // 基于安全级别调整
            const safetyMultiplier = this.config.safetyLevel / 100;
            
            if (this.isDangerousTile(eff.tile)) {
                adjusted.discardPriority += 30 * safetyMultiplier;
                adjusted.reasons.push("安全考量：危险牌");
            }
            
            if (this.isSafeTile(eff.tile)) {
                adjusted.discardPriority -= 15 * safetyMultiplier;
                adjusted.reasons.push("安全考量：安全牌");
            }
            
            return adjusted;
        });
    }
    
    /**
     * 选择最佳弃牌
     */
    private selectBestDiscardTile(efficiency: TileEfficiency[]): TileInfo | null {
        if (efficiency.length === 0) {
            console.warn("DiscardDecisionEngine: 没有可选择的牌");
            return null;
        }
        
        // 按弃牌优先级排序
        efficiency.sort((a, b) => b.discardPriority - a.discardPriority);
        
        const bestTile = efficiency[0].tile;
        console.log(`DiscardDecisionEngine: 选择弃牌 ${bestTile.type}, 优先级: ${efficiency[0].discardPriority.toFixed(1)}`);
        
        return bestTile;
    }
    
    /**
     * 生成备选方案
     */
    private generateAlternatives(efficiency: TileEfficiency[], selectedTile: TileInfo | null): TileInfo[] {
        if (!selectedTile) return [];
        
        // 选择前3个优先级最高的作为备选
        const alternatives = efficiency
            .filter(eff => eff.tile.type !== selectedTile.type)
            .slice(0, 3)
            .map(eff => eff.tile);
        
        console.log(`DiscardDecisionEngine: 生成${alternatives.length}个备选方案`);
        
        return alternatives;
    }
    
    /**
     * 计算决策信心度
     */
    private calculateConfidence(selectedTile: TileInfo | null, efficiency: TileEfficiency[], handAnalysis: HandAnalysis): number {
        if (!selectedTile || efficiency.length === 0) {
            return 0;
        }
        
        const selectedEff = efficiency.find(e => e.tile.type === selectedTile.type);
        if (!selectedEff) return 0;
        
        // 基于弃牌优先级计算信心度
        let confidence = Math.min(100, Math.max(0, selectedEff.discardPriority));
        
        // 如果有明显的最佳选择，提高信心度
        if (efficiency.length > 1) {
            const secondBest = efficiency[1];
            const gap = selectedEff.discardPriority - secondBest.discardPriority;
            if (gap > 20) {
                confidence += 10;
            }
        }
        
        // 基于手牌分析调整信心度
        if (handAnalysis.shanten <= 1) {
            confidence += 10; // 接近听牌时信心度提高
        }
        
        return Math.min(100, Math.max(0, Math.round(confidence)));
    }
    
    /**
     * 生成推理说明
     */
    private generateReasoning(selectedTile: TileInfo | null, handAnalysis: HandAnalysis, efficiency: TileEfficiency[]): string {
        if (!selectedTile) return "无法决策";
        
        const selectedEff = efficiency.find(e => e.tile.type === selectedTile.type);
        if (!selectedEff) return "决策依据不明";
        
        let reasoning = `选择弃掉 ${selectedTile.type}`;
        
        // 添加主要原因
        if (selectedEff.reasons.length > 0) {
            reasoning += `，主要原因：${selectedEff.reasons[0]}`;
        }
        
        // 添加手牌状态信息
        reasoning += `。当前向听数：${handAnalysis.shanten}`;
        
        if (handAnalysis.waitingInfo.isWaiting) {
            reasoning += `，已听牌`;
        }
        
        // 添加策略信息
        reasoning += `，策略：${this.getStrategyDescription()}`;
        
        return reasoning;
    }
    
    /**
     * 获取策略描述
     */
    private getStrategyDescription(): string {
        switch (this.config.strategy) {
            case DiscardStrategy.SAFETY_FIRST: return "安全优先策略";
            case DiscardStrategy.SPEED_FIRST: return "速度优先策略";
            case DiscardStrategy.VALUE_FIRST: return "价值优先策略";
            case DiscardStrategy.DEFENSIVE: return "防守策略";
            case DiscardStrategy.BALANCED: return "平衡策略";
            default: return "未知策略";
        }
    }
    
    // === 牌型判断辅助方法 ===
    
    private isDangerousTile(tile: TileInfo): boolean {
        // 简化的危险牌判断
        // 实际应该根据场况、对手动向等判断
        return tile.isTerminal || tile.isHonor;
    }
    
    private isSafeTile(tile: TileInfo): boolean {
        // 简化的安全牌判断
        return !tile.isTerminal && !tile.isHonor && tile.value >= 4 && tile.value <= 6;
    }
    
    private isSlowTile(tile: TileInfo, handAnalysis: HandAnalysis): boolean {
        // 判断是否为进张慢的牌
        return tile.isHonor || (tile.isTerminal && this.isIsolated(tile, handAnalysis.tiles));
    }
    
    private isFastTile(tile: TileInfo, handAnalysis: HandAnalysis): boolean {
        // 判断是否为进张快的牌
        return !tile.isHonor && !tile.isTerminal && tile.value >= 3 && tile.value <= 7;
    }
    
    private isLowValueTile(tile: TileInfo, handAnalysis: HandAnalysis): boolean {
        // 判断是否为低价值牌
        return this.isIsolated(tile, handAnalysis.tiles) && (tile.isTerminal || tile.isHonor);
    }
    
    private isHighValueTile(tile: TileInfo, handAnalysis: HandAnalysis): boolean {
        // 判断是否为高价值牌
        return !this.isIsolated(tile, handAnalysis.tiles) && !tile.isTerminal;
    }
    
    private isIsolated(tile: TileInfo, allTiles: TileInfo[]): boolean {
        if (tile.isHonor) {
            return allTiles.filter(t => t.type === tile.type).length === 1;
        }
        
        const sameSuitTiles = allTiles.filter(t => t.suit === tile.suit);
        return !sameSuitTiles.some(t => 
            t.type !== tile.type && Math.abs(t.value - tile.value) <= 2
        );
    }
    
    private analyzeTileDanger(tile: TileInfo): DangerAnalysis {
        // 简化的危险度分析
        let dangerLevel = 0;
        const reasons: string[] = [];
        
        if (tile.isTerminal) {
            dangerLevel += 30;
            reasons.push("幺九牌");
        }
        
        if (tile.isHonor) {
            dangerLevel += 40;
            reasons.push("字牌");
        }
        
        if (tile.value >= 4 && tile.value <= 6) {
            dangerLevel += 20;
            reasons.push("中张牌");
        }
        
        return {
            tile,
            dangerLevel,
            reasons,
            relatedOpponents: [] // 简化处理
        };
    }
    
    // === 公共配置接口 ===
    
    public setStrategy(strategy: DiscardStrategy) {
        this.config.strategy = strategy;
        console.log(`DiscardDecisionEngine: 策略设置为 ${strategy}`);
    }
    
    public setAggressiveness(level: number) {
        this.config.aggressiveness = Math.max(0, Math.min(100, level));
        console.log(`DiscardDecisionEngine: 激进程度设置为 ${this.config.aggressiveness}`);
    }
    
    public setSafetyLevel(level: number) {
        this.config.safetyLevel = Math.max(0, Math.min(100, level));
        console.log(`DiscardDecisionEngine: 安全级别设置为 ${this.config.safetyLevel}`);
    }
    
    public setTargetYaku(yakuList: string[]) {
        this.config.targetYaku = [...yakuList];
        console.log(`DiscardDecisionEngine: 目标役种设置为 ${yakuList.join(', ')}`);
    }
    
    public getConfig(): DiscardAIConfig {
        return { ...this.config };
    }
} 