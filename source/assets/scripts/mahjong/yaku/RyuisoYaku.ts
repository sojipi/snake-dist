import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class RyuisoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查绿一色役...");
        
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
        
        // 绿一色：所有牌都是绿色的牌，包括索子的2、3、4、6、8和发
        
        // 绿色牌的ID
        const greenTiles = [11, 12, 13, 15, 17, 20]; // 条子2、3、4、6、8和发
        
        for (const tile of tiles) {
            const num = tile.num;
            
            // 检查是否为绿色牌
            if (!greenTiles.includes(num)) {
                console.log(`发现非绿色牌: ${num}`);
                return false;
            }
        }
        
        console.log("所有牌都是绿色牌，符合绿一色要求");
        return true;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 绿色牌的ID
        const greenTiles = [11, 12, 13, 15, 17, 20]; // 条子2、3、4、6、8和发
        
        // 其他花色的牌
        const otherTiles = [
            // 饼子
            [0, 1, 2, 3, 4, 5, 6, 7, 8],
            // 条子
            [9, 10, 14, 16, 18],
            // 万子
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            // 字牌
            [19, 31, 32, 33, 34]
        ].flat();
        
        // 生成三组刻子（每组6张，因为要2个消除才有一个）
        for (let i = 0; i < 3; i++) {
            // 随机选择一个绿色牌作为刻子
            const tile = greenTiles[Math.floor(Math.random() * greenTiles.length)];
            // 每张牌生成4个
            for (let j = 0; j < 4; j++) {
                numArr.push(tile);
            }
        }
        
        // 生成一对雀头（确保不会破坏绿一色）
        const pairTile = greenTiles[Math.floor(Math.random() * greenTiles.length)];
        // 每张牌生成4个
        for (let i = 0; i < 4; i++) {
            numArr.push(pairTile);
        }
        
        // 生成其他牌（70%绿色牌，30%其他花色）
        const remainingCount = count - 16; // 已经生成了16张牌（3个刻子12张 + 1对雀头4张）
        for (let i = 0; i < remainingCount/2; i++) {
            // 70%概率生成绿色牌，30%概率生成其他花色
            if (Math.random() < 0.5) {
                // 随机选择一个绿色牌
                const tile = greenTiles[Math.floor(Math.random() * greenTiles.length)];
                // 每张牌生成4个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            } else {
                // 随机选择一个其他花色
                const tile = otherTiles[Math.floor(Math.random() * otherTiles.length)];
                // 每张牌生成4个
                for (let j = 0; j < 2; j++) {
                    numArr.push(tile);
                }
            }
        }
        
        return numArr;
    }
} 