import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanliankeYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三连刻役...");
        
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
            
            // 记录每种花色的刻子
            const keziMap: Record<number, Set<number>> = {
                0: new Set<number>(), // 饼子
                1: new Set<number>(), // 条子
                2: new Set<number>()  // 万子
            };
            
            // 获取花色
            const getSuit = (num: number): number => {
                if (num >= 1 && num <= 9) return 0; // 饼子
                if (num >= 10 && num <= 18) return 1; // 条子
                if (num >= 22 && num <= 30) return 2; // 万子
                return -1; // 其他（字牌）
            };
            
            // 获取数字
            const getValue = (num: number): number => {
                if (num >= 1 && num <= 9) return num; // 饼子
                if (num >= 10 && num <= 18) return num - 9; // 条子
                if (num >= 22 && num <= 30) return num - 21; // 万子
                return -1; // 其他（字牌）
            };
            
            // 遍历所有面子
            for (const set of result.sets) {
                // 检查这个面子是否为刻子（三张相同的牌）
                if (set.length === 3 && set[0] === set[1] && set[1] === set[2]) {
                    const suit = getSuit(set[0]);
                    const value = getValue(set[0]);
                    
                    // 只考虑数牌（饼子、条子、万子）
                    if (suit !== -1 && value !== -1) {
                        keziMap[suit].add(value);
                    }
                }
            }
            
            // 检查是否有某个花色包含3组连续数字的刻子
            for (const suit in keziMap) {
                const values = Array.from(keziMap[Number(suit)]).sort((a, b) => a - b);
                
                for (let i = 0; i <= values.length - 3; i++) {
                    if (values[i] + 1 === values[i + 1] && values[i + 1] + 1 === values[i + 2]) {
                        console.log(`找到三连刻：花色 ${suit} 的 ${values[i]}, ${values[i + 1]}, ${values[i + 2]}`);
                        return true;
                    }
                }
            }
        }
        
        console.log("未找到三连刻");
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
        
        // 随机选择三个连续的数字作为刻子（1-7，确保可以形成三连刻）
        const startNum = 1 + Math.floor(Math.random() * 7);
        
        // 生成三组刻子（每组三张相同的牌）
        for (let i = 0; i < 3; i++) {
            const num = startNum + i;
            for (let j = 0; j < 3; j++) {
                numArr.push(suit.base + num);
                numArr.push(suit.base + num);
                numArr.push(suit.base + num);

            }
        }
        
        // 生成一对雀头（确保不会破坏三连刻）
        let pairNum;
        do {
            pairNum = 1 + Math.floor(Math.random() * 9);
        } while (pairNum >= startNum && pairNum <= startNum + 2);
        
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏三连刻）
        const remainingCount = count - 29; // 已经生成了11张牌（3个刻子9张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9），确保不会形成新的刻子
            let randomNum;
            do {
                randomNum = 1 + Math.floor(Math.random() * 9);
            } while (randomNum >= startNum && randomNum <= startNum + 2);
            
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 