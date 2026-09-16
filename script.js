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
