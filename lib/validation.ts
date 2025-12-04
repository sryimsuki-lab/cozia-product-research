export interface ValidationResult {
    passed: boolean;
    reasons: string[];
    checks: {
        usWarehouse: boolean;
        shippingTime: boolean;
        minPrice: boolean;
        maxPrice: boolean;
        inventory: boolean;
        markup: boolean;
        sweetSpot: boolean;
        lowMargin: boolean;
    };
}

export function validateProduct(data: {
    us_warehouse: boolean;
    total_days_max: number;
    min_selling_price: number;
    inventory_count: number;
    recommended_price: number;
    total_cost: number;
}): ValidationResult {
    const profitPerSale = data.recommended_price - data.total_cost;
    const marginPercent = (profitPerSale / data.recommended_price) * 100;

    const checks = {
        usWarehouse: data.us_warehouse,
        shippingTime: data.total_days_max <= 12,
        minPrice: data.recommended_price >= 29.99,
        maxPrice: data.recommended_price <= 99.99,
        inventory: data.inventory_count >= 50,
        markup: data.recommended_price >= data.total_cost * 3, // Double check markup on recommended price
        sweetSpot: data.recommended_price >= 29 && data.recommended_price <= 39,
        lowMargin: marginPercent < 60,
    };

    const reasons: string[] = [];

    if (!checks.usWarehouse) reasons.push("noUsWarehouse");
    if (!checks.shippingTime) reasons.push("shippingTooSlow");
    if (!checks.minPrice) reasons.push("priceTooLow");
    if (!checks.maxPrice) reasons.push("priceTooHigh");
    if (!checks.inventory) reasons.push("lowInventory");
    // if (!checks.markup) reasons.push("markupTooLow"); // We might not want to block submission on this if it's just a warning, but let's keep it for now or remove if it conflicts with the cap.
    // Actually, if the cap forces the price down, the markup check might fail.
    // Let's only fail markup check if it's NOT capped. But for now, let's loosen it or rely on the other checks.
    // The user requirement says "Warning if the cost is too high for a 3x markup within the cap".
    // So we shouldn't block submission, just warn.
    // But the previous code blocked it. Let's keep blocking for now unless we decide otherwise.
    // Wait, if cost is $40, rec price is $99.99. 40*3 = 120. 99.99 < 120. So markup check fails.
    // If we block, they can't submit high cost items.
    // Let's REMOVE "markupTooLow" as a blocking reason if it's due to the cap.
    // Instead, we'll rely on "lowMargin" warning in the UI, but maybe not block?
    // The prompt says "Warning if the cost is too high...".
    // Let's keep it simple: if margin < 60%, it's a "Low Margin" warning.
    // Let's remove "markupTooLow" from reasons list to avoid blocking, or make it a soft warning.
    // The previous code had it as a blocking reason.
    // Let's keep it as a blocking reason ONLY if the price is NOT capped.
    // But wait, the price IS calculated. So if it's not capped, it IS 3x.
    // So the only time it fails is if it IS capped.
    // So effectively, this blocks products where Cost * 3 > 99.99.
    // If Cost > 33.33, then Cost * 3 > 100.
    // So we are blocking products with Cost > 33.33.
    // Is this intended? "Price range: $25-50".
    // If we sell for $50, cost should be ~$16.
    // If cost is $35, price should be $105. Cap is $99.99.
    // If we block cost > 33.33, that seems strict but maybe correct for "Dropshipping home goods".
    // However, the user said "Warning if the cost is too high".
    // So I will NOT add it to `reasons` (blocking), but keep it in `checks` for UI warning.

    return {
        passed: reasons.length === 0,
        reasons,
        checks,
    };
}
