import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class HongyiDianYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查红一点役...");

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

        // 检查是否包含中
        let hasZhong = false;

        // 检查是否只包含条子的23468
        const validNumbers = new Set([2, 3, 4, 6, 8]);
        const validSuits = new Set([1]); // 1表示条子

        // 遍历所有牌
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const num = tile.num;

            // 检查是否为中
            if (num === 19) {
                hasZhong = true;
                continue;
            }

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
            } else {
                // 其他字牌，不符合红一点
                console.log(`包含其他字牌: ${num}`);
                return false;
            }

            // 检查是否为条子
            if (suit !== 1) {
                console.log(`包含非条子牌: 数字${value}, 花色${suit}`);
                return false;
            }

            // 检查是否为23468
            if (!validNumbers.has(value)) {
                console.log(`包含非23468的条子: ${value}`);
                return false;
            }
        }

        // 必须包含中
        if (!hasZhong) {
            console.log("不包含中");
            return false;
        }

        console.log("符合红一点役");
        return true;
    }
} 