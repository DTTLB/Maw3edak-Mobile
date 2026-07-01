import {
  AlertTriangle,
  Phone,
  Activity,
  Stethoscope,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { MedicalRecord, MedicalTable } from '@/utils/medicalData';

// Translator function injected at render time (react-i18next `t`).
// constants/medicalSections.tsx is not a React component, so it cannot call
// the useTranslation hook; instead display strings are stored as i18n key
// strings and the screen translates them, and the primary/secondary builders
// receive `t` so they can translate fallback labels and prefixes.
export type Translate = (key: string, options?: Record<string, unknown>) => string;

export type FieldType =
  | 'text'
  | 'multiline'
  | 'phone'
  | 'boolean'
  | 'segmented'
  | 'date';

export interface FieldConfig {
  key: string;
  // i18n key string for the field label, e.g. 'medicalRecords.allergenLabel'.
  labelKey: string;
  type: FieldType;
  // i18n key string for the placeholder.
  placeholderKey?: string;
  required?: boolean;
  // Stored option VALUES used in logic — never translated.
  options?: string[];
  // Parallel to `options`: i18n key string for each option's display label.
  optionLabelKeys?: string[];
  // When true, the segmented control tints each option with its severity color.
  severityColored?: boolean;
}

export interface SectionConfig {
  key: MedicalTable;
  // i18n key string for the section title.
  titleKey: string;
  // i18n key string for the lower-case noun used in empty states / confirmations.
  nounKey: string;
  icon: LucideIcon;
  // i18n key string for the empty-state message.
  emptyMessageKey: string;
  // Primary line shown for an entry. Receives `t` to translate fallback labels.
  primary: (item: MedicalRecord, t: Translate) => string;
  // Optional secondary line shown beneath the primary line.
  secondary?: (item: MedicalRecord, t: Translate) => string;
  // When set, returns the severity value used to render a colored chip on the row.
  severityOf?: (item: MedicalRecord) => string | null;
  fields: FieldConfig[];
}

// Severity color coding shared across the severity segmented picker and the row chips.
export const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  severe: { bg: '#FFEDEB', text: '#FF6F61' },
  moderate: { bg: '#fef3c7', text: '#d97706' },
  mild: { bg: '#fef9c3', text: '#ca8a04' },
};

export function severityStyle(severity?: string | null) {
  if (!severity) return null;
  return SEVERITY_COLORS[severity.toLowerCase()] ?? null;
}

