import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ToitoiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查对对和役...");
        
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
        
        // 检查是否全部是刻子（没有顺子）
        for (const set of result.sets) {
            // 如果不是刻子（三张相同的牌）
            if (set[0] !== set[1] || set[1] !== set[2]) {
                console.log(`发现顺子 ${set}，不符合对对和要求`);
                return false;
            }
        }
        
        console.log("符合对对和役的要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 计算需要生成的刻子数量（每个刻子6张牌）
        const koutsuCount = Math.floor(count / 6);
        
        // 生成刻子
        for (let i = 0; i < koutsuCount; i++) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            
            // 生成刻子（6张相同的牌）
            for (let j = 0; j < 6; j++) {
                numArr.push(randomBaseNum + randomNum);
            }
        }
        
        // 生成剩余数量的牌（确保是偶数）
        const remainingCount = count - (koutsuCount * 6);
        if (remainingCount > 0) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            
            // 生成剩余数量的牌（确保是偶数）
            for (let i = 0; i < remainingCount; i++) {
                numArr.push(randomBaseNum + randomNum);
            }
        }
        
        return numArr;
    }
}