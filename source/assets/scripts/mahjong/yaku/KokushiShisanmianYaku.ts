import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class KokushiShisanmianYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查国士无双十三面役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 国士无双十三面不使用标准和牌形式检查，它是特殊和牌形式
        
        // 国士无双十三面需要的牌：
        // 1. 所有幺九牌（1和9）的每种花色各一张
        // 2. 所有字牌（东南西北白发中）各一张
        // 3. 其中一种牌需要有两张（作为雀头）
        // 4. 特别的是，雀头必须是13种幺九牌中的一种
        
        // 统计每种牌的数量
        const countMap = {};
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 检查是否包含所有必要的幺九牌和字牌
        const requiredTiles = [
            1, 9,       // 饼子的1和9
            10, 18,     // 条子的1和9
            22, 30,     // 万子的1和9
            31, 32, 33, 34, 19, 20, 21  // 东南西北白发中
        ];
        
        // 检查是否所有必要的牌都至少有一张
        for (const num of requiredTiles) {
            if (!countMap[num] || countMap[num] < 1) {
                console.log(`缺少必要的牌: ${num}`);
                return false;
            }
        }
        
        // 检查是否有一种牌有两张（作为雀头）
        let hasPair = false;
        for (const num of requiredTiles) {
            if (countMap[num] === 2) {
                hasPair = true;
                break;
            }
        }
        
        if (!hasPair) {
            console.log("没有找到雀头");
            return false;
        }
        
        // 检查是否有多余的牌
        let totalCount = 0;
        for (const num in countMap) {
            totalCount += countMap[num];
        }
        
        if (totalCount !== 14) {
            console.log(`牌的总数不正确: ${totalCount}`);
            return false;
        }
        
        // 检查最后一张牌是否是雀头
        const lastTile = tiles[tiles.length - 1];
        const lastTileNum = lastTile.id || lastTile.num;
        
        // 检查最后一张牌是否是幺九牌或字牌
        if (!requiredTiles.includes(lastTileNum)) {
            console.log("最后一张牌不是幺九牌或字牌");
            return false;
        }
        
        // 检查最后一张牌是否有对应的另一张牌
        let hasMatchingTile = false;
        for (let i = 0; i < tiles.length - 1; i++) {
            const tile = tiles[i];
            const tileNum = tile.id || tile.num;
            if (tileNum === lastTileNum) {
                hasMatchingTile = true;
                break;
            }
        }
        
        if (!hasMatchingTile) {
            console.log("最后一张牌没有对应的另一张牌");
            return false;
        }
        
        console.log("符合国士无双十三面要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 国士无双十三面需要的牌：
        // 1. 所有幺九牌（1和9）的每种花色各一张
        // 2. 所有字牌（东南西北白发中）各一张
        // 3. 其中一种牌需要有两张（作为雀头）
        
        // 定义所有幺九牌和字牌
        const requiredTiles = [
            1, 9,       // 饼子的1和9
            10, 18,     // 条子的1和9
            22, 30,     // 万子的1和9
            31, 32, 33, 34, 19, 20, 21  // 东南西北白发中
        ];
        
        // 随机选择一种牌作为雀头
        const pairIndex = Math.floor(Math.random() * requiredTiles.length);
        const pairTile = requiredTiles[pairIndex];
        
        // 生成所有幺九牌和字牌（每种一张）
        for (let i = 0; i < requiredTiles.length; i++) {
            if (i !== pairIndex) { // 跳过雀头牌，后面会单独添加
                numArr.push(requiredTiles[i]);
                numArr.push(requiredTiles[i]);
                numArr.push(requiredTiles[i]);

            }
        }
        
        // 生成其他牌（确保不会破坏国士无双十三面）
        const remainingCount = count - 36; // 已经生成了13张牌（13种幺九牌和字牌）
        for (let i = 0; i < remainingCount - 5; i++) { // 减1是为了留出最后一张牌作为雀头
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（2-8），避免生成幺九牌
            const randomNum = 2 + Math.floor(Math.random() * 7);
            numArr.push(randomBaseNum + randomNum);
        }
        
        // 生成雀头（最后一张牌）
        numArr.push(pairTile);
        numArr.push(pairTile);
        numArr.push(pairTile);
        numArr.push(pairTile);
        numArr.push(pairTile);
        return numArr;
    }
} 