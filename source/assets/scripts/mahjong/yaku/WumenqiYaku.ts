import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class WumenqiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查五门齐役...");
        
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
        
        // 五门齐：包含饼子、条子、万子、风牌和三元牌
        
        // 统计各种牌的存在情况
        let hasPinzi = false;
        let hasSozi = false;
        let hasManzi = false;
        let hasFengpai = false;
        let hasSanyuanpai = false;
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            
            // 饼子：1-9
            if (num >= 1 && num <= 9) {
                hasPinzi = true;
            }
            // 条子：10-18
            else if (num >= 10 && num <= 18) {
                hasSozi = true;
            }
            // 万子：19-27
            else if (num >= 22 && num <= 30) {
                hasManzi = true;
            }
            // 风牌：31-34
            else if (num >= 31 && num <= 34) {
                hasFengpai = true;
            }
            // 三元牌：35-37
            else if (num >= 19 && num <= 21) {
                hasSanyuanpai = true;
            }
        }
        
        // 五门齐：包含饼子、条子、万子、风牌和三元牌
        if (hasPinzi && hasSozi && hasManzi && hasFengpai && hasSanyuanpai) {
            console.log("符合五门齐要求");
            return true;
        }
        
        console.log(`不符合五门齐要求，饼子: ${hasPinzi}, 条子: ${hasSozi}, 万子: ${hasManzi}, 风牌: ${hasFengpai}, 三元牌: ${hasSanyuanpai}`);
        return false;
    }

    generateTiles(count: number): number[] {
        console.log("生成五门齐役牌型...");
        
        // 定义各种花色的牌
        const pinzi = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 饼子
        const sozi = [10, 11, 12, 13, 14, 15, 16, 17, 18]; // 条子
        const manzi = [19, 20, 21, 22, 23, 24, 25, 26, 27]; // 万子
        const fengpai = [31, 32, 33, 34]; // 风牌
        const sanyuanpai = [19, 20, 21]; // 三元牌
        
        // 生成牌型，确保包含所有五种花色
        const tiles: number[] = [];
        
        // 确保每种花色至少有一对牌
        for (let i = 0; i < 5; i++) {
            let tileNum;
            switch (i) {
                case 0: // 饼子
                    tileNum = pinzi[Math.floor(Math.random() * pinzi.length)];
                    break;
                case 1: // 条子
                    tileNum = sozi[Math.floor(Math.random() * sozi.length)];
                    break;
                case 2: // 万子
                    tileNum = manzi[Math.floor(Math.random() * manzi.length)];
                    break;
                case 3: // 风牌
                    tileNum = fengpai[Math.floor(Math.random() * fengpai.length)];
                    break;
                case 4: // 三元牌
                    tileNum = sanyuanpai[Math.floor(Math.random() * sanyuanpai.length)];
                    break;
            }
            
            // 添加一对相同的牌
            tiles.push(tileNum);
            tiles.push(tileNum);
        }
        
        // 继续生成剩余的牌，确保和数大于等于100
        while (tiles.length < count) {
            // 随机选择一种花色
            const suit = Math.floor(Math.random() * 5);
            
            // 根据花色选择牌
            let tileNum;
            switch (suit) {
                case 0: // 饼子
                    tileNum = pinzi[Math.floor(Math.random() * pinzi.length)];
                    break;
                case 1: // 条子
                    tileNum = sozi[Math.floor(Math.random() * sozi.length)];
                    break;
                case 2: // 万子
                    tileNum = manzi[Math.floor(Math.random() * manzi.length)];
                    break;
                case 3: // 风牌
                    tileNum = fengpai[Math.floor(Math.random() * fengpai.length)];
                    break;
                case 4: // 三元牌
                    tileNum = sanyuanpai[Math.floor(Math.random() * sanyuanpai.length)];
                    break;
            }
            
            // 添加一对相同的牌
            tiles.push(tileNum);
            // tiles.push(tileNum);
        }
        
        console.log(`生成五门齐役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 