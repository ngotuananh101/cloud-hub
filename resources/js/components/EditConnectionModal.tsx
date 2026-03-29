import { useForm } from '@inertiajs/react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DisconnectConfirmDialog from './DisconnectConfirmDialog';

interface Provider {
    id: string;
    name: string;
    icon: string;
    icon_url: string;
    driver: string;
    config_schema: Record<string, any>;
}

interface CloudConnection {
    id: number;
    provider_id: string;
    name: string;
    provider: Provider;
    settings?: Record<string, any>;
    credentials?: Record<string, any>; // Usually empty from server unless specifically included
}

interface EditConnectionModalProps {
    connection: CloudConnection | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditConnectionModal({
    connection,
    open,
    onOpenChange,
}: EditConnectionModalProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            credentials: {} as Record<string, any>,
            settings: {} as Record<string, any>,
        });

    const deleteForm = useForm({});

    useEffect(() => {
        if (connection && open) {
            setData({
                name: connection.name,
                credentials: {}, // Secrets are empty by default
                settings: connection.settings || {},
            });
        }
    }, [connection, open, setData]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        
        onOpenChange(isOpen);
    };

    const handleCredentialChange = (key: string, value: string) => {
        setData('credentials', {
            ...data.credentials,
            [key]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!connection) {
            return;
        }

        patch(route('cloud-connections.update', connection.id), {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Connection updated successfully!');
            },
        });
    };

    const handleDisconnect = () => {
        if (!connection) {
            return;
        }

        deleteForm.delete(route('cloud-connections.destroy', connection.id), {
            onSuccess: () => {
                onOpenChange(false);
                setIsConfirmOpen(false);
                toast.success('Cloud storage disconnected successfully!');
            },
        });
    };

    const handleReconnect = () => {
        if (!connection) {
            return;
        }

        // Redirect to OAuth authorization page with the connection name
        window.location.href = route('oauth.redirect', {
            provider: connection.provider_id,
            name: data.name,
        });
    };

    if (!connection) {
        return null;
    }

    const isOAuth = ['google', 'onedrive', 'dropbox'].includes(
        connection.provider_id,
    );

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[80vh] min-w-[550px] flex-col overflow-hidden p-0 sm:max-w-[50vw] sm:rounded-[20px]">
                    <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
                        <DialogTitle className="text-[16px] font-bold text-slate-800">
                            Edit {connection.provider.name} Connection
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-1 flex-col overflow-hidden"
                    >
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="edit_name"
                                        className="text-[11px] font-bold text-slate-700"
                                    >
                                        CONNECTION NAME
                                    </Label>
                                    <Input
                                        id="edit_name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Dynamic Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(
                                        connection.provider.config_schema,
                                    ).map(([key, type]) => (
                                        <div
                                            key={key}
                                            className={
                                                [
                                                    'secret',
                                                    'token',
                                                    'key',
                                                    'uri',
                                                    'url',
                                                    'path',
                                                    'id',
                                                    'bucket',
                                                ].some((keyword) =>
                                                    key
                                                        .toLowerCase()
                                                        .includes(keyword),
                                                )
                                                    ? 'col-span-2'
                                                    : 'col-span-1'
                                            }
                                        >
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor={`edit_${key}`}
                                                    className="text-[11px] font-bold text-slate-700 capitalize"
                                                >
                                                    {key.replace(/_/g, ' ')}
                                                </Label>
                                                {Array.isArray(type) ? (
                                                    <Select
                                                        value={
                                                            data.credentials[
                                                                key
                                                            ] ||
                                                            data.settings[
                                                                key
                                                            ] ||
                                                            ''
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleCredentialChange(
                                                                key,
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-11 w-full rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-[#c12222]">
                                                            <SelectValue
                                                                placeholder={`Select ${key.replace(/_/g, ' ')}`}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                            {type.map(
                                                                (option) => (
                                                                    <SelectItem
                                                                        key={
                                                                            option
                                                                        }
                                                                        value={
                                                                            option
                                                                        }
                                                                        className="rounded-lg py-2.5 text-[13px] focus:bg-slate-50 focus:text-[#c12222]"
                                                                    >
                                                                        {option}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        id={`edit_${key}`}
                                                        type={
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'password',
                                                                ) ||
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'secret',
                                                                ) ||
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'token',
                                                                )
                                                                ? 'password'
                                                                : 'text'
                                                        }
                                                        placeholder={
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'secret',
                                                                ) ||
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'password',
                                                                ) ||
                                                            key
                                                                .toLowerCase()
                                                                .includes(
                                                                    'token',
                                                                )
                                                                ? 'Leave blank to keep current'
                                                                : `Enter ${key.replace(/_/g, ' ')}`
                                                        }
                                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                                        value={
                                                            data.credentials[
                                                                key
                                                            ] ||
                                                            data.settings[
                                                                key
                                                            ] ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleCredentialChange(
                                                                key,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/5 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsConfirmOpen(true)}
                                    className="h-11 items-center gap-2 rounded-lg text-[13px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Disconnect
                                </Button>

                                {isOAuth && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleReconnect}
                                        className="h-11 items-center gap-2 rounded-lg text-[13px] font-semibold text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Reconnect
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="text-[13px] font-semibold text-slate-500 hover:bg-transparent hover:text-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 min-w-[120px] rounded-lg bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md hover:bg-[#a31c1c] active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <DisconnectConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleDisconnect}
                providerName={connection.provider.name}
                processing={deleteForm.processing}
            />
        </>
    );
}
