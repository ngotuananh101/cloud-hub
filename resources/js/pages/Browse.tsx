import { Head } from '@inertiajs/react';
import { Upload, Plus, Share2, Trash2, Copy, Move, Search } from 'lucide-react';
import React from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import FileTable from '@/components/FileTable';
import NewFolderModal from '@/components/NewFolderModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UploadModal from '@/components/UploadModal';
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

export default function Browse({
    connection,
    currentPath,
    currentHash,
    files,
    breadcrumbs,
    error,
}: PageProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] =
        React.useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

    const filteredFiles = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return files;
        }

        return files.filter((file) =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [files, searchQuery]);

    return (
        <AppLayout title={`${connection.name} - Browse`}>
            <Head title={`${connection.name} - Browse`} />

            <div className="flex h-full flex-col gap-4 overflow-hidden">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-medium tracking-tight text-slate-800">
                                {connection.name}
                            </h1>
                        </div>
                        <Breadcrumbs
                            connectionId={connection.id}
                            breadcrumbs={breadcrumbs}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="group relative mr-2">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#c12222]" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-64 rounded-xl border-slate-100 bg-slate-50 pl-10 text-[13px] ring-[#c12222] focus:border-[#c12222] focus:ring-1"
                            />
                        </div>
                        <Button
                            onClick={() => setIsNewFolderModalOpen(true)}
                            className="h-11 gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            <Plus className="h-4 w-4" />
                            New Folder
                        </Button>

                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="h-11 gap-2 rounded-xl bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md hover:bg-[#a31c1c] active:scale-[0.98]"
                        >
                            <Upload className="h-4 w-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                {error ? (
                    <div className="rounded-[20px] border border-red-100 bg-red-50 p-6 text-center text-red-600 shadow-sm">
                        <p className="mb-2 font-semibold">
                            Error connecting to storage
                        </p>
                        <p className="text-sm opacity-80">{error}</p>
                    </div>
                ) : (
                    <FileTable
                        connectionId={connection.id}
                        files={filteredFiles}
                    />
                )}
            </div>

            <NewFolderModal
                isOpen={isNewFolderModalOpen}
                onClose={() => setIsNewFolderModalOpen(false)}
                connectionId={connection.id}
                currentHash={currentHash}
            />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                connectionId={connection.id}
                currentHash={currentHash}
            />
        </AppLayout>
    );
}
