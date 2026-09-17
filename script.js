// Native details names keep one year and one chapter open. Reset nested
// chapters when their year closes so reopening a year starts at its overview.
document.querySelectorAll('.story-year').forEach((year) => {
  year.addEventListener('toggle', () => {
    if (!year.open) {
      year.querySelectorAll('details[open]').forEach((chapter) => {
        chapter.open = false;
      });
    }
  });
});

// Wait for sibling content to close and the layout to settle before
// placing the newly opened heading below the fixed navigation.
document.querySelectorAll('.story-year, .story-chapter').forEach((section) => {
  section.addEventListener('toggle', () => {
    if (!section.open) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!section.open || !section.closest('.story-year').open) return;
        const summary = section.querySelector(':scope > summary');
        const nav = document.querySelector('.nav');
        const offset = (nav ? nav.getBoundingClientRect().height : 0) + 16;
        window.scrollTo({
          top: window.scrollY + summary.getBoundingClientRect().top - offset,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
      });
    });
  });
});

const particles = document.querySelector('.particles');
const particleCount = 64;

for (let index = 0; index < particleCount; index += 1) {
  const particle = document.createElement('span');
  const size = 2 + Math.random() * 5;

  particle.className = 'particle';
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.opacity = `${0.25 + Math.random() * 0.5}`;
  particle.style.animationDelay = `${Math.random() * -9}s`;
  particle.style.animationDuration = `${4 + Math.random() * 7}s`;
  particle.style.setProperty('--particle-drift-x', `${-22 + Math.random() * 44}px`);
  particle.style.setProperty('--particle-drift-y', `${-42 + Math.random() * 28}px`);
  particle.style.setProperty('--particle-highlight', `${0.65 + Math.random() * 0.35}`);
  particle.style.setProperty('--particle-scale', `${0.8 + Math.random() * 0.8}`);
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

const navigation = document.querySelector('.nav');

if (navigation) {
  const updateNavigation = () => {
    navigation.classList.toggle('is-scrolled', window.scrollY > 48);
  };

  window.addEventListener('scroll', updateNavigation, { passive: true });
  updateNavigation();
}

const hero = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (hero && !reduceMotion.matches) {
  let frameId;

  const updateHeroParallax = () => {
    const scrollDistance = Math.min(window.scrollY, hero.offsetHeight);
    hero.style.setProperty('--hero-copy-parallax', `${scrollDistance * -0.14}px`);
    hero.style.setProperty('--hero-portrait-parallax', `${scrollDistance * 0.36}px`);
    hero.style.setProperty('--hero-violet-x-parallax', `${scrollDistance * -0.1}px`);
    hero.style.setProperty('--hero-violet-y-parallax', `${scrollDistance * 0.42}px`);
    hero.style.setProperty('--hero-green-x-parallax', `${scrollDistance * 0.08}px`);
    hero.style.setProperty('--hero-green-y-parallax', `${scrollDistance * -0.28}px`);
    hero.style.setProperty('--hero-grid-parallax', `${scrollDistance * 0.2}px`);
    hero.style.setProperty('--hero-portrait-shape-x-parallax', `${scrollDistance * 0.06}px`);
    hero.style.setProperty('--hero-portrait-shape-y-parallax', `${scrollDistance * -0.22}px`);
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
