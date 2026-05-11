'use client';

import * as React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { FormField } from '@/components/shared/molecules/form-field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Universal FormArray molecule.
 * Handles dynamic lists of objects in a form (e.g., product sizes).
 */
export interface FormArrayProps {
  /** Name of the array in the form schema */
  name: string;
  /** Label for the entire section */
  label?: string;
  /** Configuration for the fields within each array item */
  fields: {
    name: string; // Relative name within the item
    label: string;
    type: 'text' | 'number' | 'select';
    options?: any[]; // For select
    gridSpan?: string;
  }[];
  /** Label for the "Add Item" button */
  addLabel?: string;
  /** Default value for a new item */
  newItemDefault: any;
  /** Custom class name */
  className?: string;
}

export function FormArray({
  name,
  label,
  fields,
  addLabel = 'Add Item',
  newItemDefault,
  className
}: FormArrayProps) {
  const { control } = useFormContext();
  const { fields: items, append, remove } = useFieldArray({
    control,
    name
  });

  return (
    <div className={cn("space-y-4 pt-4 border-t border-border/50", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">
            {label}
          </Label>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(newItemDefault)}
          className="h-7 text-[10px] uppercase tracking-widest border-brand-gold/30 text-brand-gold"
          leftIcon={<Plus className="h-3 w-3" />}
        >
          {addLabel}
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="relative p-4 rounded-xl border border-border/50 bg-card/10 group animate-in fade-in zoom-in duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
              {fields.map((f) => (
                <div key={f.name} className={cn(f.gridSpan)}>
                  <FormField
                    name={`${name}.${index}.${f.name}`}
                    label={f.label}
                    type={f.type as any}
                    options={f.options}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4 border-2 border-dashed border-border/30 rounded-xl">
            No items added yet. Click "{addLabel}" to start.
          </p>
        )}
      </div>
    </div>
  );
}
