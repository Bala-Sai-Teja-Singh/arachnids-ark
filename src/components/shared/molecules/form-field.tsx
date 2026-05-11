'use client';

import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/shared/atoms/input';
import { Select, type SelectOption, type SelectGroup } from '@/components/shared/atoms/select';
import { Textarea } from '@/components/shared/atoms/textarea';
import { cn } from '@/lib/utils';

/**
 * Enhanced FormField molecule.
 * Bridges Atoms with react-hook-form. Handles labels, error messages, and state synchronization.
 */
interface BaseFormFieldProps {
  /** Name of the field in the form schema */
  name: string;
  /** Label text displayed above the input */
  label?: string;
  /** Optional hint or instruction text */
  description?: string;
  /** If true, the field is required (visually) */
  required?: boolean;
}

export interface InputFormFieldProps extends BaseFormFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface SelectFormFieldProps extends BaseFormFieldProps {
  type: 'select';
  options: (SelectOption | SelectGroup)[];
  placeholder?: string;
}

export type FormFieldProps = InputFormFieldProps | SelectFormFieldProps;

export function FormField(props: FormFieldProps) {
  const { control, formState: { errors }, setValue } = useFormContext();
  const error = errors[props.name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className="space-y-2 w-full animate-in fade-in slide-in-from-top-1 duration-300">
      {props.label && (
        <Label 
          htmlFor={props.name} 
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1",
            props.required && "after:content-['*'] after:ml-0.5 after:text-brand-red"
          )}
        >
          {props.label}
        </Label>
      )}

      <Controller
        name={props.name}
        control={control}
        render={({ field }) => {
          if (props.type === 'select') {
            return (
              <Select
                id={props.name}
                value={field.value}
                onValueChange={field.onChange}
                onClear={() => setValue(props.name, '')}
                options={props.options}
                placeholder={props.placeholder}
                error={!!error}
                helperText={errorMessage || props.description}
              />
            );
          }

          if (props.type === 'textarea') {
            return (
              <Textarea
                {...field}
                id={props.name}
                placeholder={props.placeholder}
                error={!!error}
                value={field.value || ''}
                onClose={() => field.onBlur()}
                helperText={errorMessage || props.description}
              />
            );
          }

          return (
            <Input
              {...field}
              id={props.name}
              type={props.type}
              placeholder={props.placeholder}
              leftIcon={props.leftIcon}
              rightIcon={props.rightIcon}
              error={!!error}
              value={field.value || ''}
              onClear={() => setValue(props.name, '')}
              onClose={() => field.onBlur()}
              helperText={errorMessage || props.description}
              onChange={(e) => {
                const val = props.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                field.onChange(val);
              }}
            />
          );
        }}
      />
    </div>
  );
}
