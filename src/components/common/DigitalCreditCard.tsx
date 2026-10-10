import React, { useState } from 'react';
import { CreditCard } from '../../types';
import { formatMoney } from '../../utils/formatters';

export type BankRegion = 'todos' | 'el_salvador' | 'mexico' | 'centroamerica' | 'sudamerica' | 'global' | 'fintech';

export interface BankPreset {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  region: BankRegion;
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
  { id: 'el_salvador', name: '🇸🇻 El Salvador' },
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
// Card Design Presets & Visual Tiers (Azules, Doradas, Walmart, Super Selectos, Premia Gold...)
// -------------------------------------------------------------
export type CardDesignCategory = 'premia_oro' | 'super' | 'azul' | 'premium' | 'cobranded';

export interface CardDesignPreset {
  id: string;
  name: string;
  category: CardDesignCategory;
  categoryLabel: string;
  description: string;
  badgeLabel: string;
  gradient: string;
  borderColor: string;
  chipColor: 'gold' | 'silver';
  textColor: string;
  accentColor: string;
  isGoldFoil?: boolean;
}

export const CARD_DESIGN_PRESETS: CardDesignPreset[] = [
  // --- 🥇 PREMIA GOLD & DORADAS (FOTOGRAFÍAS REALES DE EL SALVADOR) ---
  {
    id: 'agricola_dorada_nueva',
    name: 'Agrícola Crédito Dorada (Nueva Identidad)',
    category: 'premia_oro',
    categoryLabel: 'Agrícola Dorada',
    description: 'Oro satinado oficial de Banco Agrícola con los arcos multicolor dinámicos y trazos de marca',
    badgeLabel: 'CRÉDITO DORADA',
    gradient: 'from-[#dcc075] via-[#c4a35a] via-[#ab8a42] to-[#73581e]',
    borderColor: 'border-amber-400/80',
    chipColor: 'gold',
    textColor: 'text-neutral-900',
    accentColor: '#10b981',
    isGoldFoil: true,
  },
  {
    id: 'promerica_premia_gold',
    name: 'Promerica Premia Gold (Origami 3D)',
    category: 'premia_oro',
    categoryLabel: 'Promerica Premia',
    description: 'Facetas geométricas 3D en bronce y champagne mate con estrella Promerica y tipografía Premia',
    badgeLabel: 'PREMIA GOLD',
    gradient: 'from-[#8c7247] via-[#a38755] via-[#c5a974] to-[#5c4728]',
    borderColor: 'border-amber-400/70',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#f59e0b',
    isGoldFoil: true,
  },
  {
    id: 'premia_gold',
    name: 'Premia Gold Prestige',
    category: 'premia_oro',
    categoryLabel: 'Premia Gold',
    description: 'Lingote de oro cepillado de alto gramaje con filigrana guilloché de seguridad bancaria y sello 3D grabado',
    badgeLabel: 'PREMIA GOLD',
    gradient: 'from-[#fef08a] via-[#eab308] via-[#ca8a04] to-[#713f12]',
    borderColor: 'border-amber-300/80',
    chipColor: 'gold',
    textColor: 'text-amber-950',
    accentColor: '#ca8a04',
    isGoldFoil: true,
  },
  {
    id: 'gold',
    name: 'Dorada / Gold Clásica',
    category: 'premia_oro',
    categoryLabel: 'Dorada / Gold',
    description: 'Oro noble reflectante con destellos champagne y microcircuitos grabados en oro puro',
    badgeLabel: 'GOLD / ORO',
    gradient: 'from-[#fef9c3] via-[#facc15] via-[#ca8a04] to-[#78350f]',
    borderColor: 'border-yellow-400/70',
    chipColor: 'gold',
    textColor: 'text-amber-950',
    accentColor: '#f59e0b',
    isGoldFoil: true,
  },
  {
    id: 'rose_gold',
    name: 'Oro Rosado / Rose Gold',
    category: 'premia_oro',
    categoryLabel: 'Rose Gold',
    description: 'Aleación de oro rosa sedoso con reflejos cobrizos y brillo nacarado de alta gama',
    badgeLabel: 'ROSE GOLD',
    gradient: 'from-[#fecdd3] via-[#fb7185] via-[#e11d48] to-[#4c0519]',
    borderColor: 'border-rose-300/70',
    chipColor: 'gold',
    textColor: 'text-rose-950',
    accentColor: '#f43f5e',
    isGoldFoil: true,
  },
  {
    id: 'millas_gold',
    name: 'Millas Plus / Viajero Gold',
    category: 'premia_oro',
    categoryLabel: 'Millas Gold',
    description: 'Oro ámbar con brújula de navegación y alas de aviación para acumulación de millas',
    badgeLabel: 'MILLAS GOLD',
    gradient: 'from-[#fef08a] via-[#d97706] to-[#451a03]',
    borderColor: 'border-amber-400/80',
    chipColor: 'gold',
    textColor: 'text-amber-950',
    accentColor: '#d97706',
    isGoldFoil: true,
  },
  {
    id: 'puntos_oro',
    name: 'Puntos Oro El Salvador',
    category: 'premia_oro',
    categoryLabel: 'Puntos Oro',
    description: 'Dorado intenso con constelación de recompensas y chip de oro brillante',
    badgeLabel: 'PUNTOS ORO',
    gradient: 'from-[#fde047] via-[#ca8a04] to-[#422006]',
    borderColor: 'border-yellow-300/80',
    chipColor: 'gold',
    textColor: 'text-yellow-950',
    accentColor: '#eab308',
    isGoldFoil: true,
  },
  {
    id: 'davivienda_oro',
    name: 'Davivienda Dorada / Gold',
    category: 'premia_oro',
    categoryLabel: 'Davivienda Gold',
    description: 'Oro noble con la icónica casita roja de Davivienda, banda carmesí y chip dorado de alto gramaje',
    badgeLabel: 'DAVIVIENDA GOLD',
    gradient: 'from-[#fef08a] via-[#eab308] via-[#ca8a04] to-[#7f1d1d]',
    borderColor: 'border-red-400/60',
    chipColor: 'gold',
    textColor: 'text-amber-950',
    accentColor: '#ef4444',
    isGoldFoil: true,
  },
  {
    id: 'fedecredito_oro',
    name: 'FEDECRÉDITO Visa Oro Oficial',
    category: 'premia_oro',
    categoryLabel: 'FEDECRÉDITO Oro',
    description: 'Oro satinado oficial del Sistema FEDECRÉDITO con círculo institucional en amarillo sol y azul rey',
    badgeLabel: 'FEDECRÉDITO ORO',
    gradient: 'from-[#fef08a] via-[#ca8a04] via-[#003882] to-[#001f4d]',
    borderColor: 'border-yellow-300/80',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#facc15',
    isGoldFoil: true,
  },
  {
    id: 'banco_azul_oro',
    name: 'Banco Azul Oro / Gold',
    category: 'premia_oro',
    categoryLabel: 'Banco Azul Oro',
    description: 'Dorado champagne con la insignia oficial del ave y onda azul eléctrico de Banco Azul El Salvador',
    badgeLabel: 'AZUL ORO',
    gradient: 'from-[#fef08a] via-[#0284c7] to-[#082f49]',
    borderColor: 'border-amber-300/80',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    isGoldFoil: true,
  },

  // --- 🛒 WALMART & SUPERMERCADOS ---
  {
    id: 'walmart',
    name: 'Walmart Mastercard Oficial',
    category: 'super',
    categoryLabel: 'Walmart & Super',
    description: 'Azul rey Walmart oficial con la chispa amarilla Spark de 6 destellos, Maxi Despensa y Despensa de Don Juan',
    badgeLabel: 'WALMART CASHBACK',
    gradient: 'from-[#0071dc] via-[#004c91] to-[#001d3d]',
    borderColor: 'border-yellow-400/70',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#ffc220',
  },
  {
    id: 'walmart_black',
    name: 'Walmart Rewards Black / Elite',
    category: 'super',
    categoryLabel: 'Walmart Black',
    description: 'Negro grafito mate de alta gama con la chispa luminiscente dorada Spark de Walmart',
    badgeLabel: 'WALMART ELITE',
    gradient: 'from-[#1f2937] via-[#111827] to-[#030712]',
    borderColor: 'border-yellow-400/80',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#ffc220',
  },
  {
    id: 'super_selectos',
    name: 'Súper Selectos Oficial',
    category: 'super',
    categoryLabel: 'Súper Selectos',
    description: 'Verde esmeralda y oro cálido oficial de Súper Selectos El Salvador con monograma grabado',
    badgeLabel: 'SELECTOS CLUB',
    gradient: 'from-[#047857] via-[#064e3b] to-[#022c22]',
    borderColor: 'border-amber-400/60',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#facc15',
  },
  {
    id: 'super_selectos_oro',
    name: 'Súper Selectos Gold',
    category: 'super',
    categoryLabel: 'Selectos Gold',
    description: 'Dorado champagne con laurel verde y membresía especial en compras de supermercado',
    badgeLabel: 'SELECTOS GOLD',
    gradient: 'from-[#fef08a] via-[#15803d] to-[#052e16]',
    borderColor: 'border-yellow-300/80',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#84cc16',
  },
  {
    id: 'pricesmart',
    name: 'PriceSmart Diamond Club',
    category: 'super',
    categoryLabel: 'PriceSmart',
    description: 'Rojo carmesí y azul medianoche con sello de membresía para compras mayoristas de club',
    badgeLabel: 'PRICESMART CLUB',
    gradient: 'from-[#b91c1c] via-[#1e3a8a] to-[#091026]',
    borderColor: 'border-red-400/50',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#f87171',
  },
  {
    id: 'super_cashback',
    name: 'Supermercados CashBack',
    category: 'super',
    categoryLabel: 'Super CashBack',
    description: 'Rojo rubí a naranja ámbar con devolución especial en compras de víveres y abarrotes',
    badgeLabel: 'SUPER CASHBACK',
    gradient: 'from-[#e11d48] via-[#ea580c] to-[#431407]',
    borderColor: 'border-orange-400/60',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#fb923c',
  },
  {
    id: 'promerica_club',
    name: 'Club Promerica Esmeralda',
    category: 'super',
    categoryLabel: 'Club Promerica',
    description: 'Verde esmeralda y titanio mate para compras en comercios afiliados y supermercados',
    badgeLabel: 'CLUB PROMERICA',
    gradient: 'from-[#059669] via-[#047857] to-[#064e3b]',
    borderColor: 'border-emerald-400/60',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#34d399',
  },

  // --- 💙 LAS AZULES ---
  {
    id: 'agricola_clasica_azul_nueva',
    name: 'Agrícola Crédito Clásica Azul (Nueva)',
    category: 'azul',
    categoryLabel: 'Agrícola Azul',
    description: 'Azul cobalto oficial de Banco Agrícola con los arcos multicolor de la nueva identidad',
    badgeLabel: 'CRÉDITO CLÁSICA',
    gradient: 'from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a]',
    borderColor: 'border-blue-400/60',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#38bdf8',
  },
  {
    id: 'blue_clasica',
    name: 'Azul / Clásica Rewards',
    category: 'azul',
    categoryLabel: 'Las Azules',
    description: 'Azul cobalto y real con ondas dinámicas de fidelidad',
    badgeLabel: 'CLÁSICA / AZUL',
    gradient: 'from-[#1d4ed8] via-[#1e3a8a] to-[#0b132b]',
    borderColor: 'border-blue-400/50',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#60a5fa',
  },
  {
    id: 'blue_zafiro',
    name: 'Azul Zafiro / El Salvador',
    category: 'azul',
    categoryLabel: 'Las Azules',
    description: 'Azul eléctrico vibrante y cyan zafiro con facetas reflectantes (inspirado en Banco Azul y Visa Zafiro)',
    badgeLabel: 'AZUL ZAFIRO',
    gradient: 'from-[#0284c7] via-[#0369a1] to-[#082f49]',
    borderColor: 'border-sky-400/60',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#38bdf8',
  },
  {
    id: 'blue_navy',
    name: 'Azul Marino Ejecutivo',
    category: 'azul',
    categoryLabel: 'Las Azules',
    description: 'Deep Navy y azul medianoche con filamentos plata (estilo Cuscatlán MultiPremios y BAC Conecta)',
    badgeLabel: 'NAVY EJECUTIVA',
    gradient: 'from-[#172554] via-[#0f172a] to-[#020617]',
    borderColor: 'border-blue-500/40',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#93c5fd',
  },
  {
    id: 'blue_cashback',
    name: 'Azul CashBack / Conecta',
    category: 'azul',
    categoryLabel: 'Las Azules',
    description: 'Azul aguamarina a azul profundo con ondas de reembolso inteligente y compras en línea',
    badgeLabel: 'CONECTA AZUL',
    gradient: 'from-[#0284c7] via-[#1d4ed8] to-[#0f172a]',
    borderColor: 'border-cyan-400/50',
    chipColor: 'silver',
    textColor: 'text-white',
    accentColor: '#22d3ee',
  },

  // --- 💎 ALTA GAMA PLATINO & OBSIDIANA ---
  {
    id: 'promerica_premia_platinum',
    name: 'Promerica Premia Platinum 3D',
    category: 'premium',
    categoryLabel: 'Promerica Platinum',
    description: 'Facetas geométricas 3D en plata y titanio mercurio con estrella blanca y Premia platinum',
    badgeLabel: 'PREMIA PLATINUM',
    gradient: 'from-[#94a3b8] via-[#cbd5e1] via-[#64748b] to-[#334155]',
    borderColor: 'border-slate-300/70',
    chipColor: 'silver',
    textColor: 'text-slate-900',
    accentColor: '#e2e8f0',
  },
  {
    id: 'promerica_premia_black',
    name: 'Promerica Premia Black 3D',
    category: 'premium',
    categoryLabel: 'Promerica Black',
    description: 'Facetas geométricas 3D en obsidiana carbón y grafito mate con estrella blanca',
    badgeLabel: 'PREMIA BLACK',
    gradient: 'from-[#27272a] via-[#18181b] to-[#09090b]',
    borderColor: 'border-amber-400/50',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#fbbf24',
  },
  {
    id: 'agricola_platinum_nueva',
    name: 'Agrícola Crédito Platinum (Nueva)',
    category: 'premium',
    categoryLabel: 'Agrícola Platinum',
    description: 'Plata satinada mercurio con los arcos multicolor de la nueva identidad de Banco Agrícola',
    badgeLabel: 'CRÉDITO PLATINUM',
    gradient: 'from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]',
    borderColor: 'border-slate-300/70',
    chipColor: 'silver',
    textColor: 'text-slate-900',
    accentColor: '#94a3b8',
  },
  {
    id: 'agricola_black_nueva',
    name: 'Agrícola Crédito Black (Nueva)',
    category: 'premium',
    categoryLabel: 'Agrícola Black',
    description: 'Negro obsidiana mate con los arcos multicolor de la nueva identidad de Banco Agrícola',
    badgeLabel: 'CRÉDITO BLACK',
    gradient: 'from-[#18181b] via-[#0f172a] to-[#020617]',
    borderColor: 'border-amber-400/40',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#facc15',
  },
  {
    id: 'platinum',
    name: 'Platino / Platinum Metal',
    category: 'premium',
    categoryLabel: 'Alta Gama Platino',
    description: 'Plata mercurio cepillado con reflejos de titanio y chip plata pulida',
    badgeLabel: 'PLATINUM',
    gradient: 'from-[#f8fafc] via-[#cbd5e1] via-[#94a3b8] to-[#334155]',
    borderColor: 'border-slate-300/60',
    chipColor: 'silver',
    textColor: 'text-slate-900',
    accentColor: '#e2e8f0',
  },
  {
    id: 'black_infinite',
    name: 'Black / Infinite Obsidiana',
    category: 'premium',
    categoryLabel: 'Obsidiana Black',
    description: 'Negro obsidiana mate de máxima exclusividad con bisel en oro y logo lustroso',
    badgeLabel: 'INFINITE BLACK',
    gradient: 'from-[#18181b] via-[#09090b] to-[#000000]',
    borderColor: 'border-amber-400/50',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#fbbf24',
  },
  {
    id: 'premia_platinum',
    name: 'Premia Platinum',
    category: 'premium',
    categoryLabel: 'Premia Platinum',
    description: 'Titanio cepillado con guilloché plateado y sello 3D Premia Platinum de alto nivel',
    badgeLabel: 'PREMIA PLATINUM',
    gradient: 'from-[#e2e8f0] via-[#94a3b8] to-[#1e293b]',
    borderColor: 'border-slate-300/80',
    chipColor: 'silver',
    textColor: 'text-slate-900',
    accentColor: '#cbd5e1',
  },

  // --- ✈️ VIAJES & CO-BRANDED ---
  {
    id: 'lifemiles_avianca',
    name: 'LifeMiles Avianca',
    category: 'cobranded',
    categoryLabel: 'Viajes & Avianca',
    description: 'Rojo rubí Avianca y plata cepillada con plumaje aerodinámico (Agrícola y Cuscatlán)',
    badgeLabel: 'LIFEMILES AVIANCA',
    gradient: 'from-[#dc2626] via-[#991b1b] to-[#450a0a]',
    borderColor: 'border-red-400/60',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#fca5a5',
  },
  {
    id: 'real_madrid_cuscatlan',
    name: 'Cuscatlán Real Madrid',
    category: 'cobranded',
    categoryLabel: 'Deportiva Oficial',
    description: 'Blanco perla y azul real con corona dorada y detalles de afición deportiva exclusiva',
    badgeLabel: 'REAL MADRID',
    gradient: 'from-[#ffffff] via-[#e2e8f0] via-[#1e3a8a] to-[#0f172a]',
    borderColor: 'border-amber-400/60',
    chipColor: 'gold',
    textColor: 'text-slate-900',
    accentColor: '#f59e0b',
  },

  // --- 🏛️ INSTITUCIONAL POR DEFECTO ---
  {
    id: 'bank_default',
    name: 'Color Institucional del Banco',
    category: 'azul',
    categoryLabel: 'Color del Banco',
    description: 'Utiliza el degradado y colores corporativos oficiales del banco emisor seleccionado',
    badgeLabel: 'DIGITAL',
    gradient: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    borderColor: 'border-slate-700/60',
    chipColor: 'gold',
    textColor: 'text-white',
    accentColor: '#38bdf8',
  },
];

export function getCardDesignPreset(id?: string): CardDesignPreset {
  if (id) {
    const found = CARD_DESIGN_PRESETS.find((p) => p.id === id);
    if (found) return found;
  }
  return CARD_DESIGN_PRESETS[CARD_DESIGN_PRESETS.length - 1]; // bank_default
}

// Resolver design based on explicit preset or card title heuristics
export function resolveCardDesign(card?: Partial<CreditCard>): CardDesignPreset {
  if (!card) return getCardDesignPreset('bank_default');

  if (card.cardDesignPreset && card.cardDesignPreset !== 'bank_default') {
    const found = CARD_DESIGN_PRESETS.find((p) => p.id === card.cardDesignPreset);
    if (found) return found;
  }

  const name = (card.name || '').toLowerCase();
  if (name.includes('agrícola dorada') || name.includes('agricola dorada') || name.includes('crédito dorada') || name.includes('credito dorada')) {
    return getCardDesignPreset('agricola_dorada_nueva');
  }
  if (name.includes('promerica premia gold') || name.includes('promerica gold')) {
    return getCardDesignPreset('promerica_premia_gold');
  }
  if (name.includes('promerica premia plat') || name.includes('promerica platinum')) {
    return getCardDesignPreset('promerica_premia_platinum');
  }
  if (name.includes('promerica premia black') || name.includes('promerica black')) {
    return getCardDesignPreset('promerica_premia_black');
  }
  if (name.includes('agrícola clásica') || name.includes('agricola clasica') || name.includes('crédito clásica') || name.includes('credito clasica') || (name.includes('agricola') && name.includes('azul'))) {
    return getCardDesignPreset('agricola_clasica_azul_nueva');
  }
  if (name.includes('agrícola plat') || name.includes('agricola plat')) {
    return getCardDesignPreset('agricola_platinum_nueva');
  }
  if (name.includes('agrícola black') || name.includes('agricola black')) {
    return getCardDesignPreset('agricola_black_nueva');
  }
  if (name.includes('walmart black') || (name.includes('walmart') && (name.includes('black') || name.includes('elite')))) {
    return getCardDesignPreset('walmart_black');
  }
  if (name.includes('walmart')) return getCardDesignPreset('walmart');
  if (name.includes('davivienda oro') || name.includes('davivienda gold') || name.includes('davivienda dorada')) {
    return getCardDesignPreset('davivienda_oro');
  }
  if (name.includes('fedecredito oro') || name.includes('fedecrédito oro') || name.includes('fedecredito gold')) {
    return getCardDesignPreset('fedecredito_oro');
  }
  if (name.includes('banco azul oro') || name.includes('azul oro') || name.includes('azul gold')) {
    return getCardDesignPreset('banco_azul_oro');
  }
  if (name.includes('club promerica')) {
    return getCardDesignPreset('promerica_club');
  }
  if (name.includes('selectos oro') || name.includes('selectos gold')) return getCardDesignPreset('super_selectos_oro');
  if (name.includes('selectos')) return getCardDesignPreset('super_selectos');
  if (name.includes('pricesmart')) return getCardDesignPreset('pricesmart');
  if (name.includes('super cashback') || (name.includes('super') && name.includes('cashback'))) return getCardDesignPreset('super_cashback');
  if (name.includes('premia platinum') || name.includes('premia plat')) return getCardDesignPreset('premia_platinum');
  if (name.includes('premia gold') || (name.includes('premia') && (name.includes('oro') || name.includes('gold')))) {
    return getCardDesignPreset('premia_gold');
  }
  if (name.includes('premia')) return getCardDesignPreset('premia_gold');
  if (name.includes('rose gold') || name.includes('oro rosa')) return getCardDesignPreset('rose_gold');
  if (name.includes('millas gold') || name.includes('millas plus gold') || name.includes('viajero gold')) return getCardDesignPreset('millas_gold');
  if (name.includes('puntos oro')) return getCardDesignPreset('puntos_oro');
  if (name.includes('gold') || name.includes('oro') || name.includes('dorada')) {
    return getCardDesignPreset('gold');
  }
  if (name.includes('zafiro') || name.includes('banco azul')) return getCardDesignPreset('blue_zafiro');
  if (name.includes('navy') || name.includes('multipremios azul')) return getCardDesignPreset('blue_navy');
  if (name.includes('conecta') || name.includes('cashback azul')) return getCardDesignPreset('blue_cashback');
  if (name.includes('azul') || name.includes('blue') || name.includes('economía') || name.includes('economia') || name.includes('clásica') || name.includes('clasica')) {
    return getCardDesignPreset('blue_clasica');
  }
  if (name.includes('lifemiles') || name.includes('avianca')) return getCardDesignPreset('lifemiles_avianca');
  if (name.includes('real madrid')) return getCardDesignPreset('real_madrid_cuscatlan');
  if (name.includes('platinum') || name.includes('platino')) return getCardDesignPreset('platinum');
  if (name.includes('black') || name.includes('infinite') || name.includes('obsidian') || name.includes('titanio')) {
    return getCardDesignPreset('black_infinite');
  }

  return getCardDesignPreset('bank_default');
}

// -------------------------------------------------------------
// Plantillas Populares de Tarjetas de El Salvador (1 Clic)
// -------------------------------------------------------------
export interface ElSalvadorCardTemplate {
  id: string;
  name: string;
  bank: string;
  bankLogoKey: string;
  designPreset: string;
  network: 'visa' | 'mastercard' | 'amex';
  badgeTitle: string;
  typeTag: 'premia' | 'dorada' | 'azul' | 'super' | 'black' | 'viaje';
  typicalLimit: number;
  cutOffDay: number;
  paymentDueDay: number;
  accent: string;
}

export const EL_SALVADOR_CARD_TEMPLATES: ElSalvadorCardTemplate[] = [
  // --- PREMIA GOLD & DORADAS DE LAS FOTOS ---
  {
    id: 'tmpl_agricola_dorada_nueva',
    name: 'Agrícola Crédito Dorada',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'agricola_dorada_nueva',
    network: 'mastercard',
    badgeTitle: 'Crédito Dorada',
    typeTag: 'dorada',
    typicalLimit: 250000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#c4a35a',
  },
  {
    id: 'tmpl_promerica_premia_gold',
    name: 'Promerica Premia Gold',
    bank: 'Banco Promerica',
    bankLogoKey: 'promerica',
    designPreset: 'promerica_premia_gold',
    network: 'mastercard',
    badgeTitle: 'Premia Gold 3D',
    typeTag: 'premia',
    typicalLimit: 250000,
    cutOffDay: 16,
    paymentDueDay: 31,
    accent: '#a38755',
  },
  {
    id: 'tmpl_agricola_clasica_azul_nueva',
    name: 'Agrícola Crédito Clásica Azul',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'agricola_clasica_azul_nueva',
    network: 'visa',
    badgeTitle: 'Crédito Clásica',
    typeTag: 'azul',
    typicalLimit: 120000,
    cutOffDay: 22,
    paymentDueDay: 7,
    accent: '#2563eb',
  },
  {
    id: 'tmpl_cuscatlan_premia_gold',
    name: 'Cuscatlán Premia Gold',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'premia_gold',
    network: 'visa',
    badgeTitle: 'Premia Gold',
    typeTag: 'premia',
    typicalLimit: 300000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#f59e0b',
  },
  {
    id: 'tmpl_bac_premia_gold',
    name: 'BAC Premia Gold',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'premia_gold',
    network: 'mastercard',
    badgeTitle: 'Premia Gold BAC',
    typeTag: 'premia',
    typicalLimit: 280000,
    cutOffDay: 14,
    paymentDueDay: 29,
    accent: '#eab308',
  },

  // --- WALMART & SUPERMERCADOS ---
  {
    id: 'tmpl_bac_walmart',
    name: 'BAC Walmart Mastercard',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'walmart',
    network: 'mastercard',
    badgeTitle: 'Walmart Spark',
    typeTag: 'super',
    typicalLimit: 150000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#0071dc',
  },
  {
    id: 'tmpl_bac_walmart_black',
    name: 'BAC Walmart Black Elite',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'walmart_black',
    network: 'mastercard',
    badgeTitle: 'Walmart Elite',
    typeTag: 'super',
    typicalLimit: 350000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#facc15',
  },
  {
    id: 'tmpl_cuscatlan_selectos',
    name: 'Cuscatlán Super Selectos',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'super_selectos',
    network: 'visa',
    badgeTitle: 'Súper Selectos',
    typeTag: 'super',
    typicalLimit: 180000,
    cutOffDay: 18,
    paymentDueDay: 3,
    accent: '#059669',
  },
  {
    id: 'tmpl_agricola_selectos',
    name: 'Agrícola Súper Selectos',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'super_selectos',
    network: 'visa',
    badgeTitle: 'Selectos Club',
    typeTag: 'super',
    typicalLimit: 180000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#10b981',
  },
  {
    id: 'tmpl_bac_pricesmart',
    name: 'BAC PriceSmart Diamond',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'pricesmart',
    network: 'visa',
    badgeTitle: 'PriceSmart Club',
    typeTag: 'super',
    typicalLimit: 200000,
    cutOffDay: 25,
    paymentDueDay: 10,
    accent: '#dc2626',
  },

  // --- LAS AZULES ---
  {
    id: 'tmpl_agricola_azul',
    name: 'Agrícola Visa Clásica Azul',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'blue_clasica',
    network: 'visa',
    badgeTitle: 'Clásica Azul',
    typeTag: 'azul',
    typicalLimit: 120000,
    cutOffDay: 22,
    paymentDueDay: 7,
    accent: '#2563eb',
  },
  {
    id: 'tmpl_bac_economia_azul',
    name: 'BAC Conecta / Economía Azul',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'blue_cashback',
    network: 'visa',
    badgeTitle: 'Conecta Azul',
    typeTag: 'azul',
    typicalLimit: 100000,
    cutOffDay: 16,
    paymentDueDay: 1,
    accent: '#1d4ed8',
  },
  {
    id: 'tmpl_cuscatlan_multipremios_azul',
    name: 'Cuscatlán MultiPremios Azul',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'blue_navy',
    network: 'visa',
    badgeTitle: 'MultiPremios Azul',
    typeTag: 'azul',
    typicalLimit: 150000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#0284c7',
  },
  {
    id: 'tmpl_banco_azul_clasica',
    name: 'Banco Azul Clásica Zafiro',
    bank: 'Banco Azul de El Salvador',
    bankLogoKey: 'banco_azul',
    designPreset: 'blue_zafiro',
    network: 'visa',
    badgeTitle: 'Azul Zafiro',
    typeTag: 'azul',
    typicalLimit: 100000,
    cutOffDay: 19,
    paymentDueDay: 4,
    accent: '#0284c7',
  },
  {
    id: 'tmpl_fedecredito_azul',
    name: 'FEDECRÉDITO Visa Clásica',
    bank: 'Sistema FEDECRÉDITO',
    bankLogoKey: 'fedecredito',
    designPreset: 'blue_clasica',
    network: 'visa',
    badgeTitle: 'FEDECRÉDITO Azul',
    typeTag: 'azul',
    typicalLimit: 80000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#1e40af',
  },
  {
    id: 'tmpl_hipotecario_azul',
    name: 'Hipotecario Visa Clásica Azul',
    bank: 'Banco Hipotecario',
    bankLogoKey: 'hipotecario',
    designPreset: 'blue_clasica',
    network: 'visa',
    badgeTitle: 'Hipotecario Azul',
    typeTag: 'azul',
    typicalLimit: 90000,
    cutOffDay: 18,
    paymentDueDay: 3,
    accent: '#0284c7',
  },
  {
    id: 'tmpl_atlantida_azul',
    name: 'Atlántida Visa Clásica',
    bank: 'Banco Atlántida El Salvador',
    bankLogoKey: 'atlantida',
    designPreset: 'blue_clasica',
    network: 'visa',
    badgeTitle: 'Atlántida Azul',
    typeTag: 'azul',
    typicalLimit: 85000,
    cutOffDay: 17,
    paymentDueDay: 2,
    accent: '#be123c',
  },

  // --- LAS DORADAS / GOLD ---
  {
    id: 'tmpl_bac_millas_gold',
    name: 'BAC Millas Plus Gold',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'millas_gold',
    network: 'mastercard',
    badgeTitle: 'Millas Plus Gold',
    typeTag: 'dorada',
    typicalLimit: 250000,
    cutOffDay: 12,
    paymentDueDay: 27,
    accent: '#eab308',
  },
  {
    id: 'tmpl_agricola_puntos_oro',
    name: 'Agrícola Puntos Oro',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'puntos_oro',
    network: 'visa',
    badgeTitle: 'Puntos Oro',
    typeTag: 'dorada',
    typicalLimit: 260000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#eab308',
  },
  {
    id: 'tmpl_cuscatlan_multipremios_oro',
    name: 'Cuscatlán MultiPremios Oro',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'gold',
    network: 'visa',
    badgeTitle: 'MultiPremios Oro',
    typeTag: 'dorada',
    typicalLimit: 220000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#d97706',
  },
  {
    id: 'tmpl_davivienda_dorada',
    name: 'Davivienda Dorada Gold',
    bank: 'Banco Davivienda',
    bankLogoKey: 'davivienda',
    designPreset: 'davivienda_oro',
    network: 'mastercard',
    badgeTitle: 'Davivienda Gold',
    typeTag: 'dorada',
    typicalLimit: 220000,
    cutOffDay: 14,
    paymentDueDay: 29,
    accent: '#ca8a04',
  },
  {
    id: 'tmpl_fedecredito_oro',
    name: 'FEDECRÉDITO Visa Oro',
    bank: 'Sistema FEDECRÉDITO',
    bankLogoKey: 'fedecredito',
    designPreset: 'fedecredito_oro',
    network: 'visa',
    badgeTitle: 'FEDECRÉDITO Oro',
    typeTag: 'dorada',
    typicalLimit: 200000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#eab308',
  },
  {
    id: 'tmpl_banco_azul_oro',
    name: 'Banco Azul Visa Oro',
    bank: 'Banco Azul de El Salvador',
    bankLogoKey: 'banco_azul',
    designPreset: 'banco_azul_oro',
    network: 'visa',
    badgeTitle: 'Banco Azul Oro',
    typeTag: 'dorada',
    typicalLimit: 210000,
    cutOffDay: 19,
    paymentDueDay: 4,
    accent: '#38bdf8',
  },

  // --- VIAJES & CO-BRANDED ---
  {
    id: 'tmpl_promerica_club',
    name: 'Club Promerica Esmeralda',
    bank: 'Banco Promerica',
    bankLogoKey: 'promerica',
    designPreset: 'promerica_club',
    network: 'visa',
    badgeTitle: 'Club Promerica',
    typeTag: 'super',
    typicalLimit: 175000,
    cutOffDay: 16,
    paymentDueDay: 31,
    accent: '#10b981',
  },
  {
    id: 'tmpl_agricola_lifemiles',
    name: 'Agrícola Avianca LifeMiles',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'lifemiles_avianca',
    network: 'visa',
    badgeTitle: 'LifeMiles Avianca',
    typeTag: 'viaje',
    typicalLimit: 300000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#dc2626',
  },
  {
    id: 'tmpl_cuscatlan_lifemiles',
    name: 'Cuscatlán Avianca LifeMiles',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'lifemiles_avianca',
    network: 'mastercard',
    badgeTitle: 'LifeMiles Cuscatlán',
    typeTag: 'viaje',
    typicalLimit: 320000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#dc2626',
  },
  {
    id: 'tmpl_cuscatlan_real_madrid',
    name: 'Cuscatlán Real Madrid',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'real_madrid_cuscatlan',
    network: 'visa',
    badgeTitle: 'Real Madrid SV',
    typeTag: 'viaje',
    typicalLimit: 250000,
    cutOffDay: 15,
    paymentDueDay: 30,
    accent: '#f59e0b',
  },

  // --- BLACK & PLATINO ---
  {
    id: 'tmpl_promerica_premia_platinum',
    name: 'Promerica Premia Platinum 3D',
    bank: 'Banco Promerica',
    bankLogoKey: 'promerica',
    designPreset: 'promerica_premia_platinum',
    network: 'mastercard',
    badgeTitle: 'Premia Platinum 3D',
    typeTag: 'black',
    typicalLimit: 450000,
    cutOffDay: 16,
    paymentDueDay: 31,
    accent: '#cbd5e1',
  },
  {
    id: 'tmpl_promerica_premia_black',
    name: 'Promerica Premia Black 3D',
    bank: 'Banco Promerica',
    bankLogoKey: 'promerica',
    designPreset: 'promerica_premia_black',
    network: 'mastercard',
    badgeTitle: 'Premia Black 3D',
    typeTag: 'black',
    typicalLimit: 600000,
    cutOffDay: 16,
    paymentDueDay: 31,
    accent: '#fbbf24',
  },
  {
    id: 'tmpl_agricola_platinum_nueva',
    name: 'Agrícola Crédito Platinum',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'agricola_platinum_nueva',
    network: 'visa',
    badgeTitle: 'Crédito Platinum',
    typeTag: 'black',
    typicalLimit: 450000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#cbd5e1',
  },
  {
    id: 'tmpl_agricola_black_nueva',
    name: 'Agrícola Crédito Black',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'agricola_black_nueva',
    network: 'mastercard',
    badgeTitle: 'Crédito Black',
    typeTag: 'black',
    typicalLimit: 650000,
    cutOffDay: 20,
    paymentDueDay: 5,
    accent: '#facc15',
  },
  {
    id: 'tmpl_cuscatlan_infinite_black',
    name: 'Cuscatlán Infinite Black',
    bank: 'Banco Cuscatlán',
    bankLogoKey: 'cuscatlan',
    designPreset: 'black_infinite',
    network: 'visa',
    badgeTitle: 'Infinite Black',
    typeTag: 'black',
    typicalLimit: 500000,
    cutOffDay: 28,
    paymentDueDay: 13,
    accent: '#f59e0b',
  },
  {
    id: 'tmpl_bac_mastercard_black',
    name: 'BAC Mastercard Black',
    bank: 'BAC Credomatic',
    bankLogoKey: 'bac',
    designPreset: 'black_infinite',
    network: 'mastercard',
    badgeTitle: 'Mastercard Black',
    typeTag: 'black',
    typicalLimit: 600000,
    cutOffDay: 25,
    paymentDueDay: 10,
    accent: '#ef4444',
  },
  {
    id: 'tmpl_agricola_platinum',
    name: 'Agrícola Visa Platinum',
    bank: 'Banco Agrícola',
    bankLogoKey: 'agricola',
    designPreset: 'platinum',
    network: 'visa',
    badgeTitle: 'Visa Platinum',
    typeTag: 'black',
    typicalLimit: 400000,
    cutOffDay: 22,
    paymentDueDay: 7,
    accent: '#cbd5e1',
  },
];

// -------------------------------------------------------------
// Vector SVG Emblems for Co-Branded Cards & Textures
// -------------------------------------------------------------

// Banco Agrícola Nueva Identidad - Arcos Multicolor Dinámicos
export const AgricolaRainbowArcs: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 400 250"
    className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Grupo superior de arcos que envuelven el chip EMV */}
    {/* Arco Verde Esmeralda */}
    <path
      d="M 145 -15 C 158 20, 150 50, 128 66 C 114 76, 96 82, 70 82"
      stroke="#00a86b"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Arco Morado Real */}
    <path
      d="M 158 -15 C 172 20, 164 54, 138 72 C 120 84, 98 88, 70 88"
      stroke="#8b5cf6"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Arco Amarillo Sol */}
    <path
      d="M 100 102 C 108 92, 118 78, 122 62"
      stroke="#facc15"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Arco Cyan / Celeste */}
    <path
      d="M 46 122 C 48 114, 55 106, 64 104"
      stroke="#06b6d4"
      strokeWidth="4"
      strokeLinecap="round"
    />

    {/* Grupo inferior izquierdo que asciende hacia el chip */}
    {/* Arco Naranja Cálido */}
    <path
      d="M 18 245 C 20 195, 36 158, 65 138 C 76 130, 88 128, 98 128"
      stroke="#f97316"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Arco Amarillo brillante */}
    <path
      d="M 30 225 C 32 185, 45 152, 70 134"
      stroke="#eab308"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Arco Celeste brillante */}
    <path
      d="M 44 168 C 50 148, 62 133, 78 128"
      stroke="#06b6d4"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

