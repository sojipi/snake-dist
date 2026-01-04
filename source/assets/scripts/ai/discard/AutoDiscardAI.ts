import { _decorator, Component } from 'cc';
import { GameManager } from '../../GameManager';
import { DiscardDecisionEngine } from './DiscardDecisionEngine';
import { DiscardDecision, DiscardStrategy, DiscardHistory } from './DiscardTypes';

const { ccclass, property } = _decorator;

@ccclass('AutoDiscardAI')
export class AutoDiscardAI extends Component {
    
    @property({ tooltip: "是否启用自动弃牌" })
    enableAutoDiscard: boolean = false;
    
    @property({ tooltip: "弃牌决策间隔（秒）" })
    decisionInterval: number = 2.0;
    
    @property({ tooltip: "是否显示AI思考过程" })
    showThinkingProcess: boolean = true;
    
    private gameManager: GameManager = null!;
    private decisionEngine: DiscardDecisionEngine = null!;
    private decisionTimer: number = 0;
    private discardHistory: DiscardHistory[] = [];
    private isThinking: boolean = false;
    
    // 统计信息
    private totalDecisions: number = 0;
    private correctDecisions: number = 0;
    private averageThinkingTime: number = 0;
    
    onLoad() {
        this.gameManager = GameManager.getInstance();
        this.decisionEngine = this.node.addComponent(DiscardDecisionEngine);
        
        // 设置默认策略
        this.decisionEngine.setStrategy(DiscardStrategy.BALANCED);
        this.decisionEngine.setSafetyLevel(70);
        
        // 🔥 新增：获取并设置当前关卡的目标役种
        this.updateTargetYaku();
    }
    
    start() {
        if (this.enableAutoDiscard) {
            this.startAutoDiscard();
        }
    }
    
    update(deltaTime: number) {
        if (!this.enableAutoDiscard || !this.gameManager) {
            return;
        }
        
        // 检查游戏状态
        if (this.gameManager.getGameState() !== 0) { // 0 = PLAYING
            return;
        }
        
        // 🔥 检查是否需要弃牌
        const shouldDiscard = this.shouldConsiderDiscard();
        if (shouldDiscard) {
            this.decisionTimer += deltaTime;
            
            if (this.decisionTimer >= this.decisionInterval && !this.isThinking) {
                this.decisionTimer = 0;
                console.log("AutoDiscardAI: 触发自动弃牌决策");
                this.executeDiscardDecision();
            }
        } else {
            // 重置计时器
            this.decisionTimer = 0;
        }
    }
    
    /**
     * 启动自动弃牌
     */
    public startAutoDiscard() {
        this.enableAutoDiscard = true;
        this.decisionTimer = 0;
        this.isThinking = false;
        
        console.log("AutoDiscardAI: 自动弃牌AI已启动");
    }
    
    /**
     * 停止自动弃牌
     */
    public stopAutoDiscard() {
        this.enableAutoDiscard = false;
        this.isThinking = false;
        
        console.log("AutoDiscardAI: 自动弃牌AI已停止");
    }
    
    /**
     * 判断是否应该考虑弃牌
     */
    private shouldConsiderDiscard(): boolean {
        // 🔥 检查是否是AI角色
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        
        if (aiCharacter) {
            // AI角色：检查AI角色的手牌状态
            const handCount = aiCharacter.getHandCardsCount();
            const maxHandCards = aiCharacter.getMaxHandCards();
            
            // console.log(`AutoDiscardAI.shouldConsiderDiscard: AI角色手牌 ${handCount}/${maxHandCards}`);
            
            // 手牌满了才考虑弃牌
            return handCount >= maxHandCards;
        } else {
            // 玩家角色：检查GameManager的手牌状态
        const handCount = this.gameManager.getHandCardsCount();
        const maxHandCards = this.gameManager.getMaxHandCards();
            
            // console.log(`AutoDiscardAI.shouldConsiderDiscard: 玩家手牌 ${handCount}/${maxHandCards}`);
        
        // 手牌满了才考虑弃牌
            return handCount >= maxHandCards;
        }
    }
    
