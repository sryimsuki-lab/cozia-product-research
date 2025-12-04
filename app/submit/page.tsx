"use client";

import { ProductForm } from '@/components/ProductForm';
import { useLanguage } from '@/components/LanguageToggle';

export default function SubmitPage() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <h1 className="text-2xl font-bold text-[var(--text-main)]">{t('submitProduct')}</h1>
            <ProductForm />
        </div>
    );
}
