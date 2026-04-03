import { Link, router } from '@inertiajs/react';
import { MoreHorizontal, Share2, Copy, Move, Trash2, Info, Loader2, OctagonAlert, X, Download } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FileIcon from './FileIcon';

interface FileItem {
    id: string;
    name: string;
    path: string;
    hash: string | null;
    type: string;
    mime_type: string | null;
    size: number | null;
    last_modified: string | null;
    extension: string;
}

interface FileTableProps {
    connectionId: number;
    files: FileItem[];
}

export default function FileTable({ connectionId, files }: FileTableProps) {
    const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!fileToDelete) {
            return;
        }
        
        setIsDeleting(true);
        // @ts-expect-error - Ziggy route global
        router.delete(route('clouds.files.destroy', { connection: connectionId }), {
            data: { path: fileToDelete.path, type: fileToDelete.type },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`"${fileToDelete.name}" deleted successfully.`);
                setFileToDelete(null);
            },
            onError: () => {
                toast.error(`Failed to delete "${fileToDelete.name}".`);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const formatSize = (bytes: number | null) => {
        if (bytes === null) {
            return '--';
        }

        if (bytes === 0) {
            return '0 B';
        }

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) {
            return '--';
        }

        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today';
        }

        if (days === 1) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year:
                date.getFullYear() !== now.getFullYear()
                    ? 'numeric'
                    : undefined,
        });
    };

    const getFileTypeLabel = (item: FileItem) => {
        if (item.type === 'dir') {
            return 'Folder';
        }

        const ext = item.extension.toUpperCase();

        if (['JPG', 'PNG', 'GIF', 'SVG', 'WEBP'].includes(ext)) {
            return 'Image';
        }

        if (['MP4', 'MOV', 'AVI'].includes(ext)) {
            return 'Video';
        }

        if (['MP3', 'WAV'].includes(ext)) {
            return 'Audio';
        }

        if (['ZIP', 'RAR', '7Z'].includes(ext)) {
            return 'Compressed';
        }

        if (ext === 'PDF') {
            return 'PDF Document';
        }

        if (['DOC', 'DOCX'].includes(ext)) {
            return 'Word Document';
        }

        return ext ? `${ext} File` : 'File';
    };

    return (
        <div className="flex-1 overflow-auto rounded-lg border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50/90 backdrop-blur-sm">
                        <th className="border-b border-slate-100 px-3 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Name
                        </th>
                        <th className="border-b border-slate-100 px-3 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Size
                        </th>
                        <th className="border-b border-slate-100 px-3 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Type
                        </th>
                        <th className="border-b border-slate-100 px-3 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Last Modified
                        </th>
                        <th className="border-b border-slate-100 px-3 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {files.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-slate-400"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Info className="h-8 w-8 text-slate-200" />
                                    <p className="text-[13px]">
                                        This folder is empty
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        files.map((file) => (
                            <tr
                                key={file.id}
                                className="group transition-colors hover:bg-slate-50/50"
                            >
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-4">
                                        <FileIcon
                                            type={file.type}
                                            extension={file.extension}
                                        />
                                        {file.type === 'dir' ? (
                                            <Link
                                                // @ts-expect-error - Ziggy route global
                                                href={route('clouds.browse', {
                                                    connection: connectionId,
                                                    hash: file.hash,
                                                })}
                                                className="text-[12px] font-semibold text-slate-700 transition-colors hover:text-[#c12222]"
                                            >
                                                {file.name}
                                            </Link>
                                        ) : (
                                            <span className="text-[12px] font-semibold text-slate-700">
                                                {file.name}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-[11px] text-slate-500">
                                    {formatSize(file.size)}
                                </td>
                                <td className="px-3 py-2">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                        {getFileTypeLabel(file)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-[11px] text-slate-500">
                                    {formatDate(file.last_modified)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        {file.type !== 'dir' && (
                                            <a
                                                // @ts-expect-error - Ziggy route global
                                                href={route('clouds.files.download', {
                                                    connection: connectionId,
                                                    hash: file.hash,
                                                })}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Download"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100/50 hover:text-[#c12222]"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-[#c12222]"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setFileToDelete(file)}
                                            className="h-8 w-8 text-slate-400 hover:text-[#c12222]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-48 rounded-xl border-slate-100 shadow-xl"
                                            >
                                                <DropdownMenuItem className="gap-2 rounded-lg py-2.5 text-[13px]">
                                                    <Move className="h-4 w-4" />{' '}
                                                    Move to...
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 rounded-lg py-2.5 text-[13px]">
                                                    <Share2 className="h-4 w-4" />{' '}
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => setFileToDelete(file)}
                                                    className="gap-2 rounded-lg py-2.5 text-[13px] text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />{' '}
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && !isDeleting && setFileToDelete(null)}>
                <AlertDialogContent className="max-w-[400px] gap-0 border-0 p-0 sm:rounded-[24px]">
                    <div className="relative p-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            onClick={() => !isDeleting && setFileToDelete(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="flex flex-col items-center gap-4 pt-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-red-50">
                                <OctagonAlert className="h-8 w-8 text-[#c12222]" />
                            </div>

                            <div className="space-y-2 text-center">
                                <AlertDialogTitle className="text-[20px] font-bold text-slate-900">
                                    Delete {fileToDelete?.type === 'dir' ? 'Folder' : 'File'}?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-[14px] leading-relaxed text-slate-500">
                                    Are you sure you want to delete <strong>"{fileToDelete?.name}"</strong>? This action cannot be undone and will permanently remove it from your cloud storage.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </div>

                    <AlertDialogFooter className="flex flex-row items-center gap-3 border-t border-slate-50 bg-slate-50/30 p-6">
                        <AlertDialogCancel asChild>
                            <Button
                                variant="outline"
                                disabled={isDeleting}
                                className="h-12 flex-1 rounded-xl border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 mt-0"
                            >
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-12 flex-1 rounded-xl bg-[#c12222] text-[14px] font-bold text-white shadow-lg shadow-red-500/10 hover:bg-[#a31c1c] mt-0"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