    /**
     * 执行弃牌决策
     */
    private async executeDiscardDecision() {
        this.isThinking = true;
        const startTime = Date.now();
        
        try {
            if (this.showThinkingProcess) {
                console.log("AutoDiscardAI: 开始思考弃牌...");
            }
            
            // 获取当前手牌
            const handCards = this.getCurrentHandCards();
            
            if (handCards.length === 0) {
                console.warn("AutoDiscardAI: 没有手牌可以分析");
                return;
            }
            
            // 做出弃牌决策
            const decision = this.decisionEngine.makeDiscardDecision(handCards);
            
            // 记录决策时间
            const thinkingTime = Date.now() - startTime;
            this.updateStatistics(thinkingTime);
            
            if (this.showThinkingProcess) {
                this.logDecisionProcess(decision, thinkingTime);
            }
            
            // 🔥 执行弃牌
            if (decision.recommendedTile) {
                // 检查是否是AI角色
                const aiCharacter = this.node.getComponent('AICharacter') as any;
                if (aiCharacter) {
                    // AI角色：使用专用方法执行弃牌
                    const success = this.executeDiscardForAI(decision.recommendedTile.type);
                    if (success) {
                        console.log(`AutoDiscardAI: AI角色自动弃牌成功: ${decision.recommendedTile.type}`);
                    } else {
                        console.warn(`AutoDiscardAI: AI角色自动弃牌失败: ${decision.recommendedTile.type}`);
                    }
                } else {
                    // 玩家角色：使用原有方法执行弃牌
                this.executeDiscard(decision);
                }
            } else {
                console.warn("AutoDiscardAI: 没有推荐的弃牌");
            }
            
        } catch (error) {
            console.error("AutoDiscardAI: 弃牌决策出错", error);
        } finally {
            this.isThinking = false;
        }
    }
    
    /**
     * 获取当前手牌
     */
    private getCurrentHandCards(): string[] {
        // 🔥 检查是否是AI角色
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        
        if (aiCharacter) {
            // AI角色：从AICharacter获取手牌
            const handCards = aiCharacter.getHandCards();
            console.log(`AutoDiscardAI.getCurrentHandCards: AI角色手牌:`, handCards);
            
            // 🔥 AI角色的手牌是数字格式，需要转换为标准格式
            return handCards.map((card: string) => {
                const tileNum = parseInt(card);
                if (!isNaN(tileNum)) {
                    return this.convertNumberToTileString(tileNum);
                }
                return card;
            });
        } else {
            // 玩家角色：从GameManager获取手牌数据
        const handCardsRaw = (this.gameManager as any).handCards || [];
        
            console.log(`AutoDiscardAI.getCurrentHandCards: 玩家手牌数据:`, handCardsRaw);
        
        // 将数字编码转换为牌型字符串
        return handCardsRaw.map((card: any) => {
            if (typeof card === 'string') {
                return card;
            } else if (typeof card === 'number') {
                // 将数字编码转换为标准牌型字符串
                return this.convertNumberToTileString(card);
            } else {
                // 如果是对象，尝试获取type属性
                return card.type || card.toString();
            }
        });
        }
    }
    
    /**
     * 将数字编码转换为牌型字符串
     */
    private convertNumberToTileString(num: number): string {
        // 根据游戏的编码规则转换
        if (num >= 1 && num <= 9) {
            // 饼子：1-9 -> "1p"-"9p"
            return `${num}p`;
        } else if (num >= 10 && num <= 18) {
            // 条子：10-18 -> "1s"-"9s"
            return `${num - 9}s`;
        } else if (num >= 22 && num <= 30) {
            // 万子：22-30 -> "1m"-"9m"
            return `${num - 21}m`;
        } else if (num >= 19 && num <= 21) {
            // 三元牌：19-21 -> 中发白
            const honors = ["中", "发", "白"];
            return honors[num - 19];
        } else if (num >= 31 && num <= 34) {
            // 风牌：31-34 -> 东南西北
            const winds = ["东", "南", "西", "北"];
            return winds[num - 31];
        } else {
            console.warn(`AutoDiscardAI: 未知的牌编码 ${num}`);
            return num.toString();
        }
    }
    
