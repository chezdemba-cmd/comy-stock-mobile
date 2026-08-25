import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';

export default function ComyIAScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer>
      <EmptyState title={t('nav.comyAI')} description={t('common.comingSoonDetail')} />
    </ScreenContainer>
  );
}
