import Link from 'next/link';
import { Moon, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-black flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      {/* Subtle background pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Moon className="w-12 h-12 text-white" />
        </div>

        {/* App name */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          RECOVER
        </h1>

        {/* Tagline */}
        <p className="text-xl text-gray-300 font-normal mb-12">
          Sleep Better. Perform Better.
        </p>

        {/* Primary CTA - Get Started Free */}
        <Link href="/signup" className="w-full mb-4">
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-lg py-4 px-8 rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-amber-500/40 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" />
            Get Started Free
          </button>
        </Link>

        {/* Secondary CTA - Log In */}
        <Link href="/login" className="w-full mb-8">
          <button className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02]">
            Log In
          </button>
        </Link>

        {/* Tertiary link - Create Account */}
        <Link
          href="/signup"
          className="text-orange-400 hover:text-orange-300 font-medium transition-colors hover:underline"
        >
          Create Account
        </Link>
      </div>

      {/* Footer text */}
      <div className="absolute bottom-8 left-0 right-0 text-center pb-safe">
        <p className="text-gray-500 text-xs">
          No credit card required
        </p>
      </div>
    </div>
  );
}