    /**
     * 🔥 新增：将牌型字符串转换为数字编码
     */
    private convertTileStringToNumber(tileStr: string): number | null {
        // 字牌处理
        const honorMap: {[key: string]: number} = {
            '中': 19, '发': 20, '白': 21,
            '东': 31, '南': 32, '西': 33, '北': 34
        };
        
        if (honorMap[tileStr]) {
            return honorMap[tileStr];
        }
        
        // 数牌处理
        const lastChar = tileStr.slice(-1);
        const value = parseInt(tileStr.slice(0, -1));
        
        if (isNaN(value)) {
            console.warn(`AutoDiscardAI: 无法解析牌型字符串 ${tileStr}`);
            return null;
        }
        
        switch (lastChar) {
            case 'p': // 饼子：1-9
                if (value >= 1 && value <= 9) {
                    return value;
                }
                break;
            case 's': // 条子：1-9
                if (value >= 1 && value <= 9) {
                    return value + 9;
                }
                break;
            case 'm': // 万子：1-9
                if (value >= 1 && value <= 9) {
                    return value + 21;
                }
                break;
        }
        
        console.warn(`AutoDiscardAI: 无法转换牌型字符串 ${tileStr}`);
        return null;
    }
    
    /**
     * 执行弃牌操作
     */
    private executeDiscard(decision: DiscardDecision) {
        if (!decision.recommendedTile) {
            return;
        }
        
        const tileToDiscard = decision.recommendedTile;
        
        console.log(`AutoDiscardAI: 执行弃牌 ${tileToDiscard.type}，信心度: ${decision.confidence}%`);
        
        // 记录弃牌历史
        this.recordDiscardHistory(decision);
        
        // 实际执行弃牌操作
        this.performDiscard(tileToDiscard.type);
        
        // 触发弃牌事件（如果需要的话）
        this.onDiscardExecuted(decision);
    }
    
    /**
     * 实际执行弃牌操作
     */
    private performDiscard(tileType: string) {
        try {
            console.log(`AutoDiscardAI.performDiscard: 开始执行弃牌操作，目标牌型: "${tileType}"`);
            console.log(`AutoDiscardAI.performDiscard: 牌型类型: ${typeof tileType}, 长度: ${tileType.length}`);
            
            // 🔥 检查是否是AI角色
            const aiCharacter = this.node.getComponent('AICharacter') as any;
            
            if (aiCharacter) {
                // AI角色：使用AI角色的弃牌方法
                const discardResult = aiCharacter.discardCard(tileType);
            
            if (discardResult) {
                    console.log(`AutoDiscardAI.performDiscard: ✅ AI角色成功弃掉牌型 "${tileType}"`);
                } else {
                    console.warn(`AutoDiscardAI.performDiscard: ❌ AI角色弃牌失败，牌型: "${tileType}"`);
                    
                    // 🔥 增强调试：如果弃牌失败，显示当前手牌状态
                    const handCards = aiCharacter.getHandCards();
                    console.warn(`AutoDiscardAI.performDiscard: AI角色当前手牌状态:`, handCards);
                    console.warn(`AutoDiscardAI.performDiscard: AI角色手牌数量: ${handCards.length}, 最大数量: ${aiCharacter.getMaxHandCards()}`);
                }
            } else {
                // 玩家角色：使用GameManager的弃牌方法
                const discardResult = this.gameManager.discardCardByType(tileType);
                
                if (discardResult) {
                    console.log(`AutoDiscardAI.performDiscard: ✅ 玩家成功弃掉牌型 "${tileType}"`);
                    console.log(`AutoDiscardAI.performDiscard: 弃牌操作完成，UI和蛇身已同步更新`);
                } else {
                console.warn(`AutoDiscardAI.performDiscard: ❌ GameManager拒绝了弃牌操作，牌型: "${tileType}"`);
                
                // 🔥 增强调试：如果弃牌失败，显示当前手牌状态
                const handCards = (this.gameManager as any).handCards || [];
                    console.warn(`AutoDiscardAI.performDiscard: 玩家当前手牌状态:`, handCards);
                    console.warn(`AutoDiscardAI.performDiscard: 玩家手牌数量: ${handCards.length}, 最大数量: ${this.gameManager.getMaxHandCards()}`);
                }
            }
            
        } catch (error) {
            console.error("AutoDiscardAI.performDiscard: 执行弃牌操作失败", error);
        }
    }
    