// Banco Agrícola Nueva Identidad - Logotipo 3 Trazos '≡ Ba'
export const AgricolaThreeBarsLogo: React.FC<{ className?: string; isDarkText?: boolean }> = ({
  className = 'h-7',
  isDarkText = true,
}) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {/* 3 trazos horizontales gruesos redondeados con ligera inclinación */}
    <div className="flex flex-col gap-1 -rotate-6 transform shrink-0">
      <div className={`w-6 h-1.5 rounded-full ${isDarkText ? 'bg-neutral-900' : 'bg-white'}`} />
      <div className={`w-8 h-1.5 rounded-full ${isDarkText ? 'bg-neutral-900' : 'bg-white'}`} />
      <div className={`w-7 h-1.5 rounded-full ${isDarkText ? 'bg-neutral-900' : 'bg-white'}`} />
    </div>
    <span
      className={`font-black text-2xl tracking-tighter ${
        isDarkText ? 'text-neutral-900' : 'text-white'
      } font-sans drop-shadow-sm select-none leading-none ml-1`}
    >
      Ba
    </span>
  </div>
);

// Banco Promerica - Malla de Facetas Geométricas 3D Origami (Origami Prism)
export const PromericaFacetedMesh: React.FC<{
  className?: string;
  variant?: 'gold' | 'platinum' | 'black';
}> = ({ className = '', variant = 'gold' }) => {
  const colors = {
    gold: {
      p1: '#705731',
      p2: '#9a7f4e',
      p3: '#bfa068',
      p4: '#5e4826',
      p5: '#836a3e',
      p6: '#d8ba82',
      p7: '#47361a',
      p8: '#a98d5a',
    },
    platinum: {
      p1: '#94a3b8',
      p2: '#cbd5e1',
      p3: '#e2e8f0',
      p4: '#64748b',
      p5: '#94a3b8',
      p6: '#f8fafc',
      p7: '#475569',
      p8: '#cbd5e1',
    },
    black: {
      p1: '#1c1917',
      p2: '#292524',
      p3: '#44403c',
      p4: '#0c0a09',
      p5: '#1c1917',
      p6: '#57534e',
      p7: '#000000',
      p8: '#292524',
    },
  }[variant];

  return (
    <svg
      viewBox="0 0 400 250"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`grad-mesh-1-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.p1} />
          <stop offset="100%" stopColor={colors.p4} />
        </linearGradient>
        <linearGradient id={`grad-mesh-2-${variant}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.p2} />
          <stop offset="100%" stopColor={colors.p6} />
        </linearGradient>
        <linearGradient id={`grad-mesh-3-${variant}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={colors.p7} />
          <stop offset="100%" stopColor={colors.p3} />
        </linearGradient>
      </defs>

      {/* Facetas poligonales triangulares 3D */}
      <polygon points="0,0 160,0 120,95 0,110" fill={`url(#grad-mesh-1-${variant})`} />
      <polygon points="160,0 290,0 220,115 120,95" fill={colors.p3} />
      <polygon points="290,0 400,0 400,105 220,115" fill={colors.p5} />
      <polygon points="0,110 120,95 155,190 0,250" fill={colors.p4} />
      <polygon points="120,95 220,115 250,215 155,190" fill={`url(#grad-mesh-2-${variant})`} />
      <polygon points="220,115 400,105 400,250 250,215" fill={`url(#grad-mesh-3-${variant})`} />
      <polygon points="155,190 250,215 400,250 0,250" fill={colors.p7} />
      <polygon points="135,70 240,65 190,140" fill={colors.p6} opacity="0.45" />

      {/* Aristas y reflejos de luz */}
      <line x1="120" y1="95" x2="220" y2="115" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1="120" y1="95" x2="155" y2="190" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      <line x1="220" y1="115" x2="250" y2="215" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <line x1="220" y1="115" x2="400" y2="105" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
    </svg>
  );
};

// Banco Promerica - Logotipo Oficial Estrella y Tipografía
export const PromericaStarEmblem: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <span className="font-black italic text-xs sm:text-sm tracking-tight text-white font-sans drop-shadow-sm">
      Banco Promerica
    </span>
    {/* Estrella Promerica blanca con ala dinámica */}
    <svg viewBox="0 0 100 100" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-white drop-shadow">
      <polygon points="50,10 61,35 88,28 72,50 95,70 65,65 52,90 42,65 15,68 32,48 18,25 42,35" />
    </svg>
  </div>
);

