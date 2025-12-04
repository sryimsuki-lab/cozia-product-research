"use client";

import Link from 'next/link';
import { CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { useLanguage } from './LanguageToggle';
import { AIAnalysis } from './AIAnalysis';
import type { Product } from '@/lib/types';

interface ProductDetailProps {
    product: Product;
}

export function ProductDetailClient({ product }: ProductDetailProps) {
    const { t } = useLanguage();

    const statusColor =
        product.status === 'approved' ? 'text-[var(--success)] bg-[var(--success)]/10' :
            product.status === 'rejected' ? 'text-[var(--error)] bg-[var(--error)]/10' :
                'text-[var(--warning)] bg-[var(--warning)]/10';

    const isSweetSpot = product.recommended_price >= 29 && product.recommended_price <= 39;
    const isLowMargin = product.profit_margin_percent < 60;

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            <Link href="/products" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToProducts')}
            </Link>

            {/* Header Card */}
            <div className="biz-card p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-main)]">{product.name}</h1>
                        <span className="inline-block mt-2 text-xs font-medium text-[var(--text-secondary)] bg-gray-100 px-2 py-1 rounded">
                            {product.category}
                        </span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${statusColor}`}>
                        {t(product.status)}
                    </div>
                </div>

                <a
                    href={product.cj_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-black)] hover:underline font-medium"
                >
                    {t('viewOnCJ')}
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            {/* AI Analysis */}
            {product.ai_scores && (
                <AIAnalysis
                    loading={false}
                    analysis={{
                        scores: product.ai_scores,
                        overall_score: product.ai_overall_score ?? 0,
                        recommendation: (product.ai_recommendation as 'APPROVE' | 'REVIEW' | 'REJECT') ?? 'REVIEW',
                        explanation_en: product.ai_explanation_en ?? '',
                        explanation_kh: product.ai_explanation_kh ?? ''
                    }}
                />
            )}

            {/* Validation Results */}
            <div className="biz-card p-6">
                <h2 className="font-bold text-lg mb-4 text-[var(--text-main)]">{t('validation')}</h2>
                <div className="space-y-3">
                    <ValidationRow
                        passed={product.us_warehouse}
                        label={t('usWarehouse')}
                    />
                    <ValidationRow
                        passed={product.total_days_max <= 12}
                        label={`${t('shippingTimeLabel')} (${product.total_days_max} ${t('days')})`}
                    />
                    <ValidationRow
                        passed={product.min_selling_price >= 25 && product.min_selling_price <= 100}
                        label={`${t('priceRangeLabel')} ($${product.min_selling_price} - $100)`}
                    />
                    <ValidationRow
                        passed={product.inventory_count >= 50}
                        label={`${t('inventoryLabel')} (${product.inventory_count} ${t('units')})`}
                    />
                </div>

                {product.rejection_reasons && product.rejection_reasons.length > 0 && (
                    <div className="mt-4 p-4 bg-[var(--error)]/10 rounded-lg border border-[var(--error)]/20">
                        <strong className="text-[var(--error)] text-sm">{t('rejectionReasonsTitle')}:</strong>
                        <ul className="mt-2 text-sm text-[var(--error)] list-disc list-inside space-y-1">
                            {product.rejection_reasons.map((r: string) => (
                                <li key={r}>{t(`rejectionReasons.${r}`) || r}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Financials Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Costs */}
                <div className="biz-card p-6">
                    <h2 className="font-bold text-lg mb-4 text-[var(--text-main)]">{t('costsSection')}</h2>
                    <div className="space-y-3 text-sm">
                        <FinancialRow label={t('productCost')} value={`$${product.product_cost}`} />
                        <FinancialRow label={t('shippingCost')} value={`$${product.shipping_cost}`} />
                        <FinancialRow label={t('lastMileFee')} value={`$${product.lastmile_fee}`} />
                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                            <span className="text-[var(--text-main)]">{t('totalCost')}</span>
                            <span className="text-[var(--text-main)]">${product.total_cost}</span>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="biz-card p-6">
                    <h2 className="font-bold text-lg mb-4 text-[var(--text-main)]">{t('pricingSection')}</h2>
                    <div className="space-y-3 text-sm">
                        <FinancialRow label={t('minSellingPrice')} value={`$${product.min_selling_price}`} />
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">{t('recommendedPriceLabel')}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-[var(--text-main)]">${product.recommended_price}</span>
                                {isSweetSpot && (
                                    <span className="bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {t('sweetSpot')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <FinancialRow
                            label={t('profitPerSale')}
                            value={`$${product.profit_per_sale}`}
                            valueClass="text-[var(--success)]"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">{t('margin')}</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${isLowMargin ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                                    {product.profit_margin_percent}%
                                </span>
                                {isLowMargin && (
                                    <span className="text-[10px] text-[var(--warning)] font-bold bg-[var(--warning)]/10 px-2 py-0.5 rounded-full">
                                        {t('lowMargin')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ValidationRow({ passed, label }: { passed: boolean; label: string }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            {passed ? (
                <CheckCircle className="text-[var(--success)] w-5 h-5 flex-shrink-0" />
            ) : (
                <XCircle className="text-[var(--error)] w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-[var(--text-main)] text-sm">{label}</span>
        </div>
    );
}

function FinancialRow({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className={valueClass || 'text-[var(--text-main)]'}>{value}</span>
        </div>
    );
}
