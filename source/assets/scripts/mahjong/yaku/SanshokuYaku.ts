import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanshokuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三色同顺役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否符合标准和牌形式
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 获取所有顺子
        const sequences = result.sets.filter(set => set[0] !== set[1] || set[1] !== set[2]);
        
        // 按照顺子的第一个数字分组（考虑实际数值而非牌号）
        const sequencesByNumber = {};
        for (const seq of sequences) {
            // 获取顺子的实际数值（1-9）
            let firstNum;
            if (seq[0] >= 1 && seq[0] <= 9) {
                firstNum = seq[0]; // 饼子
            } else if (seq[0] >= 10 && seq[0] <= 18) {
                firstNum = seq[0] - 9; // 条子
            } else if (seq[0] >= 22 && seq[0] <= 30) {
                firstNum = seq[0] - 21; // 万子
            } else {
                continue; // 跳过字牌
            }
            
            sequencesByNumber[firstNum] = sequencesByNumber[firstNum] || [];
            sequencesByNumber[firstNum].push(seq);
        }
        
        // 检查是否有三种花色的相同数字顺子
        for (const num in sequencesByNumber) {
            if (sequencesByNumber[num].length >= 3) {
                // 检查是否有三种不同花色
                const suits = new Set();
                for (const seq of sequencesByNumber[num]) {
                    if (seq[0] >= 1 && seq[0] <= 9) {
                        suits.add('pin');
                    } else if (seq[0] >= 10 && seq[0] <= 18) {
                        suits.add('sou');
                    } else if (seq[0] >= 22 && seq[0] <= 30) {
                        suits.add('wan');
                    }
                }
                
                if (suits.size === 3) {
                    console.log("符合三色同顺要求");
                    return true;
                }
            }
        }
        
        console.log("不符合三色同顺要求");
        return false;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一个起始数字（1-7，确保能形成顺子）
        const startNum = 1 + Math.floor(Math.random() * 7);
        
        // 生成三色同顺（每种花色3张，共9张）
        const suits = [0, 9, 21]; // 饼子、条子、万子的起始数字
        for (const suit of suits) {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 4; j++) {
                    numArr.push(suit + startNum + i);
                }
            }
        }
        
        // 生成其他牌（确保不会破坏三色同顺）
        const remainingCount = count - 36;
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