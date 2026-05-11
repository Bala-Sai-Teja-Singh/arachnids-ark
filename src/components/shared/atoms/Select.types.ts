import React from 'react';

export interface SelectOption {
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
}

// Map Option to SelectOption for internal use in the implementation if needed
export type Option = SelectOption;

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  selectKey?: string;
  classNames?: string;
  className?: string;
  closeMenuOnSelect?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isRtl?: boolean;
  isSearchable?: boolean;
  isMultiSelect?: boolean;
  isCreatable?: boolean;
  options?: (SelectOption | SelectGroup)[];
  styles?: any;
  defaultValue?: any;
  value?: any;
  inputValue?: string;
  placeholder?: string;
  onChange?: (value: any, actionMeta: any) => void;
  onValueChange?: (value: any) => void;
  onInputChange?: (newValue: string, actionMeta: any) => void;
  menuPortalTarget?: HTMLElement | null;
  menuPlacement?: 'top' | 'bottom' | 'auto';
  menuPosition?: 'fixed' | 'absolute';
  noOptionsMessage?: (obj: { inputValue: string }) => string | React.ReactNode;
  loadOptions?: (inputValue: string, callback: (options: SelectOption[]) => void) => void | Promise<SelectOption[]>;
  cacheOptions?: boolean;
  defaultOptions?: boolean | SelectOption[];
  isAsync?: boolean;
  isPaginated?: boolean;
  loadPageOptions?: any;
  additional?: any;
  debounceTimeout?: number;
  loadingMessage?: (obj: { inputValue: string }) => string | React.ReactNode;
  maxMenuHeight?: number;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  getOptionValue?: (option: SelectOption) => string;
  maxTags?: number;
  components?: any;
  allowedSpecialCharacters?: string[];
  id?: string;
  error?: boolean;
  helperText?: string;
  onClear?: () => void;
}
