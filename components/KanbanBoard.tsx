"use client";

import Link from 'next/link';
import { useState } from 'react';
import { MoreHorizontal, Calendar, CheckCircle, XCircle, Trash2, Copy, Download } from 'lucide-react';
import { useLanguage } from './LanguageToggle';
import { updateProductStatus, deleteProduct } from '@/lib/database';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

type TranslateFunction = (key: string) => string;

// Export products to JSON file
function exportProductsToJSON(products: Product[], filename: string) {
    const exportData = products.map(p => ({
        product_name: p.name,
        supplier_price: p.product_cost,
        shipping_cost: p.shipping_cost,
        selling_price: p.recommended_price,
        supplier_link: p.cj_url,
        description: p.notes || '',
        shipping_time_days: p.total_days_max,
        category: p.category,
        inventory: p.inventory_count,
        us_warehouse: p.us_warehouse,
        chinese_inventory: p.chinese_inventory,
        profit_margin: p.profit_margin_percent
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function KanbanBoard({ products }: { products: Product[] }) {
    const { t } = useLanguage();
    const router = useRouter();

    const columns = {
        review: products.filter((p) => p.status === 'review'),
        approved: products.filter((p) => p.status === 'approved'),
        rejected: products.filter((p) => p.status === 'rejected'),
    };

    return (
        <div className="h-full flex flex-col pb-20 md:pb-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-main)]">{t('pipeline')}</h1>
                <div className="flex gap-2">
                    {products.length > 0 && (
                        <button
                            onClick={() => exportProductsToJSON(products, 'cozia-all-products')}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                            <Download className="w-4 h-4" />
                            {t('exportAll')}
                        </button>
                    )}
                    <Link href="/submit" className="px-3 py-1.5 text-sm font-medium bg-[var(--accent-black)] text-white rounded-lg hover:opacity-90 transition-opacity">{t('newProduct')}</Link>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                    {/* Review Column */}
                    <div className="flex-1 min-w-[300px] flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--warning)]"></div>
                                <h3 className="font-semibold text-[var(--text-main)]">{t('toReview')}</h3>
                                <span className="text-xs text-[var(--text-secondary)] bg-gray-100 px-2 py-0.5 rounded-full">{columns.review.length}</span>
                            </div>
                            {columns.review.length > 0 && (
                                <button
                                    onClick={() => exportProductsToJSON(columns.review, 'cozia-review-products')}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                    title={t('exportColumn')}
                                >
                                    <Download className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {columns.review.map((product) => (
                                <ProductCard key={product.id} product={product} t={t} onUpdate={() => router.refresh()} />
                            ))}
                        </div>
                    </div>

                    {/* Approved Column */}
                    <div className="flex-1 min-w-[300px] flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
                                <h3 className="font-semibold text-[var(--text-main)]">{t('approved')}</h3>
                                <span className="text-xs text-[var(--text-secondary)] bg-gray-100 px-2 py-0.5 rounded-full">{columns.approved.length}</span>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {columns.approved.map((product) => (
                                <ProductCard key={product.id} product={product} t={t} onUpdate={() => router.refresh()} />
                            ))}
                        </div>
                    </div>

                    {/* Rejected Column */}
                    <div className="flex-1 min-w-[300px] flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--error)]"></div>
                                <h3 className="font-semibold text-[var(--text-main)]">{t('rejected')}</h3>
                                <span className="text-xs text-[var(--text-secondary)] bg-gray-100 px-2 py-0.5 rounded-full">{columns.rejected.length}</span>
                            </div>
                        </div>
                        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {columns.rejected.map((product) => (
                                <ProductCard key={product.id} product={product} t={t} onUpdate={() => router.refresh()} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductCard({ product, t, onUpdate }: { product: Product, t: TranslateFunction, onUpdate: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const isSweetSpot = product.recommended_price >= 29 && product.recommended_price <= 39;
    const isLowMargin = product.profit_margin_percent < 60;

    const handleApprove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        await updateProductStatus(product.id, 'approved');
        setShowMenu(false);
        onUpdate();
        setLoading(false);
    };

    const handleReject = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        await updateProductStatus(product.id, 'rejected');
        setShowMenu(false);
        onUpdate();
        setLoading(false);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(t('confirmDelete'))) {
            setLoading(true);
            await deleteProduct(product.id);
            onUpdate();
            setLoading(false);
        }
        setShowMenu(false);
    };

    const [copied, setCopied] = useState(false);

    const handleCopyForAI = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const jsonData = {
            product_name: product.name,
            supplier_price: product.product_cost,
            shipping_cost: product.shipping_cost,
            selling_price: product.recommended_price,
            supplier_link: product.cj_url,
            description: product.notes || '',
            shipping_time_days: product.total_days_max
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <Link href={`/products/${product.id}`} className="block">
                <div className={`biz-card p-4 hover:ring-2 hover:ring-[var(--accent-black)]/5 group ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-[var(--text-secondary)] bg-gray-100 px-2 py-0.5 rounded">{product.category}</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    <h4 className="font-semibold text-[var(--text-main)] mb-3 line-clamp-2">{product.name}</h4>

                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <div className="text-xs text-[var(--text-secondary)]">{t('price')}</div>
                            <div className="font-bold text-[var(--text-main)]">${product.recommended_price}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-[var(--text-secondary)]">{t('margin')}</div>
                            <div className={`font-bold ${isLowMargin ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                                {product.profit_margin_percent}%
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        {isSweetSpot && (
                            <span className="text-[10px] font-bold bg-[var(--success)]/10 text-[var(--success)] px-2 py-0.5 rounded-full">
                                {t('sweetSpot')}
                            </span>
                        )}
                        {product.chinese_inventory && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                {t('chineseOnly')}
                            </span>
                        )}
                        <div className="ml-auto flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Calendar className="w-3 h-3" />
                            <span>{t('today')}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Dropdown Menu */}
            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    {/* Menu */}
                    <div className="absolute right-0 top-10 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px] animate-fade-in-up">
                        {product.status !== 'approved' && (
                            <button
                                onClick={handleApprove}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-gray-50 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                {t('quickApprove')}
                            </button>
                        )}
                        {product.status !== 'rejected' && (
                            <button
                                onClick={handleReject}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-gray-50 transition-colors"
                            >
                                <XCircle className="w-4 h-4 text-[var(--error)]" />
                                {t('quickReject')}
                            </button>
                        )}
                        <button
                            onClick={handleCopyForAI}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-gray-50 transition-colors"
                        >
                            <Copy className="w-4 h-4 text-blue-500" />
                            {copied ? t('copied') : t('copyForAI')}
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('quickDelete')}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
