/**
 * Utility functions for price calculations
 */

/**
 * Calculates the weighted average buying price when adding new inventory
 * @param currentQuantity - Current quantity in stock
 * @param currentPrice - Current buying price per unit
 * @param newQuantity - New quantity being added
 * @param newPrice - New buying price per unit
 * @returns The weighted average buying price
 */
export function calculateWeightedAveragePrice(
    currentQuantity: number,
    currentPrice: number,
    newQuantity: number,
    newPrice: number
): number {
    if (currentQuantity === 0) {
        // If no current stock, use the new price
        return newPrice;
    }

    const totalValue = (currentQuantity * currentPrice) + (newQuantity * newPrice);
    const totalQuantity = currentQuantity + newQuantity;

    return Number((totalValue / totalQuantity).toFixed(2));
}

/**
 * Calculates weighted average buying prices for all unit types (piece, pack, dozen)
 * @param product - The product instance
 * @param newQuantity - New quantity being added (in pieces)
 * @param newUnitPrice - New buying price per unit
 * @param unitType - The unit type of the new purchase
 * @returns Object with updated buying prices for all unit types
 */
export function calculateWeightedAveragePricesForAllUnits(
    product: any,
    newQuantity: number,
    newUnitPrice: number,
    unitType: 'piece' | 'pack' | 'dozen'
): {
    piece_buying_price: number;
    pack_buying_price: number;
    dozen_buying_price: number;
} {
    // Convert new quantity to pieces based on unit type
    let newQuantityInPieces = newQuantity;
    if (unitType === 'pack') {
        newQuantityInPieces = newQuantity * 3; // 1 pack = 3 pieces
    } else if (unitType === 'dozen') {
        newQuantityInPieces = newQuantity * 12; // 1 dozen = 12 pieces
    }

    // Convert new unit price to piece price
    let newPiecePrice = newUnitPrice;
    if (unitType === 'pack') {
        newPiecePrice = newUnitPrice / 3; // Convert pack price to piece price
    } else if (unitType === 'dozen') {
        newPiecePrice = newUnitPrice / 12; // Convert dozen price to piece price
    }

    // Get current values
    const currentQuantity = product.quantity || 0;
    const currentPiecePrice = Number(product.piece_buying_price) || 0;

    // Calculate weighted average piece price
    const newPieceBuyingPrice = calculateWeightedAveragePrice(
        currentQuantity,
        currentPiecePrice,
        newQuantityInPieces,
        newPiecePrice
    );

    // Calculate pack and dozen prices based on the new piece price
    const newPackBuyingPrice = Number((newPieceBuyingPrice * 3).toFixed(2));
    const newDozenBuyingPrice = Number((newPieceBuyingPrice * 12).toFixed(2));

    return {
        piece_buying_price: newPieceBuyingPrice,
        pack_buying_price: newPackBuyingPrice,
        dozen_buying_price: newDozenBuyingPrice,
    };
}