// Banco Promerica - Sello Premia Gold Header
export const PromericaPremiaHeader: React.FC<{
  tier?: 'gold' | 'platinum' | 'black';
  className?: string;
}> = ({ tier = 'gold', className = '' }) => (
  <div className={`text-right ${className}`}>
    <span className="block font-black text-sm sm:text-base tracking-tight text-white font-sans drop-shadow leading-none">
      Premia
    </span>
    <span
      className={`block font-semibold text-[10px] sm:text-xs lowercase tracking-wider leading-tight ${
        tier === 'gold' ? 'text-amber-200' : tier === 'platinum' ? 'text-slate-300' : 'text-amber-400'
      }`}
    >
      {tier}
    </span>
  </div>
);

// Walmart Official Spark Emblem (6 bursts) & typography
export const WalmartSparkEmblem: React.FC<{ className?: string; showText?: boolean }> = ({
  className = 'h-7',
  showText = true,
}) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {/* Walmart Yellow Spark */}
    <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-[#ffc220] drop-shadow-sm">
      <path d="M 50 14 C 52 14, 54 28, 54 36 C 54 40, 52 42, 50 42 C 48 42, 46 40, 46 36 C 46 28, 48 14, 50 14 Z" />
      <path d="M 50 86 C 48 86, 46 72, 46 64 C 46 60, 48 58, 50 58 C 52 58, 54 60, 54 64 C 54 72, 52 86, 50 86 Z" />
      <path d="M 19 32 C 20 31, 32 38, 39 42 C 43 44, 44 46, 43 48 C 42 50, 40 50, 36 48 C 30 44, 18 33, 19 32 Z" />
      <path d="M 81 68 C 80 69, 68 62, 61 58 C 57 56, 56 54, 57 52 C 58 50, 60 50, 64 52 C 70 56, 82 67, 81 68 Z" />
      <path d="M 19 68 C 18 67, 30 56, 36 52 C 40 50, 42 50, 43 52 C 44 54, 43 56, 39 58 C 32 62, 20 69, 19 68 Z" />
      <path d="M 81 32 C 82 33, 70 44, 64 48 C 60 50, 58 50, 57 48 C 56 46, 57 44, 61 42 C 68 38, 80 31, 81 32 Z" />
      <circle cx="50" cy="50" r="5" fill="#ffc220" />
    </svg>
    {showText && (
      <span className="font-black text-sm tracking-tight text-white font-sans">
        Walmart<span className="text-[#ffc220] font-black text-xs ml-0.5">✦</span>
      </span>
    )}
  </div>
);

