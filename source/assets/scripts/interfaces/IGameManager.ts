/**
 * GameManager接口，用于解决循环依赖问题
 */
export interface IGameManager {
    getHandCardsCount(): number;
    getMaxHandCards(): number;
    discardCardByType(tileType: string): boolean;
}

/**
 * 获取GameManager实例的函数类型
 */
export type GetGameManagerInstance = () => IGameManager | null;
