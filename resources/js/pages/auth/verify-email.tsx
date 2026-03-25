import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Mail } from 'lucide-react';
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
import GuestLayout from '@/layouts/GuestLayout';

export default function VerifyEmail() {
    const { post, processing } = useForm({});

    return (
        <GuestLayout title="Verify Email">
            <Card className="relative z-10 w-full max-w-[420px] rounded-2xl border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                <CardHeader className="pt-8 pb-8 text-center">
                    <div className="mx-auto mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-red-50 ring-4 ring-red-50/50">
                        <Mail className="h-7 w-7 text-[#c12222]" />
                    </div>
                    <CardTitle className="text-[22px] font-semibold text-slate-900">
                        Check your email
                    </CardTitle>
                    <CardDescription className="mx-auto mt-3 px-4 text-[13px] leading-relaxed text-slate-500">
                        We've sent a verification link to your email address.
                        Please click the link to confirm your account and
                        continue.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-8">
                    <Button
                        asChild
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c12222] py-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a31c1c]"
                    >
                        <a href="mailto:">Open Email App</a>
                    </Button>

                    <div className="mt-6 text-center text-[13px] text-slate-500">
                        Didn't receive the email?{' '}
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => post(route('verification.send'))}
                            disabled={processing}
                            className="h-auto p-0 text-[13px] font-semibold text-[#c12222] transition-colors hover:text-[#a31c1c]"
                        >
                            Resend link
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="inline-flex items-center text-[13px] font-semibold text-slate-600 transition-colors hover:text-[#c12222]"
                        >
                            <ArrowLeft
                                className="mr-2 h-[18px] w-[18px]"
                                strokeWidth={2.5}
                            />{' '}
                            Back to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
