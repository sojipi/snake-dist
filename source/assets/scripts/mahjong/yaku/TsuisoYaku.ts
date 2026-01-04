import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class TsuisoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查字一色役...");
        
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
        
        // 字一色：所有牌都是字牌（风牌和三元牌）
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            
            // 检查是否为字牌 19-21 31-34
            if (num < 19 || num > 34||(num > 21 && num < 31)) {
                console.log(`发现非字牌: ${num}`);
                return false;
            }
        }
        
        console.log("所有牌都是字牌，符合字一色要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义字牌和花色牌
        const honorTiles = [31, 32, 33, 34, 19, 20, 21]; // 东南西北中发白
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        // 生成字牌（70%概率）
        const honorCount = Math.floor(count * 0.7);
        for (let i = 0; i < honorCount; i++) {
            const randomIndex = Math.floor(Math.random() * honorTiles.length);
            numArr.push(honorTiles[randomIndex]);
        }
        
        // 生成花色牌（30%概率）
        const remainingCount = count - honorCount;
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const suit = suits[Math.floor(Math.random() * 3)];
            // 随机选择数字（1-9）
            const num = 1 + Math.floor(Math.random() * 9);
            numArr.push(suit.base + num);
        }
        
        return numArr;
    }
}