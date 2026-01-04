import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChurenpotoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查九莲宝灯役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 九莲宝灯：同一种花色的1112345678999，再加上同一花色的任意一张牌
        
        // 统计每种花色的牌数
        const suitCounts = [0, 0, 0]; // 饼子、条子、万子
        const valueCounts = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0], // 饼子1-9
            [0, 0, 0, 0, 0, 0, 0, 0, 0], // 条子1-9
            [0, 0, 0, 0, 0, 0, 0, 0, 0]  // 万子1-9
        ];
        
        for (const tile of tiles) {
            const num = tile.num;
            
            // 只考虑数牌
            if (num >= 1 && num <= 9) { // 饼子1-9
                suitCounts[0]++;
                valueCounts[0][num - 1]++;
            } else if (num >= 10 && num <= 18) { // 条子1-9
                suitCounts[1]++;
                valueCounts[1][num - 10]++;
            } else if (num >= 22 && num <= 30) { // 万子1-9
                suitCounts[2]++;
                valueCounts[2][num - 22]++;
            } else {
                // 有字牌，不可能是九莲宝灯
                console.log(`发现字牌: ${num}`);
                return false;
            }
        }
        
        console.log("花色统计:", suitCounts);
        console.log("数字统计:", valueCounts);
        
        // 检查是否只有一种花色
        let dominantSuit = -1;
        for (let i = 0; i < suitCounts.length; i++) {
            if (suitCounts[i] === 14) {
                dominantSuit = i;
                break;
            }
        }
        
        if (dominantSuit === -1) {
            console.log("不是清一色，不可能是九莲宝灯");
            return false;
        }
        
        console.log(`主要花色: ${dominantSuit === 0 ? '饼子' : dominantSuit === 1 ? '条子' : '万子'}`);
        
        // 检查是否符合九莲宝灯的牌型：1112345678999 + 同花色任意一张
        // 标准九莲宝灯的牌型
        const standardPattern = [3, 1, 1, 1, 1, 1, 1, 1, 3];
        
        // 计算与标准牌型的差异
        let extraTile = -1;
        for (let i = 0; i < 9; i++) {
            const currentCount = valueCounts[dominantSuit][i];
            const standardCount = standardPattern[i];
            const currentDiff = currentCount - standardCount;
            
            if (currentDiff > 0) {
                // 如果某张牌多了，记录为额外牌
                if (extraTile !== -1) {
                    console.log(`发现多张额外牌: ${extraTile + 1}和${i + 1}`);
                    return false;
                }
                extraTile = i;
            } else if (currentDiff < 0) {
                // 如果有牌少了，说明不符合要求
                console.log(`数字${i + 1}的牌数不足: 当前${currentCount}张, 需要${standardCount}张`);
                return false;
            }
        }
        
        // 应该有一张额外牌
        if (extraTile !== -1) {
            console.log("符合九莲宝灯要求");
            return true;
        }
        
        console.log("没有发现额外牌");
        return false;
    }

    generateTiles(count: number): number[] {
        console.log("生成九莲宝灯役牌型...");
        
        // 定义花色
        const suits = [
            { name: "饼子", base: 1, max: 9 },
            { name: "条子", base: 10, max: 18 },
            { name: "万子", base: 22, max: 30 }
        ];
        
        // 随机选择一个花色
        const suit = suits[Math.floor(Math.random() * suits.length)];
        console.log(`选择花色: ${suit.name}`);
        
        // 生成牌型，确保包含同一种花色的1112345678999，再加上同一花色的任意一张牌
        const tiles: number[] = [];
        
        // 生成1112345678999
        // 1号牌三张
        for (let i = 0; i < 4; i++) {
            tiles.push(suit.base);
            tiles.push(suit.base);
        }
        
        // 2-8号牌各一张
        for (let i = 2; i <= 8; i++) {
            tiles.push(suit.base + i - 1);
            tiles.push(suit.base + i - 1);
            tiles.push(suit.base + i - 1);
        }
        
        // 9号牌三张
        for (let i = 0; i < 8; i++) {
            tiles.push(suit.base + 8);
        }
        
        // 额外一张同花色的牌（随机选择1-9中的一个）
        const extraNum = Math.floor(Math.random() * 9) + 1;
        tiles.push(suit.base + extraNum - 1);
        
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
        
        console.log(`生成九莲宝灯役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 