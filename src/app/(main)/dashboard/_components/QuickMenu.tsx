
'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  History, 
  Banknote, 
  QrCode, 
  ShieldCheck, 
  FileText, 
  Settings, 
  MonitorSmartphone,
  LayoutGrid,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
  bg: string;
  description?: string;
}

const MAIN_MENUS: MenuItem[] = [
  { icon: Users, label: 'Siswa', href: '/profiles', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: History, label: 'Transaksi', href: '/today-transactions', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Banknote, label: 'Keuangan', href: '/settlement', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: QrCode, label: 'Kartu', href: '/print-cards', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const MORE_MENUS: MenuItem[] = [
  { icon: FileText, label: 'Laporan', description: 'Rekap tabungan & ekspor PDF', href: '/reports', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: ShieldCheck, label: 'Aktivasi', description: 'Upgrade akun ke versi PRO', href: '/activation', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: MonitorSmartphone, label: 'Mode Kiosk', description: 'Tampilan ATM untuk siswa', href: '/kiosk', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Settings, label: 'Pengaturan', description: 'Identitas sekolah & backup', href: '/settings', color: 'text-gray-600', bg: 'bg-gray-100' },
];

export default function QuickMenu() {
  return (
    <div className="grid grid-cols-5 gap-2 px-1">
      {/* 4 Menu Utama */}
      {MAIN_MENUS.map((menu) => (
        <Link key={menu.href} href={menu.href} className="flex flex-col items-center gap-2 group">
          <div className={`h-14 w-14 rounded-2xl ${menu.bg} flex items-center justify-center transition-all duration-300 group-active:scale-90 shadow-sm border border-white`}>
            <menu.icon className={`h-6 w-6 ${menu.color}`} />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter text-center leading-tight line-clamp-1">
            {menu.label}
          </span>
        </Link>
      ))}

      {/* Tombol Lainnya */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-2 group outline-none">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center transition-all duration-300 group-active:scale-90 shadow-sm border border-white">
              <LayoutGrid className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center leading-tight">
              Lainnya
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] px-6 pb-10 border-none">
          <SheetHeader className="items-center pb-6">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mb-4" />
            <SheetTitle className="text-xl font-black tracking-tight">Semua Layanan</SheetTitle>
            <SheetDescription className="text-xs font-medium uppercase tracking-widest text-gray-400">Pilih menu yang ingin Anda akses</SheetDescription>
          </SheetHeader>
          
          <div className="grid grid-cols-1 gap-3">
            {[...MAIN_MENUS, ...MORE_MENUS].map((menu) => (
              <SheetClose asChild key={menu.href}>
                <Link 
                  href={menu.href}
                  className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 hover:bg-gray-100 transition-colors border border-gray-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl ${menu.bg} flex items-center justify-center shadow-sm border border-white`}>
                      <menu.icon className={`h-6 w-6 ${menu.color}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 leading-tight">{menu.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{menu.description || 'Akses fitur utama'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              </SheetClose>
            ))}
          </div>

          <div className="mt-8">
             <SheetClose asChild>
                <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-gray-100 text-gray-400">
                    Tutup
                </Button>
             </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
