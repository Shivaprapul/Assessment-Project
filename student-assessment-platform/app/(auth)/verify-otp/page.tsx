/**
 * OTP Verification Page
 * 
 * Matches UI/UX Design Spec exactly:
 * - 6 separate input boxes
 * - Auto-focus next input on entry
 * - Backspace moves to previous input
 * - Resend timer
 * 
 * @module app/(auth)/verify-otp
 */

'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { setSession, getSession } from '@/lib/session';

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '');
    if (digit.length > 1) {
      // Handle paste
      const pastedValues = digit.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedValues.forEach((val, i) => {
        if (index + i < 6) {
          newOtp[index + i] = val;
        }
      });
      setOtp(newOtp);
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedValues.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Single character input
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
        credentials: 'include', // Important: include cookies
      });

      const data = await response.json();

      console.log('Verify OTP Response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error?.message || data.message || 'Invalid OTP code';
        console.error('OTP verification failed:', errorMsg, data);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Check if response has the expected structure
      if (!data.success) {
        console.error('Response not successful:', data);
        setError(data.error?.message || 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store user data in localStorage (for dashboard to read)
      if (data.data?.user && data.data?.tenant) {
        try {
          setSession(data.data.user, data.data.tenant);
          console.log('✅ Session set successfully:', data.data.user.email);
          
          // Verify session was set
          const verifySession = getSession();
          if (!verifySession.user || !verifySession.tenant) {
            console.error('❌ Session verification failed - localStorage not set');
            setError('Failed to save session. Please try again.');
            setIsLoading(false);
            return;
          }
          
          console.log('✅ Session verified in localStorage');
        } catch (sessionError) {
          console.error('Error setting session:', sessionError);
          setError('Failed to save session. Please try again.');
          setIsLoading(false);
          return;
        }
      } else {
        console.error('❌ Missing user or tenant data in response:', {
          hasData: !!data.data,
          hasUser: !!data.data?.user,
          hasTenant: !!data.data?.tenant,
          fullData: data,
        });
        setError('Login successful but session data missing. Please try again.');
        setIsLoading(false);
        return;
      }

      // Small delay to ensure localStorage is written and router is ready
      await new Promise(resolve => setTimeout(resolve, 200));

      // Redirect based on user role
      const userRole = data.data?.user?.role;
      let redirectPath = '/dashboard'; // Default for students
      
      if (userRole === 'TEACHER' || userRole === 'SCHOOL_ADMIN') {
        redirectPath = '/teacher'; // Redirect to teacher dashboard
        console.log(`🔄 Teacher detected! Redirecting to ${redirectPath}...`);
        console.log(`🔄 User data:`, JSON.stringify(data.data?.user, null, 2));
      } else if (userRole === 'PARENT') {
        redirectPath = '/parent';
      } else if (userRole === 'PLATFORM_ADMIN') {
        redirectPath = '/admin'; // Platform admin dashboard (if exists)
      }
      
      console.log(`🔄 Redirecting ${userRole} to ${redirectPath}...`);
      router.replace(redirectPath);
    } catch (err) {
      console.error('Error during OTP verification:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendTimer(60); // 60 second cooldown
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Enter Your Code</CardTitle>
          <CardDescription className="text-center">
            We sent a 6-digit code to<br />
            <strong>{email || 'your email'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-semibold"
                    value={otp[index]}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || otp.join('').length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                >
                  {resendTimer > 0
                    ? `Resend code in ${resendTimer}s`
                    : 'Resend code'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTPForm />
    </Suspense>
  );
}
