
import { UI_TEXTS } from './ui';
import { WESTERN_HOROSCOPES, CHINESE_HOROSCOPES, CHINESE_ZODIAC_ORDER, CHINESE_ELEMENTS } from './horoscopes';
import { MAJOR_ARCANA } from './cards/major';
import { WANDS } from './cards/wands';
import { CUPS } from './cards/cups';
import { SWORDS } from './cards/swords';
import { PENTACLES } from './cards/pentacles';

const CARDS = [
    ...MAJOR_ARCANA,
    ...WANDS,
    ...CUPS,
    ...SWORDS,
    ...PENTACLES
];

export const DATA = {
  ui: UI_TEXTS,
  horoscopes: WESTERN_HOROSCOPES,
  chinese: CHINESE_HOROSCOPES,
  chineseOrder: CHINESE_ZODIAC_ORDER,
  chineseElements: CHINESE_ELEMENTS,
  cards: CARDS
};
