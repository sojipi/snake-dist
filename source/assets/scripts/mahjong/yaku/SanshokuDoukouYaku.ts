import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanshokuDoukouYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三色同刻役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 获取所有可能的和牌形式
        const results = this.checkAllStandardForms(tiles);
        if (results.length === 0) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 遍历所有可能的和牌形式
        for (const result of results) {
            // 统计每种花色的刻子
            const keziMap: {[key: number]: Set<number>} = {};
            
            // 遍历所有面子
            for (const set of result.sets) {
                // 检查这个面子是否为刻子（三张相同的牌）
                if (set.length === 3 && set[0] === set[1] && set[1] === set[2]) {
                    const num = set[0];
                    
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
                        // 字牌，跳过
                        continue;
                    }
                    
                    // 记录该数字在不同花色中出现的刻子
                    if (!keziMap[value]) {
                        keziMap[value] = new Set();
                    }
                    keziMap[value].add(suit);
                }
            }
            
            // 检查是否有某个数字在三种花色中都有刻子
            for (const value in keziMap) {
                if (keziMap[value].size === 3) {
                    console.log(`找到三色同刻：数字 ${value} 在三种花色中都有刻子`);
                    return true;
                }
            }
        }
        
        console.log("未找到三色同刻");
        return false;
    }

    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一个数字（1-9）
        const selectedNum = 1 + Math.floor(Math.random() * 9);
        
        // 生成三色同刻（每种花色6张，共18张）
        const suits = [0, 9, 21]; // 饼子、条子、万子的起始数字
        for (const suit of suits) {
            for (let i = 0; i < 6; i++) {
                numArr.push(suit + selectedNum);
            }
        }
        
        // 生成其他牌（确保不会破坏三色同刻）
        const remainingCount = count - 18;
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomBaseNum + randomNum);
        }
        
        return numArr;
    }
} 