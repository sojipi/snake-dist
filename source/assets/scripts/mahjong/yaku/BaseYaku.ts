import Chess from "../../game/Chess";

export interface StandardFormResult {
    valid: boolean;
    sets: number[][];
    pair: number[];
    pairIndex: number; // 雀头在手牌中的索引位置
}

export default abstract class BaseYaku {
    // 抽象方法，每个具体役种必须实现
    abstract check(tiles: Chess[]): boolean;

    // 生成特定役种所需的牌型
    abstract generateTiles(count: number): number[];
    
    // 检查标准和牌形式（4组面子+1对雀头）
    protected checkStandardForm(tiles: Chess[]): StandardFormResult {
        // 默认结果：无效
        const result = { valid: false, sets: [], pair: [], pairIndex: -1 };
        
        // 获取牌的数字值并排序
        const nums = tiles.map(tile => tile.num).sort((a, b) => a - b);
        
        // 统计每种牌的数量
        const countMap = {};
        for (const num of nums) {
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否有牌超过4张
        for (const num in countMap) {
            if (countMap[num] > 4) {
                console.log(`发现牌 ${num} 超过4张，当前: ${countMap[num]}张`);
                return result;
            }
        }
        
        // 尝试不同的雀头
        for (const num in countMap) {
            if (countMap[num] >= 2) {
                // 找到雀头
                result.pair = [parseInt(num), parseInt(num)];
                result.pairIndex = tiles.findIndex(tile => tile.num === parseInt(num));
                // 从手牌中移除雀头
                const tempCounts = { ...countMap };
                tempCounts[num] -= 2; // 减去雀头的两张牌
                
                // 尝试找出4组面子
                const sets = [];
                if (this.findSets(tempCounts, sets, 4)) {
                    result.valid = true;
                    result.sets = sets;
                    return result;
                }
            }
        }
        
        return result;
    }
    
    // 检查所有可能的和牌形式（4组面子+1对雀头）
    protected checkAllStandardForms(tiles: Chess[]): StandardFormResult[] {
        // 存储所有可能的胡牌结构
        const results: StandardFormResult[] = [];
        
        // 获取牌的数字值并排序
        const nums = tiles.map(tile => tile.num).sort((a, b) => a - b);
        
        // 统计每种牌的数量
        const countMap: Record<number, number> = {};
        for (const num of nums) {
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否有牌超过4张
        for (const num in countMap) {
            if (countMap[num] > 4) {
                console.log(`发现牌 ${num} 超过4张，当前: ${countMap[num]}张`);
                return results;
            }
        }
        
        // 找出所有可能的雀头
        const possiblePairs = [];
        for (const num in countMap) {
            if (countMap[num] >= 2) {
                possiblePairs.push(parseInt(num));
            }
        }
        
        // 从大到小尝试不同的雀头
        possiblePairs.sort((a, b) => b - a);
        
        // 记录日志
        console.log("可能的雀头:", possiblePairs);
        
        for (const num of possiblePairs) {
            // 从手牌中移除雀头
            const tempCounts = { ...countMap };
            tempCounts[num] -= 2; // 减去雀头的两张牌
            
            // 记录日志
            console.log("尝试使用", num, "作为雀头");
            
            // 尝试找出所有可能的面子组合
            const allSets = this.findAllSets(tempCounts, 4);
            
            // 为每个找到的面子组合创建一个结果
            for (const sets of allSets) {
                const result = { 
                    valid: true, 
                    sets: sets, 
                    pair: [num, num], 
                    pairIndex: tiles.findIndex(tile => tile.num === num) 
                };
                results.push(result);
                console.log("成功找到和牌组合，雀头:", num, "面子:", sets);
            }
        }
        
        return results;
    }

    // 递归查找面子
    protected findSets(counts: {[key: string]: number}, sets: number[][], needed: number): boolean {
        if (needed === 0) return true;
        
        // 尝试找刻子
        for (const num in counts) {
            if (counts[num] >= 3) {
                // 找到一个刻子
                counts[num] -= 3;
                sets.push([parseInt(num), parseInt(num), parseInt(num)]);
                
                if (this.findSets(counts, sets, needed - 1)) {
                    return true;
                }
                
                // 回溯
                counts[num] += 3;
                sets.pop();
            }
        }
        
        // 尝试找顺子
        for (const num in counts) {
            const n = parseInt(num);
            // 检查是否为数牌（1-9, 10-18, 22-30），风牌和中发白不能构成顺子
            if (n >= 1 && n <= 9 || n >= 10 && n <= 18 || n >= 22 && n <= 30) {
                // 确保n+1和n+2也是数牌，并且在同一花色内
                const next1 = n + 1;
                const next2 = n + 2;
                
                // 检查是否在同一花色内
                const isSameSuit = (n1: number, n2: number): boolean => {
                    // 饼子：1-9
                    if (n1 >= 1 && n1 <= 9 && n2 >= 1 && n2 <= 9) return true;
                    // 条子：10-18
                    if (n1 >= 10 && n1 <= 18 && n2 >= 10 && n2 <= 18) return true;
                    // 万子：22-30
                    if (n1 >= 22 && n1 <= 30 && n2 >= 22 && n2 <= 30) return true;
                    return false;
                };
                
                if (counts[n] > 0 && counts[next1] > 0 && counts[next2] > 0 && 
                    isSameSuit(n, next1) && isSameSuit(next1, next2)) {
                    // 找到一个顺子
                    counts[n]--;
                    counts[next1]--;
                    counts[next2]--;
                    sets.push([n, next1, next2]);
                    
                    if (this.findSets(counts, sets, needed - 1)) {
                        return true;
                    }
                    
                    // 回溯
                    counts[n]++;
                    counts[next1]++;
                    counts[next2]++;
                    sets.pop();
                }
            }
        }
        
        return false;
    }

    // 递归查找所有可能的面子组合
    protected findAllSets(counts: Record<number, number>, needed: number): number[][][] {
        if (needed === 0) return [[]];
        
        const results: number[][][] = [];
        
        // 尝试找刻子
        for (const num in counts) {
            if (counts[num] >= 3) {
                // 找到一个刻子
                const newCounts = { ...counts };
                newCounts[num] -= 3;
                
                // 递归查找剩余的面子
                const subResults = this.findAllSets(newCounts, needed - 1);
                
                // 将当前刻子添加到所有子结果中
                for (const subResult of subResults) {
                    results.push([[parseInt(num), parseInt(num), parseInt(num)], ...subResult]);
                }
            }
        }
        
        // 尝试找顺子
        for (const num in counts) {
            const n = parseInt(num);
            // 检查是否为数牌（1-9, 10-18, 22-30），风牌和中发白不能构成顺子
            if (n >= 1 && n <= 9 || n >= 10 && n <= 18 || n >= 22 && n <= 30) {
                // 确保n+1和n+2也是数牌，并且在同一花色内
                const next1 = n + 1;
                const next2 = n + 2;
                
                // 检查是否在同一花色内
                const isSameSuit = (n1: number, n2: number): boolean => {
                    // 饼子：1-9
                    if (n1 >= 1 && n1 <= 9 && n2 >= 1 && n2 <= 9) return true;
                    // 条子：10-18
                    if (n1 >= 10 && n1 <= 18 && n2 >= 10 && n2 <= 18) return true;
                    // 万子：22-30
                    if (n1 >= 22 && n1 <= 30 && n2 >= 22 && n2 <= 30) return true;
                    return false;
                };
                
                if (counts[n] > 0 && counts[next1] > 0 && counts[next2] > 0 && 
                    isSameSuit(n, next1) && isSameSuit(next1, next2)) {
                    // 找到一个顺子
                    const newCounts = { ...counts };
                    newCounts[n]--;
                    newCounts[next1]--;
                    newCounts[next2]--;
                    
                    // 递归查找剩余的面子
                    const subResults = this.findAllSets(newCounts, needed - 1);
                    
                    // 将当前顺子添加到所有子结果中
                    for (const subResult of subResults) {
                        results.push([[n, next1, next2], ...subResult]);
                    }
                }
            }
        }
        
        return results;
    }
    
    // 检查是否是幺九牌或字牌
    protected isTerminalOrHonor(tile: number): boolean {
        return tile === 1 || tile === 9 || // 饼子的1和9
               tile === 10 || tile === 18 || // 条子的1和9
               tile === 22 || tile === 30 || // 万子的1和9
               (tile >= 31 && tile <= 34)|| //
               (tile >= 19 && tile <= 21); //
    }
    
    // 检查是否是字牌
    protected isHonor(tile: number): boolean {
        return tile >= 31 && tile <= 34;
    }
    
    // 检查是否是幺九牌
    protected isTerminal(tile: number): boolean {
        return tile === 1 || tile === 9 || // 饼子的1和9
               tile === 10 || tile === 18 || // 条子的1和9
               tile === 22 || tile === 30; // 万子的1和9
    }
    
    // 获取牌的花色
    protected getSuit(num: number): number {
        if (num >= 1 && num <= 9) return 0; // 饼子
        if (num >= 10 && num <= 18) return 1; // 条子
        if (num >= 22 && num <= 30) return 2; // 万子
        return -1; // 其他（字牌）
    }

    protected getValue(num: number): number {
        if (num >= 1 && num <= 9) return num; // 饼子
        if (num >= 10 && num <= 18) return num - 9; // 条子
        if (num >= 22 && num <= 30) return num - 21; // 万子
        return -1; // 其他（字牌）
    }

    // 检查是否是七对子
    protected checkChitoitsu(tiles: Chess[]): { valid: boolean } {
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            return { valid: false };
        }
        
        // 统计每种牌的数量
        const countMap = {};
        for (const tile of tiles) {
            const num = tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否每种牌都是2张
        for (const num in countMap) {
            if (countMap[num] !== 2) {
                return { valid: false };
            }
        }
        
        return { valid: true };
    }
}