import { Moon } from 'lucide-react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo */}
      <header className="pt-8 pb-4 px-4">
        <div className="flex items-center justify-center gap-2">
          <Moon className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-text-primary">Recover</span>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">{children}</main>
    </div>
  );
}
