import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/GuestLayout';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout title="Register">
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                <CardHeader className="pt-4 pb-8 text-center">
                    <CardTitle className="text-[22px] font-semibold text-slate-900">
                        Create your account
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm text-slate-500">
                        Join the next generation of cloud infrastructure
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-5" onSubmit={submit}>
                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="name"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Alex Rivera"
                                required
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className="rounded-lg border-0 bg-slate-50/80 px-4 py-5 text-sm ring-1 ring-slate-200 transition-all ring-inset focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                            />
                            {errors.name && (
                                <div className="mt-1 text-[11px] font-semibold text-red-500">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="email"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                Work Email
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

                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="password"
                                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                            >
                                Password
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
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    tabIndex={-1}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-[#8c7a7a] transition-colors hover:text-[#c12222] focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <div className="mt-1 text-[11px] font-semibold text-red-500">
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-lg bg-[#c12222] py-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a31c1c] disabled:opacity-50"
                            >
                                Create Account
                            </Button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col justify-center pt-2 pb-8">
                    <div className="mb-6 px-4 text-center text-[11px] leading-relaxed text-slate-500">
                        By clicking "Create Account", you agree to our{' '}
                        <Link
                            href="#"
                            className="text-[#c12222] hover:underline"
                        >
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="#"
                            className="text-[#c12222] hover:underline"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </div>

                    <div className="text-[13px] text-slate-600">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-[#c12222] transition-colors hover:text-[#a31c1c]"
                        >
                            Log in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
