import { _decorator, Component, Node, Vec3 } from 'cc';
import { MahjongTile } from '../MahjongTile';
import { TargetEvaluation, DecisionContext } from './AITypes';
import { ITargetProvider, GetTargetProvider } from '../interfaces/ITargetProvider';

const { ccclass, property } = _decorator;

@ccclass('TargetSelector')
export class TargetSelector extends Component {
    // 用于获取目标提供者的函数，避免循环依赖
    private getTargetProvider: GetTargetProvider | null = null;

    /**
     * 设置目标提供者获取函数，避免循环依赖
     */
    public setTargetProvider(provider: GetTargetProvider) {
        this.getTargetProvider = provider;
    }
    

    
    /**
     * 寻找最佳目标麻将牌
     */
    public findBestTarget(context: DecisionContext): Node | null {
        const targetProvider = this.getTargetProvider?.();
        if (!targetProvider) {
            console.warn("TargetSelector: 目标提供者未设置");
            return null;
        }

        const activeTiles = targetProvider.getAllTileNodes();
        
        // 🔥 增强调试信息
        console.log(`TargetSelector: 开始寻找目标，目标提供者: ${targetProvider ? '有效' : '无效'}`);
        console.log(`TargetSelector: 获取到的activeTiles: ${activeTiles ? activeTiles.length : 'null'}`);

        if (!activeTiles || activeTiles.length === 0) {
            console.log("TargetSelector: 场上没有麻将牌");
            return null;
        }
        
        // 🔥 记录每个麻将牌的位置和有效性
        // console.log("TargetSelector: 场上麻将牌详情:");
        activeTiles.forEach((tile, index) => {
            if (tile && tile.isValid) {
                const distance = Vec3.distance(context.snakePosition, tile.position);
                // console.log(`  牌${index}: 位置(${tile.position.x.toFixed(1)}, ${tile.position.y.toFixed(1)}), 距离: ${distance.toFixed(1)}`);
            } else {
                console.log(`  牌${index}: 无效或已销毁`);
            }
        });
        
        const evaluations = this.evaluateAllTargets(activeTiles, context);
        
        if (evaluations.length === 0) {
            console.log("TargetSelector: 在搜索范围内未找到合适目标");
            this.logNearestTargets(activeTiles, context.snakePosition);
            
            // 🔥 扩大搜索范围重试
            console.log("TargetSelector: 尝试扩大搜索范围");
            const expandedEvaluations = this.evaluateAllTargetsWithExpandedRange(activeTiles, context);
            if (expandedEvaluations.length > 0) {
                expandedEvaluations.sort((a, b) => b.score - a.score);
                const bestTarget = expandedEvaluations[0];
                console.log(`TargetSelector: 扩大搜索范围后找到目标，距离: ${bestTarget.distance.toFixed(2)}, 评分: ${bestTarget.score.toFixed(2)}`);
                return bestTarget.target;
            }
            
            return null;
        }
        
        // 按评分排序，选择最佳目标
        evaluations.sort((a, b) => b.score - a.score);
        const bestTarget = evaluations[0];
        
        console.log(`TargetSelector: 选择最佳目标，距离: ${bestTarget.distance.toFixed(2)}, 评分: ${bestTarget.score.toFixed(2)}, 原因: ${bestTarget.reason}`);
        
        return bestTarget.target;
    }
    
    /**
     * 评估所有目标
     */
    private evaluateAllTargets(activeTiles: Node[], context: DecisionContext): TargetEvaluation[] {
        const evaluations: TargetEvaluation[] = [];
        
        console.log(`TargetSelector: 开始评估目标，场上共${activeTiles.length}张牌`);
        
        for (const tile of activeTiles) {
            if (!tile || !tile.isValid) {
                continue;
            }
            
            const distance = Vec3.distance(context.snakePosition, tile.position);
            
            // 跳过超出搜索范围的目标
            if (!this.isInSearchRange(distance, context)) {
                continue;
            }
            
            const evaluation = this.evaluateTarget(tile, distance, context);
            if (evaluation) {
                evaluations.push(evaluation);
            }
        }
        
        return evaluations;
    }
    
    /**
     * 评估单个目标
     */
    private evaluateTarget(tile: Node, distance: number, context: DecisionContext): TargetEvaluation | null {
        let score = this.calculateBaseScore(distance);
        let reason = `基础距离评分: ${score.toFixed(1)}`;
        
        const mahjongTile = tile.getComponent(MahjongTile);
        if (!mahjongTile) {
            return null;
        }
        
        // 位置优势加分
        const positionBonus = this.calculatePositionBonus(tile, context);
        score += positionBonus;
        if (positionBonus > 0) {
            reason += `, 位置加分: +${positionBonus.toFixed(1)}`;
        }
        
        console.log(`TargetSelector: 评估目标 距离${distance.toFixed(1)}, 最终评分${score.toFixed(1)} (${reason})`);
        
        return {
            target: tile,
            score: score,
            distance: distance,
            reason: reason
        };
    }
    