    /**
     * 记录弃牌历史
     */
    private recordDiscardHistory(decision: DiscardDecision) {
        if (!decision.recommendedTile) return;
        
        const history: DiscardHistory = {
            tile: decision.recommendedTile,
            turn: this.totalDecisions + 1,
            player: "AI",
            reasoning: decision.reasoning,
            timestamp: Date.now()
        };
        
        this.discardHistory.push(history);
        
        // 限制历史记录长度
        if (this.discardHistory.length > 50) {
            this.discardHistory.shift();
        }
    }
    
    /**
     * 弃牌执行后的回调
     */
    private onDiscardExecuted(decision: DiscardDecision) {
        // 可以在这里添加其他逻辑，比如：
        // - 更新UI显示
        // - 触发音效
        // - 记录统计信息
        // - 检查游戏状态变化
        
        console.log(`AutoDiscardAI: 弃牌操作完成，推理: ${decision.reasoning}`);
    }
    
    /**
     * 记录决策过程
     */
    private logDecisionProcess(decision: DiscardDecision, thinkingTime: number) {
        console.log("=== AutoDiscardAI 决策过程 ===");
        console.log(`推荐弃牌: ${decision.recommendedTile?.type || '无'}`);
        console.log(`决策信心: ${decision.confidence}%`);
        console.log(`策略类型: ${decision.strategy}`);
        console.log(`思考时间: ${thinkingTime}ms`);
        console.log(`推理过程: ${decision.reasoning}`);
        
        if (decision.alternatives.length > 0) {
            const altTypes = decision.alternatives.map(t => t.type).join(', ');
            console.log(`备选方案: ${altTypes}`);
        }
        
        console.log("========================");
    }
    
    /**
     * 更新统计信息
     */
    private updateStatistics(thinkingTime: number) {
        this.totalDecisions++;
        this.averageThinkingTime = (this.averageThinkingTime * (this.totalDecisions - 1) + thinkingTime) / this.totalDecisions;
    }
    
    // === 公共接口方法 ===
    
    /**
     * 设置弃牌策略
     */
    public setDiscardStrategy(strategy: DiscardStrategy) {
        this.decisionEngine.setStrategy(strategy);
        console.log(`AutoDiscardAI: 弃牌策略设置为 ${strategy}`);
    }
    
    /**
     * 设置决策间隔
     */
    public setDecisionInterval(interval: number) {
        this.decisionInterval = Math.max(0.5, interval);
        console.log(`AutoDiscardAI: 决策间隔设置为 ${this.decisionInterval}秒`);
    }
    
    /**
     * 设置安全级别
     */
    public setSafetyLevel(level: number) {
        this.decisionEngine.setSafetyLevel(level);
        console.log(`AutoDiscardAI: 安全级别设置为 ${level}`);
    }
    
