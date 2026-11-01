// High performance, zero-dependency confetti cannon using HTML5 Canvas
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'square' | 'circle' | 'star';
}

const COLORS = ['#58cc02', '#ff9600', '#1cb0f6', '#ff4b4b', '#ffc800', '#ce82ff', '#2ce2a8'];

export function launchConfetti(opts?: { durationMs?: number; particleCount?: number }) {
  if (typeof window === 'undefined') return;

  const duration = opts?.durationMs ?? 2500;
  const count = opts?.particleCount ?? 80;

  let canvas = document.getElementById('temukata-confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'temukata-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // Launch from center-bottom or left/right
    const fromX = width * (0.3 + Math.random() * 0.4);
    const fromY = height * 0.7;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 10 + Math.random() * 18;

    particles.push({
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'square' : Math.random() > 0.5 ? 'circle' : 'star',
    });
  }

  const startTime = performance.now();

  function render(time: number) {
    if (!ctx || !canvas) return;
    const elapsed = time - startTime;
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.vx *= 0.98; // Air drag
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Star shape
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size);
          ctx.lineTo(Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2));
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    if (elapsed < duration) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      canvas.remove();
    }
  }

  requestAnimationFrame(render);
}
