"use client";

import { useEffect } from "react";
import { EXCHANGES } from "@/lib/ws/exchanges";
import type {
  ExchangeConfig,
  PollExchangeConfig,
  WsExchangeConfig,
} from "@/lib/ws/types";
import { useExchangeStore } from "@/store/useExchangeStore";

const STALE_MS = 30_000;
const PING_MS = 20_000;
const MAX_BACKOFF_MS = 15_000;
const DEFAULT_POLL_MS = 30_000;

function connectWs(cfg: WsExchangeConfig, signal: AbortSignal) {
  const { setTick, setStatus } = useExchangeStore.getState();
  let ws: WebSocket | null = null;
  let attempt = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastMsg = Date.now();

  const send = (data: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  };

  const cleanupTimers = () => {
    if (pingTimer) clearInterval(pingTimer);
    if (watchdog) clearInterval(watchdog);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    pingTimer = watchdog = null;
    reconnectTimer = null;
  };

  const scheduleReconnect = () => {
    if (signal.aborted) return;
    cleanupTimers();
    attempt += 1;
    const backoff = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt);
    const jitter = Math.random() * 400;
    reconnectTimer = setTimeout(open, backoff + jitter);
  };

  function open() {
    if (signal.aborted) return;
    setStatus(cfg.id, "connecting");
    try {
      ws = new WebSocket(cfg.wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      attempt = 0;
      lastMsg = Date.now();
      cfg.subscribe(send);
      if (cfg.ping) pingTimer = setInterval(() => cfg.ping!(send), PING_MS);
      watchdog = setInterval(() => {
        if (Date.now() - lastMsg > STALE_MS) {
          setStatus(cfg.id, "offline");
          ws?.close();
        }
      }, STALE_MS / 2);
    };

    ws.onmessage = (ev) => {
      lastMsg = Date.now();
      let parsed: unknown = ev.data;
      if (typeof ev.data === "string") {
        if (ev.data === "pong") return;
        try {
          parsed = JSON.parse(ev.data);
        } catch {
          return;
        }
      }
      const tick = cfg.parse(parsed);
      if (tick) setTick(cfg.id, tick, Date.now());
    };

    ws.onerror = () => ws?.close();

    ws.onclose = () => {
      if (signal.aborted) return;
      setStatus(cfg.id, "offline");
      scheduleReconnect();
    };
  }

  open();

  return () => {
    cleanupTimers();
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      ws.close();
    }
  };
}

function connectPoll(cfg: PollExchangeConfig, signal: AbortSignal) {
  const { setTick, setStatus } = useExchangeStore.getState();
  const pollMs = cfg.pollMs ?? DEFAULT_POLL_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const schedule = () => {
    if (signal.aborted || stopped) return;
    timer = setTimeout(run, pollMs);
  };

  const run = async () => {
    if (signal.aborted || stopped) return;
    try {
      const tick = await cfg.poll(signal);
      if (signal.aborted || stopped) return;
      setTick(cfg.id, tick, Date.now());
    } catch {
      if (signal.aborted || stopped) return;
      setStatus(cfg.id, "offline");
    } finally {
      schedule();
    }
  };

  setStatus(cfg.id, "connecting");
  void run();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

function connect(cfg: ExchangeConfig, signal: AbortSignal) {
  if (cfg.transport === "poll") {
    return connectPoll(cfg, signal);
  }

  return connectWs(cfg, signal);
}

/** Opens all exchange sockets once and streams ticks into the store. */
export function useExchangeFeeds() {
  useEffect(() => {
    const controller = new AbortController();
    const cleanups = EXCHANGES.map((cfg) => connect(cfg, controller.signal));
    return () => {
      controller.abort();
      cleanups.forEach((fn) => fn());
    };
  }, []);
}
