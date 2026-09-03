import { LegalDocument, type LegalSectionData } from '@/components/LegalDocument';

const sections: LegalSectionData[] = [
  {
    title: '1. Responsable et contact',
    paragraphs: [
      'Comy Stock est édité par Eso-dev, à Bamako, Mali. Pour toute question relative aux données personnelles ou pour exercer vos droits, contactez le support WhatsApp au +223 75 45 82 33.',
    ],
  },
  {
    title: '2. Données traitées',
    paragraphs: [
      "L'application traite les informations de compte (nom et adresse e-mail), les informations des entreprises, boutiques et membres, ainsi que les données saisies pour gérer les produits, stocks, ventes, paiements, clients, fournisseurs, dettes, dépenses et rapports.",
      "Lorsque vous choisissez de les ajouter, Comy Stock traite aussi les photos de produits et les justificatifs de dépenses. La caméra et la galerie ne sont accessibles qu'après votre action et l'autorisation du téléphone.",
      "Les conversations avec Comy IA, les informations commerciales strictement nécessaires à ses réponses et les diagnostics techniques d'erreur peuvent également être traités.",
    ],
  },
  {
    title: '3. Finalités',
    paragraphs: [
      "Ces données servent uniquement à fournir les fonctions de gestion de boutique, sécuriser les comptes, synchroniser les opérations, produire les reçus et rapports, assister l'utilisateur et diagnostiquer les incidents techniques.",
      "Comy Stock ne vend pas les données personnelles et ne les utilise pas pour de la publicité ciblée.",
    ],
  },
  {
    title: '4. Prestataires',
    paragraphs: [
      "Supabase assure l'authentification, la base de données, le stockage des fichiers et les fonctions serveur. Anthropic traite les messages envoyés volontairement à Comy IA et le contexte nécessaire à la réponse. Sentry peut recevoir des diagnostics techniques lorsqu'une erreur survient.",
      "WhatsApp n'est ouvert qu'à votre demande pour transmettre un message prérempli. Dès son ouverture, le traitement relève également des règles de WhatsApp.",
    ],
  },
  {
    title: '5. Sécurité et accès',
    paragraphs: [
      "Les échanges réseau utilisent HTTPS. Les politiques de sécurité Supabase isolent les entreprises et boutiques. Les droits dépendent du rôle attribué : propriétaire, comptable responsable, manager, caissier ou gestionnaire de stock.",
      "Vous devez protéger votre mot de passe et retirer rapidement l'accès d'un ancien membre de l'équipe.",
    ],
  },
  {
    title: '6. Conservation et suppression',
    paragraphs: [
      "Lorsque vous supprimez votre compte, votre accès, votre profil personnel et vos appartenances sont supprimés immédiatement. Les références historiques à votre identité sont anonymisées.",
      "Si d'autres membres restent dans l'entreprise, ses données leur sont conservées et la propriété est transférée à un responsable. Si aucun autre membre ne reste, les données commerciales et les fichiers sont isolés pendant deux ans, puis supprimés automatiquement.",
    ],
  },
  {
    title: '7. Vos droits',
    paragraphs: [
      "Vous pouvez demander l'accès, la rectification ou la suppression de vos données et vous opposer à certains traitements, dans les limites des obligations applicables. La suppression est disponible dans Plus, Mon compte.",
      "Vous pouvez également saisir l'Autorité de Protection des Données à caractère Personnel du Mali selon les voies qu'elle met à disposition.",
    ],
  },
  {
    title: '8. Évolution de la politique',
    paragraphs: [
      "Cette politique peut évoluer avec les fonctions de Comy Stock ou les exigences applicables. La date affichée en haut permet d'identifier la version en vigueur.",
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocument
      title="Politique de confidentialité"
      updatedAt="3 septembre 2026"
      introduction="Cette politique explique de façon claire quelles données Comy Stock utilise, pourquoi elles sont nécessaires et comment demander leur suppression."
      sections={sections}
    />
  );
}
