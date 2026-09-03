import { LegalDocument, type LegalSectionData } from '@/components/LegalDocument';

const sections: LegalSectionData[] = [
  {
    title: '1. Objet du service',
    paragraphs: [
      "Comy Stock est un outil de gestion destiné aux commerces et entreprises. Il aide à suivre les produits, stocks, ventes, paiements, clients, fournisseurs, dépenses, équipes et rapports.",
    ],
  },
  {
    title: '2. Compte et responsabilités',
    paragraphs: [
      "L'utilisateur doit fournir des informations exactes, protéger ses identifiants et utiliser l'application conformément aux lois applicables. Le propriétaire est responsable des accès accordés aux membres de son entreprise.",
      "Il est interdit d'utiliser Comy Stock pour une activité frauduleuse, illégale ou portant atteinte aux droits d'un tiers.",
    ],
  },
  {
    title: '3. Données commerciales',
    paragraphs: [
      "L'utilisateur reste responsable de l'exactitude des prix, stocks, ventes, dettes, dépenses et informations de tiers qu'il saisit. Il doit disposer d'une base légitime pour enregistrer les coordonnées de ses clients, fournisseurs et employés.",
    ],
  },
  {
    title: '4. Caisse, comptabilité et fiscalité',
    paragraphs: [
      "Les calculs et rapports facilitent la gestion mais ne remplacent pas les conseils d'un comptable, d'un fiscaliste ou d'une autorité compétente. L'entreprise demeure responsable de ses déclarations, pièces justificatives et obligations légales.",
    ],
  },
  {
    title: '5. Comy IA',
    paragraphs: [
      "Comy IA fournit une assistance automatisée susceptible de contenir des erreurs. Les réponses importantes doivent être vérifiées avant toute décision financière, commerciale, juridique ou fiscale.",
      "L'utilisateur ne doit pas transmettre à l'assistant des secrets, mots de passe ou informations personnelles qui ne sont pas nécessaires à sa question.",
    ],
  },
  {
    title: '6. Mode hors ligne',
    paragraphs: [
      "Certaines opérations peuvent être conservées temporairement sur le téléphone puis synchronisées. L'utilisateur doit vérifier la file de synchronisation après le retour de la connexion et éviter de partager un appareil sans fermer sa session.",
    ],
  },
  {
    title: '7. Formules et paiement',
    paragraphs: [
      "Les limites et prix des formules sont indiqués dans l'application. Une demande de changement de formule peut être initiée via WhatsApp. Les modalités de paiement et d'activation sont confirmées avant toute modification payante.",
    ],
  },
  {
    title: '8. Disponibilité',
    paragraphs: [
      "Eso-dev met en œuvre des moyens raisonnables pour maintenir le service, sans garantir une disponibilité ininterrompue. Des opérations de maintenance, incidents réseau ou indisponibilités de prestataires peuvent affecter temporairement certaines fonctions.",
    ],
  },
  {
    title: '9. Suppression et fin d’utilisation',
    paragraphs: [
      "L'utilisateur peut supprimer son compte depuis Plus, Mon compte. Les règles de suppression, de transfert d'entreprise et de conservation pendant deux ans sont détaillées dans la politique de confidentialité.",
    ],
  },
  {
    title: '10. Droit applicable et contact',
    paragraphs: [
      "Ces conditions sont régies par le droit malien. En cas de difficulté, contactez d'abord Eso-dev au +223 75 45 82 33 afin de rechercher une solution amiable.",
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocument
      title="Conditions d’utilisation"
      updatedAt="3 septembre 2026"
      introduction="En créant un compte ou en utilisant Comy Stock, vous acceptez les présentes conditions d’utilisation."
      sections={sections}
    />
  );
}
