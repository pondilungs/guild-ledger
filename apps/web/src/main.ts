import './style.css';
import { GameEngine, mountGameUI } from '@game-lab/engine';
import { guildLedgerTheme } from '../../../themes/guild-ledger/config.ts';
import * as flavor from '../../../themes/guild-ledger/flavor.ts';
import { guildLedgerTutorial } from '../../../themes/guild-ledger/tutorial.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
const engine = new GameEngine(guildLedgerTheme, flavor);

mountGameUI(engine, app, guildLedgerTutorial);
engine.start();

window.addEventListener('beforeunload', () => engine.stop());

// itch.io iframe: prevent arrow/space from scrolling the page
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});