export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  completeOn?: 'next' | 'hire_party' | 'start_quest' | 'buy_upgrade' | 'quest_done';
  upgradeId?: string;
}

import { trackEvent } from './Analytics.ts';

export class TutorialManager {
  private stepIndex = 0;
  private completed = false;
  private readonly storageKey: string;
  private readonly steps: TutorialStep[];

  constructor(themeId: string, steps: TutorialStep[]) {
    this.storageKey = `game-lab-tutorial-${themeId}`;
    this.steps = steps;
    this.load();
  }

  get active(): boolean {
    return !this.completed && this.stepIndex < this.steps.length;
  }

  get current(): TutorialStep | null {
    if (!this.active) return null;
    return this.steps[this.stepIndex];
  }

  get progress(): { current: number; total: number } {
    return { current: Math.min(this.stepIndex + 1, this.steps.length), total: this.steps.length };
  }

  advance(): void {
    if (this.completed) return;
    this.stepIndex++;
    if (this.stepIndex >= this.steps.length) {
      this.completed = true;
      trackEvent({ type: 'tutorial_complete' });
    }
    this.save();
  }

  skip(): void {
    trackEvent({ type: 'tutorial_skip', step: this.stepIndex });
    this.completed = true;
    this.save();
  }

  reset(): void {
    this.stepIndex = 0;
    this.completed = false;
    localStorage.removeItem(this.storageKey);
  }

  notify(action: string, data?: { upgradeId?: string }): void {
    const step = this.current;
    if (!step?.completeOn || step.completeOn === 'next') return;

    if (step.completeOn === action) {
      if (action === 'buy_upgrade' && step.upgradeId && data?.upgradeId !== step.upgradeId) return;
      this.advance();
    }
  }

  checkQuestDone(hasActiveQuest: boolean, hadQuest: boolean): void {
    const step = this.current;
    if (step?.completeOn === 'quest_done' && !hasActiveQuest && hadQuest) {
      this.advance();
    }
  }

  private load(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { completed: boolean; stepIndex: number };
      this.completed = parsed.completed;
      this.stepIndex = parsed.stepIndex;
    } catch {
      /* fresh tutorial */
    }
  }

  private save(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({ completed: this.completed, stepIndex: this.stepIndex }),
    );
  }
}