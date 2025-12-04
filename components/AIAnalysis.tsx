"use client";

import React from 'react';
import { useLanguage } from './LanguageToggle';
import { Sparkles, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface AIAnalysisProps {
    analysis: {
        scores: {
            cozy: number;
            minimalist: number;
            home_relevance: number;
            quality: number;
            year_round: number;
        };
        overall_score: number;
        recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
        explanation_en: string;
        explanation_kh: string;
    } | null;
    loading: boolean;
}

export function AIAnalysis({ analysis, loading }: AIAnalysisProps) {
    const { language, t } = useLanguage();

    if (loading) {
        return (
            <div className="biz-card p-6 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[var(--accent-black)]" />
                    <h3 className="font-semibold text-[var(--text-main)]">{t('aiBrandAnalysis')}</h3>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!analysis) return null;

    const getStatusColor = (rec: string) => {
        switch (rec) {
            case 'APPROVE': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
            case 'REJECT': return 'text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/20';
            default: return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
        }
    };

    const getIcon = (rec: string) => {
        switch (rec) {
            case 'APPROVE': return <CheckCircle className="w-5 h-5" />;
            case 'REJECT': return <XCircle className="w-5 h-5" />;
            default: return <AlertTriangle className="w-5 h-5" />;
        }
    };

    const getStatusText = (rec: string) => {
        switch (rec) {
            case 'APPROVE': return t('approved');
            case 'REJECT': return t('rejected');
            default: return t('needsReview');
        }
    };

    const scoreLabels: Record<string, string> = {
        cozy: t('aiScoreLabels.cozy'),
        minimalist: t('aiScoreLabels.minimalist'),
        home_relevance: t('aiScoreLabels.home_relevance'),
        quality: t('aiScoreLabels.quality'),
        year_round: t('aiScoreLabels.year_round')
    };

    return (
        <div className="biz-card p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--accent-black)]" />
                    <h3 className="font-semibold text-[var(--text-main)]">{t('aiBrandAnalysis')}</h3>
                </div>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold text-sm ${getStatusColor(analysis.recommendation)}`}>
                    {getIcon(analysis.recommendation)}
                    <span>{getStatusText(analysis.recommendation)}</span>
                </div>
            </div>

            {/* Overall Score */}
            <div className="mb-6 text-center md:text-left">
                <div className="text-4xl font-bold text-[var(--text-main)] mb-1">{analysis.overall_score}/10</div>
                <p className="text-sm text-[var(--text-secondary)]">{t('overallBrandFitScore')}</p>
            </div>

            {/* Score Bars */}
            <div className="grid grid-cols-5 gap-3 mb-6">
                {Object.entries(analysis.scores).map(([key, score]) => (
                    <div key={key} className="text-center">
                        <div className="h-20 w-full bg-gray-100 rounded-lg relative overflow-hidden mb-2">
                            <div
                                className="absolute bottom-0 left-0 w-full bg-[var(--accent-black)] transition-all duration-700 ease-out"
                                style={{ height: `${(score as number) * 10}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-[var(--text-main)] mix-blend-difference">{score}</span>
                            </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block truncate">
                            {scoreLabels[key] || key.replace('_', ' ')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Explanation */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-[var(--text-main)] text-sm leading-relaxed">
                    {language === 'en' ? analysis.explanation_en : analysis.explanation_kh}
                </p>
            </div>
        </div>
    );
}
