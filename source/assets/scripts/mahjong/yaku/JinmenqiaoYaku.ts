import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class JinmenqiaoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查金门桥役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }

        // 检查是否有同花色的123，345，567，789
        const hasAllSequences = this.checkAllSequences(tiles);
        if (!hasAllSequences) {
            console.log("缺少同花色的123，345，567，789");
            return false;
        }

        console.log("符合金门桥役");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成金门桥役牌型...");
        
        // 定义花色
        const suits = [
            { name: "饼子", base: 1, max: 9 },
            { name: "条子", base: 10, max: 18 },
            { name: "万子", base: 22, max: 30 }
        ];
        
        // 随机选择一个花色
        const suit = suits[Math.floor(Math.random() * suits.length)];
        console.log(`选择花色: ${suit.name}`);
        
        // 定义顺子
        const sequences = [
            [1, 2, 3],
            [3, 4, 5],
            [5, 6, 7],
            [7, 8, 9]
        ];
        
        // 生成牌型，确保包含同花色的123，345，567，789
        const tiles: number[] = [];
        
        // 生成四个顺子
        for (const sequence of sequences) {
            for (const num of sequence) {
                // 根据花色调整数字
                const tileNum = num + (suit.base - 1);
                //添加3个
                tiles.push(tileNum);
                tiles.push(tileNum);
                tiles.push(tileNum);
            }
        }
        
        // 生成雀头（一对相同的牌）
        const pairNum = Math.floor(Math.random() * 9) + 1;
        const pairTileNum = pairNum + (suit.base - 1);
        tiles.push(pairTileNum);
        tiles.push(pairTileNum);
        
        // 补充剩余的牌
        const remainingCount = count - tiles.length;
        if (remainingCount > 0) {
            // 定义其他花色的牌
            const otherSuits = suits.filter(s => s.base !== suit.base);
            const otherTiles = [];
            
            // 收集其他花色的牌
            for (const otherSuit of otherSuits) {
                for (let i = 1; i <= 9; i++) {
                    otherTiles.push(i + (otherSuit.base - 1));
                }
            }
            
            // 从同花色和其他花色中随机选择补充
            for (let i = 0; i < remainingCount; i++) {
                // 70%的概率选择同花色，30%的概率选择其他花色
                if (Math.random() < 0.3) {
                    // 从同花色中随机选择
                    const num = Math.floor(Math.random() * 9) + 1;
                    const tileNum = num + (suit.base - 1);
                    tiles.push(tileNum);
                } else {
                    // 从其他花色中随机选择
                    const randomIndex = Math.floor(Math.random() * otherTiles.length);
                    tiles.push(otherTiles[randomIndex]);
                }
            }
        }
        
        console.log(`生成金门桥役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }

    private checkAllSequences(tiles: Chess[]): boolean {
        // 获取同花色的牌
        const sameSuitTiles = tiles.filter(tile => {
            // 排除字牌
            if (tile.num >= 31) return false;
            
            // 获取第一张非字牌的花色作为基准
            const firstNonHonorTile = tiles.find(t => t.num < 31);
            if (!firstNonHonorTile) return false;
            
            // 判断花色
            const isFirstPin = firstNonHonorTile.num <= 9; // 饼子
            const isFirstSou = firstNonHonorTile.num >= 10 && firstNonHonorTile.num <= 18; // 条子
            const isFirstMan = firstNonHonorTile.num >= 22 && firstNonHonorTile.num <= 30; // 万子
            
            const isTilePin = tile.num <= 9;
            const isTileSou = tile.num >= 10 && tile.num <= 18;
            const isTileMan = tile.num >= 22 && tile.num <= 30;
            
            return (isFirstPin && isTilePin) || 
                   (isFirstSou && isTileSou) || 
                   (isFirstMan && isTileMan);
        });

        // 根据花色调整数字
        const adjustedTiles = sameSuitTiles.map(tile => {
            if (tile.num <= 9) return tile.num; // 饼子
            if (tile.num <= 18) return tile.num - 9; // 条子
            return tile.num - 21; // 万子
        });

        // 统计每个数字的数量
        const tileCounts = new Map<number, number>();
        for (const num of adjustedTiles) {
            tileCounts.set(num, (tileCounts.get(num) || 0) + 1);
        }

        // 检查是否有123，345，567，789
        const sequences = [
            [1, 2, 3],
            [3, 4, 5],
            [5, 6, 7],
            [7, 8, 9]
        ];

        // 检查每个顺子
        for (const sequence of sequences) {
            const [num1, num2, num3] = sequence;
            // 检查每个数字是否都有足够的牌
            if ((tileCounts.get(num1) || 0) < 1 || 
                (tileCounts.get(num2) || 0) < 1 || 
                (tileCounts.get(num3) || 0) < 1) {
                console.log(`缺少顺子 ${num1}${num2}${num3}`);
                return false;
            }
            // 使用这些牌
            tileCounts.set(num1, (tileCounts.get(num1) || 0) - 1);
            tileCounts.set(num2, (tileCounts.get(num2) || 0) - 1);
            tileCounts.set(num3, (tileCounts.get(num3) || 0) - 1);
        }

        return true;
    }
} 