// Converts a stored ISO date (YYYY-MM-DD) to the DD/MM/YYYY display format the app uses.
export function isoToDisplayDate(iso?: string | null): string {
  if (!iso) return '';
  const parts = String(iso).split('T')[0].split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

const formatDate = (iso?: string | null, label?: string) => {
  const display = isoToDisplayDate(iso);
  if (!display) return '';
  return label ? `${label}: ${display}` : display;
};

export const SECTIONS: Record<MedicalTable, SectionConfig> = {
  allergies: {
    key: 'allergies',
    titleKey: 'medicalRecords.allergiesTitle',
    nounKey: 'medicalRecords.allergyNoun',
    icon: AlertTriangle,
    emptyMessageKey: 'medicalRecords.allergiesEmpty',
    primary: (i, t) => i.allergen || t('medicalRecords.allergyDefaultPrimary'),
    secondary: (i) =>
      [i.type, i.reaction].filter(Boolean).join(' • '),
    severityOf: (i) => i.severity ?? null,
    fields: [
      {
        key: 'allergen',
        labelKey: 'medicalRecords.allergenLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.allergenPlaceholder',
        required: true,
      },
      {
        key: 'type',
        labelKey: 'medicalRecords.typeLabel',
        type: 'segmented',
        options: ['drug', 'food', 'environmental', 'other'],
        optionLabelKeys: [
          'medicalRecords.typeOptionDrug',
          'medicalRecords.typeOptionFood',
          'medicalRecords.typeOptionEnvironmental',
          'medicalRecords.typeOptionOther',
        ],
        required: true,
      },
      {
        key: 'severity',
        labelKey: 'medicalRecords.severityLabel',
        type: 'segmented',
        options: ['mild', 'moderate', 'severe'],
        optionLabelKeys: [
          'medicalRecords.severityOptionMild',
          'medicalRecords.severityOptionModerate',
          'medicalRecords.severityOptionSevere',
        ],
        required: true,
        severityColored: true,
      },
      {
        key: 'reaction',
        labelKey: 'medicalRecords.reactionLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.reactionPlaceholder',
      },
    ],
  },
  emergency_contacts: {
    key: 'emergency_contacts',
    titleKey: 'medicalRecords.emergencyContactsTitle',
    nounKey: 'medicalRecords.contactNoun',
    icon: Phone,
    emptyMessageKey: 'medicalRecords.emergencyContactsEmpty',
    primary: (i, t) => i.name || t('medicalRecords.contactDefaultPrimary'),
    secondary: (i, t) =>
      [i.relationship, i.phone, i.is_primary ? t('medicalRecords.primaryBadge') : null]
        .filter(Boolean)
        .join(' • '),
    fields: [
      {
        key: 'name',
        labelKey: 'medicalRecords.nameLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.namePlaceholder',
        required: true,
      },
      {
        key: 'relationship',
        labelKey: 'medicalRecords.relationshipLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.relationshipPlaceholder',
      },
      {
        key: 'phone',
        labelKey: 'medicalRecords.phoneLabel',
        type: 'phone',
        placeholderKey: 'medicalRecords.phonePlaceholder',
        required: true,
      },
      { key: 'is_primary', labelKey: 'medicalRecords.isPrimaryLabel', type: 'boolean' },
    ],
  },
  conditions: {
    key: 'conditions',
    titleKey: 'medicalRecords.conditionsTitle',
    nounKey: 'medicalRecords.conditionNoun',
    icon: Activity,
    emptyMessageKey: 'medicalRecords.conditionsEmpty',
    primary: (i, t) => i.condition || t('medicalRecords.conditionDefaultPrimary'),
    secondary: (i, t) =>
      [formatDate(i.diagnosed_on, t('medicalRecords.diagnosedPrefix')), i.notes]
        .filter(Boolean)
        .join(' • '),
    fields: [
      {
        key: 'condition',
        labelKey: 'medicalRecords.conditionLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.conditionPlaceholder',
        required: true,
      },
      {
        key: 'diagnosed_on',
        labelKey: 'medicalRecords.diagnosedOnLabel',
        type: 'date',
        placeholderKey: 'medicalRecords.datePlaceholder',
      },
      {
        key: 'notes',
        labelKey: 'medicalRecords.notesLabel',
        type: 'multiline',
        placeholderKey: 'medicalRecords.notesPlaceholder',
      },
    ],
  },
  surgeries: {
    key: 'surgeries',
    titleKey: 'medicalRecords.surgeriesTitle',
    nounKey: 'medicalRecords.surgeryNoun',
    icon: Stethoscope,
    emptyMessageKey: 'medicalRecords.surgeriesEmpty',
    primary: (i, t) => i.procedure || t('medicalRecords.surgeryDefaultPrimary'),
    secondary: (i, t) =>
      [formatDate(i.performed_on, t('medicalRecords.performedPrefix')), i.notes]
        .filter(Boolean)
        .join(' • '),
    fields: [
      {
        key: 'procedure',
        labelKey: 'medicalRecords.procedureLabel',
        type: 'text',
        placeholderKey: 'medicalRecords.procedurePlaceholder',
        required: true,
      },
      {
        key: 'performed_on',
        labelKey: 'medicalRecords.performedOnLabel',
        type: 'date',
        placeholderKey: 'medicalRecords.datePlaceholder',
      },
      {
        key: 'notes',
        labelKey: 'medicalRecords.notesLabel',
        type: 'multiline',
        placeholderKey: 'medicalRecords.notesPlaceholder',
      },
    ],
  },
};

export const SECTION_ORDER: MedicalTable[] = [
  'allergies',
  'emergency_contacts',
  'conditions',
  'surgeries',
];

export function isMedicalTable(value: unknown): value is MedicalTable {
  return typeof value === 'string' && value in SECTIONS;
}