    /**
     * 计算基础距离评分
     */
    private calculateBaseScore(distance: number): number {
        return 1000 / (distance + 1);
    }
    

    
    /**
     * 计算位置优势加分
     */
    private calculatePositionBonus(tile: Node, context: DecisionContext): number {
        let bonus = 0;
        
        // 距离边界较近的牌更容易收集
        const distanceFromBoundary = this.calculateDistanceFromBoundary(tile.position, context.gameBounds);
        if (distanceFromBoundary < 100) {
            bonus += 20;
        }
        
        // 如果当前已有目标，避免选择过于分散的目标
        if (context.currentTarget && context.currentTarget.position) {
            const targetDistance = Vec3.distance(tile.position, context.currentTarget.position);
            if (targetDistance > 200) {
                bonus -= 30; // 分散惩罚
            }
        }
        
        // 添加一些随机性，避免AI行为过于机械
        const randomBonus = (Math.random() - 0.5) * 10; // -5 到 +5 的随机加分
        bonus += randomBonus;
        
        return bonus;
    }
    
    /**
     * 计算距离边界的距离
     */
    private calculateDistanceFromBoundary(position: Vec3, bounds: any): number {
        const distToLeft = Math.abs(position.x - bounds.minX);
        const distToRight = Math.abs(position.x - bounds.maxX);
        const distToTop = Math.abs(position.y - bounds.maxY);
        const distToBottom = Math.abs(position.y - bounds.minY);
        
        return Math.min(distToLeft, distToRight, distToTop, distToBottom);
    }
    
    /**
     * 检查是否在搜索范围内
     */
    private isInSearchRange(distance: number, context: DecisionContext): boolean {
        // 搜索半径可以从context或配置中获取
        const searchRadius = 1500; // 增大搜索半径到1500像素
        return distance <= searchRadius;
    }
    
    /**
     * 记录最近目标信息（调试用）
     */
    private logNearestTargets(activeTiles: Node[], snakePosition: Vec3) {
        if (activeTiles.length === 0) return;
        
        const distances = activeTiles
            .filter(tile => tile && tile.isValid)
            .map(tile => Vec3.distance(snakePosition, tile.position))
            .sort((a, b) => a - b)
            .slice(0, 3);
            
        console.log(`TargetSelector: 最近的3个目标距离: ${distances.map(d => d.toFixed(1)).join(', ')}`);
    }
    
    /**
     * 验证目标是否仍然有效
     */
    public isValidTarget(target: Node | null, context: DecisionContext): boolean {
        if (!target || !target.isValid) {
            return false;
        }
        
        // 检查距离是否仍在搜索范围内
        const distance = Vec3.distance(context.snakePosition, target.position);
        return this.isInSearchRange(distance, context);
    }
    
    /**
     * 获取目标相关统计信息
     */
    public getTargetStats(context: DecisionContext): {totalTargets: number, inRange: number, evaluated: number} {
        const targetProvider = this.getTargetProvider?.();
        const activeTiles = targetProvider?.getAllTileNodes() || [];
        const totalTargets = activeTiles.length;
        
        let inRange = 0;
        let evaluated = 0;
        
        if (activeTiles) {
            for (const tile of activeTiles) {
                if (!tile || !tile.isValid) continue;
                
                const distance = Vec3.distance(context.snakePosition, tile.position);
                if (this.isInSearchRange(distance, context)) {
                    inRange++;
                    if (tile.getComponent(MahjongTile)) {
                        evaluated++;
                    }
                }
            }
        }
        
        return { totalTargets, inRange, evaluated };
    }
    
    /**
     * 🔥 新增：使用扩大搜索范围评估目标
     */
    private evaluateAllTargetsWithExpandedRange(activeTiles: Node[], context: DecisionContext): TargetEvaluation[] {
        const evaluations: TargetEvaluation[] = [];
        const expandedSearchRadius = 1000; // 扩大到1000像素
        
        console.log(`TargetSelector: 使用扩大搜索范围(${expandedSearchRadius})重新评估目标`);
        
        for (const tile of activeTiles) {
            if (!tile || !tile.isValid) {
                continue;
            }
            
            const distance = Vec3.distance(context.snakePosition, tile.position);
            
            // 使用扩大的搜索范围
            if (distance <= expandedSearchRadius) {
                const evaluation = this.evaluateTarget(tile, distance, context);
                if (evaluation) {
                    evaluations.push(evaluation);
                }
            }
        }
        
        return evaluations;
    }
} 