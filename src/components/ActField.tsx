import { useEffect, useRef, useState } from 'react';
import type { FieldDef } from '@/domain/types';
import { useI18n } from '@/hooks/useI18n';
import { entryKind, hintForKey, keepEntry, moneyToNumber } from '@/lib/fieldInput';

export function ActField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { L } = useI18n();
  const label = `${L(field.label)}${field.required ? ' *' : ''}`;
  if (field.type === 'checkbox') {
    return (
      <label className="field">
        <span>{label}</span>
        <input type="checkbox" checked={value === 'da'} onChange={(event) => onChange(field.key, event.target.checked ? 'da' : '')} />
      </label>
    );
  }
  if (field.type === 'textarea') {
    return (
      <label className="field wide">
        <span>{label}</span>
        <textarea value={value} onChange={(event) => onChange(field.key, event.target.value)} />
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <label className="field">
        <span>{label}</span>
        <select value={value} onChange={(event) => onChange(field.key, event.target.value)}>
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {L(option.label)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === 'date') {
    return (
      <label className="field">
        <span>{label}</span>
        <input type="date" value={value} onChange={(event) => onChange(field.key, event.target.value)} />
      </label>
    );
  }
  return (
    <FilteredField
      entryKey={field.key}
      label={label}
      value={value}
      onChange={(next) => onChange(field.key, next)}
    />
  );
}

export function FilteredField({
  entryKey,
  label,
  value,
  onChange,
  wide,
}: {
  entryKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  const { t } = useI18n();
  const kind = entryKind(entryKey);
  const hint = hintForKey(entryKey);
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input
        type="text"
        inputMode={kind === 'digits' ? 'numeric' : kind === 'money' || kind === 'share' ? 'decimal' : 'text'}
        autoCapitalize={kind === 'letters' ? 'characters' : 'off'}
        autoComplete="off"
        spellCheck={kind === 'name' || kind === 'place' || kind === 'phrase'}
        value={value}
        onChange={(event) => onChange(keepEntry(entryKey, event.target.value))}
      />
      {hint && <small className="hint">{t(hint)}</small>}
    </label>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(() => (value ? String(value) : ''));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value ? String(value) : '');
  }, [value]);

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setText(value ? String(value) : '');
        }}
        onChange={(event) => {
          const next = keepEntry('amount', event.target.value);
          setText(next);
          onChange(moneyToNumber(next));
        }}
      />
      <small className="hint">{t('hintMoney')}</small>
    </label>
  );
}

export function DigitsField({
  label,
  entryKey,
  value,
  onChange,
}: {
  label: string;
  entryKey: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(() => String(value));
  const focused = useRef(false);
  const hint = hintForKey(entryKey);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setText(String(value));
        }}
        onChange={(event) => {
          const next = keepEntry(entryKey, event.target.value);
          setText(next);
          onChange(next === '' ? 0 : Number(next));
        }}
      />
      {hint && <small className="hint">{t(hint)}</small>}
    </label>
  );
}
