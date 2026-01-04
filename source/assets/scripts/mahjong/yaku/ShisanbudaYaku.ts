import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ShisanbudaYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查十三不搭役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }

        // 先找出雀头
        const pairTile = this.findPairTile(tiles);
        if (!pairTile) {
            console.log("没有雀头，不符合十三不搭");
            return false;
        }

        // 获取所有牌的数字和花色
        const tileInfo = tiles.map(tile => {
            const num = tile.num;
            let value, suit;
            
            if (num >= 1 && num <= 9) {
                value = num;
                suit = 0; // 饼子
            } else if (num >= 10 && num <= 18) {
                value = num - 9;
                suit = 1; // 条子
            } else if (num >= 22 && num <= 30) {
                value = num - 21;
                suit = 2; // 万子
            } else {
                value = num;
                suit = 3; // 字牌
            }
            
            return { value, suit, num };
        });

        // 检查是否有相邻或相同的牌（除了雀头）
        for (let i = 0; i < tileInfo.length; i++) {
            for (let j = i + 1; j < tileInfo.length; j++) {
                const tile1 = tileInfo[i];
                const tile2 = tileInfo[j];
                
                // 跳过雀头的检查
                if (tile1.num === pairTile || tile2.num === pairTile) {
                    continue;
                }
                
                // 如果是同一张牌，不符合十三不搭
                if (tile1.value === tile2.value && tile1.suit === tile2.suit) {
                    console.log(`发现相同的牌: 数字${tile1.value}, 花色${tile1.suit}`);
                    return false;
                }
                
                // 如果是同花色且数字相邻或间隔为1，不符合十三不搭
                if (tile1.suit === tile2.suit && tile1.suit !== 3) { // 不是字牌
                    const diff = Math.abs(tile1.value - tile2.value);
                    if (diff <= 2) { // 修改为间隔至少为2
                        console.log(`发现间隔小于等于2的牌: ${tile1.value}和${tile2.value}, 间隔${diff}`);
                        return false;
                    }
                }
            }
        }

        console.log("符合十三不搭役");
        return true;
    }

    private findPairTile(tiles: Chess[]): number | null {
        const countMap = new Map<number, number>();
        
        // 统计每种牌的数量
        for (const tile of tiles) {
            const count = countMap.get(tile.num) || 0;
            countMap.set(tile.num, count + 1);
        }
        
        // 找出对子
        for (const [num, count] of countMap.entries()) {
            if (count >= 2) {
                return num;
            }
        }
        
        return null;
    }
    
    generateTiles(count: number): number[] {
        console.log("生成十三不搭役牌型...");
        
        // 十三不搭役需要13张不相关的牌和1对雀头
        const numArr: number[] = [];
        
        // 定义花色
        const suits = [
            { name: "饼子", base: 1, max: 9 },
            { name: "条子", base: 10, max: 18 },
            { name: "万子", base: 22, max: 30 },
            { name: "字牌", base: 31, max: 34, isHonor: true },
            { name: "中发白", base: 19, max: 21, isHonor: true }
        ];
        
        // 随机选择13张不相关的牌
        const selectedTiles = new Set<number>();
        
        // 从三种花色（饼子、条子、万子）中每种选择3张不连续的牌
        for (let i = 0; i < 3; i++) { // 只处理前三种花色
            const suit = suits[i];
            const availableValues = [];
            
            // 收集可用的值
            for (let value = suit.base; value <= suit.max; value++) {
                availableValues.push(value);
            }
            
            // 随机选择3张不连续的牌
            const selectedValues = [];
            for (let j = 0; j < 3; j++) {
                if (availableValues.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableValues.length);
                    const selectedValue = availableValues.splice(randomIndex, 1)[0];
                    selectedValues.push(selectedValue);
                    
                    // 移除相邻的值，确保不连续
                    const adjacentValues = [selectedValue - 1, selectedValue + 1];
                    for (const adjValue of adjacentValues) {
                        const adjIndex = availableValues.indexOf(adjValue);
                        if (adjIndex !== -1) {
                            availableValues.splice(adjIndex, 1);
                        }
                    }
                }
            }
            
            // 将选中的值添加到结果中
            for (const value of selectedValues) {
                selectedTiles.add(value);
            }
        }
        
        // 剩余的选择字牌
        const honorSuits = suits.slice(3); // 获取字牌和中发白
        const remainingCount = 13 - selectedTiles.size;
        
        for (let i = 0; i < remainingCount; i++) {
            const randomSuit = honorSuits[Math.floor(Math.random() * honorSuits.length)];
            const randomValue = Math.floor(Math.random() * (randomSuit.max - randomSuit.base + 1)) + randomSuit.base;
            
            if (!selectedTiles.has(randomValue)) {
                selectedTiles.add(randomValue);
            } else {
                i--; // 如果已经选择了这个值，重试
            }
        }
        
        // 将选中的牌添加到结果中
        for (const tile of selectedTiles) {
            numArr.push(tile);
            numArr.push(tile);
            numArr.push(tile);
        }
        
        // 生成一对雀头（确保不会破坏十三不搭）
        let pairTile;
        do {
            const randomSuit = suits[Math.floor(Math.random() * suits.length)];
            pairTile = Math.floor(Math.random() * (randomSuit.max - randomSuit.base + 1)) + randomSuit.base;
        } while (selectedTiles.has(pairTile));
        
        // 添加一对雀头
        numArr.push(pairTile);
        numArr.push(pairTile);
        
        // 补充剩余牌，确保总数为count
        const remainingCount2 = count - numArr.length;
        if (remainingCount2 > 0) {
            console.log(`补充剩余牌: ${remainingCount2}张`);
            
            // 随机生成剩余的牌
            for (let i = 0; i < remainingCount2; i++) {
                const randomSuit = suits[Math.floor(Math.random() * suits.length)];
                const randomValue = Math.floor(Math.random() * (randomSuit.max - randomSuit.base + 1)) + randomSuit.base;
                numArr.push(randomValue);
            }
        }
        
        console.log(`十三不搭役牌型生成完成，共${numArr.length}张牌`);
        return numArr;
    }
} 