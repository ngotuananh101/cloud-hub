import { useForm, usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Provider {
    id: string;
    name: string;
    icon: string;
    icon_url: string;
    driver: string;
    config_schema: Record<string, any>;
    default_config_schema?: Record<string, any>;
}

interface ConnectCloudModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ConnectCloudModal({
    open,
    onOpenChange,
}: ConnectCloudModalProps) {
    const { providers } = usePage<{ providers: Provider[] }>().props;
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
        null,
    );

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            provider_id: '',
            name: '',
            credentials: {} as Record<string, any>,
            settings: {} as Record<string, any>,
        });

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedProvider(null);
            reset();
            clearErrors();
        }

        onOpenChange(isOpen);
    };

    const handleProviderChange = (id: string) => {
        const provider = providers.find((p) => p.id === id) || null;
        setSelectedProvider(provider);

        setData((prev) => ({
            ...prev,
            provider_id: id,
            name: provider ? `${provider.name} Storage` : '',
            credentials: provider?.default_config_schema || {},
        }));
    };

    const handleCredentialChange = (key: string, value: string) => {
        setData('credentials', {
            ...data.credentials,
            [key]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if selected provider is an OAuth provider (handled by redirect flow)
        const oauthProviders = ['google', 'onedrive', 'dropbox'];

        if (selectedProvider && oauthProviders.includes(selectedProvider.id)) {
            // Redirect to OAuth authorization page with the connection name
            window.location.href = route('oauth.redirect', {
                provider: selectedProvider.id,
                name: data.name,
            });

            return;
        }

        post(route('cloud-connections.store'), {
            onSuccess: () => {
                onOpenChange(false);
                toast.success('Cloud storage connected successfully!');
            },
            onError: (err) => {
                // Individual errors are handled in the UI
                if (Object.keys(err).length > 0) {
                    toast.error('Please fix the errors before submitting.');
                }
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[80vh] min-w-[550px] flex-col overflow-hidden p-0 sm:max-w-[50vw] sm:rounded-[20px]">
                <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-slate-100 px-6 py-4">
                    <DialogTitle className="text-[16px] font-bold text-slate-800">
                        Connect New Storage
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    {/* Provider Selection (Fixed at top) */}
                    <div className="shrink-0 border-b border-slate-50 px-6 pt-0 pb-4">
                        <Label className="mb-3 block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Select Provider
                        </Label>
                        <div className="custom-scrollbar w-full overflow-x-auto pb-2">
                            <RadioGroup
                                value={data.provider_id}
                                onValueChange={handleProviderChange}
                                className="flex w-max gap-3"
                            >
                                {providers.map((provider) => (
                                    <div key={provider.id}>
                                        <RadioGroupItem
                                            value={provider.id}
                                            id={provider.id}
                                            className="peer sr-only"
                                        />
                                        <label
                                            htmlFor={provider.id}
                                            className="flex h-[90px] w-[90px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white transition-all peer-data-[state=checked]:border-[#c12222] peer-data-[state=checked]:bg-[#c12222]/5 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-[#c12222] hover:bg-slate-50"
                                        >
                                            <img
                                                src={provider.icon_url}
                                                alt={provider.name}
                                                className="h-8 w-8"
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 peer-data-[state=checked]:text-[#c12222]">
                                                {provider.name}
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        {errors.provider_id && (
                            <p className="mt-1 text-[11px] text-red-500">
                                {errors.provider_id}
                            </p>
                        )}
                    </div>

                    {/* Scrollable Content (Dynamic fields) */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                        {selectedProvider && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="cc_name"
                                        className="text-[11px] font-bold text-slate-700"
                                    >
                                        CONNECTION NAME
                                    </Label>
                                    <Input
                                        id="cc_name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="e.g. My Personal Backup"
                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(
                                        selectedProvider.config_schema,
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
                                                    htmlFor={`cc_${key}`}
                                                    className="text-[11px] font-bold text-slate-700 capitalize"
                                                >
                                                    {key.replace(/_/g, ' ')}
                                                </Label>
                                                {Array.isArray(type) ? (
                                                    <Select
                                                        value={
                                                            data.credentials[
                                                                key
                                                            ] || ''
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
                                                        id={`cc_${key}`}
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
                                                        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                                        className="h-11 rounded-lg border-0 bg-slate-50 px-4 text-[13px] ring-1 ring-slate-200 ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222]"
                                                        value={
                                                            data.credentials[
                                                                key
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            handleCredentialChange(
                                                                key,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                )}
                                                {errors[
                                                    `credentials.${key}`
                                                ] && (
                                                    <p className="text-[11px] text-red-500">
                                                        {
                                                            errors[
                                                                `credentials.${key}`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/5 px-6 py-4">
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
                            disabled={processing || !selectedProvider}
                            className="h-11 min-w-[140px] rounded-lg bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md hover:bg-[#a31c1c] active:scale-[0.98]"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect Provider'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
