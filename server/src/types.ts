/* eslint-disable @typescript-eslint/no-redeclare */
import * as t from 'io-ts';

export interface RoomTokenPayload {
  roomId: string;
  playerId: string;
}

export const BritishAuctionOptions = t.type({
  type: t.literal('british'),
  currency: t.string,
  multiplier: t.number,
  startingPrice: t.number,
  minIncrement: t.number,
  timePerBid: t.number,
});
export type BritishAuctionOptions = t.TypeOf<typeof BritishAuctionOptions>;

export const DutchAuctionOptions = t.type({
  type: t.literal('dutch'),
  currency: t.string,
  multiplier: t.number,
  startingPrice: t.number,
  endingPrice: t.number,
  totalTime: t.number,
});

export const AuctionOptions = t.union([BritishAuctionOptions, DutchAuctionOptions]);
export type AuctionOptions = t.TypeOf<typeof AuctionOptions>;

export const CreateRoomBody = t.type({
  auctionOptions: AuctionOptions,
});

export const JoinRoomBody = t.type({
  code: t.number,
});

export interface RestApiFunctions {
  createRoom: (auctionOptions: AuctionOptions) => string
  joinRoom: (code: number) => string | null,
}

export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
}

export const InCreatePlayer = t.type({
  name: t.string,
  color: t.string,
});

export type RoomState = 'not-started' | 'countdown' | 'in-progress' | 'finished';
