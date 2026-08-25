export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildDebtReminderMessage(customerName: string, amount: string, shopName: string): string {
  return `Bonjour ${customerName}, ceci est un petit rappel amical : vous avez un solde de ${amount} chez ${shopName}. Merci de bien vouloir régulariser dès que possible. Excellente journée !`;
}
