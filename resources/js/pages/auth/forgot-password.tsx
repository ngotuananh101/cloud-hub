import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import React from 'react';
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

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout title="Forgot Password">
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                <CardHeader className="pt-8 pb-8 text-center">
                    <div className="mx-auto mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-50">
                        <KeyRound className="h-7 w-7 text-[#c12222]" />
                    </div>
                    <CardTitle className="text-[22px] font-semibold text-slate-900">
                        Reset your password
                    </CardTitle>
                    <CardDescription className="mt-3 px-4 text-[13px] leading-relaxed text-slate-500">
                        Enter your email address and we'll send you a link to
                        reset your password.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-8">
                    <form className="space-y-6" onSubmit={submit}>
                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="email"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="name@company.com"
                                required
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className="rounded-lg border-0 bg-slate-50/80 px-4 py-5 text-sm ring-1 ring-slate-200 transition-all ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                            />
                            {errors.email && (
                                <div className="mt-1 text-[11px] font-semibold text-red-500">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c12222] py-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a31c1c] disabled:opacity-50"
                            >
                                Send Reset Link{' '}
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
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
