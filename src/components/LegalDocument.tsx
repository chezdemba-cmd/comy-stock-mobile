import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface LegalSectionData {
  title: string;
  paragraphs: string[];
}

interface LegalDocumentProps {
  title: string;
  updatedAt: string;
  introduction: string;
  sections: LegalSectionData[];
}

export function LegalDocument({ title, updatedAt, introduction, sections }: LegalDocumentProps) {
  return (
    <ScreenContainer edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Dernière mise à jour : {updatedAt}</Text>
        <Text style={styles.introduction}>{introduction}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.xl, paddingBottom: spacing.xxxl },
  title: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h2.fontSize },
  updated: { color: colors.textTertiary, fontFamily: typography.fontBody, fontSize: 12, marginTop: spacing.xs },
  introduction: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  section: { marginTop: spacing.xl, gap: spacing.sm },
  sectionTitle: { color: colors.textPrimary, fontFamily: typography.fontHeading, fontSize: typography.h3.fontSize },
  paragraph: { color: colors.textSecondary, fontFamily: typography.fontBody, fontSize: 14, lineHeight: 22 },
});