// Super Selectos Official Leaf / Cart Emblem
export const SuperSelectosEmblem: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#005a2b] to-[#10b981] border border-amber-300/60 flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-amber-300 font-black text-xs leading-none">S</span>
    </div>
    <div className="leading-tight text-left">
      <span className="block text-[8px] font-black tracking-widest text-amber-300 uppercase">SÚPER</span>
      <span className="block text-[11px] font-black tracking-tight text-white uppercase drop-shadow-sm">
        SELECTOS
      </span>
    </div>
  </div>
);

// PriceSmart Club Emblem
export const PriceSmartEmblem: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <div className="bg-[#b91c1c] text-white px-1.5 py-0.5 rounded font-black text-[9px] tracking-tight border border-red-300/40">
      CLUB
    </div>
    <span className="font-black text-xs text-white tracking-tight uppercase">PriceSmart</span>
  </div>
);

// Premia Gold 3D Relief Emblem
export const PremiaGoldEmblem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-amber-300/70 backdrop-blur-md shadow-md ${className}`}>
    <div className="w-2.5 h-2.5 bg-gradient-to-tr from-amber-400 to-amber-200 transform rotate-45 rounded-xs shrink-0 shadow-sm" />
    <span className="font-black text-[10px] tracking-widest text-amber-300 uppercase font-sans drop-shadow-sm">
      PREMIA GOLD
    </span>
  </div>
);

// Premia Platinum 3D Relief Emblem
export const PremiaPlatinumEmblem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/45 border border-slate-300/70 backdrop-blur-md shadow-md ${className}`}>
    <div className="w-2.5 h-2.5 bg-gradient-to-tr from-slate-200 to-slate-400 transform rotate-45 rounded-xs shrink-0 shadow-sm" />
    <span className="font-black text-[10px] tracking-widest text-slate-200 uppercase font-sans drop-shadow-sm">
      PREMIA PLATINUM
    </span>
  </div>
);

