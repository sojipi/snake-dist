import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class HonitsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查混一色役...");

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

        // 混一色：所有数牌都是同一种花色，且有字牌

        // 统计每种花色的数量
        let suitCounts = [0, 0, 0]; // 饼子、条子、万子
        let ziPaiCount = 0; // 字牌（东南西北中发白）

        for (const tile of tiles) {
            const num = tile.id || tile.num;

            // 字牌：东南西北中发白
            if ((num >= 31 && num <= 34) || (num >= 19 && num <= 21)) {
                ziPaiCount++;
            }
            // 数牌
            else {
                const suit = Math.floor(num / 10);
                if (suit >= 0 && suit <= 2) {
                    suitCounts[suit]++;
                }
            }
        }

        // 检查是否只有一种花色的数牌
        let numSuitCount = 0;
        for (const count of suitCounts) {
            if (count > 0) {
                numSuitCount++;
            }
        }

        // 混一色：只有一种花色的数牌，且有字牌（包括三元牌）
        if (numSuitCount === 1 && ziPaiCount > 0) {
            console.log("符合混一色要求");
            return true;
        }

        console.log(`不符合混一色要求，数牌花色数: ${numSuitCount}，字牌数: ${ziPaiCount}`);
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];

        // 随机选择一种花色作为主花色
        const mainSuit = Math.floor(Math.random() * 3); // 0:饼子, 1:条子, 2:万子
        const baseNum = mainSuit === 0 ? 0 : (mainSuit === 1 ? 9 : 21);

        // 字牌
        const honorTiles = [31, 32, 33, 34, 19, 20, 21];  // 东南西北中发白

        // 生成主花色的牌（1-9）
        for (let i = 1; i <= 9; i++) {
            const count = Math.ceil(count * 0.6 / 9); // 60%的牌是主花色
            for (let j = 0; j < count && numArr.length < count * 0.6; j++) {
                numArr.push(baseNum + i);
            }
        }

        // 生成字牌（40%）
        const honorCount = Math.ceil(count * 0.4);
        for (let i = 0; i < honorCount; i++) {
            const randomIndex = Math.floor(Math.random() * honorTiles.length);
            numArr.push(honorTiles[randomIndex]);
        }

        // 如果牌数不够，补充主花色的牌
        while (numArr.length < count) {
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(baseNum + randomNum);
        }

        return numArr;
    }
} 