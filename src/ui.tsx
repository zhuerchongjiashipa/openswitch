import {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
  forwardRef,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';
import { OS_TOKENS } from './data';

// shadcn-style primitives shared by the Add Environment / Add Credential
// dialogs. 1px lines, 6–8px radii, quiet focus, ghost/outline/default variants.

export function FieldLabel({
  children,
  hint,
  htmlFor,
  required,
}: {
  children: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  required?: boolean;
} & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        fontSize: 12.5,
        fontWeight: 500,
        color: OS_TOKENS.ink,
        marginBottom: 6,
        letterSpacing: '-0.005em',
      }}
    >
      <span>
        {children}
        {required && (
          <span style={{ color: OS_TOKENS.danger, marginLeft: 2 }}>*</span>
        )}
      </span>
      {hint && (
        <span
          style={{ fontSize: 11.5, fontWeight: 400, color: OS_TOKENS.inkMute }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  mono?: boolean;
  invalid?: boolean;
  wrapperStyle?: CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, mono, invalid, wrapperStyle, style, ...rest },
  ref,
) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: '0 10px',
        borderRadius: 7,
        background: OS_TOKENS.surface,
        border: `1px solid ${invalid ? OS_TOKENS.danger : OS_TOKENS.line}`,
        ...wrapperStyle,
      }}
    >
      {leading && (
        <span
          style={{
            color: OS_TOKENS.inkMute,
            fontSize: 12.5,
            fontFamily: mono ? OS_TOKENS.mono : 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {leading}
        </span>
      )}
      <input
        ref={ref}
        {...rest}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 13,
          fontFamily: mono ? OS_TOKENS.mono : 'inherit',
          letterSpacing: mono ? 0 : '-0.005em',
          color: OS_TOKENS.ink,
          ...style,
        }}
      />
      {trailing}
    </div>
  );
});

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'default',
  size = 'md',
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 7,
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '-0.005em',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.55 : 1,
  };
  const sizes: Record<Size, CSSProperties> = {
    sm: { height: 28, padding: '0 10px', fontSize: 12 },
    md: { height: 34, padding: '0 14px', fontSize: 13 },
  };
  const variants: Record<Variant, CSSProperties> = {
    default: {
      background: OS_TOKENS.ink,
      color: OS_TOKENS.bg,
      border: `1px solid ${OS_TOKENS.ink}`,
    },
    outline: {
      background: OS_TOKENS.surface,
      color: OS_TOKENS.ink,
      border: `1px solid ${OS_TOKENS.line}`,
    },
    ghost: {
      background: 'transparent',
      color: OS_TOKENS.inkSoft,
      border: '1px solid transparent',
    },
  };
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 17,
        height: 17,
        padding: '0 4px',
        borderRadius: 3,
        background: OS_TOKENS.surface,
        border: `1px solid ${OS_TOKENS.line}`,
        fontSize: 10,
        color: OS_TOKENS.inkSoft,
        fontFamily: OS_TOKENS.mono,
      }}
    >
      {children}
    </span>
  );
}

export function Separator({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: OS_TOKENS.line, ...style }} />;
}

export interface RadioOption {
  id: string;
  label: string;
  hint: string;
}

export function RadioCards({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: RadioOption[];
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 8,
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              textAlign: 'left',
              padding: '10px 11px',
              borderRadius: 8,
              background: active ? OS_TOKENS.accentSoft : OS_TOKENS.surface,
              border: `1px solid ${
                active ? 'oklch(0.78 0.07 250)' : OS_TOKENS.line
              }`,
              boxShadow: active ? '0 0 0 3px oklch(0.95 0.02 250)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              fontFamily: 'inherit',
              color: OS_TOKENS.ink,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '-0.005em',
                color: active ? OS_TOKENS.accentInk : OS_TOKENS.ink,
              }}
            >
              {o.label}
            </span>
            <span style={{ fontSize: 11.5, color: OS_TOKENS.inkMute, lineHeight: 1.4 }}>
              {o.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Check({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(ev) => {
        ev.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        cursor: 'pointer',
        background: checked ? OS_TOKENS.accent : OS_TOKENS.surface,
        border: `1px solid ${checked ? OS_TOKENS.accent : OS_TOKENS.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path
            d="M1.5 5.3 L4 7.6 L8.5 2.6"
            stroke="#fff"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function Dialog({
  children,
  width = 520,
  onClose,
}: {
  children: ReactNode;
  width?: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(24,20,14,0.42)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          width,
          maxWidth: '100%',
          background: OS_TOKENS.surface,
          borderRadius: 12,
          border: `1px solid ${OS_TOKENS.line}`,
          boxShadow:
            '0 24px 60px -12px rgba(24,20,14,0.28), 0 4px 12px rgba(24,20,14,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 48px)',
          fontFamily: OS_TOKENS.sans,
          color: OS_TOKENS.ink,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  title,
  subtitle,
  onClose,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: '16px 18px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderBottom: `1px solid ${OS_TOKENS.lineSoft}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 12.5,
              color: OS_TOKENS.inkMute,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: OS_TOKENS.inkMute,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}

export function DialogBody({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ padding: '16px 18px 18px', overflow: 'auto', ...style }}>
      {children}
    </div>
  );
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderTop: `1px solid ${OS_TOKENS.lineSoft}`,
        background: OS_TOKENS.bg,
      }}
    >
      {children}
    </div>
  );
}