// Avianca LifeMiles Emblem
export const LifeMilesEmblem: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-red-500 drop-shadow-sm">
      <path d="M 10 50 C 30 20, 70 20, 90 40 C 70 45, 50 60, 30 80 C 25 70, 15 60, 10 50 Z" />
    </svg>
    <div className="leading-tight text-left">
      <span className="block text-[8px] font-bold text-red-300 tracking-wider uppercase">AVIANCA</span>
      <span className="block text-[11px] font-black text-white tracking-tight uppercase">LifeMiles</span>
    </div>
  </div>
);

// Real Madrid Heráldica / Emblem
export const RealMadridEmblem: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-amber-400 drop-shadow-sm">
      <path d="M 20 40 L 35 60 L 50 30 L 65 60 L 80 40 L 75 75 L 25 75 Z" />
      <circle cx="20" cy="35" r="4" />
      <circle cx="50" cy="25" r="4" />
      <circle cx="80" cy="35" r="4" />
    </svg>
    <span className="font-black text-xs text-white tracking-tight uppercase font-sans">
      REAL MADRID
    </span>
  </div>
);

// Millas Plus Golden Compass
export const MillasCompassEmblem: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-amber-300 drop-shadow-sm">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#facc15" strokeWidth="6" />
      <polygon points="50,15 60,45 90,50 60,55 50,85 40,55 10,50 40,45" />
    </svg>
    <span className="font-black text-xs text-amber-300 tracking-widest uppercase font-mono">
      MILLAS+
    </span>
  </div>
);

