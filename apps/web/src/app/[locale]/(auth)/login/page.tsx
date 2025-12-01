'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ThemeSwitcher from '@/components/system/ThemeSwitcher';
import LanguageSwitcher from '@/components/system/LanguageSwitcher';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Shield, Zap, Users, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const signIn = useAuthStore((state) => state.signIn);
    const router = useRouter();
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const t = useTranslations();

    // Check if session expired on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const expired = sessionStorage.getItem('sessionExpired');
            if (expired === 'true') {
                setSessionExpired(true);
                sessionStorage.removeItem('sessionExpired');
                toast.info('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
                    duration: 5000,
                    icon: <AlertCircle className="w-5 h-5" />,
                });
            }
        }
    }, []);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await signIn(data);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.login.errors.invalidCredentials'));
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-950 dark:via-gray-900 dark:to-red-950/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                {/* Floating Orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-red-400/30 dark:bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/20 dark:bg-red-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Switchers */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />
            </div>

            <div className="relative z-10 w-full flex">
                {/* Left Side - Branding & Features */}
                <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-red-600 via-red-700 to-black relative overflow-hidden">
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>

                    <div className="relative w-full flex flex-col justify-between p-12 xl:p-16">
                        {/* Logo & Brand */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="relative w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                                    <Image
                                        src="/sigma-red.jpeg"
                                        alt="SIGMA Logo"
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-tight">
                                        SIGMA
                                    </h1>
                                    <p className="text-red-100 text-sm font-medium">Enterprise 2.0</p>
                                </div>
                            </div>
                        </div>

                        {/* Center Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-5xl xl:text-6xl font-black text-white leading-tight">
                                    Enterprise
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-white">
                                        {t('auth.login.hero.title').split(' ').slice(1).join(' ')}
                                    </span>
                                </h2>
                                <p className="text-xl text-red-100/90 font-light max-w-md">
                                    {t('auth.login.hero.subtitle')}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-1 gap-4 max-w-md">
                                {[
                                    { icon: Shield, title: t('auth.login.hero.features.security.title'), desc: t('auth.login.hero.features.security.desc') },
                                    { icon: Zap, title: t('auth.login.hero.features.performance.title'), desc: t('auth.login.hero.features.performance.desc') },
                                    { icon: Users, title: t('auth.login.hero.features.multitenancy.title'), desc: t('auth.login.hero.features.multitenancy.desc') }
                                ].map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                                    >
                                        <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                            <feature.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                            <p className="text-red-100/70 text-xs">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-red-100/60 text-sm">
                            <p>{t('auth.login.hero.footer')}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 sm:p-12">
                    <div className="w-full max-w-md space-y-8">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-2">
                                    <Image
                                        src="/sigma-black.jpeg"
                                        alt="SIGMA"
                                        fill
                                        className="object-contain p-1"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">SIGMA</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Enterprise 2.0</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Header */}
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                {t('auth.login.welcome')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-base">
                                {t('auth.login.instruction')}
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-red-600 dark:text-red-500" />
                                    {t('common.labels.email')}
                                </label>
                                <div className="relative group">
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="w-full px-4 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-200 outline-none text-base"
                                        placeholder="tu@empresa.com"
                                    />
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300"></div>
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-red-600 dark:text-red-500" />
                                    {t('common.labels.password')}
                                </label>
                                <div className="relative group">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-4 pr-12 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-200 outline-none text-base"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300"></div>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-red-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                                        {t('auth.login.rememberMe')}
                                    </span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold transition-colors"
                                >
                                    {t('auth.login.forgotPassword')}
                                </Link>
                            </div>

                            {/* Session Expired Message */}
                            {sessionExpired && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                        Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                    <p className="text-red-600 dark:text-red-400 text-sm font-medium text-center">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {t('auth.login.loggingIn')}
                                        </>
                                    ) : (
                                        <>
                                            {t('auth.login.signIn')}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                                {/* Shine Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
                                        {t('auth.login.newToSigma')}
                                    </span>
                                </div>
                            </div>

                            {/* Register Link */}
                            <Link
                                href="/register"
                                className="block w-full text-center py-4 px-6 border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 transition-all duration-200 group"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {t('auth.login.createAccount')}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </form>

                        {/* Footer Info */}
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-6">
                            {t('auth.login.terms')}{' '}
                            <Link href="/terms" className="text-red-600 dark:text-red-500 hover:underline font-semibold">
                                {t('auth.login.termsLink')}
                            </Link>{' '}
                            {t('auth.login.and')}{' '}
                            <Link href="/privacy" className="text-red-600 dark:text-red-500 hover:underline font-semibold">
                                {t('auth.login.privacyLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
