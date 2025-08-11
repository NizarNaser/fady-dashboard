
'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Providers from "@/providers";
export default function AdminHome() {
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

    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">مرحبًا بك في لوحة التحكم</h1>
        <p className="text-gray-700">يمكنك إدارة الأقسام والمنتجات والمبيعات من هنا.</p>
      </div>
    );
  }
  
