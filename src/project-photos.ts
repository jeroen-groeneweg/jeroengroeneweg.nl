/** Enhance project photos without changing their source files or the video. */
export function mountImages(root: HTMLElement): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-modal';
  dialog.setAttribute('aria-label', 'Enlarged project photo');
  dialog.innerHTML = `<button type="button" class="photo-modal-close" aria-label="Close enlarged photo" autofocus>Close ×</button><figure><img alt="" /><figcaption></figcaption></figure>`;
  document.body.append(dialog);
  const large = dialog.querySelector<HTMLImageElement>('img')!;
  const caption = dialog.querySelector<HTMLElement>('figcaption')!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('button')!;
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    // The close button is the modal's only control. Keep keyboard focus inside
    // the native dialog even in browsers that do not cycle it automatically.
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('photo-modal-open'));
  root.querySelectorAll<HTMLImageElement>('.arcade img, .game-screenshot img, .home-story img').forEach(photo => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-photo';
    button.setAttribute('aria-label', `Enlarge photo: ${photo.alt}`);
    button.setAttribute('aria-haspopup', 'dialog');
    photo.replaceWith(button);
    button.append(photo);
    button.addEventListener('click', () => {
      large.src = photo.currentSrc || photo.src;
      large.alt = photo.alt;
      caption.textContent = photo.closest('figure')?.querySelector('figcaption')?.textContent || photo.alt;
      document.body.classList.add('photo-modal-open');
      dialog.showModal();
      closeButton.focus();
    });
  });
}
