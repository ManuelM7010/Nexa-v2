import React, { useState } from 'react';
import { CreditCard } from '../../types';
import { formatMoney } from '../../utils/formatters';

export type BankRegion = 'todos' | 'mexico' | 'centroamerica' | 'sudamerica' | 'global' | 'fintech';

export interface BankPreset {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  region: 'mexico' | 'centroamerica' | 'sudamerica' | 'global' | 'fintech';
  gradient: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  chipColor: 'gold' | 'silver';
  defaultNetwork: 'visa' | 'mastercard' | 'amex';
  webDomain?: string;
  renderLogo: (className?: string) => React.ReactNode;
}

export const BANK_REGIONS: { id: BankRegion; name: string }[] = [
  { id: 'todos', name: 'Todos los Bancos' },
  { id: 'mexico', name: 'México' },
  { id: 'centroamerica', name: 'Centroamérica' },
  { id: 'sudamerica', name: 'Sudamérica' },
  { id: 'global', name: 'USA & Global' },
  { id: 'fintech', name: 'Fintech & Digital' },
];

// Helper to get web image logo from reliable CDNs
export function getInternetBankLogoUrl(domainOrName: string): string {
  if (!domainOrName) return '';
  const clean = domainOrName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domain = clean.includes('.') ? clean : `${clean}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

// -------------------------------------------------------------
// Authentic Bank Logos (Vector SVG) & Card Presets
// -------------------------------------------------------------
export const BANK_PRESETS: BankPreset[] = [
  // --- MÉXICO ---
  {
    id: 'bbva',
    name: 'BBVA',
    aliases: ['bbva', 'bancomer', 'bbva bancomer', 'bbva mexico', 'bbva espana'],
    country: 'México / España / Global',
    region: 'mexico',
    gradient: 'from-[#004481] via-[#043263] to-[#011c38]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-500/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'bbva.mx',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-lg tracking-wider text-white font-sans drop-shadow-sm select-none">
          BBVA
        </span>
      </div>
    ),
  },
  {
    id: 'santander',
    name: 'Santander',
    aliases: ['santander', 'banco santander', 'serfin'],
    country: 'México / España / Global',
    region: 'mexico',
    gradient: 'from-[#ec0000] via-[#c40000] to-[#7a0000]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-500/50',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'santander.com.mx',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Santander Flame */}
        <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0 fill-white drop-shadow">
          <path d="M 50 14 C 44 26, 32 38, 32 54 C 32 68, 40 78, 50 82 C 60 78, 68 68, 68 54 C 68 38, 56 26, 50 14 Z M 50 36 C 54 44, 58 52, 58 60 C 58 66, 54 70, 50 72 C 46 70, 42 66, 42 60 C 42 52, 46 44, 50 36 Z" />
        </svg>
        <span className="font-black tracking-tight text-white text-sm uppercase">Santander</span>
      </div>
    ),
  },
  {
    id: 'banorte',
    name: 'Banorte',
    aliases: ['banorte', 'ixe', 'banco banorte', 'fuerte'],
    country: 'México',
    region: 'mexico',
    gradient: 'from-[#eb192e] via-[#b00f1f] to-[#69050f]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-500/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'banorte.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Banorte Eagle Wings Emblem */}
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-white">
          <path d="M 10 35 L 50 15 L 90 35 L 50 55 Z" />
          <path d="M 20 50 L 50 65 L 80 50 L 50 35 Z" opacity="0.8" />
          <path d="M 30 65 L 50 75 L 70 65 L 50 55 Z" opacity="0.6" />
        </svg>
        <span className="font-black text-xs text-white tracking-widest uppercase">BANORTE</span>
      </div>
    ),
  },
  {
    id: 'citi',
    name: 'Citibanamex (Citi)',
    aliases: ['citi', 'citibank', 'citibanamex', 'banamex'],
    country: 'México / USA',
    region: 'mexico',
    gradient: 'from-[#003b70] via-[#002549] to-[#001326]',
    textColor: 'text-white',
    accentColor: '#f87171',
    borderColor: 'border-sky-400/40',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'citibanamex.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center relative ${className}`}>
        <span className="font-black text-base text-white tracking-tighter">citi</span>
        <span className="w-3.5 h-1.5 border-t-2 border-r-2 border-red-500 rounded-tr-full absolute -top-0.5 left-3.5" />
        <span className="font-bold text-[10px] text-blue-200 ml-3.5 tracking-tight uppercase hidden sm:inline">banamex</span>
      </div>
    ),
  },
  {
    id: 'azteca',
    name: 'Banco Azteca',
    aliases: ['azteca', 'banco azteca', 'elektra', 'guardadito'],
    country: 'México / Latam',
    region: 'mexico',
    gradient: 'from-[#007837] via-[#005a28] to-[#003316]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-emerald-400/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'bancoazteca.com.mx',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-5 h-5 rounded-full bg-[#facc15] flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#007837]">
            <path d="M12 2L2 22h20L12 2zm0 5l6 12H6l6-12z" />
          </svg>
        </div>
        <div className="leading-tight">
          <span className="block text-[8px] font-bold text-amber-200 tracking-widest uppercase">BANCO</span>
          <span className="block text-xs font-black text-white tracking-tight uppercase">AZTECA</span>
        </div>
      </div>
    ),
  },

  // --- FINTECH & DIGITAL ---
  {
    id: 'nu',
    name: 'Nu (Nubank)',
    aliases: ['nu', 'nubank', 'nu bank', 'moradita', 'la moradita'],
    country: 'México / Brasil / Colombia',
    region: 'fintech',
    gradient: 'from-[#820ad1] via-[#6105a1] to-[#3a0166]',
    textColor: 'text-white',
    accentColor: '#c084fc',
    borderColor: 'border-purple-400/50',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'nubank.com.br',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="font-extrabold text-2xl tracking-tighter text-white font-sans lowercase drop-shadow">
          nu
        </span>
      </div>
    ),
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    aliases: ['mercado pago', 'mercadopago', 'mp', 'mercadolibre'],
    country: 'México / Argentina / Latam',
    region: 'fintech',
    gradient: 'from-[#009ee3] via-[#007bb0] to-[#004d73]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-300/50',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'mercadopago.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Handshake icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0 drop-shadow">
          <path d="M10.5 3a2.5 2.5 0 0 0-2.5 2.5v1.2a2.5 2.5 0 0 0 1.2 2.1l1.8 1.1-1.6 1.6a2.5 2.5 0 0 0 0 3.5l4 4a2.5 2.5 0 0 0 3.5 0l4-4a2.5 2.5 0 0 0 0-3.5l-1.6-1.6 1.8-1.1A2.5 2.5 0 0 0 23 6.7V5.5A2.5 2.5 0 0 0 20.5 3h-10z" />
        </svg>
        <span className="font-black text-xs text-white tracking-tight">mercado pago</span>
      </div>
    ),
  },
  {
    id: 'revolut',
    name: 'Revolut',
    aliases: ['revolut', 'revolut metal', 'revolut ultra'],
    country: 'Global / Europa / USA',
    region: 'fintech',
    gradient: 'from-[#191919] via-[#0f0f10] to-[#000000]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-slate-700/60',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'revolut.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="font-black text-base text-white tracking-wider font-mono">R</span>
        <span className="font-bold text-xs text-white tracking-tight">Revolut</span>
      </div>
    ),
  },
  {
    id: 'uala',
    name: 'Ualá',
    aliases: ['uala', 'ualá'],
    country: 'Argentina / México / Colombia',
    region: 'fintech',
    gradient: 'from-[#e11d48] via-[#be123c] to-[#4c0519]',
    textColor: 'text-white',
    accentColor: '#fda4af',
    borderColor: 'border-rose-400/50',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'uala.com.ar',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-base text-white tracking-tight lowercase">ualá</span>
      </div>
    ),
  },
  {
    id: 'klar',
    name: 'Klar',
    aliases: ['klar', 'klar credito', 'klar tarjeta'],
    country: 'México',
    region: 'fintech',
    gradient: 'from-[#0f172a] via-[#1e293b] to-[#0284c7]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-400/40',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'klar.mx',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="font-black text-base text-sky-400 tracking-tight">klar</span>
      </div>
    ),
  },
  {
    id: 'stori',
    name: 'Stori',
    aliases: ['stori', 'stori card', 'stori credito'],
    country: 'México',
    region: 'fintech',
    gradient: 'from-[#059669] via-[#047857] to-[#064e3b]',
    textColor: 'text-white',
    accentColor: '#34d399',
    borderColor: 'border-emerald-400/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'storicard.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="font-black text-base text-white tracking-tight">stori</span>
      </div>
    ),
  },

  // --- CENTROAMÉRICA ---
  {
    id: 'bac',
    name: 'BAC Credomatic',
    aliases: ['bac', 'credomatic', 'bac credomatic', 'bac san salvador', 'bac panama', 'bac costa rica', 'bac honduras', 'bac guatemala'],
    country: 'Centroamérica',
    region: 'centroamerica',
    gradient: 'from-[#a8001d] via-[#850016] to-[#45000b]',
    textColor: 'text-white',
    accentColor: '#f87171',
    borderColor: 'border-red-500/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'baccredomatic.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Lion emblem */}
        <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0 fill-current text-white drop-shadow">
          <circle cx="50" cy="50" r="46" fill="#ffffff" fillOpacity="0.15" />
          <path
            d="M 28 36 C 30 24, 45 20, 56 22 C 68 24, 76 34, 73 45 C 70 54, 62 60, 58 66 C 54 72, 49 78, 42 78 C 36 78, 30 73, 27 66 C 24 58, 26 48, 28 36 Z"
            fill="#ffffff"
          />
          <circle cx="48" cy="38" r="4" fill="#a8001d" />
          <path d="M 40 48 Q 50 56 60 48" stroke="#a8001d" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <span className="font-black tracking-tighter text-white text-base">BAC</span>
      </div>
    ),
  },
  {
    id: 'agricola',
    name: 'Banco Agrícola',
    aliases: ['agricola', 'agrícola', 'banco agricola', 'banco agrícola'],
    country: 'El Salvador',
    region: 'centroamerica',
    gradient: 'from-[#0f3d75] via-[#092b57] to-[#04162e]',
    textColor: 'text-white',
    accentColor: '#60a5fa',
    borderColor: 'border-blue-400/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'bancoagricola.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-blue-300">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#60a5fa" strokeWidth="8" />
          <path d="M 30 65 L 50 25 L 70 65 Z" fill="#60a5fa" />
        </svg>
        <div className="leading-none text-left">
          <span className="block text-[8px] font-bold tracking-widest text-blue-200 uppercase">BANCO</span>
          <span className="block text-xs font-black tracking-wider text-white">AGRÍCOLA</span>
        </div>
      </div>
    ),
  },
  {
    id: 'cuscatlan',
    name: 'Banco Cuscatlán',
    aliases: ['cuscatlan', 'cuscatlán', 'banco cuscatlan'],
    country: 'El Salvador / Honduras',
    region: 'centroamerica',
    gradient: 'from-[#1a365d] via-[#102a43] to-[#0b1c2d]',
    textColor: 'text-white',
    accentColor: '#f59e0b',
    borderColor: 'border-amber-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bancocuscatlan.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-4 h-4 bg-amber-400 rounded-sm transform rotate-45 shrink-0" />
        <span className="font-black text-xs text-white tracking-wider uppercase">CUSCATLAN</span>
      </div>
    ),
  },
  {
    id: 'promerica',
    name: 'Banco Promerica',
    aliases: ['promerica', 'banco promerica', 'promerica cr', 'promerica sv', 'promerica gt'],
    country: 'Centroamérica / Caribe',
    region: 'centroamerica',
    gradient: 'from-[#006341] via-[#004a31] to-[#002e1e]',
    textColor: 'text-white',
    accentColor: '#4ade80',
    borderColor: 'border-emerald-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'promerica.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Promerica</span>
      </div>
    ),
  },
  {
    id: 'banco_general',
    name: 'Banco General',
    aliases: ['banco general', 'bg', 'general panama'],
    country: 'Panamá',
    region: 'centroamerica',
    gradient: 'from-[#003882] via-[#002456] to-[#001433]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bgeneral.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-sky-300">
          <polygon points="50,5 64,36 98,36 70,58 81,91 50,70 19,91 30,58 2,36 36,36" />
        </svg>
        <span className="font-extrabold text-xs tracking-tight text-white uppercase">Banco General</span>
      </div>
    ),
  },
  {
    id: 'ficohsa',
    name: 'Ficohsa',
    aliases: ['ficohsa', 'banco ficohsa'],
    country: 'Honduras / Guatemala / Nicaragua / Panamá',
    region: 'centroamerica',
    gradient: 'from-[#0b2f64] via-[#061d40] to-[#020e21]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-400/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'ficohsa.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Ficohsa</span>
      </div>
    ),
  },
  {
    id: 'industrial',
    name: 'Banco Industrial (BI)',
    aliases: ['banco industrial', 'bi', 'industrial guatemala'],
    country: 'Guatemala / El Salvador / Panamá',
    region: 'centroamerica',
    gradient: 'from-[#002f6c] via-[#001e47] to-[#001129]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-yellow-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'corporacionbi.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-sm text-yellow-400">Bi</span>
        <span className="font-bold text-xs text-white tracking-tight">Banco Industrial</span>
      </div>
    ),
  },

  // --- SUDAMÉRICA ---
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    aliases: ['bancolombia', 'grupo bancolombia'],
    country: 'Colombia',
    region: 'sudamerica',
    gradient: 'from-[#1c1c1e] via-[#121214] to-[#050505]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-yellow-500/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'bancolombia.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="flex flex-col gap-0.5">
          <span className="w-5 h-1 bg-[#fed100] rounded-sm" />
          <span className="w-5 h-1 bg-[#002f6c] rounded-sm" />
          <span className="w-5 h-1 bg-[#c8102e] rounded-sm" />
        </div>
        <span className="font-extrabold text-xs tracking-tight text-white uppercase">Bancolombia</span>
      </div>
    ),
  },
  {
    id: 'davivienda',
    name: 'Davivienda',
    aliases: ['davivienda'],
    country: 'Colombia / Centroamérica',
    region: 'sudamerica',
    gradient: 'from-[#ed1c24] via-[#b51016] to-[#6e0509]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-400/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'davivienda.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-white">
          <polygon points="50,15 90,48 80,48 80,85 20,85 20,48 10,48" />
          <rect x="40" y="55" width="20" height="30" fill="#ed1c24" />
        </svg>
        <span className="font-black text-xs text-white tracking-tight uppercase">Davivienda</span>
      </div>
    ),
  },
  {
    id: 'bcp',
    name: 'BCP (Banco de Crédito)',
    aliases: ['bcp', 'banco de credito', 'banco de crédito'],
    country: 'Perú',
    region: 'sudamerica',
    gradient: 'from-[#002a86] via-[#011c5c] to-[#001038]',
    textColor: 'text-white',
    accentColor: '#fb923c',
    borderColor: 'border-orange-500/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'viabcp.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-base text-white tracking-tight">BCP</span>
        <span className="w-2.5 h-2.5 bg-[#ff7800] rounded-full shrink-0" />
      </div>
    ),
  },
  {
    id: 'interbank',
    name: 'Interbank',
    aliases: ['interbank'],
    country: 'Perú',
    region: 'sudamerica',
    gradient: 'from-[#009b3a] via-[#00702a] to-[#004218]',
    textColor: 'text-white',
    accentColor: '#86efac',
    borderColor: 'border-emerald-400/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'interbank.pe',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center font-black text-[9px] text-[#009b3a]">
          i
        </span>
        <span className="font-black text-xs text-white tracking-tight">Interbank</span>
      </div>
    ),
  },
  {
    id: 'bancodechile',
    name: 'Banco de Chile',
    aliases: ['banco de chile', 'banco chile', 'bchile'],
    country: 'Chile',
    region: 'sudamerica',
    gradient: 'from-[#0d2c65] via-[#081e47] to-[#030e26]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bancochile.cl',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Banco de Chile</span>
      </div>
    ),
  },
  {
    id: 'bci',
    name: 'BCI',
    aliases: ['bci', 'banco de credito e inversiones'],
    country: 'Chile',
    region: 'sudamerica',
    gradient: 'from-[#004691] via-[#003166] to-[#001c3d]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-blue-400/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'bci.cl',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-sm text-white tracking-wider">Bci</span>
      </div>
    ),
  },
  {
    id: 'pichincha',
    name: 'Banco Pichincha',
    aliases: ['pichincha', 'banco pichincha'],
    country: 'Ecuador / Colombia / España',
    region: 'sudamerica',
    gradient: 'from-[#0f2042] via-[#08152e] to-[#030917]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-yellow-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'pichincha.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="w-4 h-4 bg-[#ffdd00] rounded-sm transform rotate-45 shrink-0" />
        <span className="font-black text-xs tracking-tight text-white uppercase">Pichincha</span>
      </div>
    ),
  },
  {
    id: 'mercantil',
    name: 'Mercantil',
    aliases: ['mercantil', 'banco mercantil'],
    country: 'Venezuela / Panamá / USA',
    region: 'sudamerica',
    gradient: 'from-[#003f7a] via-[#002a54] to-[#001730]',
    textColor: 'text-white',
    accentColor: '#fb923c',
    borderColor: 'border-blue-400/40',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'mercantilbanco.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Mercantil</span>
      </div>
    ),
  },
  {
    id: 'banesco',
    name: 'Banesco',
    aliases: ['banesco'],
    country: 'Venezuela / Panamá / Rep. Dominicana',
    region: 'sudamerica',
    gradient: 'from-[#00824b] via-[#005e36] to-[#003820]',
    textColor: 'text-white',
    accentColor: '#86efac',
    borderColor: 'border-emerald-400/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'banesco.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Banesco</span>
      </div>
    ),
  },

  // --- USA & GLOBAL ---
  {
    id: 'hsbc',
    name: 'HSBC',
    aliases: ['hsbc', 'banco hsbc', 'hsbc premier'],
    country: 'Global / Latam / UK',
    region: 'global',
    gradient: 'from-[#db0011] via-[#94000b] to-[#450005]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-400/40',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'hsbc.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* HSBC Hexagonal Hourglass */}
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-white">
          <polygon points="50,10 90,50 50,90 10,50" fill="#ffffff" />
          <polygon points="50,10 50,50 10,50" fill="#db0011" />
          <polygon points="50,90 50,50 90,50" fill="#db0011" />
        </svg>
        <span className="font-black text-xs text-white tracking-widest uppercase">HSBC</span>
      </div>
    ),
  },
  {
    id: 'scotiabank',
    name: 'Scotiabank',
    aliases: ['scotiabank', 'scotia', 'inverlat'],
    country: 'Canadá / Latam / Global',
    region: 'global',
    gradient: 'from-[#ed111a] via-[#ab0c13] to-[#590408]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-400/40',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'scotiabank.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="w-5 h-5 rounded-full bg-white text-[#ed111a] font-black flex items-center justify-center text-xs">
          S
        </span>
        <span className="font-black text-xs tracking-tight text-white">Scotiabank</span>
      </div>
    ),
  },
  {
    id: 'chase',
    name: 'Chase (JPMorgan)',
    aliases: ['chase', 'jpmorgan', 'jp morgan', 'chase sapphire', 'chase freedom'],
    country: 'USA / Global',
    region: 'global',
    gradient: 'from-[#1170cf] via-[#094e96] to-[#042852]',
    textColor: 'text-white',
    accentColor: '#93c5fd',
    borderColor: 'border-blue-400/50',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'chase.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-white">
          <polygon points="50,6 88,24 94,66 66,94 24,88 6,50 24,12" fill="none" stroke="#ffffff" strokeWidth="12" />
          <rect x="36" y="36" width="28" height="28" fill="#ffffff" />
        </svg>
        <span className="font-black text-sm tracking-widest text-white uppercase">CHASE</span>
      </div>
    ),
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    aliases: ['bank of america', 'bofa', 'bofa us'],
    country: 'USA',
    region: 'global',
    gradient: 'from-[#002868] via-[#011c47] to-[#00102b]',
    textColor: 'text-white',
    accentColor: '#ef4444',
    borderColor: 'border-red-500/30',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bankofamerica.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="grid grid-cols-3 gap-0.5 w-4 h-4 shrink-0">
          <span className="bg-[#bf0a30]" />
          <span className="bg-white" />
          <span className="bg-[#002868]" />
          <span className="bg-white" />
          <span className="bg-[#bf0a30]" />
          <span className="bg-white" />
        </div>
        <span className="font-extrabold text-[11px] tracking-tight text-white uppercase leading-none">
          Bank of America
        </span>
      </div>
    ),
  },
  {
    id: 'wellsfargo',
    name: 'Wells Fargo',
    aliases: ['wells fargo', 'wells', 'wellsfargo'],
    country: 'USA',
    region: 'global',
    gradient: 'from-[#9e1b32] via-[#741324] to-[#400611]',
    textColor: 'text-white',
    accentColor: '#fbbf24',
    borderColor: 'border-amber-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'wellsfargo.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="bg-[#d41c2c] text-[#ffdd00] px-1.5 py-0.5 rounded font-black text-[10px] tracking-tighter">
          WELLS
        </div>
        <span className="font-black text-xs text-white uppercase tracking-tight">FARGO</span>
      </div>
    ),
  },
  {
    id: 'amex_card',
    name: 'American Express',
    aliases: ['amex', 'american express', 'centurion', 'platinum card'],
    country: 'USA / Global',
    region: 'global',
    gradient: 'from-[#006fcf] via-[#004f99] to-[#002d59]',
    textColor: 'text-white',
    accentColor: '#93c5fd',
    borderColor: 'border-sky-300/40',
    chipColor: 'silver',
    defaultNetwork: 'amex',
    webDomain: 'americanexpress.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="bg-[#006fcf] text-white px-2 py-0.5 rounded font-black text-[10px] tracking-tighter uppercase border border-sky-300/50 shadow-sm">
          AMEX
        </div>
      </div>
    ),
  },
  {
    id: 'black_diamond',
    name: 'Black Diamond / Titanio',
    aliases: ['black', 'titanium', 'carbon', 'obsidian', 'vip', 'infinite', 'black reserve'],
    country: 'Edición Ejecutiva',
    region: 'global',
    gradient: 'from-[#18181b] via-[#09090b] to-[#000000]',
    textColor: 'text-white',
    accentColor: '#fbbf24',
    borderColor: 'border-amber-400/50',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="w-3.5 h-3.5 bg-gradient-to-tr from-amber-400 to-amber-200 transform rotate-45 rounded-xs shrink-0 shadow-sm" />
        <span className="font-black text-[11px] tracking-widest text-amber-300 uppercase">BLACK RESERVE</span>
      </div>
    ),
  },
];

