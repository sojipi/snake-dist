import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class TanyaoYaku extends BaseYaku {
    // 生成断幺九所需的牌型
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 断幺九需要不包含幺九牌和字牌，只使用2-8的数字
        const middleTiles = [
            2, 3, 4, 5, 6, 7, 8,           // 饼子的2-8
            11, 12, 13, 14, 15, 16, 17,     // 条子的2-8
            23, 24, 25, 26, 27, 28, 29      // 万子的2-8
        ];
        
        // 随机生成count个中间数字的牌
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * middleTiles.length);
            numArr.push(middleTiles[randomIndex]);
        }
        
        return numArr;
    }
    check(tiles: Chess[]): boolean {
        console.log("检查断幺九役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否有字牌或幺九牌
        for (const tile of tiles) {
            // 字牌（31-34是东南西北）或幺九牌（1和9）
            if (this.isTerminalOrHonor(tile.num)) {
                console.log(`发现非法牌: ${tile.num}，不符合断幺九要求`);
                return false;
            }
        }
        
        // 检查是否符合标准和牌形式或七对子形式
        const standardResult = this.checkStandardForm(tiles);
        if (!standardResult.valid) {
            // 尝试检查七对子
            const chitoitsuResult = this.checkChitoitsu(tiles);
            if (!chitoitsuResult.valid) {
                console.log("不符合标准和牌形式或七对子形式");
                return false;
            }
        }
        
        console.log("符合断幺九役的要求");
        return true;
    }
    

}