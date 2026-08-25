export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildDebtReminderMessage(customerName: string, amount: string, shopName: string): string {
  return `Bonjour ${customerName}, ceci est un petit rappel amical : vous avez un solde de ${amount} chez ${shopName}. Merci de bien vouloir régulariser dès que possible. Excellente journée !`;
}

export function buildUpgradeRequestMessage(companyName: string, targetPlanLabel: string): string {
  return `Bonjour, je souhaite passer mon entreprise « ${companyName} » sur Comy_stock à la formule ${targetPlanLabel}. Pouvez-vous m'indiquer comment procéder au paiement ?`;
}
