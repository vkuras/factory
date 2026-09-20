// Agent labels, agent colours and status colours: the design's `AG` and `STATUS` maps (ADR-0002).

import type { Actor } from './types.js';

export const AG: Record<Actor, { label: string; color: string }> = {
  groom: { label: 'Groom', color: '#5BC8F5' },
  architect: { label: 'Architect', color: '#A78BFA' },
  implementer: { label: 'Implementer', color: '#F5A524' },
  validator: { label: 'Validator', color: '#9EE84B' },
  human: { label: 'You', color: '#FF7AB6' },
};

export type Stage = 'grooming' | 'design' | 'implementation' | 'verification';

export const STAGES: readonly { key: Stage; label: string; color: string; hint: string }[] = [
  { key: 'grooming', label: 'Grooming', color: '#5BC8F5', hint: 'requirements & open questions' },
  { key: 'design', label: 'Design', color: '#A78BFA', hint: 'architecture decisions' },
  { key: 'implementation', label: 'Implementation', color: '#F5A524', hint: 'code & fix rounds' },
  { key: 'verification', label: 'Verification', color: '#9EE84B', hint: 'validated or in review' },
];

export const UNKNOWN_COLOR = '#6E7887';
export const FAILURE_COLOR = '#FF6B6B';
