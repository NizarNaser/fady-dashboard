'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Providers from "@/providers";
export default function Home() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAILS;

  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === 'loading') return; // ننتظر تحميل الجلسة
    if (!session) return; // ننتظر الجلسة
  
    if (session.user.email !== adminEmail) {
      router.push('/');
    }
  }, [session, status]);
  
  if (status === 'loading') return <p>Verifying...</p>;

  if (!session) {
    return (
      <div className="flex flex-col items-center mt-20">
        <h1 className="text-2xl mb-4">مرحبا بك 👋</h1>
        <button onClick={() => signIn("google")} className="bg-blue-500 text-white px-4 py-2 rounded">
          تسجيل الدخول بـ Google
        </button>
      </div>
    );
  }
  
  return (
    <div className="text-center mt-20">
      <h2 className="text-xl mb-2">مرحباً، {session.user.name}</h2>
      <p>{session.user.email}</p>
      <button onClick={() => signOut()} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        تسجيل الخروج
      </button>
      {
        

        session.user.email === adminEmail && (
          <button onClick={() => router.push('/admin')} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
            لوحة التحكم
          </button>
        )
      }

    </div>
  );
  
 
}
