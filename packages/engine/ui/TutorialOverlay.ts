import type { TutorialManager } from '../core/TutorialManager.ts';

export function renderTutorialOverlay(tutorial: TutorialManager): string {
  if (!tutorial.active) return '';
  const step = tutorial.current!;
  const { current, total } = tutorial.progress;

  return `
    <div class="tutorial-overlay" role="dialog" aria-label="Tutorial">
      <div class="tutorial-card">
        <div class="tutorial-header">
          <span class="tutorial-step">${current}/${total}</span>
          <button class="tutorial-skip" data-action="tutorial-skip" type="button">Atla</button>
        </div>
        <h3 class="tutorial-title">${step.title}</h3>
        <p class="tutorial-body">${step.body}</p>
        ${step.completeOn === 'next' ? `
          <button class="btn btn-primary tutorial-next" data-action="tutorial-next" type="button">
            ${step.id === 'done' ? 'Başla!' : 'Anladım'}
          </button>
        ` : `
          <p class="tutorial-wait">Görevi tamamla...</p>
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