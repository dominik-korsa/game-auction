import jwt from 'jsonwebtoken';
import { RoomTokenPayload } from './types';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Environment variable '${name}' not set`);
  return value;
}

export function verifyRoomToken(token: string): RoomTokenPayload {
  return jwt.verify(token, requireEnv('ROOM_JWT_SECRET')) as RoomTokenPayload;
}

export function createRoomToken(roomId: string, playerId: string): string {
  const payload: RoomTokenPayload = {
    roomId,
    playerId,
  };
  return jwt.sign(payload, requireEnv('ROOM_JWT_SECRET'));
}
