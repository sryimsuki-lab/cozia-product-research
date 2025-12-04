"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageToggle';
import { LayoutDashboard, PlusCircle, KanbanSquare, Users } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

export function Navigation() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const links = [
        { href: '/', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/products', label: t('allProducts'), icon: KanbanSquare },
        { href: '/submit', label: t('addNew'), icon: PlusCircle },
    ];

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
                <div className="flex justify-around items-center h-16">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive ? "text-[var(--accent-black)]" : "text-[var(--text-secondary)]"
                                )}
                            >
                                <Icon className={clsx("w-6 h-6", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Desktop Sidebar Navigation */}
            <nav className="hidden md:flex w-64 bg-white border-r border-gray-100 h-screen flex-col p-6 sticky top-0">
                <div className="mb-10 px-2">
                    <Image
                        src="/cozia-logo.png"
                        alt="COZIA"
                        width={120}
                        height={40}
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-[var(--accent-black)] text-white shadow-md"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--accent-gray)] hover:text-[var(--text-main)]"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-current")} />
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-3 px-4 py-3 text-[var(--text-secondary)]">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-[var(--text-main)]">Manith</span>
                            <span className="text-xs">{t('admin')}</span>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
