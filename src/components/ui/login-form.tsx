"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { ArrowRight, Lock, User } from "lucide-react";

// Vertex shader: a single full-screen quad.
const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Fragment shader: the wavy, smokey glow, nudged by the mouse position.
const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float time = iTime * 0.5;

    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

interface SmokeyBackgroundProps {
  backdropBlurAmount?: BlurSize;
  /** Hex colour, e.g. "#3347ff". */
  color?: string;
  className?: string;
}

const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.substring(1, 3), 16) / 255,
  parseInt(hex.substring(3, 5), 16) / 255,
  parseInt(hex.substring(5, 7), 16) / 255,
];

/**
 * Interactive WebGL smoke background. The GL program is set up once per colour; mouse
 * position lives in a ref so moving the pointer never rebuilds it. Under reduced motion
 * it draws a single still frame.
 */
export function SmokeyBackground({
  backdropBlurAmount = "sm",
  color = "#3347ff",
  className = "",
}: SmokeyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return; // No WebGL: the page background colour shows instead.

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform3f(uColorLocation, ...hexToRgb(color));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startTime = performance.now();
    let frame = 0;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, (performance.now() - startTime) / 1000);
      const mouse = mouseRef.current;
      gl.uniform2f(iMouseLocation, mouse ? mouse.x : width / 2, mouse ? height - mouse.y : height / 2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    };

    // Listen on the window so the effect still follows the pointer over the form.
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [color]);

  return (
    <div aria-hidden className={`absolute inset-0 h-full w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className={`absolute inset-0 ${blurClassMap[backdropBlurAmount]}`} />
    </div>
  );
}

type LoginState = { error?: string };

interface LoginFormProps {
  /** Server action that signs the user in. Returns { error } on failure, redirects on success. */
  action: (formData: FormData) => Promise<LoginState | void>;
  title?: string;
  subtitle?: string;
  emailLabel?: string;
  /** Hide the password field, e.g. for a one-time email link form. */
  showPassword?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  /** An error to show before the first submit, e.g. one passed back in the URL. */
  initialError?: string | null;
  forgotHref?: string;
  /** Rendered under the submit button, inside the card. */
  afterForm?: React.ReactNode;
  footer?: React.ReactNode;
}

const inputClass =
  "peer block w-full appearance-none border-0 border-b-2 border-white/40 bg-transparent px-0 py-2.5 text-sm text-white focus:border-[#6e7dff] focus:outline-none focus:ring-0";
const labelClass =
  "absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-[#b8bfcc] duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-[#9aa5ff]";

/** Glass sign-in card with floating labels, wired to a server action. */
export function LoginForm({
  action,
  title = "Welcome back",
  subtitle = "Sign in to continue",
  emailLabel = "Email address",
  showPassword = true,
  submitLabel = "Sign in",
  pendingLabel = "Signing in…",
  initialError = null,
  forgotHref,
  afterForm,
  footer,
}: LoginFormProps) {
  const id = useId();
  const [state, formAction, pending] = useActionState(
    async (_prev: LoginState, formData: FormData): Promise<LoginState> => (await action(formData)) ?? {},
    { error: initialError ?? undefined },
  );

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/15 bg-[#0a0e17]/60 p-8 shadow-2xl backdrop-blur-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-[#b8bfcc]">{subtitle}</p>
      </div>
      <form action={formAction} className="space-y-8">
        <div className="relative z-0">
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" className={inputClass} placeholder=" " required />
          <label htmlFor={`${id}-email`} className={labelClass}>
            <User className="-mt-1 mr-2 inline-block" size={16} aria-hidden />
            {emailLabel}
          </label>
        </div>
        {showPassword ? (
          <div className="relative z-0">
            <input id={`${id}-password`} name="password" type="password" autoComplete="current-password" className={inputClass} placeholder=" " required />
            <label htmlFor={`${id}-password`} className={labelClass}>
              <Lock className="-mt-1 mr-2 inline-block" size={16} aria-hidden />
              Password
            </label>
          </div>
        ) : null}

        {forgotHref ? (
          <div className="-mt-4 flex justify-end">
            <a href={forgotHref} className="text-xs text-[#b8bfcc] transition hover:text-white">
              Forgot password?
            </a>
          </div>
        ) : null}

        {state.error ? (
          <p role="alert" className="-mt-4 text-sm text-[#ff8f8f]">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="group flex w-full items-center justify-center rounded-lg bg-[#3347ff] px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#2537e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6e7dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17] disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? pendingLabel : submitLabel}
          {!pending ? <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden /> : null}
        </button>
      </form>
      {afterForm}
      {footer ? <div className="text-center text-xs text-[#b8bfcc]">{footer}</div> : null}
    </div>
  );
}
