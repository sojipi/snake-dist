import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanseitsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三色通贯役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 获取所有可能的和牌形式
        const results = this.checkAllStandardForms(tiles);
        if (results.length === 0) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 遍历所有可能的和牌形式
        for (const result of results) {
            // 创建不包含雀头的牌组
            const remainingTiles = tiles.filter((_, index) => 
                index !== result.pairIndex && index !== result.pairIndex + 1);
            
            // 记录每种花色的顺子
            const shunziMap = {
                0: new Set(), // 饼子
                1: new Set(), // 条子
                2: new Set()  // 万子
            };
            
            // 遍历所有面子
            for (const set of result.sets) {
                // 检查这个面子是否为顺子（三张连续的牌）
                if (set.length === 3) {
                    const num1 = set[0];
                    const num2 = set[1];
                    const num3 = set[2];
                    
                    // 获取花色和数字
                    let suit1, value1, suit2, value2, suit3, value3;
                    
                    // 判断花色和数字
                    if (num1 <= 9) { // 饼子
                        suit1 = 0;
                        value1 = num1;
                    } else if (num1 <= 18) { // 条子
                        suit1 = 1;
                        value1 = num1 - 9;
                    } else if (num1 <= 30) { // 万子
                        suit1 = 2;
                        value1 = num1 - 21;
                    } else {
                        continue; // 跳过字牌
                    }
                    
                    if (num2 <= 9) {
                        suit2 = 0;
                        value2 = num2;
                    } else if (num2 <= 18) {
                        suit2 = 1;
                        value2 = num2 - 9;
                    } else if (num2 <= 30) {
                        suit2 = 2;
                        value2 = num2 - 21;
                    } else {
                        continue;
                    }
                    
                    if (num3 <= 9) {
                        suit3 = 0;
                        value3 = num3;
                    } else if (num3 <= 18) {
                        suit3 = 1;
                        value3 = num3 - 9;
                    } else if (num3 <= 30) {
                        suit3 = 2;
                        value3 = num3 - 21;
                    } else {
                        continue;
                    }
                    
                    // 如果是顺子（三张连续的牌）且花色相同
                    if (suit1 === suit2 && suit2 === suit3 && 
                        ((value1 + 1 === value2 && value2 + 1 === value3) || 
                         (value3 + 1 === value2 && value2 + 1 === value1))) {
                        
                        // 记录该顺子的起始数字
                        const minValue = Math.min(value1, value2, value3);
                        shunziMap[suit1].add(minValue);
                    }
                }
            }
            
            // 检查是否有123、456、789顺子
            const requiredSequences = [1, 4, 7]; // 123、456、789的起始数字
            
            // 尝试所有可能的组合
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (i === j) continue;
                    for (let k = 0; k < 3; k++) {
                        if (k === i || k === j) continue;
                        
                        // 检查是否有一种花色有123，一种花色有456，一种花色有789
                        if (shunziMap[i].has(requiredSequences[0]) && 
                            shunziMap[j].has(requiredSequences[1]) && 
                            shunziMap[k].has(requiredSequences[2])) {
                            console.log(`找到三色同贯：花色${i}有123，花色${j}有456，花色${k}有789`);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log("未找到三色同贯");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义三种花色和对应的基础数字
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        // 定义三种顺子
        const sequences = [
            [1, 2, 3],  // 123
            [4, 5, 6],  // 456
            [7, 8, 9]   // 789
        ];
        
        // 随机分配顺子到不同花色
        const shuffledSuits = [...suits].sort(() => Math.random() - 0.5);
        
        // 为每种花色生成一个顺子
        for (let i = 0; i < 3; i++) {
            const suit = shuffledSuits[i];
            const sequence = sequences[i];
            
            // 添加顺子的三张牌
            for (const num of sequence) {
                numArr.push(suit.base + num);
                numArr.push(suit.base + num);
            }
        }
        
        // 生成其他牌（确保不会破坏三色同贯）
        const remainingCount = count - 18; // 已经生成了9张牌（3个顺子）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 