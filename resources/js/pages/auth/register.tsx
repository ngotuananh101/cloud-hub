import { Link, useForm } from '@inertiajs/react';
import React from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuestLayout from '@/layouts/GuestLayout';

export default function Register() {
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
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 p-4">
                <CardHeader className="text-center pb-8 pt-4">
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
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
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
                                onChange={(e) => setData('name', e.target.value)}
                                className="rounded-lg border-0 bg-slate-50/80 px-4 py-5 text-sm ring-1 ring-inset ring-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c12222]"
                            />
                            {errors.name && (
                                <div className="text-[11px] font-semibold text-red-500 mt-1">
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="email"
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
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
                                onChange={(e) => setData('email', e.target.value)}
                                className="rounded-lg border-0 bg-slate-50/80 px-4 py-5 text-sm ring-1 ring-inset ring-slate-200 transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c12222]"
                            />
                            {errors.email && (
                                <div className="text-[11px] font-semibold text-red-500 mt-1">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 text-left">
                            <Label
                                htmlFor="password"
                                className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            >
                                Password
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="font-mono text-sm tracking-widest rounded-lg border-0 bg-slate-50/80 px-4 py-5 ring-1 ring-inset ring-slate-200 transition-all placeholder:tracking-widest focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c12222]"
                            />
                            {errors.password && (
                                <div className="text-[11px] font-semibold text-red-500 mt-1">
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

                <CardFooter className="flex flex-col justify-center pb-8 pt-2">
                    <div className="mb-6 px-4 text-center text-[11px] leading-relaxed text-slate-500">
                        By clicking "Create Account", you agree to our{' '}
                        <Link href="#" className="text-[#c12222] hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="#" className="text-[#c12222] hover:underline">Privacy Policy</Link>.
                    </div>

                    <div className="text-[13px] text-slate-600">
                        Already have an account?{' '}
                        <Link href={route('login')} className="font-semibold text-[#c12222] transition-colors hover:text-[#a31c1c]">
                            Log in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </GuestLayout>
    );
}
