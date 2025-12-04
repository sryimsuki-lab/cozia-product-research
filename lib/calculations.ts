export function calculatePricing(
    productCost: number,
    shippingCost: number,
    lastMileFee: number
) {
    const totalCost = productCost + shippingCost + lastMileFee;
    const minSellingPrice = 29.99; // New floor

    // Strict 3x markup
    let recommendedPrice = totalCost * 3;

    // Apply floor
    if (recommendedPrice < minSellingPrice) {
        recommendedPrice = minSellingPrice;
    }

    // Apply cap
    if (recommendedPrice > 99.99) {
        recommendedPrice = 99.99;
    }

    // Round to .99
    recommendedPrice = Math.ceil(recommendedPrice) - 0.01;

    // Re-check cap after rounding (in case ceil pushed it over, though unlikely with 99.99)
    if (recommendedPrice > 99.99) {
        recommendedPrice = 99.99;
    }

    const profitPerSale = recommendedPrice - totalCost;
    const profitMarginPercent = (profitPerSale / recommendedPrice) * 100;

    return {
        totalCost: Number(totalCost.toFixed(2)),
        minSellingPrice: Number(minSellingPrice.toFixed(2)),
        recommendedPrice: Number(recommendedPrice.toFixed(2)),
        profitPerSale: Number(profitPerSale.toFixed(2)),
        profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
        isCostTooHigh: (totalCost * 3) > 99.99
    };
}

export function calculateShipping(
    processingMin: number,
    processingMax: number,
    deliveryMin: number,
    deliveryMax: number
) {
    return {
        min: processingMin + deliveryMin,
        max: processingMax + deliveryMax
    };
}
