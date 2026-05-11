'use client';

import React, {
  useRef,
  useState,
  useId,
  useEffect,
} from 'react';
import dynamic from 'next/dynamic';
import type {
  StylesConfig,
  GroupBase,
  OptionProps,
  ValueContainerProps,
  InputProps,
  MultiValueProps,
} from 'react-select';
import { components } from 'react-select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import type {
  SelectProps,
  SelectOption,
  SelectGroup,
  Option,
} from './Select.types';

export type { SelectOption, SelectGroup };

const ReactSelect = dynamic(
  () =>
    import('react-select').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const CreatableSelect = dynamic(
  () =>
    import('react-select/creatable').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const AsyncSelect = dynamic(
  () =>
    import('react-select/async').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const AsyncCreatableSelect = dynamic(
  () =>
    import('react-select/async-creatable').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const AsyncPaginate = dynamic(
  () =>
    import('react-select-async-paginate').then(
      (mod) => mod.AsyncPaginate
    ),
  { ssr: false }
);

const INDICATORS_WIDTH = 32 + 8; // 40
const INDICATORS_WIDTH_WITH_CLEAR = 32 + 32 + 8; // 72

const defaultStyles: StylesConfig<
  Option,
  boolean
> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'transparent',
    borderRadius: '8px',
    minHeight: '2.25rem',
    maxHeight: '2.25rem',
    border:
      state.isFocused &&
      state.selectProps.menuIsOpen
        ? '1px solid var(--brand-gold)'
        : '1px solid var(--border)',
    boxShadow:
      state.isFocused &&
      state.selectProps.menuIsOpen
        ? '0 0 0 1px var(--brand-gold)'
        : 'none',
    color: 'hsl(var(--foreground))',
    overflow: 'hidden',
    flexWrap: 'nowrap',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: '1px solid var(--brand-gold)',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    fontSize: '0.875rem',
    color: 'hsl(var(--foreground))',
    maxHeight: '2.25rem',
    overflow: 'hidden',
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingRight: '6px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'var(--brand-gold)',
    borderRadius: '6px',
    margin: '1px 2px',
    flexShrink: 0,
    maxWidth: '200px',
    minWidth: '40px',
    border: '1px solid var(--brand-gold)',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'black',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '2px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'black',
    padding: '0 4px',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.1)',
      color: 'black',
    },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0 6px 6px 0',
    flexShrink: 0,
    cursor: 'pointer',
    height: 'auto',
    alignSelf: 'stretch',
  }),
  input: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
    margin: 0,
    paddingBottom: 0,
    paddingTop: 0,
  }),
  placeholder: (base, state) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    margin: 0,
    display: state.isFocused ? 'none' : 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 'calc(100% - 8px)',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  indicatorsContainer: (base) => ({
    ...base,
    position: 'absolute',
    right: '0',
    top: '0',
    bottom: '0',
    paddingRight: '8px',
    backgroundColor: 'transparent',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: '0 8px 8px 0',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    padding: '4px',
    '&:hover': {
      color: 'hsl(var(--destructive))',
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    padding: '4px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--popover))',
    fontSize: '0.875rem',
    zIndex: 99999,
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(16px)',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  menuList: (base) => ({
    ...base,
    padding: '0',
    maxHeight: '300px',
    overflowY: 'auto',
  }),
  option: (base, state) => {
    const opts = (state as any).selectProps?.options as Option[] | undefined;
    const index = Array.isArray(opts) ? opts.indexOf((state as any).data) : -1;
    return {
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--brand-gold)'
        : state.isFocused
          ? 'rgba(184, 134, 11, 0.1)'
          : 'transparent',
      color: state.isSelected
        ? 'black'
        : 'hsl(var(--foreground))',
      borderRadius: 0,
      cursor: 'pointer',
      paddingTop: '12px',
      paddingBottom: '12px',
      paddingLeft: '14px',
      paddingRight: '14px',
      fontSize: '0.9rem',
      fontWeight: state.isSelected ? '600' : '500',
      lineHeight: '1.25rem',
      borderBottom: index === (opts?.length ?? 1) - 1 ? 'none' : '1px solid var(--border)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: state.isSelected ? 'var(--brand-gold)' : 'rgba(184, 134, 11, 0.1)',
      },
    } as any;
  },
};

const CheckboxOption = (props: OptionProps<Option, boolean, GroupBase<Option>>) => {
  const { isSelected, label } = props;
  return (
    <components.Option {...props}>
      <div className='flex items-center gap-2'>
        <input type='checkbox' checked={Boolean(isSelected)} onChange={() => {}} tabIndex={-1} className='h-4 w-4 rounded border-border' />
        <span>{label as any}</span>
      </div>
    </components.Option>
  );
};

const CustomMultiValue = (props: MultiValueProps<Option, boolean, GroupBase<Option>>) => {
  return <components.MultiValue {...props} />;
};

const CustomMenuPortal = (props: any) => (
  <components.MenuPortal {...props}>
    <div data-select-instance-id={props.selectProps.instanceId}>{props.children}</div>
  </components.MenuPortal>
);

