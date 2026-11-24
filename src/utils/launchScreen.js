export function dismissLaunchScreen() {
  const screen = document.getElementById('app-launch-screen');
  if (!screen || screen.dataset.dismissed) return;
  screen.dataset.dismissed = 'true';
  screen.setAttribute('aria-hidden', 'true');
  screen.classList.add('launch-complete');
  window.setTimeout(() => screen.remove(), 300);
}
