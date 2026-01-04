import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class HonrotoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查混老头役...");

        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }

        // 检查是否全部是幺九牌或字牌
        for (const tile of tiles) {
            if (!this.isTerminalOrHonor(tile.num)) {
                console.log(`发现非幺九牌或字牌: ${tile.num}，不符合混老头要求`);
                return false;
            }
        }

        // 检查是否符合标准和牌形式或七对子形式
        const standardResult = this.checkStandardForm(tiles);
        if (!standardResult.valid) {
            // 尝试检查七对子
            const chitoitsuResult = this.checkChitoitsu(tiles);
            if (!chitoitsuResult) {
                console.log("不符合标准和牌形式或七对子形式");
                return false;
            }
        }

        console.log("符合混老头役的要求");
        return true;
    }



    generateTiles(count: number): number[] {
        const numArr: number[] = [];

        // 混老头只能使用幺九牌和字牌
        const validNumbers = [
            // 幺九牌
            1, 9,      // 饼子的1和9
            10, 18,    // 条子的1和9
            22, 30,    // 万子的1和9
            // 字牌
            31, 32, 33, 34, 19, 20, 21  // 东南西北中发白
        ];

        // 计算需要生成的对子数量（每个对子2张牌）
        const pairCount = Math.floor(count / 2);

        // 生成对子
        for (let i = 0; i < pairCount; i++) {
            // 随机选择一个幺九牌或字牌
            const randomIndex = Math.floor(Math.random() * validNumbers.length);
            const tileNum = validNumbers[randomIndex];

            // 生成对子（2张相同的牌）
            for (let j = 0; j < 2; j++) {
                numArr.push(tileNum);
            }
        }

        // 生成剩余数量的牌（确保是偶数）
        const remainingCount = count - (pairCount * 2);
        if (remainingCount > 0) {
            // 随机选择一个幺九牌或字牌
            const randomIndex = Math.floor(Math.random() * validNumbers.length);
            const tileNum = validNumbers[randomIndex];

            // 生成剩余数量的牌（确保是偶数）
            for (let i = 0; i < remainingCount; i++) {
                numArr.push(tileNum);
            }
        }

        return numArr;
    }
}