    /**
     * 手动触发弃牌决策
     */
    public async triggerManualDiscard(): Promise<DiscardDecision | null> {
        if (this.isThinking) {
            console.log("AutoDiscardAI: 正在思考中，请稍候");
            return null;
        }
        
        const handCards = this.getCurrentHandCards();
        if (handCards.length === 0) {
            console.warn("AutoDiscardAI: 没有手牌可以分析");
            return null;
        }
        
        console.log("AutoDiscardAI: 手动触发弃牌决策");
        const decision = this.decisionEngine.makeDiscardDecision(handCards);
        
        this.logDecisionProcess(decision, 0);
        
        return decision;
    }
    
    /**
     * 🔥 新增：为AI角色执行弃牌（不通过GameManager）
     */
    public executeDiscardForAI(tileType: string): boolean {
        console.log(`AutoDiscardAI: AI角色执行弃牌 ${tileType}`);
        
        // 🔥 获取AI角色组件
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        if (!aiCharacter) {
            console.error("AutoDiscardAI: 未找到AICharacter组件");
            return false;
        }
        
        // 🔥 将标准格式的牌型转换回数字格式
        const numericTileType = this.convertTileStringToNumber(tileType);
        if (numericTileType === null) {
            console.error(`AutoDiscardAI: 无法转换牌型 ${tileType} 为数字格式`);
            return false;
        }
        
        console.log(`AutoDiscardAI: 转换牌型 ${tileType} -> ${numericTileType}`);
        
        // 🔥 通过AI角色执行弃牌
        const result = aiCharacter.discardCard(numericTileType.toString());
        
        if (result) {
            console.log(`AutoDiscardAI: AI角色成功弃牌 ${tileType} (数字: ${numericTileType})`);
            return true;
        } else {
            console.warn(`AutoDiscardAI: AI角色弃牌失败 ${tileType} (数字: ${numericTileType})`);
            return false;
        }
    }
    
    /**
     * 获取AI状态信息
     */
    public getAIStatus(): {
        enabled: boolean,
        thinking: boolean,
        totalDecisions: number,
        averageThinkingTime: number,
        recentHistory: DiscardHistory[]
    } {
        return {
            enabled: this.enableAutoDiscard,
            thinking: this.isThinking,
            totalDecisions: this.totalDecisions,
            averageThinkingTime: this.averageThinkingTime,
            recentHistory: this.discardHistory.slice(-5)
        };
    }
    
    /**
     * 获取弃牌历史
     */
    public getDiscardHistory(): DiscardHistory[] {
        return [...this.discardHistory];
    }
    
    /**
     * 清空历史记录
     */
    public clearHistory() {
        this.discardHistory = [];
        this.totalDecisions = 0;
        this.correctDecisions = 0;
        this.averageThinkingTime = 0;
        
        console.log("AutoDiscardAI: 历史记录已清空");
    }
    
    /**
     * 切换AI开关
     */
    public toggleAI(): boolean {
        if (this.enableAutoDiscard) {
            this.stopAutoDiscard();
        } else {
            this.startAutoDiscard();
        }
        
        return this.enableAutoDiscard;
    }
    
    /**
     * 检查是否启用
     */
    public isEnabled(): boolean {
        return this.enableAutoDiscard;
    }
    
    /**
     * 更新目标役种设置
     */
    private updateTargetYaku() {
        // 🔥 检查是否是AI角色，如果是AI角色则不设置目标役种
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        
        if (aiCharacter) {
            console.log("AutoDiscardAI: AI角色，不设置目标役种，使用通用弃牌策略");
            // AI角色不设置目标役种，使用通用策略
            this.decisionEngine.setTargetYaku([]);
        } else {
            // 玩家角色设置目标役种
        const targetYaku = this.gameManager.getCurrentTargetYaku();
        if (targetYaku) {
            console.log(`AutoDiscardAI: 当前关卡目标役种 - ${targetYaku}`);
            this.decisionEngine.setTargetYaku([targetYaku]);
        } else {
            console.warn("AutoDiscardAI: 未找到当前关卡的目标役种");
            }
        }
    }
} 