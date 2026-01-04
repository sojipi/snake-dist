import { _decorator, Component, Vec3 } from 'cc';
import { GameManager } from '../GameManager';
import { SnakeController } from '../SnakeController';
import { Direction, DirectionSafety, PathPlanResult, DecisionContext } from './AITypes';

const { ccclass, property } = _decorator;

@ccclass('PathFinder')
export class PathFinder extends Component {
    
    private gameManager: GameManager = null!;
    private snakeController: SnakeController = null!;
    
    onLoad() {
        this.gameManager = GameManager.getInstance();
        this.snakeController = this.getComponent(SnakeController) || this.node.getComponent(SnakeController);
        
        if (!this.snakeController) {
            console.error("PathFinder: 未找到SnakeController组件");
        }
    }
    
    /**
     * 规划到目标的路径
     */
    public planPathToTarget(context: DecisionContext): PathPlanResult {
        if (!context.currentTarget) {
            return this.planExplorationPath(context);
        }
        
        // 计算理想方向
        const preferredDirection = this.calculateDirectionToTarget(
            context.snakePosition, 
            context.currentTarget.position
        );
        
        console.log(`PathFinder: 计算理想方向 ${this.directionToString(preferredDirection)}`);
        
        // 进行避障检查
        const avoidanceResult = this.avoidObstacles(context, preferredDirection);
        
        return {
            direction: avoidanceResult.direction,
            isSafe: avoidanceResult.isSafe,
            reason: avoidanceResult.reason,
            alternatives: avoidanceResult.alternatives
        };
    }
    
    /**
     * 规划探索路径（没有明确目标时）
     */
    public planExplorationPath(context: DecisionContext): PathPlanResult {
        console.log("PathFinder: 执行探索模式路径规划");
        
        const explorationDirection = this.calculateExplorationDirection(context);
        const safetyCheck = this.checkDirectionSafety(context, explorationDirection);
        
        if (safetyCheck.safe) {
            return {
                direction: explorationDirection,
                isSafe: true,
                reason: "探索方向安全",
                alternatives: []
            };
        }
        
        // 探索方向不安全，寻找替代方案
        const alternatives = this.findSafeDirections(context);
        
        if (alternatives.length > 0) {
            const bestAlternative = this.chooseBestExplorationDirection(alternatives, context);
            return {
                direction: bestAlternative,
                isSafe: true,
                reason: "使用探索替代方向",
                alternatives: alternatives
            };
        }
        
        // 所有方向都不安全，强制选择一个方向
        return {
            direction: explorationDirection,
            isSafe: false,
            reason: "强制选择方向，清空路径历史",
            alternatives: []
        };
    }
    
