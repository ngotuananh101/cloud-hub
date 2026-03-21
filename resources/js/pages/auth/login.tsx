import { Link, useForm } from '@inertiajs/react';
import React from 'react';
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

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout title="Login">
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                <CardHeader className="pt-4 pb-8 text-center">
                    <CardTitle className="text-[22px] font-semibold text-slate-900">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm text-slate-500">
                        Enter your credentials to access your vault
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-5" onSubmit={submit}>
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

                        <div className="space-y-1.5 text-left">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                                >
                                    Password
                                </Label>
                                <Link
                                    href="#"
                                    className="text-[11px] font-semibold text-[#c12222] transition-colors hover:text-[#a31c1c]"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                required
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="rounded-lg border-0 bg-slate-50/80 px-4 py-5 font-mono text-sm tracking-widest ring-1 ring-slate-200 transition-all ring-inset placeholder:tracking-widest focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                            />
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
                                Sign In
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div
                                className="absolute inset-0 flex items-center"
                                aria-hidden="true"
                            >
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-bold tracking-widest">
                                <span className="bg-white px-4 text-slate-400 uppercase">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-lg border-0 bg-slate-50/80 py-5 text-[13px] font-semibold text-slate-700 shadow-none ring-1 ring-slate-200 transition-all ring-inset hover:bg-slate-100 hover:text-slate-900 hover:ring-slate-300"
                            >
                                <svg
                                    className="mr-2 h-[18px] w-[18px]"
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                        fill="#334155"
                                    />
                                </svg>
                                <span className="pt-px">Google</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-lg border-0 bg-slate-50/80 py-5 text-[13px] font-semibold text-slate-700 shadow-none ring-1 ring-slate-200 transition-all ring-inset hover:bg-slate-100 hover:text-slate-900 hover:ring-slate-300"
                            >
                                <svg
                                    className="mr-2 h-[18px] w-[18px]"
                                    aria-hidden="true"
                                    viewBox="0 0 21 21"
                                >
                                    <path
                                        d="M0 0h10v10H0zm11 0h10v10H11zM0 11h10v10H0zm11 0h10v10H11z"
                                        fill="#334155"
                                    />
                                </svg>
                                <span className="pt-px">Microsoft</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center pt-2 pb-8">
                    <div className="text-[13px] text-slate-600">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-[#c12222] transition-colors hover:text-[#a31c1c]"
                        >
                            Create account
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
