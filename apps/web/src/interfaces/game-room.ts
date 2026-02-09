export interface IGameRoom {
  id: string;
  name: string;
  host_id: string;
  status: "WAITING" | "PLAYING" | "FINISHED" | "DESTROYED";
  config: any;
  created_at: string;
  updated_at: string;
  players?: IGamePlayer[];
}

export interface IGamePlayer {
  id: string;
  user_id: string;
  room_id: string;
  status: "JOINED" | "READY" | "LEFT";
  seat_number: number;
  user: {
    username: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
}
