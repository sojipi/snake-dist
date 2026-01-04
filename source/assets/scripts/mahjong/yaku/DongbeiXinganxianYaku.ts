import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class DongbeiXinganxianYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查东北新干线役...");
        
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
        
        // 检查是否有东、北的刻子
        const hasEast = this.checkKotsu(tiles, 31); // 东
        const hasNorth = this.checkKotsu(tiles, 34); // 北
        if (!hasEast || !hasNorth) {
            console.log("缺少东或北的刻子");
            return false;
        }

        // 检查是否有同花色牌的1-9
        const hasAllNumbers = this.checkAllNumbers(tiles);
        if (!hasAllNumbers) {
            console.log("缺少同花色牌的1-9");
            return false;
        }

        console.log("符合东北新干线役");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成东北新干线役牌型...");
        
        // 定义花色
        const suits = [
            { name: "饼子", base: 1, max: 9 },
            { name: "条子", base: 10, max: 18 },
            { name: "万子", base: 22, max: 30 }
        ];
        
        // 随机选择一个花色
        const suit = suits[Math.floor(Math.random() * suits.length)];
        console.log(`选择花色: ${suit.name}`);
        
        // 生成牌型，确保包含东、北的刻子和同花色牌的1-9
        const tiles: number[] = [];
        
        // 生成东、北的刻子
        for (let i = 0; i < 6; i++) {
            tiles.push(31); // 东
        }
        for (let i = 0; i < 6; i++) {
            tiles.push(34); // 北
        }
        
        // 生成同花色牌的1-9
        for (let i = 1; i <= 9; i++) {
            const tileNum = i + (suit.base - 1);
            //三张
            tiles.push(tileNum);
            tiles.push(tileNum);
            tiles.push(tileNum);
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
                // 30%的概率选择同花色，70%的概率选择其他花色
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
        
        console.log(`生成东北新干线役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }

    private checkKotsu(tiles: Chess[], num: number): boolean {
        let count = 0;
        for (const tile of tiles) {
            if (tile.num === num) {
                count++;
            }
        }
        return count >= 2; // 需要2张或以上才算是刻子
    }

    private checkAllNumbers(tiles: Chess[]): boolean {
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

        // 检查1-9是否都存在
        const numbers = new Set(sameSuitTiles.map(tile => {
            if (tile.num <= 9) return tile.num; // 饼子
            if (tile.num <= 18) return tile.num - 9; // 条子
            return tile.num - 21; // 万子
        }));
        console.log("同花色牌的数字集合:", Array.from(numbers));
        return numbers.size === 9;
    }
} 