// Helper to find the best bank preset given a bank name or preset key
export function getBankPreset(bankName?: string, bankLogoKey?: string): BankPreset {
  if (bankLogoKey) {
    const found = BANK_PRESETS.find((p) => p.id === bankLogoKey);
    if (found) return found;
  }

  if (bankName) {
    const clean = bankName.toLowerCase().trim();
    // 1. Exact or alias match
    for (const preset of BANK_PRESETS) {
      if (preset.name.toLowerCase() === clean || preset.aliases.includes(clean)) {
        return preset;
      }
    }
    // 2. Substring match
    for (const preset of BANK_PRESETS) {
      if (clean.includes(preset.id)) return preset;
      for (const alias of preset.aliases) {
        if (clean.includes(alias)) return preset;
      }
    }
  }

  // Default elegant style: BBVA as premier baseline
  return BANK_PRESETS[0];
}

// -------------------------------------------------------------
// Payment Network Logos (Visa, Mastercard, Amex)
// -------------------------------------------------------------
export const PaymentNetworkLogo: React.FC<{ network?: 'visa' | 'mastercard' | 'amex' | 'generic'; className?: string }> = ({
  network = 'visa',
  className = 'h-6',
}) => {
  if (network === 'mastercard') {
    return (
      <div className={`flex items-center ${className}`}>
        <svg viewBox="0 0 100 62" className="h-full w-auto drop-shadow-sm">
          <circle cx="34" cy="31" r="28" fill="#EB001B" />
          <circle cx="66" cy="31" r="28" fill="#F79E1B" fillOpacity="0.9" />
          <path
            d="M 50 12.5 C 56.4 17.5 60.5 24.5 60.5 31 C 60.5 37.5 56.4 44.5 50 49.5 C 43.6 44.5 39.5 37.5 39.5 31 C 39.5 24.5 43.6 17.5 50 12.5 Z"
            fill="#FF5F00"
          />
        </svg>
      </div>
    );
  }

  if (network === 'amex') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="bg-[#006fcf] text-white px-2 py-0.5 rounded font-black text-[10px] tracking-tighter uppercase border border-sky-300/40 shadow-sm">
          AMEX
        </div>
      </div>
    );
  }

  // Default Visa
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-black italic text-lg tracking-tighter text-white drop-shadow font-serif">
        VISA
      </span>
    </div>
  );
};

