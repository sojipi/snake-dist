import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class YakuhaiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查役牌役...");

        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        console.log(tiles);
        // 检查是否符合标准和牌形式
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }

        // 役牌：三元牌（白发中）和自风牌、场风牌的刻子
        // 这里简化处理，只要有任何风牌或三元牌的刻子就算役牌
        console.log(result);
        
        // 遍历所有面子
        for (const set of result.sets) {
            // 检查这个面子是否为刻子（三张相同的牌）
            if (set.length === 3 && set[0] === set[1] && set[1] === set[2]) {
                const num = set[0];
                
                // 风牌：东(31)、南(32)、西(33)、北(34)
                // 三元牌：中(19)、发(20)、白(21)
                if ((num >= 31 && num <= 34) || (num >= 19 && num <= 21)) {
                    console.log(`找到役牌刻子：${num}`);
                    return true;
                }
            }
        }

        console.log("未找到役牌刻子");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];

        // 役牌包括：风牌（东南西北）和三元牌（中发白）
        const yakuhaiTiles = [31, 32, 33, 34, 19, 20, 21]; // 东南西北中发白

        // 随机选择一个役牌作为刻子（生成6张，确保是偶数）
        const yakuhaiIndex = Math.floor(Math.random() * yakuhaiTiles.length);
        const yakuhaiNum = yakuhaiTiles[yakuhaiIndex];

        // 生成役牌的刻子（6张）
        for (let i = 0; i < 6; i++) {
            numArr.push(yakuhaiNum);
        }

        // 生成其他字牌（20%，确保是偶数）
        const ziPaiCount = Math.ceil(count * 0.2);
        const evenZiPaiCount = ziPaiCount % 2 === 0 ? ziPaiCount : ziPaiCount + 1;
        for (let i = 0; i < evenZiPaiCount; i++) {
            const randomIndex = Math.floor(Math.random() * yakuhaiTiles.length);
            numArr.push(yakuhaiTiles[randomIndex]);
        }

        // 生成数牌（确保是偶数）
        const remainingCount = count - 6 - evenZiPaiCount;
        const evenRemainingCount = remainingCount % 2 === 0 ? remainingCount : remainingCount + 1;
        for (let i = 0; i < evenRemainingCount; i++) {
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