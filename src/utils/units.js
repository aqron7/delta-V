import { AU, DAY } from '../physics/constants.js';

export const msToKms = (v) => v / 1000;
export const kmsToMs = (v) => v * 1000;
export const kmToM   = (v) => v * 1000;
export const mToKm   = (v) => v / 1000;
export const auToM   = (v) => v * AU;
export const mToAu   = (v) => v / AU;
export const sToDays = (v) => v / DAY;
export const daysToS = (v) => v * DAY;
