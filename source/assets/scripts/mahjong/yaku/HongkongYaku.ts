import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class HongkongYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查红孔雀役...");

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

        // 检查是否只包含条子的1579
        const validNumbers = new Set([1, 5, 7, 9]);
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
                // 其他字牌，不符合红孔雀
                console.log(`包含其他字牌: ${num}`);
                return false;
            }

            // 检查是否为条子
            if (suit !== 1) {
                console.log(`包含非条子牌: 数字${value}, 花色${suit}`);
                return false;
            }

            // 检查是否为1579
            if (!validNumbers.has(value)) {
                console.log(`包含非1579的条子: ${value}`);
                return false;
            }
        }

        // 必须包含中
        if (!hasZhong) {
            console.log("不包含中");
            return false;
        }

        console.log("符合红孔雀役");
        return true;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义条子的1579和中
        const validTiles = [10, 14, 16, 18]; // 条子的1579
        const zhong = 19; // 中
        
        // 定义其他牌
        const otherTiles = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        // 生成中（至少四张）
        for (let i = 0; i < 6; i++) {
            numArr.push(zhong);
        }
        
        // 生成条子的1579（30%概率）
        const validCount = Math.floor((count - 6) * 0.6);
        for (let i = 0; i < validCount; i++) {
            const randomIndex = Math.floor(Math.random() * validTiles.length);
            numArr.push(validTiles[randomIndex]);
        }
        
        // 生成其他牌（70%概率）
        const remainingCount = count - 6 - validCount;
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const suit = otherTiles[Math.floor(Math.random() * 3)];
            // 随机选择数字（1-9）
            const num = 1 + Math.floor(Math.random() * 9);
            numArr.push(suit.base + num);
        }
        
        return numArr;
    }
} 