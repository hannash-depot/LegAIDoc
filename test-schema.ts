import { TemplateUpdateSchema } from './src/schemas/template';

const body = { isActive: false };
const parsed = TemplateUpdateSchema.safeParse(body);

if (!parsed.success) {
  console.log('Error:', parsed.error);
} else {
  console.log('Success! parsed data:', parsed.data);
}
