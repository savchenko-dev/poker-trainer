import type { AnswerOption, Explanation, Prompt } from '../engine/types';
import type { Dict, ExplanationText } from './en';

export function formatPrompt(t: Dict, prompt: Prompt): string {
  return (t.prompts[prompt.key] as (params: Prompt['params']) => string)(prompt.params);
}

export function formatExplanation(t: Dict, explanation: Explanation): ExplanationText {
  return (t.explanations[explanation.key] as (params: Explanation['params']) => ExplanationText)(explanation.params);
}

export function optionLabel(t: Dict, option: AnswerOption): string {
  return typeof option.value === 'string' ? t.actions[option.value] : option.label;
}
