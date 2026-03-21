import { Head, Link } from '@inertiajs/react';
import React from 'react';
import type {PropsWithChildren} from 'react';

export default function GuestLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    return (
        <>
            {title && <Head title={title} />}
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-4 font-sans sm:p-8">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100/50"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=')] mask-[linear-gradient(to_bottom,white,transparent)]"></div>
                <div className="relative z-10 w-full max-w-[420px]">
                    {children}
                </div>

                {/* Page Footer */}
                <div className="absolute bottom-6 left-0 right-0 hidden w-full items-center justify-between px-12 text-[10px] font-semibold tracking-wider text-slate-400 sm:flex">
                    <div>© 2024 CLOUDHUB INFRASTRUCTURE. ALL RIGHTS RESERVED.</div>
                    <div className="flex gap-8">
                        <Link href="#" className="transition-colors hover:text-slate-600">PRIVACY POLICY</Link>
                        <Link href="#" className="transition-colors hover:text-slate-600">TERMS OF SERVICE</Link>
                        <Link href="#" className="transition-colors hover:text-slate-600">HELP CENTER</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
