import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SuankoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查四暗刻役...");
        
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
        
        // 四暗刻：四组刻子和一对雀头
        
        // 统计每种牌的数量
        const countMap = {};
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 计算刻子数量
        let keziCount = 0;
        let pairCount = 0;
        
        for (const num in countMap) {
            if (countMap[num] >= 3) {
                keziCount++;
                // 如果有4张相同的牌，算作一个刻子和一个雀头
                if (countMap[num] === 4) {
                    pairCount++;
                }
            } else if (countMap[num] === 2) {
                pairCount++;
            }
        }
        
        // 四暗刻：四组刻子和一对雀头
        if (keziCount === 4 && pairCount >= 1) {
            console.log("符合四暗刻要求");
            return true;
        }
        
        console.log(`不符合四暗刻要求，刻子数: ${keziCount}，对子数: ${pairCount}`);
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 所有可用的牌
        const allTiles = [
            // 饼子
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            // 条子
            [10, 11, 12, 13, 14, 15, 16, 17, 18],
            // 万子
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            // 字牌
            [19, 20, 31, 32, 33, 34, 35, 36, 37]
        ].flat();
        
        // 随机选择四种不同的牌作为刻子
        const selectedTiles = [];
        for (let i = 0; i < 4; i++) {
            let tile;
            do {
                tile = allTiles[Math.floor(Math.random() * allTiles.length)];
            } while (selectedTiles.includes(tile));
            selectedTiles.push(tile);
        }
        
        // 生成四组刻子（每组6张，因为要2个消除才有一个）
        for (const tile of selectedTiles) {
            // 每张牌生成6个
            for (let i = 0; i < 8; i++) {
                numArr.push(tile);
            }
        }
        
        // 生成一对雀头（确保不会破坏四暗刻）
        let pairTile;
        do {
            pairTile = allTiles[Math.floor(Math.random() * allTiles.length)];
        } while (selectedTiles.includes(pairTile));
        
        // 每张牌生成4个
        for (let i = 0; i < 4; i++) {
            numArr.push(pairTile);
        }
        
        // 生成其他牌（40%刻子牌，60%其他牌）
        const remainingCount = count - 36; // 已经生成了28张牌（4个刻子24张 + 1对雀头4张）
        for (let i = 0; i < remainingCount/2; i++) {
            // 40%概率生成刻子牌，60%概率生成其他牌
            if (Math.random() < 0.4) {
                // 随机选择一个刻子牌
                const tile = selectedTiles[Math.floor(Math.random() * selectedTiles.length)];
                // 每张牌生成2个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            } else {
                // 随机选择一个其他牌
                let tile;
                do {
                    tile = allTiles[Math.floor(Math.random() * allTiles.length)];
                } while (selectedTiles.includes(tile) || tile === pairTile);
                // 每张牌生成2个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            }
        }
        
        return numArr;
    }
} 