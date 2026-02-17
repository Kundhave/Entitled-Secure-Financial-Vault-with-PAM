'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Shield, Lock, FileText, CheckCircle, ArrowRight, Activity, Users } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      if (data.role === 'employee') {
        router.push('/employee');
      } else if (data.role === 'admin') {
        router.push('/admin');
      } else if (data.role === 'auditor') {
        router.push('/auditor');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Employee', user: 'employee1', pass: 'employee123' },
    { role: 'Admin', user: 'admin1', pass: 'admin123' },
    { role: 'Auditor', user: 'auditor', pass: 'auditor123' },
  ];

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Shield className="h-6 w-6" />
            <span>ENTITLED</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#security" className="hover:text-primary transition-colors">Security</a>
            <a href="#compliance" className="hover:text-primary transition-colors">Compliance</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-24 lg:py-32 bg-slate-900 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
          <div className="container relative z-10 grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">

            {/* Hero Content */}
            <div className="space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Secure Financial <br />
                <span className="text-emerald-400">Privileged Access</span>
              </h1>
              <p className="max-w-[600px] text-slate-300 text-lg sm:text-xl">
                Enterprise-grade vault for managing sensitive financial data with strict role-based access control, MFA, and comprehensive audit trails.
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10">
                  Documentation
                </Button>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4 border-t border-white/10">
                <div>
                  <h3 className="text-2xl font-bold text-white">99.9%</h3>
                  <p className="text-sm text-slate-400">Uptime</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">SOC2</h3>
                  <p className="text-sm text-slate-400">Certified</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">256-bit</h3>
                  <p className="text-sm text-slate-400">Encryption</p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="lg:pl-8">
              <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur text-slate-900">
                <CardHeader>
                  <CardTitle className="text-2xl">Secure Login</CardTitle>
                  <CardDescription>Access your authorized dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                      <Activity className="h-4 w-4" /> {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                        Username
                      </label>
                      <Input
                        id="username"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Authenticating...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Demo Credentials</p>
                    <div className="grid grid-cols-3 gap-2">
                      {demoCredentials.map((creds) => (
                        <Button
                          key={creds.role}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => fillCredentials(creds.user, creds.pass)}
                        >
                          {creds.role}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Enterprise Security Standard</h2>
              <p className="mt-4 text-lg text-muted-foreground">Built for financial institutions requiring the highest level of data protection.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Role-Based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Strict separation of duties between Employees, Admins, and Auditors. Granular permission controls for every vault item.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle>Audit Trails</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Immutable logs for every action. Track who accessed what and when, with detailed metadata for compliance reporting.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle>MFA Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Time-based One-Time Password (TOTP) enforcement for privileged actions and sensitive data retrieval.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Entitled Financial Systems. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
