import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanshokuKokuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三色国士役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 三色国士不使用标准和牌形式检查，它是特殊和牌形式
        
        // 三色国士：包含三种花色的1和9，以及所有字牌，且其中一种有对子
        
        // 统计每种牌的数量
        const countMap = {};
        
        // 需要检查的牌
        const requiredTiles = [
            1, 9,     // 饼子的1和9
            10, 18,   // 条子的1和9
            19, 27,   // 万子的1和9
            31, 32, 33, 34, 35, 36, 37 // 所有字牌
        ];
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否包含所有必要的牌
        for (const num of requiredTiles) {
            if (!countMap[num] || countMap[num] < 1) {
                console.log(`缺少牌: ${num}`);
                return false;
            }
        }
        
        // 检查是否有一种牌有对子
        let hasPair = false;
        for (const num of requiredTiles) {
            if (countMap[num] >= 2) {
                hasPair = true;
                break;
            }
        }
        
        if (!hasPair) {
            console.log("没有找到对子");
            return false;
        }
        
        // 检查总牌数是否为14
        let totalCount = 0;
        for (const num in countMap) {
            totalCount += countMap[num];
        }
        
        if (totalCount !== 14) {
            console.log(`总牌数不为14，当前: ${totalCount}`);
            return false;
        }
        
        console.log("符合三色国士要求");
        return true;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一个数字（1-9）
        const selectedNum = 1 + Math.floor(Math.random() * 9);
        
        // 生成三色同刻（每种花色6张，共18张）
        const suits = [0, 9, 21]; // 饼子、条子、万子的起始数字
        for (const suit of suits) {
            for (let i = 0; i < 6; i++) {
                numArr.push(suit + selectedNum);
            }
        }
        
        // 生成其他牌（确保不会破坏三色同刻）
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