// -------------------------------------------------------------
// Metallic EMV Chip Component
// -------------------------------------------------------------
export const MetallicChip: React.FC<{ color?: 'gold' | 'silver'; className?: string }> = ({
  color = 'gold',
  className = '',
}) => {
  const isGold = color === 'gold';
  return (
    <div
      className={`w-10 h-7 rounded-md relative overflow-hidden border ${
        isGold
          ? 'bg-gradient-to-tr from-[#d4af37] via-[#f9e79f] to-[#aa8010] border-[#8a6808] shadow-inner'
          : 'bg-gradient-to-tr from-[#cbd5e1] via-[#f1f5f9] to-[#94a3b8] border-[#64748b] shadow-inner'
      } ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-70">
        <div className="w-full h-[1px] bg-black/40" />
        <div className="absolute h-full w-[1px] bg-black/40" />
        <div className="absolute w-4 h-4 border border-black/40 rounded-sm" />
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Contactless Waves Component
// -------------------------------------------------------------
export const ContactlessIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-white/80' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className}>
    <path d="M7 16 C 5.5 13.5, 5.5 10.5, 7 8" />
    <path d="M11 19 C 8.5 15, 8.5 9, 11 5" />
    <path d="M15 22 C 11.5 16.5, 11.5 7.5, 15 2" />
  </svg>
);

// -------------------------------------------------------------
// Standalone Mini Bank Badge (for Tabs, Dropdowns & Lists)
// -------------------------------------------------------------
export const BankLogoBadge: React.FC<{
  card?: CreditCard;
  bankName?: string;
  bankLogoKey?: string;
  bankLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ card, bankName, bankLogoKey, bankLogoUrl, size = 'sm', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const finalBank = bankName || card?.bank || '';
  const finalKey = bankLogoKey || card?.bankLogoKey;
  const finalUrl = bankLogoUrl || card?.bankLogoUrl;
  const preset = getBankPreset(finalBank, finalKey);

  const dims = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  if (finalUrl && !imgError) {
    return (
      <div
        className={`${dims} rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center p-0.5 shadow-sm ${className}`}
        title={finalBank || preset.name}
      >
        <img
          src={finalUrl}
          alt={finalBank || 'Banco'}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-lg overflow-hidden border ${preset.borderColor} bg-gradient-to-br ${preset.gradient} shrink-0 flex items-center justify-center p-1 shadow-sm ${className}`}
      title={preset.name}
    >
      <div className="scale-75 origin-center">{preset.renderLogo()}</div>
    </div>
  );
};

