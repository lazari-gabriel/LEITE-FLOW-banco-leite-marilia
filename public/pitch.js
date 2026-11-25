(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  let currentSlide = 0;

  const progressEl = document.getElementById('progress');
  const counterEl = document.getElementById('counter');
  const dotsContainer = document.getElementById('dotsContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Gerar pontos de navegação direta
  const dots = [];
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `slide-dot${i === 0 ? ' active' : ''}`;
    dot.title = `Ir para slide ${i + 1}`;
    dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
    dot.addEventListener('click', () => updateSlide(i));
    dotsContainer.appendChild(dot);
    dots.push(dot);
  }

  function updateSlide(index) {
    const clamped = Math.max(0, Math.min(totalSlides - 1, index));
    currentSlide = clamped;

    slides.forEach((slide, idx) => {
      const active = idx === currentSlide;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) {
        slide.scrollTop = 0;
      }
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });

    const percentage = ((currentSlide + 1) / totalSlides) * 100;
    progressEl.style.width = `${percentage}%`;
    counterEl.textContent = `${currentSlide + 1} / ${totalSlides}`;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
  }

  prevBtn.addEventListener('click', () => updateSlide(currentSlide - 1));
  nextBtn.addEventListener('click', () => updateSlide(currentSlide + 1));

  // ==========================================
  // CRONÔMETRO DE 5 MINUTOS (P iniciar/pausar | R resetar)
  // ==========================================
  const INITIAL_SECONDS = 5 * 60;
  let timerTotalSeconds = INITIAL_SECONDS;
  let timerInterval = null;
  let isTimerRunning = false;

  const timerText = document.getElementById('timerText');
  const timerBtn = document.getElementById('timerBtn');

  function updateTimerDisplay() {
    const mins = Math.floor(timerTotalSeconds / 60);
    const secs = timerTotalSeconds % 60;
    timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerText.style.color = timerTotalSeconds <= 60 ? '#ef4444' : '';
  }

  function toggleTimer() {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      timerBtn.style.opacity = '0.75';
    } else {
      if (timerTotalSeconds === 0) {
        timerTotalSeconds = INITIAL_SECONDS;
        updateTimerDisplay();
      }
      isTimerRunning = true;
      timerBtn.style.opacity = '1';
      timerInterval = setInterval(() => {
        if (timerTotalSeconds > 0) {
          timerTotalSeconds -= 1;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerTotalSeconds = INITIAL_SECONDS;
    timerBtn.style.opacity = '1';
    updateTimerDisplay();
  }

  timerBtn.addEventListener('click', toggleTimer);

  // ==========================================
  // MODO CLARO / ESCURO (TECLA T)
  // ==========================================
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    themeIcon.textContent = isLight ? '🌙' : '☀️';
    themeText.textContent = isLight ? 'Modo Escuro' : 'Modo Claro';
  }

  function toggleTheme() {
    const isLight = !document.body.classList.contains('light-mode');
    applyTheme(isLight);
    try {
      localStorage.setItem('leite_flow_theme', isLight ? 'light' : 'dark');
    } catch {
      // Ignora ambientes sem storage
    }
  }

  themeToggle.addEventListener('click', toggleTheme);

  try {
    if (localStorage.getItem('leite_flow_theme') === 'light') {
      applyTheme(true);
    }
  } catch {
    // Mantém tema escuro padrão
  }

  // ==========================================
  // ATALHOS DE TECLADO (← → Espaço Home End 1-5 T P R)
  // ==========================================
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      updateSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      updateSlide(currentSlide - 1);
    } else if (e.key === 'Home') {
      updateSlide(0);
    } else if (e.key === 'End') {
      updateSlide(totalSlides - 1);
    } else if (e.key.toLowerCase() === 't') {
      toggleTheme();
    } else if (e.key.toLowerCase() === 'p') {
      toggleTimer();
    } else if (e.key.toLowerCase() === 'r') {
      resetTimer();
    } else if (e.key >= '1' && e.key <= String(totalSlides)) {
      updateSlide(Number(e.key) - 1);
    }
  });

  // ==========================================
  // TOUCH SWIPE EM CELULARES E TABLETS
  // ==========================================
  let touchStartX = 0;
  let touchStartY = 0;

  window.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
        updateSlide(diffX < 0 ? currentSlide + 1 : currentSlide - 1);
      }
    },
    { passive: true }
  );

  updateSlide(0);
})();
