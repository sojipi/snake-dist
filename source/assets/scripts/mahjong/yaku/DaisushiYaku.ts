import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class DaisushiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查大四喜役...");
        
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
        
        // 大四喜：包含东、南、西、北四种风牌的刻子或杠子
        
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
        
        // 检查是否每种风牌都有至少3张
        for (const wind in windCounts) {
            if (windCounts[wind] < 3) {
                console.log(`风牌${wind}数量不足3张，当前: ${windCounts[wind]}张`);
                return false;
            }
        }
        
        console.log("符合大四喜要求");
        return true;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 大四喜必须包含四种风牌的刻子
        const windTiles = [31, 32, 33, 34]; // 东南西北
        
        // 其他花色的牌
        const otherTiles = [
            // 饼子
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            // 条子
            [10, 11, 12, 13, 14, 15, 16, 17, 18],
            // 万子
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            // 字牌
            [19, 20, 35, 36, 37]
        ].flat();
        
        // 添加四种风牌的刻子（每组6张，因为要2个消除才有一个）
        for (const tile of windTiles) {
            // 每张牌生成4个
            for (let i = 0; i < 6; i++) {
                numArr.push(tile);
            }
        }
        
        // 生成一对雀头（确保不会破坏大四喜）
        const pairTile = otherTiles[Math.floor(Math.random() * otherTiles.length)];
        // 每张牌生成4个
        for (let i = 0; i < 4; i++) {
            numArr.push(pairTile);
        }
        
        // 生成其他牌（30%风牌，70%其他花色）
        const remainingCount = count - 28; // 已经生成了20张牌（4个刻子16张 + 1对雀头4张）
        for (let i = 0; i < remainingCount/2; i++) {
            // 30%概率生成风牌，70%概率生成其他花色
            if (Math.random() < 0.3) {
                // 随机选择一个风牌
                const tile = windTiles[Math.floor(Math.random() * windTiles.length)];
                // 每张牌生成2个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            } else {
                // 随机选择一个其他花色
                const tile = otherTiles[Math.floor(Math.random() * otherTiles.length)];
                // 每张牌生成2个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            }
        }
        
        return numArr;
    }
}