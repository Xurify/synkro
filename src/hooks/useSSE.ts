import { useEffect, useRef } from "react";

interface SSEOptions {
  onMessage: (event: MessageEvent) => void;
  onOpen: () => void;
  onError: (event: Event) => void;
  onReconnect: () => void;
  reconnectDelay?: number;
}

export const useSSE = (url: string, options: SSEOptions) => {
  let eventSource: EventSource | null = null;
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const { onMessage, onOpen, onError, onReconnect } = options;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        onMessage && onMessage(event);
      };

      eventSource.onopen = () => {
        onOpen && onOpen();
      };

      eventSource.onerror = (event) => {
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
          if (!document.hidden) {
            onReconnect && onReconnect();
            reconnect();
          }
        } else {
          onError && onError(event);
        }
      };
    };

    connect();

    const reconnect = () => {
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, options?.reconnectDelay ?? 1000);
    };

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [url, options]);

  return {
    close: () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    },
  };
};

export default useSSE;
