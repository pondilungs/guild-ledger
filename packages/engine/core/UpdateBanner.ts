const prefix = 'game-lab-banner-seen-';

export function shouldShowUpdateBanner(version: string | undefined): boolean {
  if (!version) return false;
  return localStorage.getItem(`${prefix}${version}`) !== '1';
}

export function dismissUpdateBanner(version: string): void {
  localStorage.setItem(`${prefix}${version}`, '1');
}