// -------------------------------------------------------------
// Digital Card Mini Banner (for Statement Headers & Detailed Views)
// -------------------------------------------------------------
export const DigitalCardMiniBanner: React.FC<{
  card: CreditCard;
  statusBadge?: React.ReactNode;
  className?: string;
}> = ({ card, statusBadge, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const preset = getBankPreset(card.bank, card.bankLogoKey);
  const network = card.network || preset.defaultNetwork;
  const digits = card.last4Digits || card.id.slice(-4).padStart(4, '0');

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border bg-gradient-to-br ${preset.gradient} ${preset.borderColor} shadow-xl relative overflow-hidden select-none text-white ${className}`}
    >
      {/* Foil light overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Bank Logo / Image */}
          <div className="p-1 rounded-xl bg-black/30 backdrop-blur-sm border border-white/15 shrink-0">
            {card.bankLogoUrl && !imgError ? (
              <img
                src={card.bankLogoUrl}
                alt={card.bank}
                className="h-8 max-w-[120px] object-contain drop-shadow"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-8 flex items-center px-2">{preset.renderLogo('h-6')}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-black tracking-tight text-white">{card.name}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/15 border border-white/20 uppercase tracking-wider">
                {card.bank}
              </span>
              {statusBadge}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/80 font-mono">
              <span>•••• •••• •••• {digits}</span>
              <span>·</span>
              <span>Corte: Día {card.cutOffDay}</span>
              <span>·</span>
              <span>Pagar antes de: Día {card.paymentDueDay}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <ContactlessIcon className="w-5 h-5 text-white/80" />
          <PaymentNetworkLogo network={network} className="h-6" />
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Full Digital Credit Card Visual Component
// -------------------------------------------------------------
export interface DigitalCreditCardProps {
  card: CreditCard;
  balance?: number; // current used balance in cents
  available?: number; // available credit in cents
  showBalancePills?: boolean;
  compact?: boolean;
  className?: string;
  currencySymbol?: string;
}

export const DigitalCreditCard: React.FC<DigitalCreditCardProps> = ({
  card,
  balance,
  available,
  showBalancePills = true,
  compact = false,
  className = '',
  currencySymbol = '$',
}) => {
  const [imgError, setImgError] = useState(false);
  const preset = getBankPreset(card.bank, card.bankLogoKey);
  const network = card.network || preset.defaultNetwork;
  const digits = card.last4Digits || card.id.slice(-4).padStart(4, '0');

  return (
    <div
      className={`relative rounded-2xl md:rounded-3xl p-5 md:p-6 overflow-hidden border bg-gradient-to-br ${preset.gradient} ${preset.borderColor} shadow-2xl transition-all duration-300 hover:shadow-cyan-900/20 group select-none ${
        compact ? 'max-w-md' : 'w-full'
      } ${className}`}
      style={{
        aspectRatio: '1.62 / 1',
        minHeight: compact ? '190px' : '210px',
      }}
    >
      {/* 1. Foil Light Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

      {/* 2. Abstract Geometric Hologram Ribbons */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/30 blur-xl pointer-events-none" />

      {/* Micro-texture Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Card Content Layout */}
      <div className="relative z-10 flex flex-col justify-between h-full text-white">
        {/* Top Row: Bank Brand Logo & Contactless */}
        <div className="flex items-start justify-between gap-3">
          {/* Bank Logo / Image */}
          <div className="flex items-center gap-2">
            {card.bankLogoUrl && !imgError ? (
              <div className="h-8 max-w-[140px] flex items-center">
                <img
                  src={card.bankLogoUrl}
                  alt={card.bank}
                  className="max-h-8 max-w-[130px] object-contain drop-shadow"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="drop-shadow-md">{preset.renderLogo('h-7')}</div>
            )}
            <span className="text-[10px] tracking-wider uppercase font-semibold text-white/70 hidden sm:inline">
              {card.bank}
            </span>
          </div>

          {/* Contactless Wave & Digital Card Tag */}
          <div className="flex items-center gap-2">
            <ContactlessIcon className="w-4 h-4 text-white/80 drop-shadow" />
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/30 border border-white/20 backdrop-blur-sm">
              DIGITAL
            </span>
          </div>
        </div>

        {/* Middle Row: EMV Metallic Chip & Card Concept */}
        <div className="my-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <MetallicChip color={preset.chipColor} />
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-md text-white truncate max-w-[200px] sm:max-w-xs">
                {card.name}
              </h3>
              <span className="text-[10px] font-mono tracking-widest text-white/70 block uppercase">
                CRÉDITO REVOLVENTE
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Card Masked Number, Expiry/Cutoff & Network Logo */}
        <div className="space-y-2 pt-2">
          {/* Card Number Mask */}
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs sm:text-sm tracking-[0.25em] text-white/90 drop-shadow font-bold">
              •••• •••• •••• {digits}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-white/80">
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-white/60">CORTE</span>
                <span className="font-mono font-bold">DÍA {card.cutOffDay}</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-white/60">LÍMITE</span>
                <span className="font-mono font-bold">DÍA {card.paymentDueDay}</span>
              </div>
            </div>
          </div>

          {/* Cardholder Name & Payment Network */}
          <div className="flex items-end justify-between pt-1 border-t border-white/15">
            <div className="truncate pr-2">
              <span className="block text-[8px] uppercase tracking-widest text-white/60 font-semibold">
                LÍMITE ASIGNADO
              </span>
              <span className="text-xs font-mono font-black tracking-wide text-white drop-shadow">
                {formatMoney(card.limit, currencySymbol)}
              </span>
            </div>

            {/* Payment Network Emblem */}
            <div className="shrink-0">
              <PaymentNetworkLogo network={network} className="h-5 sm:h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Optional Top Floating Status Pill */}
      {showBalancePills && balance !== undefined && available !== undefined && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white flex items-center gap-2 shadow-xl whitespace-nowrap">
            <span>Deuda: <strong className="text-rose-400">{formatMoney(balance, currencySymbol)}</strong></span>
            <span>•</span>
            <span>Disp: <strong className="text-sky-400">{formatMoney(available, currencySymbol)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
