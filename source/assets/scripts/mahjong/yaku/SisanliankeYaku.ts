import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SisanliankeYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查四连刻役...");
        
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
            // 记录每种花色的刻子
            const keziMap: Record<number, Set<number>> = {
                0: new Set<number>(), // 饼子
                1: new Set<number>(), // 条子
                2: new Set<number>()  // 万子
            };
            
            // 遍历所有面子
            for (const set of result.sets) {
                // 检查这个面子是否为刻子（三张相同的牌）
                if (set.length === 3 && set[0] === set[1] && set[1] === set[2]) {
                    const num = set[0];
                    const suit = this.getSuit(num);
                    const value = this.getValue(num);
                    
                    // 只考虑数牌（饼子、条子、万子）
                    if (suit !== -1 && value !== -1) {
                        keziMap[suit].add(value);
                    }
                }
            }
            
            // 检查是否有某个花色包含4组连续数字的刻子
            for (const suit in keziMap) {
                const values = Array.from(keziMap[Number(suit)]).sort((a, b) => a - b);
                
                for (let i = 0; i <= values.length - 4; i++) {
                    if (values[i] + 1 === values[i + 1] && 
                        values[i + 1] + 1 === values[i + 2] && 
                        values[i + 2] + 1 === values[i + 3]) {
                        console.log(`找到四连刻：花色 ${suit} 的 ${values[i]}, ${values[i + 1]}, ${values[i + 2]}, ${values[i + 3]}`);
                        return true;
                    }
                }
            }
        }
        
        console.log("未找到四连刻");
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
        
        // 随机选择一个起始数字作为四连刻（1-6，确保可以形成四连刻）
        const startNum = 1 + Math.floor(Math.random() * 6);
        
        // 生成四组连续的刻子
        for (let i = 0; i < 4; i++) {
            const currentNum = startNum + i;
            // 每组刻子包含三张相同的牌
            for (let j = 0; j < 8; j++) {
                numArr.push(suit.base + currentNum);
            }
        }
        
        // 生成一对雀头（确保不会破坏四连刻）
        let pairNum;
        do {
            pairNum = 1 + Math.floor(Math.random() * 9);
        } while (pairNum >= startNum && pairNum <= startNum + 3);
        
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏四连刻）
        const remainingCount = count - 34; // 已经生成了14张牌（4个刻子12张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9），确保不会形成新的刻子
            let randomNum;
            do {
                randomNum = 1 + Math.floor(Math.random() * 9);
            } while (randomNum >= startNum && randomNum <= startNum + 3);
            
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 