import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';

export default function CaisseScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <EmptyState title={t('nav.pos')} description={t('common.comingSoonDetail')} />
    </ScreenContainer>
  );
}
