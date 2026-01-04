import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class DasixingYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查大七星役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 大七星：由七种字牌组成的七对子
        
        // 统计每种字牌的数量
        const countMap = {};
        
        for (const tile of tiles) {
            const num = tile.num;
            
            // 只统计字牌（31-34 19-21 ）
            if (num >= 31 && num <= 34 || num >= 19 && num <= 21) {
                countMap[num] = (countMap[num] || 0) + 1;
            } else {
                // 有非字牌，不可能是大七星
                console.log(`发现非字牌: ${num}`);
                return false;
            }
        }
        
        // 检查是否有七种不同的字牌，且每种都有2张
        const pairs = Object.values(countMap).filter(count => count === 2);
        if (pairs.length === 7) {
            console.log("符合大七星要求：七种字牌各两张");
            return true;
        }
        
        console.log(`不符合大七星要求，字牌对子数: ${pairs.length}`);
        return false;
    }

    generateTiles(count: number): number[] {
        console.log("生成大七星役牌型...");
        
        // 定义七种字牌
        const honorTiles = [31, 32, 33, 34, 19, 20, 21]; // 东南西北白发中
        
        // 生成牌型
        const tiles: number[] = [];
        
        // 每种字牌生成两张
        for (const num of honorTiles) {
            //6张
            tiles.push(num);
            tiles.push(num);
            tiles.push(num);
            tiles.push(num);
            tiles.push(num);
            tiles.push(num);
        }
        
        // 补充剩余的牌
        const remainingCount = count - tiles.length;
        if (remainingCount > 0) {
            // 定义其他牌（非字牌）
            const otherTiles = [];
            for (let i = 1; i <= 9; i++) {
                otherTiles.push(i);      // 饼子1-9
                otherTiles.push(i + 9);  // 条子1-9
                otherTiles.push(i + 21); // 万子1-9
            }
            
            // 随机选择补充
            for (let i = 0; i < remainingCount; i++) {
                const randomIndex = Math.floor(Math.random() * otherTiles.length);
                tiles.push(otherTiles[randomIndex]);
            }
        }
        
        console.log(`生成大七星役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 