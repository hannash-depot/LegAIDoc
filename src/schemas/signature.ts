import { z } from 'zod';

export const SendOtpSchema = z.object({
  // Add additional parameters if necessary, but typically this just needs the endpoint hit.
  // We include documentId and sigId in the path, so the body can be empty.
});

export const VerifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export const SignDocumentSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions to sign the document.',
  }),
  signatureImage: z.string().optional(), // ESIG-08: base64 PNG from signature pad
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type SignDocumentInput = z.infer<typeof SignDocumentSchema>;
