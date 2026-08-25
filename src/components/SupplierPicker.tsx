import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { useCreateSupplier, useSuppliers } from '@/features/suppliers/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SupplierPickerProps {
  value: string | null;
  onChange: (supplierId: string | null) => void;
  required?: boolean;
}

export function SupplierPicker({ value, onChange, required = false }: SupplierPickerProps) {
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const { isOnline } = useNetworkStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = suppliers.find((supplier) => supplier.id === value);
  const filtered = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (!isOnline) {
      setError('Connexion requise pour cette action.');
      return;
    }
    setError(null);
    const supplier = await createSupplier.mutateAsync({
      name: newName.trim(),
      phone: newPhone.trim(),
      whatsapp: '',
      email: '',
      address: '',
    });
    onChange(supplier.id);
    setNewName('');
    setNewPhone('');
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fournisseur{required ? ' *' : ' (facultatif)'}</Text>
      <Pressable style={styles.trigger} onPress={() => setIsOpen(true)}>
        <Text style={styles.triggerLabel}>{selected ? selected.name : 'Sélectionner un fournisseur'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {selected ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.clear}>Retirer le fournisseur</Text>
        </Pressable>
      ) : null}

      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choisir un fournisseur</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher..."
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.id);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.optionLabel}>{item.name}</Text>
                  {item.phone ? <Text style={styles.optionMeta}>{item.phone}</Text> : null}
                </Pressable>
              )}
            />

            <View style={styles.newSupplierBox}>
              <Text style={styles.newSupplierTitle}>Nouveau fournisseur</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Nom"
                placeholderTextColor={colors.textTertiary}
                style={styles.searchInput}
              />
              <TextInput
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Téléphone (facultatif)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                style={styles.searchInput}
              />
              {error ? <Text style={styles.clear}>{error}</Text> : null}
              <Pressable style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonLabel}>Créer et sélectionner</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  triggerLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
  },
  clear: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.block,
    borderTopRightRadius: radii.block,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontHeading,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  option: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
  optionMeta: {
    color: colors.textTertiary,
    fontFamily: typography.fontBody,
    fontSize: 12,
  },
  newSupplierBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  newSupplierTitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.green,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createButtonLabel: {
    color: colors.textOnWhite,
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
  },
});
