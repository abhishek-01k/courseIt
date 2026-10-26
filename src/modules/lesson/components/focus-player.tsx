"use client";

import { Menu } from "@base-ui/react/menu";
import { Captions, CaptionsOff, Check, Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn, formatClock } from "@/lib/utils";
import type { FocusPlayerHandle, FocusPlayerProps } from "@/types/lesson";

// The parts of the YouTube IFrame Player API we use.
type YTPlayer = {
  getCurrentTime(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  setPlaybackRate(rate: number): void;
  loadModule(name: string): void;
  unloadModule(name: string): void;
  destroy(): void;
};
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYING = 1;
const PAUSED = 2;
const ENDED = 0;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_KEY = "courseit:speed"; // remembered in this browser, so the next lesson plays at the same speed

const savedSpeed = () => {
  try {
    const s = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(s) ? s : 1;
  } catch {
    return 1;
  }
};

let api: Promise<void> | null = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  api ??= new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return api;
}

const clock = formatClock;

/**
 * Focus mode: YouTube's own controls are hidden and ours sit BELOW the video (YouTube's terms forbid
 * covering the player). The timeline covers only this lesson, not the whole 3–6 hour video, and real
 * watch time (unique seconds; skipping ahead doesn't count) is saved. A lesson counts as watched at 80%.
 */
