import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

interface BreadcrumbItem {
    name: string;
    hash: string | null;
}

interface BreadcrumbsProps {
    connectionId: number;
    breadcrumbs: BreadcrumbItem[];
}

export default function Breadcrumbs({ connectionId, breadcrumbs }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center space-x-1 text-sm font-medium text-slate-500">
            {breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && (
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" strokeWidth={2} />
                    )}
                    
                    <Link
                        // @ts-expect-error - Ziggy route global
                        href={route('clouds.browse', { connection: connectionId, hash: breadcrumb.hash })}
                        className={`
                            flex items-center gap-1.5 transition-colors 
                            hover:text-[#c12222] 
                            ${index === breadcrumbs.length - 1 ? 'font-bold text-slate-800' : 'text-slate-500'}
                        `}
                    >
                        {index === 0 && <Home className="h-4 w-4" />}
                        {breadcrumb.name}
                    </Link>
                </div>
            ))}
        </nav>
    );
}
