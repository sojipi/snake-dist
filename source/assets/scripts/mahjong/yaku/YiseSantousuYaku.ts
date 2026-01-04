import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class YiseSantousuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查一色三同顺役...");
        
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
            const shunziMap: Record<number, Record<number, number>> = {
                0: {}, // 饼子
                1: {}, // 条子
                2: {}  // 万子
            };
            
            // 遍历面子组合
            for (const set of result.sets) {
                // 检查是否为顺子
                if (set[0] + 1 === set[1] && set[1] + 1 === set[2]) {
                    const suit = this.getSuit(set[0]);
                    const value = this.getValue(set[0]);
                    
                    // 记录该顺子的起始数字
                    if (!shunziMap[suit][value]) {
                        shunziMap[suit][value] = 0;
                    }
                    shunziMap[suit][value]++;
                }
            }
            
            // 检查是否有某个花色中有3组相同的顺子
            for (const suit in shunziMap) {
                const suitNum = Number(suit);
                for (const minValue in shunziMap[suitNum]) {
                    const value = Number(minValue);
                    if (shunziMap[suitNum][value] >= 3) {
                        console.log(`找到一色三同顺：花色 ${suit} 的 ${value}${value + 1}${value + 2} 顺子出现了 ${shunziMap[suitNum][value]} 次`);
                        return true;
                    }
                }
            }
        }
        
        console.log("未找到一色三同顺");
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
        
        // 随机选择一个花色
        const suit = suits[Math.floor(Math.random() * 3)];
        
        // 随机选择一个起始数字作为顺子（1-7，确保可以形成顺子）
        const startNum = 1 + Math.floor(Math.random() * 7);
        
        // 生成三组相同的顺子
        for (let i = 0; i < 3; i++) {
            // 每组顺子包含三张连续的牌
            for (let j = 0; j < 3; j++) {
                numArr.push(suit.base + (startNum + j));
                numArr.push(suit.base + (startNum + j));
                numArr.push(suit.base + (startNum + j));

            }
        }
        
        // 生成一对雀头（确保不会破坏一色三同顺）
        let pairNum;
        do {
            pairNum = 1 + Math.floor(Math.random() * 9);
        } while (pairNum >= startNum && pairNum <= startNum + 2);
        
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏一色三同顺）
        const remainingCount = count - 29; // 已经生成了11张牌（3个顺子9张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9），确保不会形成新的顺子
            let randomNum;
            do {
                randomNum = 1 + Math.floor(Math.random() * 9);
            } while (randomNum >= startNum && randomNum <= startNum + 2);
            
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 