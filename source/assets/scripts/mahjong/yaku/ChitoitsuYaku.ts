import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChitoitsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查七对子役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 获取牌的数字值
        const nums = tiles.map(tile => tile.num);
        
        // 统计每种牌的数量
        const countMap = {};
        for (const num of nums) {
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否有7个对子，且每个对子都是2张牌
        const pairs = Object.entries(countMap);
        if (pairs.length !== 7) {
            console.log(`不是7个不同的对子，实际有${pairs.length}种牌`);
            return false;
        }
        
        for (const [num, count] of pairs) {
            if (count !== 2) {
                console.log(`牌 ${num} 的数量不是2张，而是${count}张`);
                return false;
            }
        }
        
        console.log("符合七对子役的要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 计算需要生成的对子数量（每个对子2张牌）
        const pairCount = Math.floor(count / 2);
        
        // 生成对子
        for (let i = 0; i < pairCount; i++) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            
            // 生成对子（2张相同的牌）
            for (let j = 0; j < 2; j++) {
                numArr.push(randomBaseNum + randomNum);
            }
        }
        
        // 生成剩余数量的牌（确保是偶数）
        const remainingCount = count - (pairCount * 2);
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