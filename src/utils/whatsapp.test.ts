import { describe, expect, it } from 'vitest';

import { buildDebtReminderMessage, buildUpgradeRequestMessage, buildWhatsAppUrl } from './whatsapp';

describe('buildWhatsAppUrl', () => {
  it('normalise un numéro malien et encode le message', () => {
    expect(buildWhatsAppUrl('+223 70 00 00 00', 'Bonjour Bamako !')).toBe(
      'https://wa.me/22370000000?text=Bonjour%20Bamako%20!',
    );
  });
});

describe('messages WhatsApp', () => {
  it('inclut les informations utiles dans un rappel de dette', () => {
    const message = buildDebtReminderMessage('Awa', '25 000 F CFA', 'Bamako Commerce');

    expect(message).toContain('Awa');
    expect(message).toContain('25 000 F CFA');
    expect(message).toContain('Bamako Commerce');
  });

  it('inclut la société et la formule dans une demande de changement', () => {
    const message = buildUpgradeRequestMessage('Bamako Commerce', 'Premium');

    expect(message).toContain('Bamako Commerce');
    expect(message).toContain('Premium');
  });
});
