"use client";

import Link from 'next/link';
import { Plus, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useLanguage } from './LanguageToggle';
import type { DashboardStats, Product } from '@/lib/types';

export function DashboardClient({ stats }: { stats: DashboardStats }) {
    const { t } = useLanguage();

    // Calculate approval rate
    const totalDecided = stats.approved + stats.rejected;
    const approvalRate = totalDecided > 0 ? Math.round((stats.approved / totalDecided) * 100) : 0;

    return (
        <div className="space-y-8 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">{t('dashboard')}</h1>
                    <p className="text-[var(--text-secondary)] mt-1">{t('overview')}</p>
                </div>
                <Link href="/submit" className="biz-btn-primary flex items-center gap-2 shadow-lg shadow-black/5">
                    <Plus className="w-5 h-5" />
                    <span className="hidden md:inline">{t('addNew')}</span>
                    <span className="md:hidden">{t('newProduct')}</span>
                </Link>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart Card (Mockup) */}
                <div className="biz-card p-6 col-span-2 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-main)]">{t('newProducts')}</h3>
                            <p className="text-sm text-[var(--text-secondary)]">{t('last7Days')}</p>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-main)]">{stats.total}</div>
                    </div>

                    {/* CSS-only Bar Chart Mockup */}
                    <div className="flex items-end justify-between h-32 gap-4 mt-4 px-2">
                        {[40, 65, 45, 90, 30, 70, 55].map((h, i) => (
                            <div key={i} className="w-full bg-[var(--accent-gray)] rounded-t-lg relative group transition-all hover:bg-[var(--accent-black)]" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)] font-medium">
                        <span>{t('mon')}</span><span>{t('tue')}</span><span>{t('wed')}</span><span>{t('thu')}</span><span>{t('fri')}</span><span>{t('sat')}</span><span>{t('sun')}</span>
                    </div>
                </div>

                {/* Radial Chart Card (Mockup) */}
                <div className="biz-card p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t('approvalRate')}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{t('successfulProducts')}</p>
                    </div>

                    <div className="relative w-40 h-40 mx-auto my-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="var(--accent-gray)" strokeWidth="12" fill="transparent" />
                            <circle cx="80" cy="80" r="70" stroke="var(--accent-black)" strokeWidth="12" fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * approvalRate) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-3xl font-bold text-[var(--text-main)]">{approvalRate}%</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
                            <span className="text-[var(--text-secondary)]">{t('approved')}</span>
                        </div>
                        <span className="font-semibold">{stats.approved}</span>
                    </div>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="biz-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--warning)]/10 flex items-center justify-center text-[var(--warning)]">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.review}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{t('pendingReview')}</div>
                        </div>
                    </div>
                    <Link href="/products" className="text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="biz-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center text-[var(--success)]">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.approved}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{t('approved')}</div>
                        </div>
                    </div>
                    <Link href="/products" className="text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="biz-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{stats.rejected}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{t('rejected')}</div>
                        </div>
                    </div>
                    <Link href="/products" className="text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Recent Submissions Table Style */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">{t('recentActivity')}</h2>
                    <Link href="/products" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)]">{t('viewAll')}</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.recent.map((product: Product) => (
                        <Link key={product.id} href={`/products/${product.id}`} className="biz-card p-4 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${product.status === 'approved' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                                    product.status === 'rejected' ? 'bg-[var(--error)]/10 text-[var(--error)]' :
                                        'bg-[var(--warning)]/10 text-[var(--warning)]'
                                    }`}>
                                    {t(product.status === 'review' ? 'needsReview' : product.status)}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--text-main)] transition-colors" />
                            </div>
                            <h3 className="font-semibold text-[var(--text-main)] mb-1 truncate">{product.name}</h3>
                            <div className="flex justify-between items-end">
                                <div className="text-sm text-[var(--text-secondary)]">{t('price')}</div>
                                <div className="font-bold text-[var(--text-main)]">${product.recommended_price}</div>
                            </div>
                        </Link>
                    ))}
                    {stats.recent.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            {t('noProductsFound')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
