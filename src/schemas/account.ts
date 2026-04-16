import { z } from 'zod/v4';

export const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  preferredLocale: z.enum(['he', 'ar', 'en', 'ru']),
  companyName: z.string().max(100, 'Company name is too long').optional().or(z.literal('')),
  idNumber: z.string().max(20, 'ID Number is too long').optional().or(z.literal('')),
  address: z.string().max(255, 'Address is too long').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

export const NotificationPrefsSchema = z.object({
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
});

export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>;
