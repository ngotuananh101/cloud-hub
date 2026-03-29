import { useForm, usePage } from '@inertiajs/react';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Provider {
    id: string;
    name: string;
    icon: string;
    icon_url: string;
}

interface CloudConnection {
    id: number;
    provider_id: string;
    name: string;
    provider: Provider;
}

interface ManageConnectionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ManageConnectionsModal({
    open,
    onOpenChange,
}: ManageConnectionsModalProps) {
    const { cloudConnections } = usePage<{
        cloudConnections: CloudConnection[];
    }>().props;

    const [editingId, setEditingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const renameForm = useForm({
        name: '',
    });

    const deleteForm = useForm({});

    const startEditing = (conn: CloudConnection) => {
        setEditingId(conn.id);
        renameForm.setData('name', conn.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        renameForm.reset();
    };

    const handleRename = (id: number) => {
        renameForm.patch(route('cloud-connections.update', id), {
            onSuccess: () => {
                setEditingId(null);
                toast.success('Connection renamed successfully');
            },
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        deleteForm.delete(route('cloud-connections.destroy', id), {
            onSuccess: () => {
                setConfirmDeleteId(null);
                toast.success('Connection removed successfully');
            },
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[80vh] min-w-[500px] flex-col overflow-hidden p-0 sm:max-w-[550px] sm:rounded-[20px]">
                <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <DialogTitle className="text-[16px] font-bold text-slate-800">
                            Manage Connections
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-slate-500">
                            Rename or remove your connected cloud accounts.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
                    {cloudConnections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Trash2 className="mb-2 h-8 w-8 opacity-20" />
                            <p className="text-[13px]">No accounts connected yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {cloudConnections.map((conn) => (
                                <div
                                    key={conn.id}
                                    className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="flex flex-1 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
                                            <img
                                                src={conn.provider.icon_url}
                                                alt={conn.provider.name}
                                                className="h-6 w-6"
                                            />
                                        </div>

                                        {editingId === conn.id ? (
                                            <div className="flex flex-1 items-center gap-2">
                                                <Input
                                                    value={renameForm.data.name}
                                                    onChange={(e) =>
                                                        renameForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 py-1 text-[13px] focus-visible:ring-[#c12222]"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleRename(conn.id);
                                                        }

                                                        if (e.key === 'Escape') {
                                                            cancelEditing();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                    onClick={() =>
                                                        handleRename(conn.id)
                                                    }
                                                    disabled={
                                                        renameForm.processing
                                                    }
                                                >
                                                    {renameForm.processing ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-400 hover:bg-slate-100"
                                                    onClick={cancelEditing}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-semibold text-slate-700">
                                                        {conn.name}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200"
                                                        onClick={() =>
                                                            startEditing(conn)
                                                        }
                                                    >
                                                        <Pencil className="h-3 w-3 text-slate-400" />
                                                    </Button>
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    {conn.provider.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {confirmDeleteId === conn.id ? (
                                            <div className="flex items-center gap-1">
                                                <span className="mr-1 text-[11px] font-medium text-[#c12222]">
                                                    Confirm?
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-7 bg-[#c12222] px-2 text-[11px] hover:bg-[#a31c1c]"
                                                    onClick={() =>
                                                        handleDelete(conn.id)
                                                    }
                                                    disabled={
                                                        deleteForm.processing
                                                    }
                                                >
                                                    {deleteForm.processing ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        'Delete'
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-slate-400"
                                                    onClick={() =>
                                                        setConfirmDeleteId(null)
                                                    }
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-[#c12222]"
                                                onClick={() =>
                                                    setConfirmDeleteId(conn.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-slate-50/5 px-6 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-[13px] font-semibold text-slate-500 hover:bg-transparent hover:text-slate-700"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
