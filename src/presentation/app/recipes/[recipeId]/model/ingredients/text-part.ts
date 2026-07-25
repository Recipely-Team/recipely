export interface TextPart {
  kind: 'text' | 'timer';
  value: string;
  minutes?: number;
}
