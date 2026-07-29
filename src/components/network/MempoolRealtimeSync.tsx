"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  isRecommendedFees,
  type RecommendedFees,
} from "@/lib/api/mempool";

const MEMPOOL_WEBSOCKET_URL = "wss://mempool.space/api/v1/ws";
const HEARTBEAT_AFTER_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

interface MempoolWebsocketMessage {
  block?: { height?: unknown };
  blocks?: Array<{ height?: unknown }>;
  fees?: unknown;
}

function getLatestHeight(message: MempoolWebsocketMessage) {
  const heights = [
    message.block?.height,
    ...(message.blocks?.map((block) => block.height) ?? []),
  ].filter(
    (height): height is number =>
      typeof height === "number" &&
      Number.isSafeInteger(height) &&
      height >= 0,
  );

  return heights.length > 0 ? Math.max(...heights) : undefined;
}

/**
 * Keeps the React Query cache synced with mempool.space's live WebSocket.
 * REST queries remain as the initial load and fallback if the socket is down.
 */
export function MempoolRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeatTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeatTimeout: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempts = 0;
    let stopped = false;

    const clearHeartbeat = () => {
      clearTimeout(heartbeatTimer);
      clearTimeout(heartbeatTimeout);
    };

    const armHeartbeat = () => {
      clearHeartbeat();
      heartbeatTimer = setTimeout(() => {
        if (socket?.readyState !== WebSocket.OPEN) return;

        socket.send(JSON.stringify({ action: "ping" }));
        heartbeatTimeout = setTimeout(() => socket?.close(), HEARTBEAT_TIMEOUT_MS);
      }, HEARTBEAT_AFTER_MS);
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return;

      const backoff = Math.min(
        1_000 * 2 ** reconnectAttempts,
        MAX_RECONNECT_DELAY_MS,
      );
      const delay = backoff + Math.random() * Math.min(backoff, 2_000);
      reconnectAttempts += 1;

      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, delay);
    };

    const connect = () => {
      if (stopped) return;

      let currentSocket: WebSocket;
      try {
        currentSocket = new WebSocket(MEMPOOL_WEBSOCKET_URL);
        socket = currentSocket;
      } catch {
        scheduleReconnect();
        return;
      }

      currentSocket.addEventListener("open", () => {
        reconnectAttempts = 0;
        currentSocket.send(
          JSON.stringify({ action: "want", data: ["blocks", "stats"] }),
        );
        armHeartbeat();
      });

      currentSocket.addEventListener("message", (event) => {
        armHeartbeat();

        try {
          const message = JSON.parse(String(event.data)) as MempoolWebsocketMessage;

          if (isRecommendedFees(message.fees)) {
            void queryClient.cancelQueries({ queryKey: ["fees"] });
            queryClient.setQueryData<RecommendedFees>(["fees"], message.fees);
          }

          const height = getLatestHeight(message);
          if (height !== undefined) {
            void queryClient.cancelQueries({ queryKey: ["tip-height"] });
            queryClient.setQueryData<number>(["tip-height"], height);
          }
        } catch {
          // Ignore malformed frames and keep the live connection open.
        }
      });

      currentSocket.addEventListener("close", () => {
        if (socket === currentSocket) socket = undefined;
        clearHeartbeat();
        scheduleReconnect();
      });

      currentSocket.addEventListener("error", () => currentSocket.close());
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      clearHeartbeat();
      socket?.close();
    };
  }, [queryClient]);

  return null;
}
