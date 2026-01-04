import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanshokuDoujunYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三色同顺役...");
        
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
            
            // 检查是否有某个数字在三种花色中都有顺子
            for (let i = 1; i <= 7; i++) { // 顺子的起始数字最大为7
                if (shunziMap[0].has(i) && shunziMap[1].has(i) && shunziMap[2].has(i)) {
                    console.log(`找到三色同顺：${i}${i+1}${i+2}`);
                    return true;
                }
            }
        }
        
        console.log("未找到三色同顺");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 生成三色通贯的顺子（123、456、789，每种花色9张，共27张）
        const suits = [0, 9, 21]; // 饼子、条子、万子的起始数字
        const sequences = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        
        for (const suit of suits) {
            for (const seq of sequences) {
                for (const num of seq) {
                    numArr.push(suit + num);
                }
            }
        }
        
        // 生成其他牌（确保不会破坏三色通贯）
        const remainingCount = count - 27;
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomBaseNum + randomNum);
        }
        
        return numArr;
    }
} 