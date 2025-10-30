export type Phase = 'start' | 'running' | 'finish' | 'error';

export type ProgressPayload = {
  input: string;
  phase: Phase;
  message?: string;
  percent?: number;
};

export type Job = {
  id: string;
  inputPath: string;
  name: string;
  status: 'queued' | 'running' | 'done' | 'error';
  percent: number;
  tempOut?: string;
  savedTo?: string;
  error?: string;
};

export type ConverterKind = 'caj2pdf';
