import { buildDrills, buildMixedSession, buildScenarioDrills, buildStepChain, hitChanceStep } from '../engine/drills';
import { mulberry32 } from '../engine/rng';
import { DRILL_TYPES, POSTFLOP_TYPES, type Answer, type DrillType, type Level, type Session } from '../engine/types';

export type TrainerKey = DrillType | 'chain' | 'mixed';

export const TRAINER_KEYS: TrainerKey[] = [...DRILL_TYPES, 'chain', 'mixed'];

export const SESSION_LENGTH = 10;
export const CHAIN_HANDS = 3;
export const CHAIN_STEPS = 4;

export interface SessionState { session: Session | null; current: number; shownAt: number }

export type SessionAction =
  | { type: 'start'; key: TrainerKey; now: number; levels: Record<DrillType, Level> }
  | { type: 'answer'; optionId: string; now: number }
  | { type: 'timeout'; now: number }
  | { type: 'next'; now: number };

export const initialSession: SessionState = { session: null, current: 0, shownAt: 0 };

export function sessionKey(session: Session): TrainerKey | undefined {
  if (session.mode === 'stepChain') return 'chain';
  return session.mode === 'mixed' ? 'mixed' : session.drillType;
}

function startSession(key: TrainerKey, now: number, levels: Record<DrillType, Level>): Session {
  const rng = mulberry32(now);
  if (key === 'chain') {
    const level = Math.min(...POSTFLOP_TYPES.map((type) => levels[type])) as Level;
    return { mode: 'stepChain', drills: Array.from({ length: CHAIN_HANDS }, () => buildStepChain(level, rng)).flat(), answers: [], startedAt: now };
  }
  if (key === 'mixed') return { mode: 'mixed', drills: buildMixedSession(levels, rng, SESSION_LENGTH), answers: [], startedAt: now };
  const drills =
    key === 'scenario'
      ? buildScenarioDrills(levels.scenario, SESSION_LENGTH, rng)
      : buildDrills(key, levels[key], SESSION_LENGTH, rng);
  return { mode: 'single', drillType: key, drills, answers: [], startedAt: now };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'start') return { session: startSession(action.key, action.now, action.levels), current: 0, shownAt: action.now };
  const { session, current } = state;
  const drill = session?.drills[current];
  if (!session || !drill || session.finishedAt) return state;
  const answered = session.answers.length > current;

  if (action.type === 'timeout') {
    if (answered) return state;
    const answer: Answer = { drillId: drill.id, chosenOptionId: '', correct: false, timeMs: action.now - state.shownAt };
    return { ...state, session: { ...session, answers: [...session.answers, answer] } };
  }

  if (action.type === 'answer') {
    const option = drill.options.find((candidate) => candidate.id === action.optionId);
    if (answered || !option) return state;
    const answer: Answer = { drillId: drill.id, chosenOptionId: option.id, correct: option.isCorrect, timeMs: action.now - state.shownAt };
    const counted = option.value;
    const drills =
      session.mode === 'stepChain' && drill.type === 'outs' && typeof counted === 'number'
        ? session.drills.map((step, index) => (index === current + 1 ? hitChanceStep(step, counted, mulberry32(action.now)) : step))
        : session.drills;
    return { ...state, session: { ...session, drills, answers: [...session.answers, answer] } };
  }

  if (!answered) return state;
  if (current + 1 >= session.drills.length) return { ...state, session: { ...session, finishedAt: action.now } };
  return { ...state, current: current + 1, shownAt: action.now };
}
