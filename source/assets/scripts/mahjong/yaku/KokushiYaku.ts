import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class KokushiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查国士无双役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 国士无双不使用标准和牌形式检查，它是特殊和牌形式
        
        // 国士无双需要的牌：
        // 1. 所有幺九牌（1和9）的每种花色各一张
        // 2. 所有字牌（东南西北白发中）各一张
        // 3. 其中一种牌需要有两张（作为雀头）
        
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
        
        console.log("符合国士无双要求");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成国士无双役牌型...");
        
        // 定义所有幺九牌和字牌
        const requiredTiles = [
            1, 9,       // 饼子的1和9
            10, 18,     // 条子的1和9
            22, 30,     // 万子的1和9
            31, 32, 33, 34, 19, 20, 21  // 东南西北白发中
        ];
        
        // 随机选择一张牌作为雀头（出现两次）
        const pairTile = requiredTiles[Math.floor(Math.random() * requiredTiles.length)];
        console.log(`选择雀头: ${pairTile}`);
        
        // 生成牌型
        const tiles: number[] = [];
        
        // 添加所有幺九牌和字牌（每种一张）
        for (const num of requiredTiles) {
            //三张
            tiles.push(num);
            tiles.push(num);
            tiles.push(num);
        }
        
        // 添加雀头（额外一张）
        tiles.push(pairTile);
        
        // 补充剩余的牌
        const remainingCount = count - tiles.length;
        if (remainingCount > 0) {
            // 定义其他牌（非幺九牌和字牌）
            const otherTiles = [];
            for (let i = 2; i <= 8; i++) {
                otherTiles.push(i);      // 饼子2-8
                otherTiles.push(i + 9);  // 条子2-8
                otherTiles.push(i + 21); // 万子2-8
            }
            
            // 随机选择补充
            for (let i = 0; i < remainingCount; i++) {
                const randomIndex = Math.floor(Math.random() * otherTiles.length);
                tiles.push(otherTiles[randomIndex]);
            }
        }
        
        console.log(`生成国士无双役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 