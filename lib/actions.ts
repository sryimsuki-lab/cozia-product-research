"use server";

import { analyzeBrandFit } from './gemini';

export async function analyzeProduct(product: {
    name: string;
    category: string;
    recommended_price: number;
    images: string[];
}) {
    return await analyzeBrandFit(product);
}
