import { Request, Response } from 'express';
import { roomsSource } from './room-management';

export const publicRoomsHandler = (
  req: Request,
  res: Response,
) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendPublicRooms = () => {
    const rooms = roomsSource.getAllAsArray();
    const publicRooms = rooms.filter((room) => !room.private);
    res.write(`data: ${JSON.stringify({ type: 'rooms', rooms: publicRooms })}\n\n`);
  };

  sendPublicRooms();

  roomsSource.on('room:added', sendPublicRooms);
  roomsSource.on('room:updated', sendPublicRooms);
  roomsSource.on('rooms:cleared', sendPublicRooms);
  roomsSource.on('room:deleted', sendPublicRooms);

  req.on('close', () => {
    roomsSource.removeListener('room:added', sendPublicRooms);
    roomsSource.removeListener('room:updated', sendPublicRooms);
    roomsSource.removeListener('rooms:cleared', sendPublicRooms);
    roomsSource.removeListener('room:deleted', sendPublicRooms);
    res.end();
  });
};
