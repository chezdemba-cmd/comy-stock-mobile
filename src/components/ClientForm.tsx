import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { TextField } from '@/components/TextField';
import type { CustomerFormValues } from '@/features/customers/schemas';

interface ClientFormProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
}

export function ClientForm({ control, errors }: ClientFormProps) {
  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nom"
            placeholder="Ex. Mamadou Koné"
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
            placeholder="Ex. +223 70 00 00 00"
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
            placeholder="Ex. +223 70 00 00 00"
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
            placeholder="client@exemple.com"
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
            placeholder="Ex. ACI 2000, Bamako"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Notes (facultatif)"
            placeholder="Notes sur le client"
            multiline
            numberOfLines={3}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
    </>
  );
}