// Guilloché Security Wave Pattern SVG
export const GuillocheSecurityPattern: React.FC<{ opacity?: number }> = ({ opacity = 0.15 }) => (
  <svg
    viewBox="0 0 400 240"
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M -20 40 Q 60 120 160 40 T 340 40 T 520 40"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeDasharray="4 2"
    />
    <path
      d="M -20 70 Q 70 150 170 70 T 350 70 T 530 70"
      stroke="#ffffff"
      strokeWidth="1"
    />
    <path
      d="M -20 100 Q 80 180 180 100 T 360 100 T 540 100"
      stroke="#facc15"
      strokeWidth="1.2"
    />
    <path
      d="M -20 130 Q 90 210 190 130 T 370 130 T 550 130"
      stroke="#ffffff"
      strokeWidth="0.8"
      strokeDasharray="3 3"
    />
    <path
      d="M -20 160 Q 100 240 200 160 T 380 160 T 560 160"
      stroke="#facc15"
      strokeWidth="1"
    />
    <circle cx="200" cy="120" r="70" stroke="#facc15" strokeWidth="0.8" strokeDasharray="6 3" />
    <circle cx="200" cy="120" r="95" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="4 4" />
  </svg>
);

// Sapphire Facet Pattern for Blue Zafiro
export const SapphireFacetPattern: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => (
  <svg
    viewBox="0 0 400 240"
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ opacity }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 0 0 L 200 120 L 400 0" stroke="#38bdf8" strokeWidth="1" />
    <path d="M 0 240 L 200 120 L 400 240" stroke="#38bdf8" strokeWidth="1" />
    <polygon points="120,40 280,40 340,120 280,200 120,200 60,120" stroke="#7dd3fc" strokeWidth="1.2" />
    <polygon points="160,70 240,70 280,120 240,170 160,170 120,120" stroke="#bae6fd" strokeWidth="0.8" strokeDasharray="4 2" />
    <line x1="60" y1="120" x2="340" y2="120" stroke="#38bdf8" strokeWidth="0.8" />
  </svg>
);

