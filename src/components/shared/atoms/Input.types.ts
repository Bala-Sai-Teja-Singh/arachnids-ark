import { InputHTMLAttributes, ReactNode, RefObject } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
  iconClassName?: string;
  label?: string;
  labelClassName?: string;
  labelTooltip?: string;
  labelPlacement?: 'inside' | 'outside' | 'left';
  isClearable?: boolean;
  onClear?: () => void;
  refInput?: RefObject<HTMLInputElement>;
  startContent?: ReactNode;
  endContent?: ReactNode;
  allowedChars?: 'alphabets' | 'numbers' | 'alphanumeric' | 'all';
  regex?: RegExp;
  startPaddingClass?: string;
  endPaddingClass?: string;
  extraClassName?: string;
  loading?: boolean;
  
  // Compatibility with old Input atom
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: boolean;
  helperText?: string;
  onClose?: () => void;
}
