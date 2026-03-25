import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import React, { useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/GuestLayout';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.store'));
    };

    return (
        <GuestLayout title="Reset Password">
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                <CardHeader className="pt-8 pb-8 text-center">
                    <div className="mx-auto mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-50">
                        <KeyRound className="h-7 w-7 text-[#c12222]" />
                    </div>
                    <CardTitle className="text-[22px] font-semibold text-slate-900">
                        Set new password
                    </CardTitle>
                    <CardDescription className="mx-auto mt-3 px-4 text-[13px] leading-relaxed text-slate-500">
                        Your password must be at least 8 characters and include
                        a mix of uppercase, lowercase, and numbers.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-8">
                    <form className="space-y-6" onSubmit={submit}>
                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="password"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    required
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className="rounded-lg border-0 bg-slate-50/80 py-5 pr-12 pl-4 font-mono text-sm tracking-widest ring-1 ring-slate-200 transition-all ring-inset placeholder:tracking-widest focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    tabIndex={-1}
                                    className="absolute top-1/2 right-4 h-auto w-auto -translate-y-1/2 p-0 text-[#8c7a7a] hover:bg-transparent hover:text-[#c12222]"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <div className="mt-1 text-[11px] font-semibold text-red-500">
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    required
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-lg border-0 bg-slate-50/80 py-5 pr-12 pl-4 font-mono text-sm tracking-widest ring-1 ring-slate-200 transition-all ring-inset placeholder:tracking-widest focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    tabIndex={-1}
                                    className="absolute top-1/2 right-4 h-auto w-auto -translate-y-1/2 p-0 text-[#8c7a7a] hover:bg-transparent hover:text-[#c12222]"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.password_confirmation && (
                                <div className="mt-1 text-[11px] font-semibold text-red-500">
                                    {errors.password_confirmation}
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c12222] py-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a31c1c] disabled:opacity-50"
                            >
                                Update Password{' '}
                                <ArrowRight
                                    className="h-[18px] w-[18px]"
                                    strokeWidth={2.5}
                                />
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center text-[13px] font-semibold text-slate-600 transition-colors hover:text-[#c12222]"
                        >
                            <ArrowLeft
                                className="mr-2 h-[18px] w-[18px]"
                                strokeWidth={2.5}
                            />{' '}
                            Back to log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