    /**
     * 计算到目标的方向
     */
    private calculateDirectionToTarget(fromPos: Vec3, toPos: Vec3): Direction {
        const deltaX = toPos.x - fromPos.x;
        const deltaY = toPos.y - fromPos.y;
        
        // 选择移动幅度更大的轴作为主要方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
            return deltaY > 0 ? Direction.UP : Direction.DOWN;
        }
    }
    
    /**
     * 计算探索方向
     */
    private calculateExplorationDirection(context: DecisionContext): Direction {
        // 根据历史长度动态调整直行概率，避免过于机械
        const historyLength = context.pathHistory.length;
        let straightProbability = 0.6; // 基础直行概率降低到60%
        
        // 如果最近一直在直行，降低继续直行的概率
        if (historyLength >= 3) {
            const recentDirections = this.getRecentDirections(context.pathHistory, context.lastDirection);
            const isKeepingStraight = recentDirections.every(dir => dir === context.lastDirection);
            if (isKeepingStraight) {
                straightProbability = 0.3; // 降低到30%
                console.log("PathFinder: 检测到连续直行，降低直行概率");
            }
        }
        
        // 决定是否继续直行
        if (Math.random() < straightProbability) {
            const safetyCheck = this.checkDirectionSafety(context, context.lastDirection);
            if (safetyCheck.safe) {
                console.log(`PathFinder: 探索模式继续直行 ${this.directionToString(context.lastDirection)}`);
                return context.lastDirection;
            }
        }
        
        // 使用新的多样化探索策略
        return this.chooseDiversifiedExplorationDirection(context);
    }
    
    /**
     * 选择最佳探索方向
     */
    private chooseBestExplorationDirection(directions: Direction[], context: DecisionContext): Direction {
        let bestDirection = directions[0];
        let bestScore = -1;
        
        for (const direction of directions) {
            const explorationScore = this.calculateExplorationScore(direction, context);
            
            if (explorationScore > bestScore) {
                bestScore = explorationScore;
                bestDirection = direction;
            }
        }
        
        console.log(`PathFinder: 选择探索方向 ${this.directionToString(bestDirection)}, 评分: ${bestScore.toFixed(1)}`);
        return bestDirection;
    }
    
    /**
     * 获取最近的方向历史
     */
    private getRecentDirections(pathHistory: Vec3[], currentDirection: Direction): Direction[] {
        const directions: Direction[] = [];
        
        for (let i = 0; i < Math.min(3, pathHistory.length - 1); i++) {
            const current = pathHistory[i];
            const next = pathHistory[i + 1];
            
            const deltaX = next.x - current.x;
            const deltaY = next.y - current.y;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                directions.push(deltaX > 0 ? Direction.RIGHT : Direction.LEFT);
            } else {
                directions.push(deltaY > 0 ? Direction.UP : Direction.DOWN);
            }
        }
        
        directions.push(currentDirection);
        return directions;
    }
    
    /**
     * 多样化探索方向选择
     */
    private chooseDiversifiedExplorationDirection(context: DecisionContext): Direction {
        const allDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const oppositeDirection = this.getOppositeDirection(context.lastDirection);
        const availableDirections = allDirections.filter(dir => dir !== oppositeDirection);
        
        // 🔥 新增：检查是否在边界附近，如果是则优先选择向中心的方向
        const centerDirection = this.calculateDirectionToCenter(context.snakePosition, context.gameBounds);
        if (centerDirection !== null) {
            const centerSafety = this.checkDirectionSafety(context, centerDirection);
            if (centerSafety.safe) {
                console.log(`PathFinder: 边界附近，选择向中心方向 ${this.directionToString(centerDirection)}`);
                return centerDirection;
            }
        }
        
        // 使用多种策略随机选择
        const strategy = Math.random();
        
        if (strategy < 0.3) {
            // 30% 概率：向中心靠近
            return this.chooseCenterDirection(availableDirections, context);
        } else if (strategy < 0.6) {
            // 30% 概率：基于安全性选择
            return this.chooseSafeDirection(availableDirections, context);
        } else if (strategy < 0.8) {
            // 20% 概率：基于未访问区域选择
            return this.chooseUnexploredDirection(availableDirections, context);
        } else {
            // 20% 概率：完全随机选择
            return this.chooseRandomDirection(availableDirections, context);
        }
    }
    
    /**
     * 🔥 新增：计算向中心的方向
     */
    private calculateDirectionToCenter(currentPos: Vec3, bounds: any): Direction | null {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const centerPos = new Vec3(centerX, centerY, 0);
        
        // 检查是否已经在中心区域
        const distanceToCenter = Vec3.distance(currentPos, centerPos);
        const centerRadius = Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.3;
        
        if (distanceToCenter < centerRadius) {
            return null; // 已经在中心区域，不需要特殊处理
        }
        
        // 计算向中心的方向
        return this.calculateDirectionToTarget(currentPos, centerPos);
    }
    
    /**
     * 🔥 新增：选择向中心的方向
     */
    private chooseCenterDirection(availableDirections: Direction[], context: DecisionContext): Direction {
        const centerX = (context.gameBounds.minX + context.gameBounds.maxX) / 2;
        const centerY = (context.gameBounds.minY + context.gameBounds.maxY) / 2;
        const centerPos = new Vec3(centerX, centerY, 0);
        
        let bestDirection = availableDirections[0];
        let minDistanceToCenter = Infinity;
        
        for (const direction of availableDirections) {
            const testPos = this.getTestPosition(context.snakePosition, direction);
            const distanceToCenter = Vec3.distance(testPos, centerPos);
            
            // 检查安全性
            const safetyCheck = this.checkDirectionSafety(context, direction);
            if (safetyCheck.safe && distanceToCenter < minDistanceToCenter) {
                minDistanceToCenter = distanceToCenter;
                bestDirection = direction;
            }
        }
        
        console.log(`PathFinder: 选择向中心方向 ${this.directionToString(bestDirection)}`);
        return bestDirection;
    }
    
    /**
     * 随机方向选择
     */
    private chooseRandomDirection(directions: Direction[], context: DecisionContext): Direction {
        const safeDirections = directions.filter(dir => {
            const safetyCheck = this.checkDirectionSafety(context, dir);
            return safetyCheck.safe;
        });
        
        if (safeDirections.length > 0) {
            const chosen = safeDirections[Math.floor(Math.random() * safeDirections.length)];
            console.log(`PathFinder: 随机选择方向 ${this.directionToString(chosen)}`);
            return chosen;
        }
        
        // 如果没有安全方向，返回第一个可用方向
        return directions[0];
    }
    
    /**
     * 基于安全性选择方向
     */
    private chooseSafeDirection(directions: Direction[], context: DecisionContext): Direction {
        let bestDirection = directions[0];
        let bestSafety = -1;
        
        for (const direction of directions) {
            const safetyCheck = this.checkDirectionSafety(context, direction);
            let safetyScore = safetyCheck.safe ? 100 : 0;
            
            // 添加一些随机性
            safetyScore += (Math.random() - 0.5) * 20;
            
            if (safetyScore > bestSafety) {
                bestSafety = safetyScore;
                bestDirection = direction;
            }
        }
        
        console.log(`PathFinder: 基于安全性选择方向 ${this.directionToString(bestDirection)}`);
        return bestDirection;
    }
    
    /**
     * 基于未访问区域选择方向
     */
    private chooseUnexploredDirection(directions: Direction[], context: DecisionContext): Direction {
        let bestDirection = directions[0];
        let lowestPenalty = Infinity;
        
        for (const direction of directions) {
            const safetyCheck = this.checkDirectionSafety(context, direction);
            if (!safetyCheck.safe) continue;
            
            const testPos = this.getTestPosition(context.snakePosition, direction);
            const historyPenalty = this.calculateHistoryPenalty(testPos, context.pathHistory);
            
            // 添加随机因子，避免过于预测化
            const randomFactor = Math.random() * 10;
            const totalPenalty = historyPenalty + randomFactor;
            
            if (totalPenalty < lowestPenalty) {
                lowestPenalty = totalPenalty;
                bestDirection = direction;
            }
        }
        
        console.log(`PathFinder: 基于未访问区域选择方向 ${this.directionToString(bestDirection)}`);
        return bestDirection;
    }

    /**
     * 计算探索评分（重新设计，更平衡）
     */
    private calculateExplorationScore(direction: Direction, context: DecisionContext): number {
        let score = 100;
        
        const testPos = this.getTestPosition(context.snakePosition, direction);
        
        // 安全性检查
        const safetyCheck = this.checkDirectionSafety(context, direction);
        if (!safetyCheck.safe) {
            score -= 1000; // 不安全的方向大幅减分
        }
        
        // 历史访问惩罚（权重降低）
        const historyPenalty = this.calculateHistoryPenalty(testPos, context.pathHistory);
        score -= historyPenalty * 0.3; // 进一步降低惩罚权重
        
        // 🔥 新增：边界惩罚和中心倾向
        const boundaryDistance = this.getDistanceToBoundary(testPos, context.gameBounds);
        if (boundaryDistance < 30) {
            // 接近边界时大幅减分
            score -= (30 - boundaryDistance) * 3;
        }
        
        // 🔥 新增：向中心移动的奖励
        const centerX = (context.gameBounds.minX + context.gameBounds.maxX) / 2;
        const centerY = (context.gameBounds.minY + context.gameBounds.maxY) / 2;
        const centerPos = new Vec3(centerX, centerY, 0);
        
        const currentDistanceToCenter = Vec3.distance(context.snakePosition, centerPos);
        const newDistanceToCenter = Vec3.distance(testPos, centerPos);
        
        if (newDistanceToCenter < currentDistanceToCenter) {
            // 向中心移动给予奖励
            const centerBonus = (currentDistanceToCenter - newDistanceToCenter) * 0.5;
            score += centerBonus;
        } else {
            // 远离中心给予轻微惩罚
            const centerPenalty = (newDistanceToCenter - currentDistanceToCenter) * 0.2;
            score -= centerPenalty;
        }
        
        // 随机性加分，让探索更多样化（减少权重）
        const randomBonus = (Math.random() - 0.5) * 20; // -10 到 +10
        score += randomBonus;
        
        return score;
    }
    
    /**
     * 避障逻辑
     */
    private avoidObstacles(context: DecisionContext, preferredDirection: Direction): {
        direction: Direction,
        isSafe: boolean,
        reason: string,
        alternatives: Direction[]
    } {
        // 检查首选方向
        const preferredSafety = this.checkDirectionSafety(context, preferredDirection);
        
        console.log(`PathFinder: 检查首选方向${this.directionToString(preferredDirection)}: ${preferredSafety.safe ? '安全' : '不安全'}`);
        
        if (preferredSafety.safe) {
            return {
                direction: preferredDirection,
                isSafe: true,
                reason: "首选方向安全",
                alternatives: []
            };
        }
        
        // 首选方向不安全，寻找替代方案
        console.log(`PathFinder: 首选方向不安全(${preferredSafety.reason})，寻找替代方向`);
        
        const safeDirections = this.findSafeDirections(context);
        
        if (safeDirections.length > 0) {
            // 优先选择非反向的安全方向
            const oppositeDirection = this.getOppositeDirection(context.lastDirection);
            const nonOppositeDirections = safeDirections.filter(dir => dir !== oppositeDirection);
            
            if (nonOppositeDirections.length > 0) {
                const bestDir = this.chooseBestAlternativeDirection(nonOppositeDirections, context);
                console.log(`PathFinder: 选择替代方向 ${this.directionToString(bestDir)}`);
                
                return {
                    direction: bestDir,
                    isSafe: true,
                    reason: "使用非反向替代方向",
                    alternatives: safeDirections
                };
            } else {
                // 只能选择反向
                console.log("PathFinder: 只能选择反方向，清空路径历史");
                
                return {
                    direction: safeDirections[0],
                    isSafe: true,
                    reason: "强制选择反方向",
                    alternatives: safeDirections
                };
            }
        }
        
        // 所有方向都不安全
        console.warn("PathFinder: 所有方向都不安全，强制选择首选方向");
        
        return {
            direction: preferredDirection,
            isSafe: false,
            reason: "强制选择，所有方向都不安全",
            alternatives: []
        };
    }
    
    /**
     * 寻找所有安全方向
     */
    private findSafeDirections(context: DecisionContext): Direction[] {
        const allDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const safeDirections: Direction[] = [];
        
        for (const direction of allDirections) {
            const safetyCheck = this.checkDirectionSafety(context, direction);
            
            console.log(`PathFinder: 方向${this.directionToString(direction)}: ${safetyCheck.safe ? '安全' : '不安全'} ${safetyCheck.reason ? `(${safetyCheck.reason})` : ''}`);
            
            if (safetyCheck.safe) {
                safeDirections.push(direction);
            }
        }
        
        console.log(`PathFinder: 安全方向: ${safeDirections.map(d => this.directionToString(d)).join(', ')}`);
        
        return safeDirections;
    }
    
    /**
     * 选择最佳替代方向
     */
    private chooseBestAlternativeDirection(directions: Direction[], context: DecisionContext): Direction {
        if (!context.currentTarget) {
            // 没有目标时随机选择
            return directions[Math.floor(Math.random() * directions.length)];
        }
        
        // 有目标时选择最接近目标的方向
        let bestDirection = directions[0];
        let bestDistance = Infinity;
        
        for (const direction of directions) {
            const testPos = this.getTestPosition(context.snakePosition, direction);
            const distance = Vec3.distance(testPos, context.currentTarget.position);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = direction;
            }
        }
        
        return bestDirection;
    }
    
    /**
     * 检查方向安全性
     */
    private checkDirectionSafety(context: DecisionContext, direction: Direction): DirectionSafety {
        const testPos = this.getTestPosition(context.snakePosition, direction);
        
        // 检查边界
        if (!this.isWithinBounds(testPos, context.gameBounds)) {
            return {
                direction: direction,
                safe: false,
                reason: "超出边界",
                testPosition: testPos,
                score: 0
            };
        }
        
        // 检查蛇身碰撞
        if (this.wouldHitSnakeBody(testPos)) {
            return {
                direction: direction,
                safe: false,
                reason: "会撞到蛇身",
                testPosition: testPos,
                score: 0
            };
        }
        
        // 检查路径历史
        if (this.isInPathHistory(testPos, context.pathHistory)) {
            return {
                direction: direction,
                safe: false,
                reason: "路径历史冲突",
                testPosition: testPos,
                score: 0
            };
        }
        
        return {
            direction: direction,
            safe: true,
            reason: "",
            testPosition: testPos,
            score: 100
        };
    }
    
    /**
     * 获取指定方向的测试位置
     */
    private getTestPosition(currentPos: Vec3, direction: Direction): Vec3 {
        const moveDistance = 40; // 使用网格大小作为检测距离
        
        switch (direction) {
            case Direction.UP:
                return new Vec3(currentPos.x, currentPos.y + moveDistance, 0);
            case Direction.DOWN:
                return new Vec3(currentPos.x, currentPos.y - moveDistance, 0);
            case Direction.LEFT:
                return new Vec3(currentPos.x - moveDistance, currentPos.y, 0);
            case Direction.RIGHT:
                return new Vec3(currentPos.x + moveDistance, currentPos.y, 0);
            default:
                return currentPos.clone();
        }
    }
    
    /**
     * 检查是否在边界内
     */
    private isWithinBounds(testPos: Vec3, bounds: any): boolean {
        // 🔥 修改：减少安全边距，让AI能更好地利用边界区域
        const margin = 5; // 从10减少到5像素
        return testPos.x >= bounds.minX + margin && 
               testPos.x <= bounds.maxX - margin && 
               testPos.y >= bounds.minY + margin && 
               testPos.y <= bounds.maxY - margin;
    }
    
    /**
     * 🔥 新增：检查是否接近边界
     */
    private isNearBoundary(pos: Vec3, bounds: any, threshold: number = 50): boolean {
        return pos.x <= bounds.minX + threshold || 
               pos.x >= bounds.maxX - threshold || 
               pos.y <= bounds.minY + threshold || 
               pos.y >= bounds.maxY - threshold;
    }
    
    /**
     * 🔥 新增：计算到边界的最小距离
     */
    private getDistanceToBoundary(pos: Vec3, bounds: any): number {
        const distanceToLeft = pos.x - bounds.minX;
        const distanceToRight = bounds.maxX - pos.x;
        const distanceToBottom = pos.y - bounds.minY;
        const distanceToTop = bounds.maxY - pos.y;
        
        return Math.min(distanceToLeft, distanceToRight, distanceToBottom, distanceToTop);
    }
    
    /**
     * 检查是否会撞到蛇身
     */
    private wouldHitSnakeBody(testPos: Vec3): boolean {
        const snakeBody = (this.snakeController as any).snakeBody;
        if (!snakeBody || snakeBody.length === 0) return false;
        
        const collisionDistance = 25;
        
        for (const bodyPart of snakeBody) {
            if (!bodyPart || !bodyPart.isValid) continue;
            
            const distance = Vec3.distance(testPos, bodyPart.position);
            if (distance < collisionDistance) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查是否在路径历史中
     */
    private isInPathHistory(testPos: Vec3, pathHistory: Vec3[]): boolean {
        const historyDistance = 30;
        const recentHistory = pathHistory.slice(0, 3); // 只检查最近3步
        
        for (const historyPos of recentHistory) {
            if (Vec3.distance(testPos, historyPos) < historyDistance) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 计算历史访问惩罚
     */
    private calculateHistoryPenalty(testPos: Vec3, pathHistory: Vec3[]): number {
        let penalty = 0;
        const checkRadius = 60;
        
        for (const historyPos of pathHistory) {
            const distance = Vec3.distance(testPos, historyPos);
            if (distance < checkRadius) {
                penalty += (checkRadius - distance) / checkRadius * 30;
            }
        }
        
        return penalty;
    }
    

    
    /**
     * 获取相反方向
     */
    private getOppositeDirection(direction: Direction): Direction {
        switch (direction) {
            case Direction.UP: return Direction.DOWN;
            case Direction.DOWN: return Direction.UP;
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
            default: return Direction.UP;
        }
    }
    
    /**
     * 方向转字符串
     */
    private directionToString(direction: Direction): string {
        switch (direction) {
            case Direction.UP: return "上";
            case Direction.DOWN: return "下";
            case Direction.LEFT: return "左";
            case Direction.RIGHT: return "右";
            default: return "未知";
        }
    }
} 