// -------------------------------------------------------------
// Authentic Bank Logos (Vector SVG) & Presets (Con Especial Énfasis en El Salvador)
// -------------------------------------------------------------
export const BANK_PRESETS: BankPreset[] = [
  // --- EL SALVADOR ---
  {
    id: 'cuscatlan',
    name: 'Banco Cuscatlán',
    aliases: ['cuscatlan', 'cuscatlán', 'banco cuscatlan', 'premia', 'selectos', 'banco de cuscatlan', 'tarjeta cuscatlan'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#1a365d] via-[#102a43] to-[#0b1c2d]',
    textColor: 'text-white',
    accentColor: '#f59e0b',
    borderColor: 'border-amber-400/50',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bancocuscatlan.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Pirámide Solar Cuscatlán */}
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-amber-400 drop-shadow-sm">
          <polygon points="50,15 70,35 30,35" />
          <polygon points="50,38 80,62 20,62" opacity="0.85" />
          <polygon points="50,65 92,90 8,90" opacity="0.7" />
        </svg>
        <span className="font-black text-xs text-white tracking-wider uppercase font-sans">
          CUSCATLAN
        </span>
      </div>
    ),
  },
  {
    id: 'bac',
    name: 'BAC Credomatic',
    aliases: ['bac', 'credomatic', 'bac credomatic', 'bac el salvador', 'walmart', 'pricesmart', 'bac san salvador'],
    country: 'El Salvador / Centroamérica',
    region: 'el_salvador',
    gradient: 'from-[#a8001d] via-[#850016] to-[#45000b]',
    textColor: 'text-white',
    accentColor: '#f87171',
    borderColor: 'border-red-500/50',
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
    aliases: ['agricola', 'agrícola', 'banco agricola', 'banco agrícola', 'bancolombia el salvador'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#0f3d75] via-[#092b57] to-[#04162e]',
    textColor: 'text-white',
    accentColor: '#60a5fa',
    borderColor: 'border-blue-400/50',
    chipColor: 'gold',
    defaultNetwork: 'visa',
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
    id: 'davivienda',
    name: 'Banco Davivienda',
    aliases: ['davivienda', 'davivienda el salvador', 'banco salvadoreño', 'banco davivienda'],
    country: 'El Salvador / Colombia',
    region: 'el_salvador',
    gradient: 'from-[#ed1c24] via-[#b51016] to-[#6e0509]',
    textColor: 'text-white',
    accentColor: '#fca5a5',
    borderColor: 'border-red-400/50',
    chipColor: 'gold',
    defaultNetwork: 'mastercard',
    webDomain: 'davivienda.com.sv',
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
    id: 'promerica',
    name: 'Banco Promerica',
    aliases: ['promerica', 'promerica el salvador', 'banco promerica', 'club promerica'],
    country: 'El Salvador / Centroamérica',
    region: 'el_salvador',
    gradient: 'from-[#006341] via-[#004a31] to-[#002e1e]',
    textColor: 'text-white',
    accentColor: '#4ade80',
    borderColor: 'border-emerald-400/50',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'promerica.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Promerica</span>
      </div>
    ),
  },
  {
    id: 'banco_azul',
    name: 'Banco Azul de El Salvador',
    aliases: ['banco azul', 'azul', 'banco azul el salvador', 'azul salvador'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#0284c7] via-[#0369a1] to-[#082f49]',
    textColor: 'text-white',
    accentColor: '#38bdf8',
    borderColor: 'border-sky-400/50',
    chipColor: 'silver',
    defaultNetwork: 'visa',
    webDomain: 'bancoazul.com',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Símbolo Ola / Ave Banco Azul */}
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0 fill-white">
          <path d="M 15 70 C 35 25, 75 35, 88 55 C 65 50, 45 60, 30 75 Z" />
        </svg>
        <div className="leading-tight text-left">
          <span className="block text-[8px] font-bold text-sky-200 tracking-widest uppercase">BANCO</span>
          <span className="block text-xs font-black text-white tracking-tight uppercase">AZUL</span>
        </div>
      </div>
    ),
  },
  {
    id: 'fedecredito',
    name: 'Sistema FEDECRÉDITO',
    aliases: ['fedecredito', 'fedecrédito', 'caja de credito', 'sistema fedecredito', 'banco de los trabajadores', 'cajas de credito'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#003882] via-[#00255c] to-[#001338]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-yellow-400/50',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'fedecredito.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-[#facc15] flex items-center justify-center font-black text-[9px] text-[#003882]">
          F
        </div>
        <span className="font-black text-xs text-white tracking-tight uppercase">
          FEDECRÉDITO
        </span>
      </div>
    ),
  },
  {
    id: 'industrial',
    name: 'Banco Industrial (Bi)',
    aliases: ['banco industrial', 'bi', 'industrial el salvador', 'industrial guatemala'],
    country: 'El Salvador / Guatemala',
    region: 'el_salvador',
    gradient: 'from-[#002f6c] via-[#001e47] to-[#001129]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-yellow-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bi.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-sm text-yellow-400">Bi</span>
        <span className="font-bold text-xs text-white tracking-tight">Banco Industrial</span>
      </div>
    ),
  },
  {
    id: 'abank',
    name: 'Abank El Salvador',
    aliases: ['abank', 'banco abank', 'procredit el salvador'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#0d9488] via-[#0f766e] to-[#115e59]',
    textColor: 'text-white',
    accentColor: '#5eead4',
    borderColor: 'border-teal-400/40',
    chipColor: 'silver',
    defaultNetwork: 'mastercard',
    webDomain: 'abank.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-sm text-white tracking-tight lowercase">abank</span>
      </div>
    ),
  },
  {
    id: 'atlantida',
    name: 'Banco Atlántida El Salvador',
    aliases: ['atlantida', 'atlántida', 'banco atlantida', 'atlantida sv'],
    country: 'El Salvador / Honduras',
    region: 'el_salvador',
    gradient: 'from-[#be123c] via-[#9f1239] to-[#4c0519]',
    textColor: 'text-white',
    accentColor: '#fda4af',
    borderColor: 'border-rose-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bancoatlantida.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-white tracking-tight uppercase">Atlántida</span>
      </div>
    ),
  },
  {
    id: 'hipotecario',
    name: 'Banco Hipotecario',
    aliases: ['hipotecario', 'banco hipotecario', 'bh el salvador'],
    country: 'El Salvador',
    region: 'el_salvador',
    gradient: 'from-[#004e92] via-[#00386e] to-[#001c3d]',
    textColor: 'text-white',
    accentColor: '#facc15',
    borderColor: 'border-amber-400/40',
    chipColor: 'gold',
    defaultNetwork: 'visa',
    webDomain: 'bancohipotecario.com.sv',
    renderLogo: (className = 'h-7') => (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="font-black text-xs text-amber-400">BH</span>
        <span className="font-bold text-xs text-white tracking-tight">Hipotecario</span>
      </div>
    ),
  },

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

  // --- CENTROAMÉRICA RESTANTE ---
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
    country: 'Honduras / Nicaragua / Panamá',
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

  // --- USA & GLOBAL ---
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
    for (const preset of BANK_PRESETS) {
      if (preset.name.toLowerCase() === clean || preset.aliases.includes(clean)) {
        return preset;
      }
    }
    for (const preset of BANK_PRESETS) {
      if (clean.includes(preset.id)) return preset;
      for (const alias of preset.aliases) {
        if (clean.includes(alias)) return preset;
      }
    }
  }

  // Default to Banco Cuscatlán (predominante en El Salvador)
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
          ? 'bg-gradient-to-tr from-[#d4af37] via-[#fef08a] to-[#aa8010] border-[#8a6808] shadow-inner'
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
  const design = resolveCardDesign(card);

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

  // Use card design background if available
  const bgGradient = design.id !== 'bank_default' ? design.gradient : preset.gradient;
  const borderColor = design.id !== 'bank_default' ? design.borderColor : preset.borderColor;

  return (
    <div
      className={`${dims} rounded-lg overflow-hidden border ${borderColor} bg-gradient-to-br ${bgGradient} shrink-0 flex items-center justify-center p-1 shadow-sm ${className}`}
      title={`${preset.name} (${design.name})`}
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
  const design = resolveCardDesign(card);
  const network = card.network || preset.defaultNetwork;
  const digits = card.last4Digits || card.id.slice(-4).padStart(4, '0');

  const bgGradient = design.id !== 'bank_default' ? design.gradient : preset.gradient;
  const borderColor = design.id !== 'bank_default' ? design.borderColor : preset.borderColor;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border bg-gradient-to-br ${bgGradient} ${borderColor} shadow-xl relative overflow-hidden select-none text-white ${className}`}
    >
      {/* Guilloché security lines if Premia Gold or Gold */}
      {(design.id === 'premia_gold' || design.id === 'gold') && <GuillocheSecurityPattern opacity={0.18} />}

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
              {/* Co-branded badge */}
              {design.id === 'agricola_dorada_nueva' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/30 border border-amber-300 text-amber-200">
                  Crédito Dorada ✦
                </span>
              )}
              {design.id === 'agricola_clasica_azul_nueva' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/30 border border-blue-400 text-blue-200">
                  Crédito Clásica 💙
                </span>
              )}
              {design.id === 'agricola_platinum_nueva' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700/50 border border-slate-300 text-slate-200">
                  Crédito Platinum 💎
                </span>
              )}
              {design.id === 'agricola_black_nueva' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 border border-amber-400 text-amber-300">
                  Crédito Black 🖤
                </span>
              )}
              {design.id === 'promerica_premia_gold' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#705731] border border-amber-300 text-amber-200">
                  Premia Gold 3D 🥇
                </span>
              )}
              {design.id === 'promerica_premia_platinum' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-300 text-slate-200">
                  Premia Platinum 3D 💎
                </span>
              )}
              {design.id === 'promerica_premia_black' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black border border-amber-400 text-amber-300">
                  Premia Black 3D 🖤
                </span>
              )}
              {design.id === 'davivienda_oro' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-900/60 border border-amber-300 text-amber-200">
                  Davivienda Oro 🏠
                </span>
              )}
              {design.id === 'fedecredito_oro' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/80 border border-yellow-400 text-yellow-300">
                  FEDECRÉDITO Oro 👑
                </span>
              )}
              {design.id === 'banco_azul_oro' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950/80 border border-amber-300 text-amber-200">
                  Banco Azul Oro 🌊
                </span>
              )}
              {design.id === 'promerica_club' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-900 border border-emerald-400 text-emerald-200">
                  Club Promerica 🌿
                </span>
              )}
              {(design.id === 'walmart' || design.id === 'walmart_black') && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0071dc] border border-yellow-400 text-yellow-300">
                  Walmart✦
                </span>
              )}
              {(design.id === 'super_selectos' || design.id === 'super_selectos_oro') && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#005a2b] border border-amber-300 text-amber-300">
                  Súper Selectos
                </span>
              )}
              {design.id === 'pricesmart' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#b91c1c] border border-red-300 text-white">
                  PriceSmart
                </span>
              )}
              {design.id === 'super_cashback' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-600 border border-orange-300 text-white font-mono">
                  SÚPER %
                </span>
              )}
              {design.id === 'premia_gold' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 border border-amber-300 text-amber-300 font-mono">
                  PREMIA GOLD
                </span>
              )}
              {design.id === 'premia_platinum' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 border border-slate-300 text-slate-200 font-mono">
                  PREMIA PLATINUM
                </span>
              )}
              {design.id === 'lifemiles_avianca' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-800 border border-red-400 text-white font-sans">
                  LifeMiles
                </span>
              )}
              {design.id === 'real_madrid_cuscatlan' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-900 border border-amber-400 text-amber-300 font-sans">
                  REAL MADRID
                </span>
              )}
              {design.id === 'blue_zafiro' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-900 border border-sky-400 text-sky-200 font-sans">
                  AZUL ZAFIRO
                </span>
              )}
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
// Full Digital Credit Card Visual Component (Ultra-Realistic FinTech Card)
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
  const design = resolveCardDesign(card);
  const network = card.network || preset.defaultNetwork;
  const digits = card.last4Digits || card.id.slice(-4).padStart(4, '0');

  // Colors & backgrounds
  const bgGradient = design.id !== 'bank_default' ? design.gradient : preset.gradient;
  const borderColor = design.id !== 'bank_default' ? design.borderColor : preset.borderColor;
  const chipColor = design.id !== 'bank_default' ? design.chipColor : preset.chipColor;

  const isAgricolaNew =
    design.id === 'agricola_dorada_nueva' ||
    design.id === 'agricola_clasica_azul_nueva' ||
    design.id === 'agricola_platinum_nueva' ||
    design.id === 'agricola_black_nueva';

  const isPromericaFaceted =
    design.id === 'promerica_premia_gold' ||
    design.id === 'promerica_premia_platinum' ||
    design.id === 'promerica_premia_black';

  const isDarkText =
    design.textColor.includes('neutral-900') ||
    design.textColor.includes('slate-900') ||
    design.textColor.includes('amber-950') ||
    design.textColor.includes('yellow-950');

  const mainTextColor = isDarkText ? 'text-neutral-900' : 'text-white';
  const subTextColor = isDarkText ? 'text-neutral-800' : 'text-white/85';
  const mutedTextColor = isDarkText ? 'text-neutral-700/80' : 'text-white/70';
  const borderDivider = isDarkText ? 'border-neutral-900/25' : 'border-white/20';

  return (
    <div
      className={`relative rounded-2xl md:rounded-3xl p-5 md:p-6 overflow-hidden border bg-gradient-to-br ${bgGradient} ${borderColor} shadow-2xl transition-all duration-300 hover:shadow-cyan-900/20 group select-none ${
        compact ? 'max-w-md' : 'w-full'
      } ${className}`}
      style={{
        aspectRatio: '1.62 / 1',
        minHeight: compact ? '195px' : '215px',
      }}
    >
      {/* 0. Banco Agrícola Arcos Multicolor Oficiales (alrededor del chip) */}
      {isAgricolaNew && <AgricolaRainbowArcs />}

      {/* 0. Banco Promerica 3D Faceted Origami Mesh */}
      {isPromericaFaceted && (
        <PromericaFacetedMesh
          variant={
            design.id === 'promerica_premia_gold'
              ? 'gold'
              : design.id === 'promerica_premia_platinum'
              ? 'platinum'
              : 'black'
          }
        />
      )}

      {/* 1. Guilloché Security Wave Pattern for Premia Gold, Gold, Puntos Oro */}
      {(design.id === 'premia_gold' || design.id === 'gold' || design.id === 'puntos_oro' || design.id === 'millas_gold' || design.id === 'premia_platinum' || design.id === 'davivienda_oro' || design.id === 'fedecredito_oro') && (
        <GuillocheSecurityPattern opacity={0.22} />
      )}

      {/* 2. Walmart Background Spark Watermark */}
      {(design.id === 'walmart' || design.id === 'walmart_black') && (
        <div className="absolute -right-8 -top-8 w-44 h-44 opacity-20 pointer-events-none transform rotate-12">
          <WalmartSparkEmblem className="w-full h-full" showText={false} />
        </div>
      )}

      {/* 3. Super Selectos Background Watermark */}
      {(design.id === 'super_selectos' || design.id === 'super_selectos_oro') && (
        <div className="absolute -right-10 -bottom-10 w-44 h-44 opacity-15 pointer-events-none">
          <div className="w-full h-full rounded-full border-8 border-amber-300 flex items-center justify-center font-black text-7xl text-amber-300">
            S
          </div>
        </div>
      )}

      {/* 4. Sapphire Facets for Blue Zafiro */}
      {design.id === 'blue_zafiro' && <SapphireFacetPattern opacity={0.25} />}

      {/* 5. Blue Clásica & Conecta Dynamic Waves */}
      {(design.id === 'blue_clasica' || design.id === 'blue_cashback' || design.id === 'blue_navy') && (
        <svg
          viewBox="0 0 300 200"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          fill="none"
        >
          <path d="M 0 100 Q 75 40 150 100 T 300 100 L 300 200 L 0 200 Z" fill="#60a5fa" />
          <path d="M 0 140 Q 75 80 150 140 T 300 140 L 300 200 L 0 200 Z" fill="#3b82f6" opacity="0.6" />
        </svg>
      )}

      {/* 6. Foil Light Reflection Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

      {/* 7. Abstract Hologram Ribbons */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/30 blur-xl pointer-events-none" />

      {/* Micro-texture Lines */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Card Content Layout */}
      <div className={`relative z-10 flex flex-col justify-between h-full ${mainTextColor}`}>
        {/* Top Row: Bank Brand Logo & Co-Branding & Contactless */}
        <div className="flex items-start justify-between gap-3">
          {isAgricolaNew ? (
            /* Banco Agrícola Nueva Identidad (Fiel a la fotografía) */
            <>
              <div className="flex flex-col text-left">
                <span className={`text-sm sm:text-base font-black tracking-tight leading-none ${mainTextColor}`}>
                  {design.badgeLabel}
                </span>
                <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 opacity-80 ${mainTextColor}`}>
                  Banco Agrícola
                </span>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <AgricolaThreeBarsLogo isDarkText={isDarkText} className="h-6 sm:h-7" />
                <ContactlessIcon className={`w-4 h-4 drop-shadow opacity-90 ${mainTextColor}`} />
              </div>
            </>
          ) : isPromericaFaceted ? (
            /* Banco Promerica Premia 3D (Fiel a la fotografía) */
            <>
              <div className="flex items-center gap-2">
                <PromericaStarEmblem className="h-6 sm:h-7" />
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <PromericaPremiaHeader
                  tier={
                    design.id === 'promerica_premia_gold'
                      ? 'gold'
                      : design.id === 'promerica_premia_platinum'
                      ? 'platinum'
                      : 'black'
                  }
                />
                <ContactlessIcon className="w-4 h-4 text-white/90 drop-shadow ml-1" />
              </div>
            </>
          ) : (
            /* Standard & Other Salvadoran Bank Brands */
            <>
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
                <span className={`text-[10px] tracking-wider uppercase font-semibold hidden sm:inline ${subTextColor}`}>
                  {card.bank}
                </span>
              </div>

              {/* Top-Right: Co-Branded Retail Badge or Contactless Wave */}
              <div className="flex items-center gap-2">
                {(design.id === 'walmart' || design.id === 'walmart_black') && <WalmartSparkEmblem className="h-6" />}
                {(design.id === 'super_selectos' || design.id === 'super_selectos_oro') && <SuperSelectosEmblem className="h-6" />}
                {design.id === 'pricesmart' && <PriceSmartEmblem className="h-6" />}
                {design.id === 'premia_gold' && <PremiaGoldEmblem />}
                {design.id === 'premia_platinum' && <PremiaPlatinumEmblem />}
                {design.id === 'davivienda_oro' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-900/60 border border-amber-300 text-amber-200">
                    ORO 🏠
                  </span>
                )}
                {design.id === 'fedecredito_oro' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-950/80 border border-yellow-400 text-yellow-300">
                    ORO 👑
                  </span>
                )}
                {design.id === 'banco_azul_oro' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950/80 border border-amber-300 text-amber-200">
                    AZUL ORO 🌊
                  </span>
                )}
                {design.id === 'lifemiles_avianca' && <LifeMilesEmblem className="h-6" />}
                {design.id === 'real_madrid_cuscatlan' && <RealMadridEmblem className="h-6" />}
                {design.id === 'millas_gold' && <MillasCompassEmblem className="h-6" />}

                <ContactlessIcon className={`w-4 h-4 drop-shadow ${mainTextColor}`} />
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/35 border border-white/20 backdrop-blur-sm text-white">
                  DIGITAL
                </span>
              </div>
            </>
          )}
        </div>

        {/* Middle Row: EMV Metallic Chip & Card Name / Subtitle */}
        <div className="my-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <MetallicChip color={chipColor} />
            <div className="text-left">
              <h3 className={`text-base sm:text-lg font-black tracking-tight drop-shadow-md truncate max-w-[200px] sm:max-w-xs ${mainTextColor}`}>
                {card.name}
              </h3>
              <span className={`text-[10px] font-mono tracking-widest block uppercase font-semibold ${subTextColor}`}>
                {design.badgeLabel || 'CRÉDITO REVOLVENTE'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Card Masked Number, Expiry/Cutoff & Network Logo */}
        <div className="space-y-2 pt-2">
          {/* Card Number Mask */}
          <div className="flex items-center justify-between">
            <div className={`font-mono text-xs sm:text-sm tracking-[0.25em] drop-shadow font-bold ${mainTextColor}`}>
              •••• •••• •••• {digits}
            </div>

            <div className={`flex items-center gap-3 text-[10px] ${subTextColor}`}>
              <div className="text-right">
                <span className={`block text-[8px] uppercase tracking-wider font-semibold ${mutedTextColor}`}>CORTE</span>
                <span className="font-mono font-bold">DÍA {card.cutOffDay}</span>
              </div>
              <div className="text-right">
                <span className={`block text-[8px] uppercase tracking-wider font-semibold ${mutedTextColor}`}>LÍMITE</span>
                <span className="font-mono font-bold">DÍA {card.paymentDueDay}</span>
              </div>
            </div>
          </div>

          {/* Cardholder Name & Payment Network */}
          <div className={`flex items-end justify-between pt-1 border-t ${borderDivider}`}>
            <div className="truncate pr-2">
              <span className={`block text-[8px] uppercase tracking-widest font-semibold ${mutedTextColor}`}>
                LÍMITE ASIGNADO
              </span>
              <span className={`text-xs font-mono font-black tracking-wide drop-shadow ${mainTextColor}`}>
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
          <div className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/25 text-[10px] font-mono text-white flex items-center gap-2 shadow-2xl whitespace-nowrap">
            <span>Deuda: <strong className="text-rose-400">{formatMoney(balance, currencySymbol)}</strong></span>
            <span>•</span>
            <span>Disp: <strong className="text-sky-400">{formatMoney(available, currencySymbol)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
