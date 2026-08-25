import type { PlanTier } from '@/types/database';

export interface PlanDefinition {
  tier: PlanTier;
  label: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  monthlySubtitle: string;
  features: string[];
}

export const PLAN_ORDER: PlanTier[] = ['free', 'premium', 'pro'];

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    label: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlySubtitle: 'Pour démarrer sans risque',
    features: [
      '1 boutique',
      '10 produits maximum',
      '15 messages/mois avec Comy IA',
      'Analyse financière par l\'IA',
      'Espace caisse',
      'Clients illimités',
      '5 approvisionnements',
      'Historique des mouvements',
    ],
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    monthlyPrice: 10000,
    yearlyPrice: 108000,
    monthlySubtitle: 'ou 108 000 FCFA/an (-10%)',
    features: [
      '3 boutiques',
      'Produits illimités',
      '15 messages/jour avec Comy IA',
      'Analyse financière par l\'IA',
      'Approvisionnements illimités',
      'Fournisseurs illimités',
      'Utilisateurs illimités',
      'Rapports',
    ],
  },
  pro: {
    tier: 'pro',
    label: 'Pro',
    monthlyPrice: 20000,
    yearlyPrice: 216000,
    monthlySubtitle: 'ou 216 000 FCFA/an (-10%)',
    features: [
      '10 boutiques',
      'Produits illimités',
      '50 messages/jour avec Comy IA',
      'Utilisateurs illimités',
      'Rapports',
      'Espace comptabilité',
      'États financiers',
    ],
  },
};

export const SUPPORT_WHATSAPP_NUMBER = '2250508294939';
