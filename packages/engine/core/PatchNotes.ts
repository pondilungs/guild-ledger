const prefix = 'game-lab-patch-notes-seen-';

/** @deprecated Use shouldShowPatchNotes */
export const shouldShowUpdateBanner = shouldShowPatchNotes;

/** @deprecated Use dismissPatchNotes */
export const dismissUpdateBanner = dismissPatchNotes;

export function shouldShowPatchNotes(version: string | undefined): boolean {
  if (!version) return false;
  return localStorage.getItem(`${prefix}${version}`) !== '1';
}

export function dismissPatchNotes(version: string): void {
  localStorage.setItem(`${prefix}${version}`, '1');
}