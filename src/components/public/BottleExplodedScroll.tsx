import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronDown,
  Heart,
  Truck,
  ShieldCheck,
  Sparkles,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';

const TOTAL_FRAMES = 108;
const MAX_RETRY_ATTEMPTS = 2;

const FRAME_URLS = Array.from({ length: TOTAL_FRAMES }, (_, index) => {
  const num = String(index + 1).padStart(3, '0');
  return `${import.meta.env.BASE_URL}frames/ezgif-frame-${num}.jpg`;
});

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

interface OverlayMotion {
  opacity: number;
  translateY: number;
}

function getOverlayMotion(
  progress: number,
  [inStart, inEnd, outStart, outEnd]: [number, number, number, number]
): OverlayMotion {
  let opacity = 0;
  let translateY = 26;

  if (inStart === 0 && inEnd === 0 && progress <= outStart) {
    opacity = 1;
    translateY = 0;
  } else if (progress >= inStart && progress < inEnd) {
    const t = clamp01((progress - inStart) / (inEnd - inStart));
    const eased = t * t * (3 - 2 * t);
    opacity = eased;
    translateY = (1 - eased) * 28;
  } else if (progress >= inEnd && progress <= outStart) {
    opacity = 1;
    translateY = 0;
  } else if (progress > outStart && progress <= outEnd) {
    const t = clamp01((progress - outStart) / (outEnd - outStart));
    const eased = t * t * (3 - 2 * t);
    opacity = 1 - eased;
    translateY = -eased * 22;
  }

  return { opacity, translateY };
}

const HIGHLIGHTS = [
  {
    icon: Heart,
    title: 'Acolhimento à doadora',
    description:
      'Orientação clara desde a manifestação de interesse até o acompanhamento contínuo pela equipe de saúde.',
  },
  {
    icon: Truck,
    title: 'Logística de coleta',
    description:
      'Planejamento de rotas nas regiões atendidas em Marília, com monitoramento térmico durante o transporte.',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade e pasteurização',
    description:
      'Registro organizado das análises laboratoriais, da pasteurização e do controle de estoque.',
  },
  {
    icon: Sparkles,
    title: 'Rastreabilidade completa',
    description:
      'Identificação individual de cada frasco com código de barras e QR Code, da coleta à dispensação.',
  },
];

interface BottleExplodedScrollProps {
  isAuthenticated: boolean;
  onAccessSystem: () => void;
  onBecomeDonor: () => void;
}

