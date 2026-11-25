import type { AmbientColorRGB } from './media';

export interface TutorialChapter {
  id: string;
  index: number;
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  ambientColor: AmbientColorRGB;
  keyFormula: string;
  caption: string;
}
