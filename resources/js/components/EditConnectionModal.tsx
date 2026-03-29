import { useForm } from '@inertiajs/react';
import axios from 'axios';
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

    const [telegramStep, setTelegramStep] = useState<'phone' | 'code'>('phone');
    const [telegramData, setTelegramData] = useState({
        phone: '',
        code: '',
        phone_code_hash: '',
        password: '',
    });
    const [telegramProcessing, setTelegramProcessing] = useState(false);

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
            setTelegramStep('phone');
            setTelegramData({
                phone: '',
                code: '',
                phone_code_hash: '',
                password: '',
            });
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

    const handleTelegramRequestCode = async () => {
        if (!telegramData.phone) {
            toast.error('Please enter your phone number.');

            return;
        }

        setTelegramProcessing(true);

        try {
            const response = await axios.post(route('telegram.request-code'), {
                phone: telegramData.phone,
            });

            setTelegramStep('code');
            setTelegramData((prev) => ({
                ...prev,
                phone_code_hash: response.data.phone_code_hash,
            }));
            toast.success('Login code sent to your Telegram account.');
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || 'Failed to request code.',
            );
        } finally {
            setTelegramProcessing(false);
        }
    };

    const handleTelegramLogin = async () => {
        if (!telegramData.code || !connection) {
            toast.error('Please enter the code.');

            return;
        }

        setTelegramProcessing(true);

        try {
            const response = await axios.post(route('telegram.login'), {
                phone: telegramData.phone,
                code: telegramData.code,
                phone_code_hash: telegramData.phone_code_hash,
                password: telegramData.password,
                name: data.name,
                connection_id: connection.id,
            });

            if (response.data.success) {
                onOpenChange(false);
                toast.success('Telegram updated successfully!');
                window.location.reload();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed.');
        } finally {
            setTelegramProcessing(false);
        }
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

                                {connection.provider_id === 'telegram' ? (
                                    <div className="space-y-6">
                                        {telegramStep === 'phone' ? (
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="tg_edit_phone"
                                                    className="text-[11px] font-bold text-slate-700"
                                                >
                                                    PHONE NUMBER
                                                </Label>
                                                <Input
                                                    id="tg_edit_phone"
                                                    value={telegramData.phone}
                                                    onChange={(e) =>
                                                        setTelegramData(
                                                            (prev) => ({
                                                                ...prev,
                                                                phone: e.target.value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="+84..."
                                                    className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                                />
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Enter your full
                                                    international phone number.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="tg_edit_code"
                                                        className="text-[11px] font-bold text-slate-700"
                                                    >
                                                        LOGIN CODE
                                                    </Label>
                                                    <Input
                                                        id="tg_edit_code"
                                                        value={telegramData.code}
                                                        onChange={(e) =>
                                                            setTelegramData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    code: e.target.value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Enter the code sent to your Telegram"
                                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="tg_edit_password"
                                                        className="text-[11px] font-bold text-slate-700"
                                                    >
                                                        PASSWORD (IF ENABLED)
                                                    </Label>
                                                    <Input
                                                        id="tg_edit_password"
                                                        type="password"
                                                        value={
                                                            telegramData.password
                                                        }
                                                        onChange={(e) =>
                                                            setTelegramData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    password:
                                                                        e.target.value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="Your 2FA password"
                                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    onClick={() =>
                                                        setTelegramStep('phone')
                                                    }
                                                    className="h-auto p-0 text-[11px] text-[#c12222]"
                                                >
                                                    Change phone number
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Dynamic Fields (Non-Telegram) */
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
                                                    'id',
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
                                )}
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
                                    type="button"
                                    onClick={
                                        connection.provider_id === 'telegram'
                                            ? telegramStep === 'phone'
                                                ? handleTelegramRequestCode
                                                : handleTelegramLogin
                                            : handleSubmit
                                    }
                                    disabled={
                                        processing ||
                                        telegramProcessing ||
                                        (connection.provider_id === 'telegram' &&
                                            telegramStep === 'phone' &&
                                            !telegramData.phone)
                                    }
                                    className="h-11 min-w-[120px] rounded-lg bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md hover:bg-[#a31c1c] active:scale-[0.98]"
                                >
                                    {processing || telegramProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {connection.provider_id ===
                                            'telegram'
                                                ? 'Processing...'
                                                : 'Saving...'}
                                        </>
                                    ) : connection.provider_id ===
                                      'telegram' ? (
                                        telegramStep === 'phone' ? (
                                            'Send Login Code'
                                        ) : (
                                            'Update Telegram'
                                        )
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
