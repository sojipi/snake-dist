import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class IpekoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查一杯口役...");

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

        // 检查是否有两组完全相同的顺子
        const sequences = result.sets.filter(set => set[0] !== set[1] || set[1] !== set[2]);

        // 转换顺子为字符串，便于比较
        const sequenceStrings = sequences.map(seq => seq.join(','));

        // 检查是否有重复的顺子
        const uniqueSequences = new Set(sequenceStrings);
        if (sequenceStrings.length - uniqueSequences.size >= 1) {
            console.log("发现一对相同的顺子，符合一杯口要求");
            return true;
        }

        console.log("没有找到一对相同的顺子，不符合一杯口要求");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];

        // 随机选择一种花色
        const suit = Math.floor(Math.random() * 3); // 0:饼子, 1:条子, 2:万子
        const baseNum = suit === 0 ? 0 : (suit === 1 ? 9 : 21);

        // 生成一对相同的顺子（6张牌）
        const startNum = 1 + Math.floor(Math.random() * 7); // 1-7，确保能形成顺子
        for (let i = 0; i < 4; i++) { // 生成两遍相同的顺子
            for (let j = 0; j < 3; j++) {
                numArr.push(baseNum + startNum + j);
            }
        }

        // 生成其他牌（确保不会破坏一杯口）
        const remainingCount = count - 12;
        for (let i = 0; i < remainingCount; i++) {
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