export const BottleExplodedScroll: React.FC<BottleExplodedScrollProps> = ({
  isAuthenticated,
  onAccessSystem,
  onBecomeDonor,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const loadedFlagsRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const lastDrawnKeyRef = useRef(-1);
  const lastTickTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const drawFrame = useCallback((exactFrame: number, allowSubframeBlend = false): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return false;

    const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, exactFrame));
    const idxA = Math.floor(clamped);
    const idxB = Math.min(TOTAL_FRAMES - 1, idxA + 1);
    const frac = clamped - idxA;

    const resolveLoaded = (frameIndex: number): HTMLImageElement | null => {
      if (loadedFlagsRef.current[frameIndex]) return imagesRef.current[frameIndex];
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        if (frameIndex - offset >= 0 && loadedFlagsRef.current[frameIndex - offset]) {
          return imagesRef.current[frameIndex - offset];
        }
        if (frameIndex + offset < TOTAL_FRAMES && loadedFlagsRef.current[frameIndex + offset]) {
          return imagesRef.current[frameIndex + offset];
        }
      }
      return null;
    };

    const imgA = resolveLoaded(allowSubframeBlend ? idxA : Math.round(clamped));
    if (!imgA || !imgA.naturalWidth || !imgA.naturalHeight) return false;

    const imgB =
      allowSubframeBlend && frac > 0.01 && frac < 0.99 && idxB !== idxA && loadedFlagsRef.current[idxB]
        ? imagesRef.current[idxB]
        : null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = canvas.clientWidth || stageRef.current?.clientWidth || 0;
    const displayHeight = canvas.clientHeight || stageRef.current?.clientHeight || 0;
    if (displayWidth === 0 || displayHeight === 0) return false;

    const targetW = Math.round(displayWidth * dpr);
    const targetH = Math.round(displayHeight * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Preserva proporção original 16:9 sem corte e sem perda de qualidade
    const imgRatio = imgA.naturalWidth / imgA.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasRatio > imgRatio) {
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgA, offsetX, offsetY, drawWidth, drawHeight);

    if (imgB && imgB.naturalWidth && imgB.naturalHeight) {
      const smoothAlpha = frac * frac * (3 - 2 * frac);
      ctx.globalAlpha = smoothAlpha;
      ctx.drawImage(imgB, offsetX, offsetY, drawWidth, drawHeight);
      ctx.globalAlpha = 1;
    }

    // Fusão suave das bordas com o fundo branco de estúdio
    const featherX = drawWidth * 0.08;
    const featherY = drawHeight * 0.08;

    const topGrad = ctx.createLinearGradient(0, offsetY, 0, offsetY + featherY);
    topGrad.addColorStop(0, '#FFFFFF');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(offsetX, offsetY, drawWidth, featherY);

    const bottomGrad = ctx.createLinearGradient(0, offsetY + drawHeight - featherY, 0, offsetY + drawHeight);
    bottomGrad.addColorStop(0, 'rgba(255,255,255,0)');
    bottomGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(offsetX, offsetY + drawHeight - featherY, drawWidth, featherY);

    const leftGrad = ctx.createLinearGradient(offsetX, 0, offsetX + featherX, 0);
    leftGrad.addColorStop(0, '#FFFFFF');
    leftGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(offsetX, offsetY, featherX, drawHeight);

    const rightGrad = ctx.createLinearGradient(offsetX + drawWidth - featherX, 0, offsetX + drawWidth, 0);
    rightGrad.addColorStop(0, 'rgba(255,255,255,0)');
    rightGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(offsetX + drawWidth - featherX, offsetY, featherX, drawHeight);

    return true;
  }, []);

  // Carregamento progressivo de alta qualidade com retry automático e priorização por keyframes
  useEffect(() => {
    let isCancelled = false;

    const loadSingle = (index: number, attempt = 0): Promise<void> =>
      new Promise((resolve) => {
        if (isCancelled || loadedFlagsRef.current[index]) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = 'async';
        img.src =
          attempt === 0
            ? FRAME_URLS[index]
            : `${FRAME_URLS[index]}?retry=${attempt}`;

        const onReady = () => {
          if (isCancelled) {
            resolve();
            return;
          }
          imagesRef.current[index] = img;
          loadedFlagsRef.current[index] = true;
          lastDrawnKeyRef.current = -1;
          if (index === 0) {
            const painted = drawFrame(currentFrameRef.current, false);
            setFirstFrameReady(true);
            if (!painted) {
              window.requestAnimationFrame(() => {
                if (!isCancelled) {
                  lastDrawnKeyRef.current = -1;
                  drawFrame(currentFrameRef.current, false);
                }
              });
            }
          }
          resolve();
        };

        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(onReady).catch(onReady);
          } else {
            onReady();
          }
        };

        img.onerror = () => {
          if (!isCancelled && attempt < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => {
              void loadSingle(index, attempt + 1).then(resolve);
            }, 350 * (attempt + 1));
          } else {
            resolve();
          }
        };
      });

    const preloadAll = async () => {
      await loadSingle(0);
      if (isCancelled) return;

      // Keyframes a cada 4 quadros primeiro para resposta imediata durante o scroll, depois quadros intermediários
      const keyframes: number[] = [];
      const rest: number[] = [];
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        if (i % 4 === 0 || i === TOTAL_FRAMES - 1) keyframes.push(i);
        else rest.push(i);
      }

      const ordered = [...keyframes, ...rest];
      const CONCURRENCY = 6;
      let cursor = 0;

      const worker = async () => {
        while (!isCancelled && cursor < ordered.length) {
          const nextIdx = ordered[cursor++];
          await loadSingle(nextIdx);
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    };

    void preloadAll();
    return () => {
      isCancelled = true;
    };
  }, [drawFrame]);

  // Garante redesenho HiDPI nítido assim que o container mudar de tamanho ou o 1º frame ficar pronto
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      lastDrawnKeyRef.current = -1;
      drawFrame(currentFrameRef.current, false);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [drawFrame]);

  useEffect(() => {
    if (firstFrameReady) {
      lastDrawnKeyRef.current = -1;
      drawFrame(currentFrameRef.current, false);
    }
  }, [firstFrameReady, drawFrame]);

  // Loop suave de scroll-scrubbing em 60fps
  useEffect(() => {
    const computeProgress = (): number => {
      const section = sectionRef.current;
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp01(-rect.top / scrollable);
    };

    const handleScroll = () => {
      const p = computeProgress();
      const animProgress = clamp01(p / 0.92);
      targetFrameRef.current = animProgress * (TOTAL_FRAMES - 1);
      setProgress(p);
    };

    const handleResize = () => {
      lastDrawnKeyRef.current = -1;
      handleScroll();
      drawFrame(currentFrameRef.current, false);
    };

    const tick = (now: number) => {
      const prev = lastTickTimeRef.current || now;
      lastTickTimeRef.current = now;
      const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));

      const diff = targetFrameRef.current - currentFrameRef.current;
      let isMoving = false;

      if (prefersReducedMotion || Math.abs(diff) <= 0.01) {
        currentFrameRef.current = targetFrameRef.current;
      } else {
        const damping = 1 - Math.exp(-dt * 6.5);
        currentFrameRef.current += diff * damping;
        isMoving = true;
      }

      const clamped = Math.min(TOTAL_FRAMES - 1, Math.max(0, currentFrameRef.current));
      const drawKey = isMoving ? Math.round(clamped * 24) : Math.round(clamped) * 24;

      if (drawKey !== lastDrawnKeyRef.current) {
        const painted = drawFrame(
          isMoving ? clamped : Math.round(clamped),
          isMoving && !prefersReducedMotion
        );
        if (painted) {
          lastDrawnKeyRef.current = drawKey;
        }
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    handleScroll();
    rafIdRef.current = window.requestAnimationFrame(tick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (rafIdRef.current !== null) window.cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawFrame, prefersReducedMotion]);

  const heroOverlay = getOverlayMotion(progress, [0.0, 0.0, 0.11, 0.17]);
  const midOverlay1 = getOverlayMotion(progress, [0.22, 0.28, 0.42, 0.48]);
  const midOverlay2 = getOverlayMotion(progress, [0.53, 0.59, 0.72, 0.78]);
  const closingOverlay = getOverlayMotion(progress, [0.81, 0.87, 0.98, 1.0]);

  return (
    <div id="historia-leiteflow" className="bg-white">
      {/* FULLSCREEN CINEMATIC SCROLL-VIDEO STAGE */}
      <section
        ref={sectionRef}
        aria-label="Experiência visual interativa LEITFLOW"
        className="relative w-full bg-white h-[480vh] sm:h-[520vh]"
      >
        <div
          ref={stageRef}
          className="sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-full bg-white overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {!firstFrameReady && !posterFailed && (
              <img
                src={FRAME_URLS[0]}
                alt="Frasco de leite materno LEITFLOW"
                loading="eager"
                decoding="async"
                onError={() => setPosterFailed(true)}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            )}
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={`w-full h-full block transition-opacity duration-300 ${
                firstFrameReady ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            />
          </div>

          {/* 01 — Opening Hero Typography Overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between pt-4 pb-3 sm:pt-5 sm:pb-4 px-4 text-center pointer-events-none select-none will-change-transform"
            style={{
              opacity: heroOverlay.opacity,
              transform: `translate3d(0, ${heroOverlay.translateY}px, 0)`,
              visibility: heroOverlay.opacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <div className="space-y-1 sm:space-y-1.5 max-w-3xl px-4 py-1.5 rounded-2xl bg-white/75 backdrop-blur-[2px]">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.26em] text-[#4A6B5D]">
                Apoio à gestão do Banco de Leite Humano • Marília – SP
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-none font-normal tracking-tight text-[#1E242B]">
                LEITFLOW
              </h1>
              <p className="text-xs sm:text-sm tracking-[0.02em] text-[#1E242B]/80 max-w-2xl mx-auto">
                Tecnologia, organização e rastreabilidade a serviço da doação de leite humano.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/88 backdrop-blur-sm border border-[#EFECE6]/90 shadow-xs text-[11px] sm:text-xs tracking-[0.18em] uppercase text-[#6B737D]">
              <span>Role para explorar</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-[#4A6B5D]" />
            </div>
          </div>

          {/* 02 — Mid-Scroll Floating Headline */}
          <div
            className="absolute inset-x-0 bottom-10 sm:bottom-14 px-4 flex justify-center text-center pointer-events-none select-none will-change-transform"
            style={{
              opacity: midOverlay1.opacity,
              transform: `translate3d(0, ${midOverlay1.translateY}px, 0)`,
              visibility: midOverlay1.opacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <div className="max-w-xl px-6 py-4 rounded-3xl bg-white/80 backdrop-blur-md border border-[#EFECE6]/80 shadow-sm">
              <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] tracking-tight">
                Alimento essencial para recém-nascidos
              </h2>
              <p className="text-xs sm:text-sm text-[#1E242B]/75 mt-1.5 leading-relaxed">
                O leite humano doado oferece proteção imunológica e nutrição adequada para bebês
                prematuros ou de baixo peso internados em unidades neonatais.
              </p>
            </div>
          </div>

          {/* 03 — Mid-Scroll Floating Headline */}
          <div
            className="absolute inset-x-0 bottom-10 sm:bottom-14 px-4 flex justify-center text-center pointer-events-none select-none will-change-transform"
            style={{
              opacity: midOverlay2.opacity,
              transform: `translate3d(0, ${midOverlay2.translateY}px, 0)`,
              visibility: midOverlay2.opacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <div className="max-w-xl px-6 py-4 rounded-3xl bg-white/80 backdrop-blur-md border border-[#EFECE6]/80 shadow-sm">
              <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] tracking-tight">
                Logística organizada com cuidado
              </h2>
              <p className="text-xs sm:text-sm text-[#1E242B]/75 mt-1.5 leading-relaxed">
                Da orientação inicial à coleta domiciliar em cadeia de frio monitorada, cada etapa
                é planejada para dar praticidade à doadora e segurança ao leite coletado.
              </p>
            </div>
          </div>

          {/* 04 — Closing CTA Overlay */}
          <div
            className="absolute inset-x-0 bottom-8 sm:bottom-12 px-4 flex justify-center text-center will-change-transform"
            style={{
              opacity: closingOverlay.opacity,
              transform: `translate3d(0, ${closingOverlay.translateY}px, 0)`,
              pointerEvents: closingOverlay.opacity > 0.35 ? 'auto' : 'none',
              visibility: closingOverlay.opacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <div className="max-w-lg px-7 py-5 rounded-3xl bg-white/88 backdrop-blur-md border border-[#EFECE6] shadow-lg space-y-3.5">
              <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] tracking-tight">
                Cuidado acompanhado de ponta a ponta
              </h2>
              <p className="text-xs sm:text-sm text-[#1E242B]/75 leading-relaxed">
                Manifeste seu interesse em se tornar doadora ou acesse a área restrita para a
                equipe técnica do serviço.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onBecomeDonor}
                  className="px-7 py-3 rounded-full bg-[#4A6B5D] text-white font-medium text-xs sm:text-sm hover:bg-[#3d594d] transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <Heart className="w-4 h-4 fill-white/25" />
                  <span>Quero ser doadora</span>
                </button>
                <button
                  type="button"
                  onClick={onAccessSystem}
                  className="px-6 py-3 rounded-full bg-white text-[#1E242B] font-medium text-xs sm:text-sm border border-[#EFECE6] hover:border-[#4A6B5D]/40 hover:text-[#4A6B5D] transition-all flex items-center gap-2"
                >
                  {isAuthenticated ? (
                    <>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Acessar Meu Painel</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Acessar sistema</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MINIMALIST 4-CARD FEATURE STRIP + SUBTLE MARQUEE */}
      <section className="relative overflow-hidden bg-[#FAF9F6] border-y border-[#EFECE6] pt-16 sm:pt-24 pb-10 sm:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-[#1E242B] tracking-tight">
              Organização e segurança em cada etapa
            </h2>
            <p className="text-sm sm:text-base text-[#8C8275] mt-2">
              Como a estrutura do serviço e o apoio tecnológico atuam juntos para proteger o leite
              doado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 border border-[#EFECE6] hover:border-[#4A6B5D]/30 transition-all shadow-sm hover:shadow-md flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-medium text-[#1E242B]">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8C8275] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle Oversized Kinetic Background Marquee */}
        <div
          aria-hidden="true"
          className="mt-14 sm:mt-16 overflow-hidden select-none pointer-events-none opacity-[0.06]"
        >
          <div className="animate-leiteflow-marquee whitespace-nowrap font-display text-5xl sm:text-7xl lg:text-8xl tracking-[0.08em] text-[#1E242B] uppercase">
            <span className="mx-8">
              • LEITFLOW • CADA GOTA CARREGA VIDA • BANCO DE LEITE HUMANO • MARÍLIA
            </span>
            <span className="mx-8">
              • LEITFLOW • CADA GOTA CARREGA VIDA • BANCO DE LEITE HUMANO • MARÍLIA
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
