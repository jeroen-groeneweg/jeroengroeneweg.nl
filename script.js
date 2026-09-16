const particles = document.querySelector('.particles');

for (let index = 0; index < 24; index += 1) {
  const particle = document.createElement('span');
  particle.className = 'particle';
  particle.style.left = `${(index * 43 + 7) % 100}%`;
  particle.style.top = `${(index * 29 + 11) % 100}%`;
  particle.style.animationDelay = `${(index % 8) * -0.7}s`;
  particles.append(particle);
}

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (hero && !reduceMotion.matches) {
  let frameId;

  const updateHeroParallax = () => {
    const scrollDistance = Math.min(window.scrollY, hero.offsetHeight);
    hero.style.setProperty('--hero-copy-parallax', `${scrollDistance * -0.14}px`);
    hero.style.setProperty('--hero-portrait-parallax', `${scrollDistance * 0.06}px`);
    hero.style.setProperty('--hero-violet-x-parallax', `${scrollDistance * -0.05}px`);
    hero.style.setProperty('--hero-violet-y-parallax', `${scrollDistance * 0.28}px`);
    hero.style.setProperty('--hero-green-x-parallax', `${scrollDistance * 0.04}px`);
    hero.style.setProperty('--hero-green-y-parallax', `${scrollDistance * -0.18}px`);
    hero.style.setProperty('--hero-grid-parallax', `${scrollDistance * 0.12}px`);
    frameId = undefined;
  };

  const requestHeroParallax = () => {
    if (!frameId) {
      frameId = window.requestAnimationFrame(updateHeroParallax);
    }
  };

  window.addEventListener('scroll', requestHeroParallax, { passive: true });
  window.addEventListener('resize', requestHeroParallax);
  updateHeroParallax();
}

const projectData = {
  arcade: {
    className: 'arcade',
    label: 'Making · Hardware',
    title: 'Arcade cabinets',
    detail: 'From scratch: the physical build, the electronics and the experience of bringing a classic machine to life.',
  },
  games: {
    className: 'games',
    label: 'Making · Software',
    title: 'Game development',
    detail: 'An enduring interest in the craft of interactive software, from the systems behind a game to the moment it feels right to play.',
  },
  home: {
    className: 'home',
    label: 'Making · Automation',
    title: 'Smart-home systems',
    detail: 'Advanced home automation as a living laboratory for connected devices, software and practical engineering decisions.',
  },
};

const projectPanel = document.querySelector('#project-panel');
const projectVisual = projectPanel.querySelector('.project-visual');
const projectText = projectPanel.querySelector('.project-text');

document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projectData[button.dataset.project];
    document.querySelectorAll('[data-project]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-selected', String(item === button));
    });
    projectPanel.className = `project-card ${project.className}`;
    projectVisual.innerHTML = '<i></i><i></i><i></i>';
    projectText.innerHTML = `<p>${project.label}</p><h3>${project.title}</h3><span>${project.detail}</span>`;
  });
});
