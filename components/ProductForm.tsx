"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageToggle';
import { translations } from '@/lib/translations';
import { calculatePricing, calculateShipping } from '@/lib/calculations';
import { validateProduct, ValidationResult } from '@/lib/validation';
import { submitProduct } from '@/lib/database';
import { analyzeProduct } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { DuplicateCheckResult } from '@/lib/types';

interface Calculations {
    totalCost: number;
    minSellingPrice: number;
    recommendedPrice: number;
    profitPerSale: number;
    profitMarginPercent: number;
    isCostTooHigh: boolean;
    total_days_min: number;
    total_days_max: number;
}

export function ProductForm() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [formData, setFormData] = useState({
        cj_url: '',
        name: '',
        category: 'other',
        product_cost: 0,
        shipping_cost: 0,
        lastmile_fee: 0,
        processing_days_min: 1,
        processing_days_max: 3,
        delivery_days_min: 3,
        delivery_days_max: 8,
        us_warehouse: false,
        chinese_inventory: false,
        inventory_count: 0,
        images: [] as string[],
        notes: '',
        submitted_by: '',
    });

    const [calculations, setCalculations] = useState<Calculations | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    // Auto-calculate whenever relevant fields change
    useEffect(() => {
        const pricing = calculatePricing(
            Number(formData.product_cost),
            Number(formData.shipping_cost),
            Number(formData.lastmile_fee)
        );

        const shippingTimes = calculateShipping(
            Number(formData.processing_days_min),
            Number(formData.processing_days_max),
            Number(formData.delivery_days_min),
            Number(formData.delivery_days_max)
        );

        setCalculations({ ...pricing, total_days_min: shippingTimes.min, total_days_max: shippingTimes.max });

        const valResult = validateProduct({
            us_warehouse: formData.us_warehouse,
            total_days_max: shippingTimes.max,
            min_selling_price: pricing.minSellingPrice,
            inventory_count: Number(formData.inventory_count),
            recommended_price: pricing.recommendedPrice,
            total_cost: pricing.totalCost,
        });

        setValidation(valResult);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(val) : val
        }));
    };

    // Duplicate check state
    const [duplicateCheck, setDuplicateCheck] = useState<{
        checking: boolean;
        result: DuplicateCheckResult | null;
        dismissed: boolean;
    }>({ checking: false, result: null, dismissed: false });

    const checkForDuplicates = async () => {
        if (!formData.cj_url || !formData.name) return null;

        setDuplicateCheck({ checking: true, result: null, dismissed: false });

        const { checkDuplicate } = await import('@/lib/database');
        const result = await checkDuplicate(formData.cj_url, formData.name);

        setDuplicateCheck({ checking: false, result, dismissed: false });
        return result;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Form submission started", formData);

        // 0. Check for duplicates first
        const dupResult = await checkForDuplicates();
        console.log("Duplicate check result:", dupResult);
        if (dupResult?.isDuplicate && dupResult?.type === 'exact') {
            console.log("Blocked: Exact duplicate found");
            setLoading(false);
            return; // Block submission for exact duplicates
        }

        // If similar found and not dismissed, stop and let user see warning
        if (dupResult?.type === 'similar' && !duplicateCheck.dismissed) {
            console.log("Blocked: Similar product found, waiting for user to dismiss");
            setLoading(false);
            return;
        }

        // 1. Basic Validation
        console.log("Validation result:", validation);
        if (!validation || !validation.passed) {
            console.log("Blocked: Validation failed", validation?.reasons);
            setLoading(false);
            return; // Stop if validation fails
        }

        // 2. Ensure calculations exist
        if (!calculations) {
            console.log("Blocked: No calculations");
            setLoading(false);
            return;
        }

        // 3. AI Analysis (if validation passed)
        let aiResult = null;
        try {
            console.log("Starting AI analysis...");
            aiResult = await analyzeProduct({
                name: formData.name,
                category: formData.category,
                recommended_price: calculations.recommendedPrice,
                images: formData.images.length > 0 ? formData.images : ['placeholder']
            });
            console.log("AI analysis complete:", aiResult);
        } catch (err) {
            console.error("AI Analysis failed", err);
        }

        // 4. Determine Final Status
        let status = 'review';
        if (aiResult?.recommendation === 'APPROVE') status = 'approved';
        if (aiResult?.recommendation === 'REJECT') status = 'rejected';
        // If AI fails or returns null (no key), status remains 'review' (or 'approved' based on validation?)
        // Let's default to 'approved' if validation passed and AI is missing/skipped, 
        // BUT for a "professional" tool, maybe 'review' is safer if AI didn't check it.
        if (!aiResult) status = 'review';

        const payload = {
            ...formData,
            // Map calculations to Prisma schema (snake_case)
            total_cost: calculations.totalCost,
            min_selling_price: calculations.minSellingPrice,
            recommended_price: calculations.recommendedPrice,
            profit_per_sale: calculations.profitPerSale,
            profit_margin_percent: calculations.profitMarginPercent,
            total_days_max: calculations.total_days_max,

            validation_passed: validation.passed,
            rejection_reasons: validation.reasons,
            status,
            images: formData.images.length > 0 ? formData.images : ["https://placehold.co/400"],
            ai_scores: aiResult ? aiResult.scores : null,
            ai_overall_score: aiResult ? aiResult.overall_score : null,
            ai_recommendation: aiResult ? aiResult.recommendation : null,
            ai_explanation_en: aiResult ? aiResult.explanation_en : null,
            ai_explanation_kh: aiResult ? aiResult.explanation_kh : null,
        };

        const result = await submitProduct(payload);

        if (result.success) {
            router.push('/');
        } else {
            console.error("Submit failed:", result);
            alert(`${t('error')}: ${result.error || 'Unknown error'}`);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-sage/10">

            {/* URL & Name */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('productUrl')} *</label>
                    <input
                        required
                        type="url"
                        name="cj_url"
                        value={formData.cj_url}
                        onChange={handleChange}
                        pattern="https://.*(cjdropshipping\.com|aliexpress\.com)/.*"
                        title="Must be a valid CJDropshipping or AliExpress URL"
                        className="w-full p-2 border rounded-lg"
                        placeholder="https://cjdropshipping.com/... or https://aliexpress.com/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('productName')} *</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
            </div>

            {/* Duplicate Warning */}
            {duplicateCheck.checking && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">{t('checkingDuplicate')}</span>
                </div>
            )}

            {duplicateCheck.result?.type === 'exact' && duplicateCheck.result.existingProduct && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-[var(--error)] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-[var(--error)]">{t('duplicateFound')}</h4>
                            <p className="text-sm text-red-700 mt-1">{t('duplicateExact')}</p>
                            <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
                                <p className="font-medium text-gray-900">{duplicateCheck.result.existingProduct.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('submittedBy')} {duplicateCheck.result.existingProduct.submitted_by} {t('submittedOn')} {new Date(duplicateCheck.result.existingProduct.submitted_at).toLocaleDateString()}
                                </p>
                            </div>
                            <a
                                href={`/products/${duplicateCheck.result.existingProduct.id}`}
                                className="inline-block mt-3 text-sm font-medium text-[var(--error)] hover:underline"
                            >
                                {t('viewExisting')} →
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {duplicateCheck.result?.type === 'similar' && !duplicateCheck.dismissed && duplicateCheck.result.existingProduct && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-700">{t('duplicateSimilar')}</h4>
                            <div className="mt-3 p-3 bg-white rounded-lg border border-amber-100">
                                <p className="font-medium text-gray-900">{duplicateCheck.result.existingProduct.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('submittedBy')} {duplicateCheck.result.existingProduct.submitted_by}
                                </p>
                            </div>
                            <div className="flex gap-3 mt-3">
                                <a
                                    href={`/products/${duplicateCheck.result.existingProduct.id}`}
                                    className="text-sm font-medium text-amber-700 hover:underline"
                                >
                                    {t('viewExisting')}
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setDuplicateCheck(prev => ({ ...prev, dismissed: true }))}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                >
                                    {t('continueAnyway')} →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category */}
            <div>
                <label className="block text-sm font-medium mb-1">{t('category')} *</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg">
                    {Object.keys(translations.en.categories).map((key) => (
                        <option key={key} value={key}>
                            {language === 'en'
                                ? (translations.en.categories as Record<string, string>)[key]
                                : (translations.kh.categories as Record<string, string>)[key]}
                        </option>
                    ))}
                </select>
            </div>

            {/* Costs */}
            <div className="bg-cream/50 p-4 rounded-lg border border-sage/10">
                <h3 className="font-semibold mb-3 text-sage-dark flex justify-between items-center">
                    <span>{t('costs')} (USD)</span>
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">{t('productCost')}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                required
                                type="number"
                                step="0.01"
                                name="product_cost"
                                value={formData.product_cost || ''}
                                onChange={handleChange}
                                className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">{t('shippingCost')}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                required
                                type="number"
                                step="0.01"
                                name="shipping_cost"
                                value={formData.shipping_cost || ''}
                                onChange={handleChange}
                                className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced Costs Toggle */}
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs text-sage hover:text-sage-dark flex items-center gap-1 font-medium"
                    >
                        {showAdvanced ? `− ${t('hideExtraFees')}` : `+ ${t('addExtraFees')}`}
                    </button>

                    {showAdvanced && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-medium text-charcoal/70 mb-1">{t('lastMileFee')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="lastmile_fee"
                                    value={formData.lastmile_fee || ''}
                                    onChange={handleChange}
                                    className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition-all bg-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{t('hiddenFeesNote')}</p>
                        </div>
                    )}
                </div>

                {calculations && (
                    <div className="pt-3 border-t border-sage/10 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-charcoal/70">{t('totalCost')}</span>
                            <span className="text-base font-medium text-charcoal">${calculations.totalCost}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-charcoal/70">{t('recPrice')}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-sage-dark">${calculations.recommendedPrice}</span>
                                {validation?.checks?.sweetSpot && (
                                    <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/20">
                                        {t('sweetSpot')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Warnings */}
                        {calculations.isCostTooHigh && (
                            <div className="text-xs text-warning bg-warning/10 p-2 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t('costTooHigh')}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-charcoal/50">{t('profit')}</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${validation?.checks?.lowMargin ? 'text-warning' : 'text-sage'}`}>
                                    ${calculations.profitPerSale} ({calculations.profitMarginPercent}%)
                                </span>
                                {validation?.checks?.lowMargin && (
                                    <span className="text-[10px] text-warning font-bold">LOW MARGIN</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Shipping & Inventory */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-3 text-sage-dark">{t('shippingTime')}</h3>

                    {/* Processing Range */}
                    <div className="mb-3">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t('processingTime')}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="processing_days_min"
                                value={formData.processing_days_min}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-sage focus:border-transparent"
                                placeholder={t('min')}
                            />
                            <span className="text-gray-400 font-bold">-</span>
                            <input
                                type="number"
                                name="processing_days_max"
                                value={formData.processing_days_max}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-sage focus:border-transparent"
                                placeholder={t('max')}
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">{t('days')}</span>
                        </div>
                    </div>

                    {/* Delivery Range */}
                    <div className="mb-3">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t('deliveryTime')}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="delivery_days_min"
                                value={formData.delivery_days_min}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-sage focus:border-transparent"
                                placeholder={t('min')}
                            />
                            <span className="text-gray-400 font-bold">-</span>
                            <input
                                type="number"
                                name="delivery_days_max"
                                value={formData.delivery_days_max}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-sage focus:border-transparent"
                                placeholder={t('max')}
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">{t('days')}</span>
                        </div>
                    </div>

                    <div className="mt-2 text-center text-sm font-bold text-sage-dark bg-sage/10 py-2 rounded-lg border border-sage/20">
                        {t('total')}: {calculations?.total_days_min} - {calculations?.total_days_max} {t('days')}
                    </div>

                    <div className="mt-4 space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input type="checkbox" name="us_warehouse" checked={formData.us_warehouse} onChange={handleChange} className="w-5 h-5 text-sage rounded focus:ring-sage" />
                            <span className="font-medium text-charcoal">{t('usWarehouse')}</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200">
                            <input type="checkbox" name="chinese_inventory" checked={formData.chinese_inventory} onChange={handleChange} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                            <span className="font-medium text-amber-700">{t('chineseInventory')}</span>
                        </label>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-3 text-sage-dark">{t('inventory')}</h3>
                    <input required type="number" name="inventory_count" value={formData.inventory_count} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
            </div>

            {/* Live Validation Feedback */}
            {validation && (
                <div className={`p-4 rounded-lg border ${validation.passed ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
                    <h3 className="font-bold flex items-center gap-2">
                        {validation.passed ? <CheckCircle className="text-success w-5 h-5" /> : <XCircle className="text-error w-5 h-5" />}
                        {validation.passed ? t('success') : t('error')}
                    </h3>
                    {!validation.passed && (
                        <ul className="mt-2 text-sm text-error list-disc list-inside">
                            {validation.reasons.map((reason: string) => (
                                <li key={reason}>{t(`rejectionReasons.${reason}`)}</li>
                            ))}
                        </ul>
                    )}
                    {validation.passed && calculations && (
                        <div className="mt-2 text-sm text-success">
                            <div>{t('recPrice')}: ${calculations.recommendedPrice}</div>
                            <div>{t('profit')}: ${calculations.profitPerSale} ({calculations.profitMarginPercent}%)</div>
                        </div>
                    )}
                </div>
            )}

            {/* Submit */}
            <div className="pt-4">
                <label className="block text-sm font-medium mb-1">{t('yourName')}</label>
                <input required name="submitted_by" value={formData.submitted_by} onChange={handleChange} className="w-full p-2 border rounded-lg mb-4" />

                <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: 'var(--sage, #6B8E6B)' }}
                    className="w-full hover:opacity-90 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin w-5 h-5" />}
                    {t('submit')}
                </button>
            </div>

        </form>
    );
}
