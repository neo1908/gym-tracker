import { writable } from 'svelte/store';
import type { Exercise } from './types';

export const exercises = writable<Record<string, Exercise>>({});
export const filteredExercises = writable<Record<string, Exercise>>({});
export const theme = writable<'light' | 'dark'>('dark');
