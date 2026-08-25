import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useCategories, useCreateCategory } from '@/features/products/hooks';

interface CategoryPickerProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState('');

  const handleConfirmAdd = async () => {
    const name = draftName.trim();
    if (!name) {
      setIsAdding(false);
      return;
    }
    const category = await createCategory.mutateAsync(name);
    onChange(category.id);
    setDraftName('');
    setIsAdding(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.row}>
        {categories.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              onPress={() => onChange(selected ? null : category.id)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}

        {isAdding ? (
          <View style={styles.addRow}>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nouvelle catégorie"
              placeholderTextColor={colors.textTertiary}
              style={styles.addInput}
              autoFocus
              onSubmitEditing={handleConfirmAdd}
            />
            <Pressable onPress={handleConfirmAdd} style={styles.addConfirm}>
              <Ionicons name="checkmark" size={16} color={colors.green} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.pill} onPress={() => setIsAdding(true)}>
            <Ionicons name="add" size={14} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pillSelected: {
    borderColor: colors.green,
    backgroundColor: colors.greenDeepest,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  pillLabelSelected: {
    color: colors.textPrimary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  addInput: {
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 13,
    minWidth: 100,
  },
  addConfirm: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
