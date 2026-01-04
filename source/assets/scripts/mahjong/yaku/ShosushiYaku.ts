import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ShosushiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查小四喜役...");
        
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
        
        // 小四喜：包含三种风牌的刻子或杠子，以及剩下一种风牌的对子
        
        // 统计风牌的数量
        const windCounts = {
            31: 0, // 东
            32: 0, // 南
            33: 0, // 西
            34: 0  // 北
        };
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            if (num >= 31 && num <= 34) {
                windCounts[num]++;
            }
        }
        
        // 检查是否有三种风牌都有至少3张，且剩下一种有2张
        let keziCount = 0;
        let pairCount = 0;
        
        for (const wind in windCounts) {
            if (windCounts[wind] >= 3) {
                keziCount++;
            } else if (windCounts[wind] === 2) {
                pairCount++;
            }
        }
        
        if (keziCount === 3 && pairCount === 1) {
            console.log("符合小四喜要求");
            return true;
        }
        
        console.log(`不符合小四喜要求，刻子数: ${keziCount}，对子数: ${pairCount}`);
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义风牌
        const windTiles = [31, 32, 33, 34]; // 东南西北
        
        // 随机选择三种风牌作为刻子
        const keziTiles = [...windTiles];
        const kezi1 = keziTiles.splice(Math.floor(Math.random() * keziTiles.length), 1)[0];
        const kezi2 = keziTiles.splice(Math.floor(Math.random() * keziTiles.length), 1)[0];
        const kezi3 = keziTiles.splice(Math.floor(Math.random() * keziTiles.length), 1)[0];
        
        // 生成三组风牌的刻子（每组6张，因为要2个消除才有一个）
        for (let i = 0; i < 10; i++) {
            numArr.push(kezi1);
        }
        for (let i = 0; i < 10; i++) {
            numArr.push(kezi2);
        }
        for (let i = 0; i < 10; i++) {
            numArr.push(kezi3);
        }
        
        // 生成一对雀头（使用剩余的风牌，每组4张）
        const toitsuTile = keziTiles[0];
        for (let i = 0; i < 8; i++) {
            numArr.push(toitsuTile);
        }
        
        // 生成其他牌（确保不会破坏小四喜）
        const remainingCount = count - 38; // 已经生成了22张牌（3个刻子18张 + 1对雀头4张）
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            // 随机选择数字（1-9）
            const num = 1 + Math.floor(Math.random() * 9);
            // 每张牌生成2个
            numArr.push(randomSuit.base + num);
            numArr.push(randomSuit.base + num);
        }
        
        return numArr;
    }
} 