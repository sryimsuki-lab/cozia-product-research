"use server";

import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import type { ProductSubmitPayload, DuplicateCheckResult, DashboardStats, Product } from './types';

// Safe JSON parsing helper to prevent crashes from corrupted data
function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return fallback;
    }
}

export async function submitProduct(data: ProductSubmitPayload) {
    try {
        console.log("Submitting product data:", JSON.stringify(data, null, 2));
        const product = await prisma.product.create({
            data: {
                ...data,
                notes: data.notes || null,
                images: JSON.stringify(data.images),
                rejection_reasons: JSON.stringify(data.rejection_reasons),
                ai_scores: data.ai_scores ? JSON.stringify(data.ai_scores) : null,
            },
        });
        revalidatePath('/');
        revalidatePath('/products');
        return { success: true, product };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown database error";
        console.error("Failed to submit product:", errorMessage, error);
        return { success: false, error: errorMessage };
    }
}

export async function checkDuplicate(url: string, name: string): Promise<DuplicateCheckResult> {
    try {
        // Check for exact URL match
        const urlMatch = await prisma.product.findFirst({
            where: { cj_url: url },
            select: { id: true, name: true, submitted_by: true, submitted_at: true }
        });

        if (urlMatch) {
            return {
                isDuplicate: true,
                type: 'exact',
                existingProduct: urlMatch
            };
        }

        // Check for similar name (simple contains check)
        const allProducts = await prisma.product.findMany({
            select: { id: true, name: true, submitted_by: true, submitted_at: true }
        });

        const searchTerms = name.toLowerCase().split(' ').slice(0, 3);
        const nameMatch = allProducts.find(p => {
            const productName = p.name.toLowerCase();
            return searchTerms.some(term => productName.includes(term) && term.length > 3);
        });

        if (nameMatch) {
            return {
                isDuplicate: false,
                type: 'similar',
                existingProduct: nameMatch
            };
        }

        return { isDuplicate: false, type: null, existingProduct: null };
    } catch (error) {
        console.error("Failed to check duplicate:", error);
        return { isDuplicate: false, type: null, existingProduct: null };
    }
}

export async function getProducts(filter?: 'approved' | 'rejected' | 'review'): Promise<Product[]> {
    try {
        const where = filter ? { status: filter } : {};
        const products = await prisma.product.findMany({
            where,
            orderBy: { submitted_at: 'desc' },
        });
        return products.map(p => ({
            ...p,
            images: safeJsonParse<string[]>(p.images, []),
            rejection_reasons: safeJsonParse<string[]>(p.rejection_reasons, []),
            ai_scores: p.ai_scores ? safeJsonParse(p.ai_scores, null) : null,
        })) as Product[];
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return null;
        return {
            ...product,
            images: safeJsonParse<string[]>(product.images, []),
            rejection_reasons: safeJsonParse<string[]>(product.rejection_reasons, []),
            ai_scores: product.ai_scores ? safeJsonParse(product.ai_scores, null) : null,
        } as Product;
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return null;
    }
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const total = await prisma.product.count();
        const approved = await prisma.product.count({ where: { status: 'approved' } });
        const rejected = await prisma.product.count({ where: { status: 'rejected' } });
        const review = await prisma.product.count({ where: { status: 'review' } });

        const recent = await prisma.product.findMany({
            take: 5,
            orderBy: { submitted_at: 'desc' },
        });

        return {
            total,
            approved,
            rejected,
            review,
            recent: recent.map(p => ({
                ...p,
                images: safeJsonParse<string[]>(p.images, []),
                rejection_reasons: safeJsonParse<string[]>(p.rejection_reasons, []),
                ai_scores: p.ai_scores ? safeJsonParse(p.ai_scores, null) : null,
            })) as Product[],
        };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return { total: 0, approved: 0, rejected: 0, review: 0, recent: [] };
    }
}

export async function updateProductStatus(id: string, status: 'approved' | 'rejected' | 'review') {
    try {
        await prisma.product.update({
            where: { id },
            data: { status },
        });
        revalidatePath('/');
        revalidatePath('/products');
        revalidatePath(`/products/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update product status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath('/');
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}
