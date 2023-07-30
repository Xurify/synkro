import { useState } from "react";

interface Queue<T> {
  first: T | null;
  last: T | null;
  size: number;
  queue: T[];
  add: (element: T) => void;
  remove: () => void;
  clear: () => void;
}

const useQueue = <T>(): Queue<T> => {
  const [queue, setQueue] = useState<T[]>([]);

  const add = (element: T) => {
    setQueue((prevQueue) => [...prevQueue, element]);
  };

  const remove = () => {
    if (queue.length === 0) return;
    setQueue((prevQueue) => prevQueue.slice(1));
  };

  const clear = () => {
    setQueue([]);
  };

  const first = queue.length > 0 ? queue[0] : null;
  const last = queue.length > 0 ? queue[queue.length - 1] : null;
  const size = queue.length;

  return { first, last, size, queue, add, remove, clear };
};

export default useQueue;
