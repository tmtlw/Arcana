
import { Lesson } from '../types';
import { BADGES } from './badges';
import { BASICS_LESSONS } from '../lessons/basics';
import { MAJOR_LESSONS } from '../lessons/major';
import { MINOR_LESSONS } from '../lessons/minor';
import { READING_LESSONS } from '../lessons/reading';
import { SYMBOLISM_LESSONS } from '../lessons/symbolism';

export { BADGES };

export const LESSONS: Lesson[] = [
    ...BASICS_LESSONS,
    ...MAJOR_LESSONS,
    ...MINOR_LESSONS,
    ...READING_LESSONS,
    ...SYMBOLISM_LESSONS
];
