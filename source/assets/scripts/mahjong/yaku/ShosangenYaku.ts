import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ShosangenYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查小三元役...");
        
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
        
        // 统计三元牌（白发中）的数量
        const countMap = {};
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            // 三元牌：白(35)、发(36)、中(37)
            if (num >= 19 && num <= 21) {
                countMap[num] = (countMap[num] || 0) + 1;
            }
        }
        
        // 小三元：两组三元牌的刻子和一对三元牌的雀头
        let sangenKezi = 0; // 三元牌刻子数
        let sangenToitsu = 0; // 三元牌雀头数
        
        for (const num in countMap) {
            if (countMap[num] >= 3) {
                sangenKezi++;
            } else if (countMap[num] === 2) {
                sangenToitsu++;
            }
        }
        
        // 小三元：两组三元牌的刻子和一对三元牌的雀头
        if (sangenKezi === 2 && sangenToitsu === 1) {
            console.log("符合小三元要求：两组三元牌的刻子和一对三元牌的雀头");
            return true;
        }
        
        console.log(`不符合小三元要求，三元牌刻子数: ${sangenKezi}，三元牌雀头数: ${sangenToitsu}`);
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义三元牌
        const sangenTiles = [19, 20, 21]; // 白、发、中
        
        // 随机选择两个三元牌作为刻子
        const keziTiles = [...sangenTiles];
        const kezi1 = keziTiles.splice(Math.floor(Math.random() * keziTiles.length), 1)[0];
        const kezi2 = keziTiles.splice(Math.floor(Math.random() * keziTiles.length), 1)[0];
        
        // 生成两组刻子（每组3张）
        for (let i = 0; i < 3; i++) {
            numArr.push(kezi1);
            numArr.push(kezi1);
            numArr.push(kezi1);

        }
        for (let i = 0; i < 3; i++) {
            numArr.push(kezi2);
            numArr.push(kezi2);
            numArr.push(kezi2);
        }
        
        // 生成一对雀头（使用剩余的三元牌）
        const toitsuTile = keziTiles[0];
        for (let i = 0; i < 2; i++) {
            numArr.push(toitsuTile);
            numArr.push(toitsuTile);

        }
        
        // 生成其他牌（确保不会破坏小三元）
        const remainingCount = count - 20; // 已经生成了8张牌（2个刻子6张 + 1对雀头2张）
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
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