'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { TemplateFieldType } from '@/schemas/template-definition';
import { FieldEditorDialog } from './field-editor-dialog';

interface FieldsTableProps {
  fields: TemplateFieldType[];
  onUpdate: (fields: TemplateFieldType[]) => void;
  allFieldKeys: string[];
}

export function FieldsTable({ fields, onUpdate, allFieldKeys }: FieldsTableProps) {
  const t = useTranslations('templateEditor');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function removeField(index: number) {
    onUpdate(fields.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate(next);
  }

  function handleSaveField(field: TemplateFieldType) {
    if (editingIndex !== null) {
      const next = [...fields];
      next[editingIndex] = field;
      onUpdate(next);
      setEditingIndex(null);
    } else {
      onUpdate([...fields, field]);
      setIsAdding(false);
    }
  }

  // Keys excluding the one being edited (for uniqueness check)
  const existingKeysForValidation =
    editingIndex !== null
      ? allFieldKeys.filter((k) => k !== fields[editingIndex]?.key)
      : allFieldKeys;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t('fields')}</h4>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-3 w-3" />
          {t('addField')}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">{t('noFields')}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fieldKey')}</TableHead>
                <TableHead>{t('fieldType')}</TableHead>
                <TableHead>{t('fieldRequired')}</TableHead>
                <TableHead>{t('fieldWidth')}</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.key}>
                  <TableCell className="font-mono text-xs">{field.key}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{field.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={field.required ? 'default' : 'secondary'}>
                      {field.required ? t('fieldRequired') : t('fieldOptional')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{field.width}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveField(index, 1)}
                        disabled={index === fields.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                        <Trash2 className="text-destructive h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Field editor dialog — for adding or editing */}
      <FieldEditorDialog
        open={editingIndex !== null || isAdding}
        onOpenChange={(open) => {
          if (!open) {
            setEditingIndex(null);
            setIsAdding(false);
          }
        }}
        field={editingIndex !== null ? fields[editingIndex] : null}
        existingKeys={existingKeysForValidation}
        onSave={handleSaveField}
      />
    </div>
  );
}
