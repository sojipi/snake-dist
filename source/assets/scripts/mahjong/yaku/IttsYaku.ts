import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class IttsYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查一气通贯役...");
        
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
            // 获取花色和数字
            const getSuit = (num: number): number => {
                if (num >= 1 && num <= 9) return 0; // 饼子
                if (num >= 10 && num <= 18) return 1; // 条子
                if (num >= 22 && num <= 30) return 2; // 万子
                return -1; // 其他（字牌）
            };
            
            const getValue = (num: number): number => {
                if (num >= 1 && num <= 9) return num; // 饼子
                if (num >= 10 && num <= 18) return num - 9; // 条子
                if (num >= 22 && num <= 30) return num - 21; // 万子
                return -1; // 其他（字牌）
            };
            
            // 记录每种花色的顺子
            const shunziMap = {
                0: new Set(), // 饼子
                1: new Set(), // 条子
                2: new Set()  // 万子
            };
            
            // 遍历面子组合
            for (const set of result.sets) {
                // 检查是否为顺子
                if (set[0] + 1 === set[1] && set[1] + 1 === set[2]) {
                    const suit = getSuit(set[0]);
                    const value = getValue(set[0]);
                    
                    // 记录该顺子的起始数字
                    shunziMap[suit].add(value);
                    console.log(`找到顺子：花色 ${suit}，起始数字 ${value}`);
                }
            }
            
            // 检查是否有某个花色包含123、456、789三组顺子
            for (const suit in shunziMap) {
                if (shunziMap[suit].has(1) && shunziMap[suit].has(4) && shunziMap[suit].has(7)) {
                    console.log(`找到一气通贯：花色 ${suit} 包含123、456、789三组顺子`);
                    return true;
                }
            }
        }
        
        console.log("未找到一气通贯");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一种花色
        const suit = Math.floor(Math.random() * 3); // 0:饼子, 1:条子, 2:万子
        const baseNum = suit === 0 ? 0 : (suit === 1 ? 9 : 21);
        
        // 生成一气通贯的顺子（123、456、789，共9张）
        const sequences = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        
        for (const seq of sequences) {
            for (const num of seq) {
                numArr.push(baseNum + num);
                numArr.push(baseNum + num);
            }
        }
        
        // 生成其他牌（确保不会破坏一气通贯）
        const remainingCount = count - 18;
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