import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class HeiyiSeYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查黑一色役...");
        
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
        
        // 检查是否只包含筒子的248和东南西北
        const validNumbers = new Set([2, 4, 8]); // 筒子的248
        const validWinds = new Set([31, 32, 33, 34]); // 东南西北
        
        // 遍历所有牌
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const num = tile.num;
            
            // 获取牌的数字和花色
            let value, suit;
            
            // 根据编号判断花色和数字
            if (num >= 1 && num <= 9) {
                // 饼子
                value = num;
                suit = 0;
            } else if (num >= 10 && num <= 18) {
                // 条子
                value = num - 9;
                suit = 1;
            } else if (num >= 22 && num <= 30) {
                // 万子
                value = num - 21;
                suit = 2;
            } else if (validWinds.has(num)) {
                // 东南西北
                continue;
            } else {
                // 其他字牌，不符合黑一色
                console.log(`包含其他字牌: ${num}`);
                return false;
            }
            
            // 检查是否为饼子
            if (suit !== 0) {
                console.log(`包含非饼子牌: 数字${value}, 花色${suit}`);
                return false;
            }
            
            // 检查是否为248
            if (!validNumbers.has(value)) {
                console.log(`包含非248的饼子: ${value}`);
                return false;
            }
        }
        
        console.log("符合黑一色役");
        return true;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 黑一色牌的ID
        const blackTiles = [2, 4, 8, 31, 32, 33, 34]; // 饼子2、4、8和东南西北
        
        // 其他花色的牌
        const otherTiles = [
            // 饼子
            [0, 1, 3, 5, 6, 7, 9],
            // 条子
            [10, 11, 12, 13, 14, 15, 16, 17, 18],
            // 万子
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            // 字牌
            [19, 20]
        ].flat();
        
        // 生成三组刻子（每组6张，因为要2个消除才有一个）
        for (let i = 0; i < 3; i++) {
            // 随机选择一个黑一色牌作为刻子
            const tile = blackTiles[Math.floor(Math.random() * blackTiles.length)];
            // 每张牌生成4个
            for (let j = 0; j < 4; j++) {
                numArr.push(tile);
            }
        }
        
        // 生成一对雀头（确保不会破坏黑一色）
        const pairTile = blackTiles[Math.floor(Math.random() * blackTiles.length)];
        // 每张牌生成4个
        for (let i = 0; i < 4; i++) {
            numArr.push(pairTile);
        }
        
        // 生成其他牌（50%黑一色牌，50%其他花色）
        const remainingCount = count - 16; // 已经生成了16张牌（3个刻子12张 + 1对雀头4张）
        for (let i = 0; i < remainingCount/2; i++) {
            // 50%概率生成黑一色牌，50%概率生成其他花色
            if (Math.random() < 0.5) {
                // 随机选择一个黑一色牌
                const tile = blackTiles[Math.floor(Math.random() * blackTiles.length)];
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