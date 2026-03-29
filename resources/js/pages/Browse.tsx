import { Head, Link } from '@inertiajs/react';
import { 
    Upload, 
    Plus, 
    Share2, 
    Trash2, 
    Copy, 
    Move, 
    Search,
    ChevronLeft
} from 'lucide-react';
import React from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import FileTable from '@/components/FileTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/AppLayout';

interface Provider {
    id: string;
    name: string;
    icon: string;
}

interface CloudConnection {
    id: number;
    provider_id: string;
    name: string;
    provider: Provider;
}

interface PageProps {
    connection: CloudConnection;
    currentPath: string;
    currentHash: string | null;
    files: any[];
    breadcrumbs: any[];
    error?: string;
}

export default function Browse({ connection, files, breadcrumbs, error }: PageProps) {
    return (
        <AppLayout title={`${connection.name} - Browse`}>
            <Head title={`${connection.name} - Browse`} />

            <div className="flex flex-col gap-8 p-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Link 
                                // @ts-expect-error - Ziggy route global
                                href={route('home')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-[#c12222] hover:text-[#c12222] transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                                {connection.name}
                            </h1>
                        </div>
                        <Breadcrumbs 
                            connectionId={connection.id} 
                            breadcrumbs={breadcrumbs} 
                        />
                    </div>

                    <div className="flex items-center gap-3">
                         <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c12222] transition-colors" />
                            <Input 
                                placeholder="Search files..." 
                                className="h-11 w-64 rounded-xl border-slate-100 bg-slate-50 pl-10 text-[13px] ring-[#c12222] focus:ring-1 focus:border-[#c12222]" 
                            />
                        </div>

                        <div className="flex items-center rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#c12222]">
                                <Move className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#c12222]">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#c12222]">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="mx-1 h-4 w-px bg-slate-100" />
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#c12222]">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button className="h-11 gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                            <Plus className="h-4 w-4" />
                            New Folder
                        </Button>

                        <Button className="h-11 gap-2 rounded-xl bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md hover:bg-[#a31c1c] active:scale-[0.98]">
                            <Upload className="h-4 w-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                {error ? (
                    <div className="rounded-[20px] bg-red-50 p-6 text-center text-red-600 border border-red-100 shadow-sm">
                        <p className="font-semibold mb-2">Error connecting to storage</p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                ) : (
                    <FileTable 
                        connectionId={connection.id} 
                        files={files} 
                    />
                )}
            </div>
        </AppLayout>
    );
}
