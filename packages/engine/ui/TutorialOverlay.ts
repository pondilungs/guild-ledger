import type { TutorialManager } from '../core/TutorialManager.ts';
import type { GameLocale } from '../i18n/types.ts';

export function renderTutorialOverlay(tutorial: TutorialManager, ui: GameLocale['ui']): string {
  if (!tutorial.active) return '';
  const step = tutorial.current!;
  const { current, total } = tutorial.progress;

  return `
    <div class="tutorial-overlay" role="dialog" aria-label="Tutorial">
      <div class="tutorial-card">
        <div class="tutorial-header">
          <span class="tutorial-step">${current}/${total}</span>
          <button class="tutorial-skip" data-action="tutorial-skip" type="button">${ui.tutorialSkip}</button>
        </div>
        <h3 class="tutorial-title">${step.title}</h3>
        <p class="tutorial-body">${step.body}</p>
        ${step.completeOn === 'next' ? `
          <button class="btn btn-primary tutorial-next" data-action="tutorial-next" type="button">
            ${step.id === 'done' ? ui.tutorialStart : ui.tutorialGotIt}
          </button>
        ` : `
          <p class="tutorial-wait">${ui.tutorialWait}</p>
        `}
      </div>
    </div>
  `;
}

export function applyTutorialHighlight(root: HTMLElement, target?: string): void {
  root.querySelectorAll('[data-tutorial-target]').forEach((el) => {
    el.classList.remove('tutorial-highlight');
  });
  if (!target) return;
  root.querySelector(`[data-tutorial-target="${target}"]`)?.classList.add('tutorial-highlight');
}