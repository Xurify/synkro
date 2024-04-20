import { roomsSource } from './room-management';

const CLEANUP_INTERVAL = 4 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

export const startCleanupInterval = () => {
  if (!cleanupInterval && roomsSource.getLength() > 0) {
    cleanupInterval = setInterval(() => {
      for (const roomId in roomsSource.rooms) {
        if (roomsSource.get(roomId)?.members.length === 0) {
          roomsSource.delete(roomId);
          console.log(`🧼 Cleanup: Room ${roomId} has been deleted.`);
        }
      }
      if (roomsSource.getLength() === 0 && cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('🛑 Cleanup interval stopped as there are no rooms left');
      }
    }, CLEANUP_INTERVAL);
  }
};
