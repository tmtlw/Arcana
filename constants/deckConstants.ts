
import { Card } from '../types';
import { MAJOR_ARCANA } from '../cards/major';
import { WANDS } from '../cards/wands';
import { CUPS } from '../cards/cups';
import { SWORDS } from '../cards/swords';
import { PENTACLES } from '../cards/pentacles';

export const FULL_DECK: Card[] = [
    ...MAJOR_ARCANA,
    ...WANDS,
    ...CUPS,
    ...SWORDS,
    ...PENTACLES
];
