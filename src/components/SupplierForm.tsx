import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { TextField } from '@/components/TextField';
import type { SupplierFormValues } from '@/features/suppliers/schemas';

interface SupplierFormProps {
  control: Control<SupplierFormValues>;
  errors: FieldErrors<SupplierFormValues>;
}

export function SupplierForm({ control, errors }: SupplierFormProps) {
  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nom"
            placeholder="Ex. Grossiste Koné"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Téléphone"
            placeholder="Ex. 07 00 00 00 00"
            keyboardType="phone-pad"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="whatsapp"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="WhatsApp (si différent)"
            placeholder="Ex. 07 00 00 00 00"
            keyboardType="phone-pad"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email (facultatif)"
            placeholder="fournisseur@exemple.com"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Adresse (facultatif)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
    </>
  );
}