export default function FocusPlayer({ ref, lessonId, videoId, start, end, startAt, marks = [], autoStart = false, endScreen, onEnded, onWatched, onPlay }: FocusPlayerProps & { ref?: React.Ref<FocusPlayerHandle> }) {
  const frame = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const wantPlay = useRef(autoStart); // autoplay from the previous lesson: start as soon as the player is ready
  const onEndedRef = useRef(onEnded);
  const onWatchedRef = useRef(onWatched);
  const onPlayRef = useRef(onPlay);
  // A note link (?t=) opens the lesson at that moment; otherwise at the lesson start.
  const from = startAt !== undefined && startAt > start && startAt < end ? Math.round(startAt) : start;
  const [time, setTime] = useState(from);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [full, setFull] = useState(false);
  // Off by default (YouTube would otherwise apply the viewer's account setting); the CC button turns them on.
  const [captions, setCaptions] = useState(false);
  const captionsOn = useRef(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onWatchedRef.current = onWatched;
    onPlayRef.current = onPlay;
  });

  const length = Math.max(1, end - start);
  const position = Math.min(length, Math.max(0, time - start));

  useEffect(() => {
    const seen = new Set<number>(); // seconds into the lesson seen this session
    let pending: number[] = []; // seen but not sent yet
    let poll = 0;
    let gone = false;
    let counted = false; // tell the page once, the first time the server counts this lesson as watched

    // Sends only the new seconds; the server merges them with earlier sessions.
    // keepalive: the request still completes if the tab is closing.
    const send = () => {
      if (!pending.length) return;
      const seconds = pending;
      pending = [];
      fetch("/api/watch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId, seconds }),
        keepalive: true,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.watched && !counted) {
            counted = true;
            onWatchedRef.current?.();
          }
        })
        .catch(() => {});
    };

    const finish = () => {
      setTime(end);
      setPlaying(false);
      send();
      onEndedRef.current?.();
    };

    // Four times a second: move the timeline, record this second, stop at the lesson's end.
    const tick = () => {
      const p = player.current;
      if (!p) return;
      const t = p.getCurrentTime();
      if (t >= end - 0.3) {
        p.pauseVideo();
        return finish();
      }
      if (t < start - 1) return p.seekTo(start, true);
      setTime(t);
      const s = Math.floor(t) - start;
      if (s >= 0 && s < end - start && !seen.has(s)) {
        seen.add(s);
        pending.push(s);
      }
    };

    loadYouTubeApi().then(() => {
      if (gone || !host.current || !window.YT) return;
      player.current = new window.YT.Player(host.current, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: { start: from, end, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: () => {
            ready.current = true;
            const s = savedSpeed();
            if (s !== 1) {
              player.current?.setPlaybackRate(s);
              setSpeed(s);
            }
            if (wantPlay.current) player.current?.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            clearInterval(poll);
            if (e.data === PLAYING) {
              setPlaying(true);
              onPlayRef.current?.();
              // YouTube loads captions when playback starts; drop them unless the learner turned them on.
              if (!captionsOn.current) player.current?.unloadModule("captions");
              poll = window.setInterval(tick, 250);
            } else if (e.data === PAUSED) {
              setPlaying(false);
              send();
            } else if (e.data === ENDED) finish();
          },
        },
      });
    });

    const flush = window.setInterval(send, 15_000);
    const onHide = () => document.visibilityState === "hidden" && send();
    const onFull = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("visibilitychange", onHide);
    document.addEventListener("fullscreenchange", onFull);
    window.addEventListener("pagehide", send);
    return () => {
      gone = true;
      clearInterval(poll);
      clearInterval(flush);
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("fullscreenchange", onFull);
      window.removeEventListener("pagehide", send);
      send();
      player.current?.destroy();
      player.current = null;
      ready.current = false;
    };
  }, [lessonId, videoId, start, end, from]);

  const play = () => {
    if (position >= length - 1) seek(0); // finished: Play rewatches from the start
    if (ready.current) player.current?.playVideo();
    else wantPlay.current = true;
  };
  const pause = () => player.current?.pauseVideo();
  /** Jump to `s` seconds into the lesson (kept inside the lesson). */
  const seek = (s: number) => {
    const to = start + Math.min(length - 1, Math.max(0, s));
    player.current?.seekTo(to, true);
    setTime(to);
  };

  // Lets the quiz send the video to the exact moment that explains a wrong answer.
  useImperativeHandle(ref, () => ({
    now: () => Math.round(time),
    playFrom: (absoluteSeconds: number) => {
      seek(absoluteSeconds - start);
      play();
      frame.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }));

  const toggleCaptions = () => {
    const on = !captionsOn.current;
    captionsOn.current = on;
    if (on) player.current?.loadModule("captions");
    else player.current?.unloadModule("captions");
    setCaptions(on);
  };
  const toggleMute = () => {
    if (muted) player.current?.unMute();
    else player.current?.mute();
    setMuted(!muted);
  };
  const changeSpeed = (s: number) => {
    player.current?.setPlaybackRate(s);
    setSpeed(s);
    try {
      localStorage.setItem(SPEED_KEY, String(s));
    } catch {}
  };
  // < and > step through the speeds, as on YouTube.
  const stepSpeed = (by: number) => changeSpeed(SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, SPEEDS.indexOf(speed) + by))]);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else frame.current?.requestFullscreen?.();
  };
  // Shortcuts work anywhere on the lesson page, not only when the player has focus. Typing in notes,
  // inputs or the quiz dialog is left alone, and so are buttons and the slider for Space and arrows.
  const keys = useRef<Record<string, () => void>>({});
  useEffect(() => {
    keys.current = {
      " ": () => (playing ? pause() : play()),
      k: () => (playing ? pause() : play()),
      ArrowLeft: () => seek(position - 10),
      ArrowRight: () => seek(position + 10),
      ">": () => stepSpeed(1),
      "<": () => stepSpeed(-1),
      m: toggleMute,
      c: toggleCaptions,
      f: toggleFull,
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true], dialog[open]")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ((key === " " || key.startsWith("Arrow")) && el?.closest("button, a, [role=slider], [role=tab], [role=menu]")) return;
      const act = keys.current[key];
      if (!act) return;
      e.preventDefault();
      act();
    };
    // Clicking the video moves focus into YouTube's frame, where our page can't hear keys: take it back.
    const onBlur = () =>
      setTimeout(() => {
        if (document.activeElement?.tagName === "IFRAME" && frame.current?.contains(document.activeElement)) frame.current.focus({ preventScroll: true });
      });
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const control = "flex size-10 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frame}
        role="group"
        tabIndex={-1}
        aria-label="Lesson video. Space to play or pause, arrows to skip 10 seconds, less-than and greater-than to change speed, C for captions, M to mute, F for full screen."
        className="flex scroll-mt-6 flex-col overflow-hidden rounded-card bg-black shadow-blue outline-none focus-visible:ring-2 focus-visible:ring-dusk"
      >
        <div className={cn("relative w-full", full ? "flex-1" : "aspect-video")}>
          {/* Once the lesson has ended and the video has stopped, the player is hidden and our end screen
              takes its place. Nothing is ever drawn over the player while it shows a video (YouTube's terms). */}
          <div ref={host} className={cn("absolute inset-0 size-full", endScreen && "invisible")} />
          {endScreen && <div className="absolute inset-0">{endScreen}</div>}
        </div>

        {/* Controls live under the video, never on top of it. */}
        <div className="flex flex-col gap-1.5 bg-[#0f1611] px-3 pt-2.5 pb-2 text-white">
          <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={length}
            step={1}
            value={Math.round(position)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Position in this lesson"
            aria-valuetext={`${clock(position)} of ${clock(length)}`}
            className="h-1.5 w-full cursor-pointer accent-[#b8c460]"
          />
          {/* Your notes on this lesson, as dots on the timeline. */}
          {marks.map((m) => (
            <span
              key={m}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_#0f1611]"
              style={{ left: `${(Math.min(length, Math.max(0, m - start)) / length) * 100}%` }}
            />
          ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={playing ? pause : play} aria-label={playing ? "Pause" : "Play"} className={control}>
              {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <button type="button" onClick={() => seek(position - 10)} aria-label="Back 10 seconds" className={control}>
              <RotateCcw className="size-4.5" />
            </button>
            <button type="button" onClick={() => seek(position + 10)} aria-label="Forward 10 seconds" className={control}>
              <RotateCw className="size-4.5" />
            </button>
            <span className="ml-1 font-mono text-[0.78rem] text-white/80 tabular-nums">
              {clock(position)} / {clock(length)}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <button type="button" onClick={toggleCaptions} aria-pressed={captions} aria-label="Captions" className={control}>
                {captions ? <Captions className="size-4.5" /> : <CaptionsOff className="size-4.5" />}
              </button>
              {/* Speed menu like YouTube's: a small dark panel above the control bar, current speed ticked.
                  It's rendered inside the player frame, so it also shows in fullscreen. */}
              <Menu.Root>
                <Menu.Trigger aria-label={`Playback speed ${speed}x`} className={cn(control, "w-auto px-3 font-mono text-[0.8rem] data-popup-open:bg-white/15")}>
                  {speed}x
                </Menu.Trigger>
                <Menu.Portal container={frame}>
                  <Menu.Positioner side="top" align="end" sideOffset={10} className="z-20 outline-none">
                    <Menu.Popup className="w-44 origin-(--transform-origin) rounded-2xl bg-[#0f1611]/95 p-1.5 text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-md outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
                      <p className="px-3 pt-1.5 pb-1 font-mono text-[0.68rem] tracking-[0.07em] text-white/55 uppercase">Playback speed</p>
                      <Menu.RadioGroup value={speed} onValueChange={(value) => changeSpeed(Number(value))}>
                        {SPEEDS.map((s) => (
                          <Menu.RadioItem
                            key={s}
                            value={s}
                            closeOnClick
                            className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-[0.88rem] outline-none select-none data-checked:text-[#b8c460] data-highlighted:bg-white/10"
                          >
                            <span className="flex size-4 items-center justify-center">
                              <Menu.RadioItemIndicator>
                                <Check aria-hidden="true" className="size-4" />
                              </Menu.RadioItemIndicator>
                            </span>
                            {s === 1 ? "Normal" : `${s}x`}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
              <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className={control}>
                {muted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
              </button>
              <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} className={control}>
                {full ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
              </button>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