const CustomMenu = (props: any) => (
  <div data-select-handshake={props.selectProps.instanceId}><components.Menu {...props} /></div>
);

const CustomInput = (props: InputProps<Option, boolean, GroupBase<Option>>) => (
  <components.Input {...props} className={cn(props.className, 'select__input')} />
);

const TAG_GAP = 4;

const CustomValueContainer = ({ children, ...props }: ValueContainerProps<Option, boolean, GroupBase<Option>>) => {
  const { getValue, selectProps } = props;
  const value = getValue();
  const isMulti = selectProps.isMulti;
  const isClearable = selectProps.isClearable && value.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) { scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; }
  }, [value.length]);

  if (!isMulti) {
    return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  }

  const indicatorsWidth = isClearable ? INDICATORS_WIDTH_WITH_CLEAR : INDICATORS_WIDTH;

  return (
    <components.ValueContainer {...props}>
      <div
        ref={scrollRef}
        className='no-scrollbar'
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          width: `calc(100% - ${indicatorsWidth - 10}px)`,
          gap: `${TAG_GAP}px`,
          minWidth: 0,
          paddingRight: '24px',
          boxSizing: 'border-box',
          WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
          maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
        }}
      >
        {children}
      </div>
    </components.ValueContainer>
  );
};

const Select = React.forwardRef<any, SelectProps>(
  (
    {
      selectKey,
      classNames,
      className,
      closeMenuOnSelect = true,
      isDisabled = false,
      isLoading = false,
      isClearable = false,
      isRtl = false,
      isSearchable = true,
      isMultiSelect = false,
      isCreatable = false,
      allowedSpecialCharacters = ['@', ',', '.', '/', '-'],
      options,
      styles: providedStyles,
      defaultValue,
      value,
      inputValue,
      placeholder,
      onChange: providedOnChange,
      onInputChange,
      menuPortalTarget,
      menuPlacement,
      menuPosition,
      noOptionsMessage,
      loadOptions,
      cacheOptions,
      defaultOptions = true,
      isAsync = false,
      isPaginated = false,
      loadPageOptions,
      additional,
      debounceTimeout = 300,
      loadingMessage,
      maxMenuHeight = 300,
      onMenuOpen,
      onMenuClose,
      getOptionValue,
      maxTags,
      onValueChange: providedOnValueChange,
      components: customComponents,
      id,
      error,
      helperText,
      onClear,
    },
    ref
  ) => {
    const selectControlRef = useRef<HTMLDivElement>(null);
    const selectInstanceRef = useRef<any>(null);

    // Dynamic styles for error
    const styles = providedStyles || (defaultStyles as any);
    const finalStyles: StylesConfig<Option, boolean> = {
      ...styles,
      control: (base, state) => ({
        ...(typeof styles.control === 'function' ? styles.control(base, state) : base),
        borderColor: error ? 'var(--brand-red)' : (state.isFocused ? 'var(--brand-gold)' : 'var(--border)'),
        '&:hover': {
          borderColor: error ? 'var(--brand-red)' : 'var(--brand-gold)',
        },
      }),
    };

    // Backward compatibility for onValueChange
    const handleChange = (newValue: any, actionMeta: any) => {
      if (providedOnChange) {
        providedOnChange(newValue, actionMeta);
      }
      if (providedOnValueChange) {
        if (isMultiSelect) {
          providedOnValueChange(newValue ? newValue.map((v: any) => v.value) : []);
        } else {
          providedOnValueChange(newValue ? newValue.value : null);
        }
      }
    };

    // Helper to find the right value object for react-select
    const getValue = () => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'object') return value;
      
      const allOptions = options?.flatMap(opt => 'options' in (opt as any) ? (opt as any).options : [opt]) || [];
      
      if (isMultiSelect && Array.isArray(value)) {
        return allOptions.filter(opt => value.includes(opt.value)) || [];
      }
      return allOptions.find(opt => opt.value === value) || null;
    };
    const generatedId = useId();
    const rawId = generatedId.replace(/:/g, '');
    const stableId = selectKey || `select-${rawId}`;
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [calculatedMenuPlacement, setCalculatedMenuPlacement] = useState<'top' | 'bottom' | 'auto'>(menuPlacement || 'auto');

    useEffect(() => {
      const handleGlobalMouseDown = (e: MouseEvent) => {
        const target = e.target as Node;
        if (selectControlRef.current?.contains(target)) return;
        const ownPortal = document.querySelector(`[data-select-instance-id="${stableId}"]`);
        if (ownPortal?.contains(target)) return;
        if (menuIsOpen) {
          setTimeout(() => selectInstanceRef.current?.blur(), 10);
          setMenuIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleGlobalMouseDown, true);
      return () => document.removeEventListener('mousedown', handleGlobalMouseDown, true);
    }, [stableId, menuIsOpen]);

    useEffect(() => {
      const handleGlobalOpen = (e: any) => {
        const openedId = e.detail?.instanceId;
        if (openedId && openedId !== stableId && menuIsOpen) {
          setTimeout(() => selectInstanceRef.current?.blur(), 10);
          setMenuIsOpen(false);
        }
      };
      window.addEventListener('axcl-select-state-open', handleGlobalOpen);
      return () => window.removeEventListener('axcl-select-state-open', handleGlobalOpen);
    }, [stableId, menuIsOpen]);

    useEffect(() => {
      if (!menuIsOpen) return;
      if (menuPlacement) { setCalculatedMenuPlacement(menuPlacement); return; }
      if (selectControlRef.current) {
        const rect = selectControlRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const requiredSpace = maxMenuHeight + 40;
        setCalculatedMenuPlacement(spaceBelow < requiredSpace && spaceAbove > spaceBelow ? 'top' : 'bottom');
      }
    }, [menuIsOpen, menuPlacement, maxMenuHeight]);

    const handleMenuOpen = () => {
      setMenuIsOpen(true);
      window.dispatchEvent(new CustomEvent('axcl-select-state-open', { detail: { instanceId: stableId } }));
      onMenuOpen?.();
    };

    const handleMenuClose = () => {
      setMenuIsOpen(false);
      selectInstanceRef.current?.blur();
      onMenuClose?.();
      if (!menuPlacement) setCalculatedMenuPlacement('auto');
    };

    const handleInputChange = (newValue: string, actionMeta: any) => {
      onInputChange?.(newValue, actionMeta);
      return newValue;
    };

    const commonProps: any = {
      instanceId: stableId,
      id: stableId,
      menuIsOpen,
      className: cn('basic-single', classNames, className),
      classNamePrefix: 'select',
      closeMenuOnSelect: isMultiSelect ? false : closeMenuOnSelect,
      defaultValue,
      isDisabled,
      isLoading,
      isClearable,
      isRtl,
      isMulti: isMultiSelect,
      isSearchable,
      hideSelectedOptions: false,
      styles: finalStyles,
      value: getValue(),
      inputValue,
      placeholder,
      onChange: handleChange,
      onInputChange: handleInputChange,
      menuPortalTarget: menuPortalTarget !== undefined ? menuPortalTarget : (typeof document !== 'undefined' ? document.body : null),
      menuPlacement: calculatedMenuPlacement,
      menuPosition: menuPosition || (typeof document !== 'undefined' ? 'fixed' : undefined),
      maxMenuHeight,
      onMenuOpen: handleMenuOpen,
      onMenuClose: handleMenuClose,
      components: {
        ValueContainer: CustomValueContainer,
        MultiValue: CustomMultiValue,
        Input: CustomInput,
        Menu: CustomMenu,
        MenuPortal: CustomMenuPortal,
        ...(isMultiSelect ? { Option: CheckboxOption } : {}),
        ...customComponents,
      },
      ref: (instance: any) => {
        selectInstanceRef.current = instance;
        if (typeof ref === 'function') ref(instance);
        else if (ref) (ref as any).current = instance;
      },
      noOptionsMessage: noOptionsMessage || (({ inputValue }: any) => inputValue ? 'No options found' : 'Start typing to search...'),
      loadingMessage: loadingMessage || (() => 'Loading...'),
      getOptionValue,
      maxTags,
    };

    const renderSelectComponent = () => {
      const componentKey = selectKey || undefined;
      if (isPaginated && loadPageOptions) {
        return (
          <AsyncPaginate
            key={componentKey} {...commonProps} loadOptions={loadPageOptions}
            additional={additional ? { ...additional } : { page: 1 }}
            debounceTimeout={debounceTimeout}
            cacheUniqs={[inputValue, additional?.transportProviderId || '']}
            defaultOptions={true}
          />
        );
      }
      if (isAsync) {
        return isCreatable 
          ? <AsyncCreatableSelect key={componentKey} {...commonProps} loadOptions={loadOptions} cacheOptions={cacheOptions} defaultOptions={defaultOptions} />
          : <AsyncSelect key={componentKey} {...commonProps} loadOptions={loadOptions} cacheOptions={cacheOptions} defaultOptions={defaultOptions} />;
      }
      return isCreatable 
        ? <CreatableSelect key={componentKey} {...commonProps} options={options} />
        : <ReactSelect key={componentKey} {...commonProps} options={options} />;
    };

    return (
      <div
        ref={selectControlRef}
        className={cn("w-full space-y-1", className)}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.select__clear-indicator') || target.closest('.select__multi-value__remove')) return;
          if (!menuIsOpen) { setMenuIsOpen(true); selectInstanceRef.current?.focus(); }
          else if (!isMultiSelect) { e.preventDefault(); setMenuIsOpen(false); selectInstanceRef.current?.blur(); }
        }}
      >
        {renderSelectComponent()}
        {helperText && (
          <p className={cn("text-[10px] font-medium px-1", error ? "text-brand-red" : "text-muted-foreground")}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
