export interface User {
  id: string;
  username: string;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  host: string;
  queue: Queue[];
  members: User[];
  maxRoomSize: number;
}

interface Queue {}
