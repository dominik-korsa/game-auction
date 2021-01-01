import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import * as t from 'io-ts';
import _ from 'lodash';
import SocketIO from 'socket.io';
import { SealedBidAuctionOptions } from '../types';
import BaseRoom from './base';

const InBid = t.type({
  price: t.number,
});

interface Bid {
  playerId: string;
  price: number;
}

interface Result {
  price: number;
  bids: Bid[],
  winners: Bid[],
}

export default class SealedBidAuctionRoom extends BaseRoom {
  private readonly auctionOptions: SealedBidAuctionOptions;

  private endTime: {
    timestamp: number,
    timeoutId: NodeJS.Timeout,
  } | null = null;

  private timeLeftOnPause: number | null = null;

  private bids = new Map<string, number>();

  public constructor(socketServer: SocketIO.Server, code: number, auctionOptions: SealedBidAuctionOptions) {
    super(socketServer, code);
    this.auctionOptions = auctionOptions;

    this.socketNamespace.on('connection', (socket: SocketIO.Socket) => {
      const playerId = this.getPlayerId(socket.id);
      if (!playerId) {
        console.error(`Cannot find player of socket ${socket.id}`);
        socket.disconnect();
        return;
      }

      socket.emit('update:auction-options', this.auctionOptions);
      socket.emit('update:bid-players', this.getBidPlayers());
      socket.emit('update:result', this.getState() === 'finished' ? this.getResult() : null);

      socket.on('bid', (msg) => {
        pipe(
          InBid.decode(msg),
          fold(
            (error) => {
              console.error(error);
            },
            (body) => {
              if (this.getPaused()) {
                console.warn('Auction paused');
                return;
              }
              if (this.getState() !== 'in-progress') {
                console.warn(`Bid attempted in ${this.getState()} state`);
              }
              if (body.price < this.auctionOptions.minPrice) {
                console.warn(`${body.price} less than min price (${this.auctionOptions.minPrice})`);
                return;
              }

              this.bids.set(playerId, body.price);
              this.socketNamespace.emit('update:bid-players', this.getBidPlayers());
              if (
                this.endTime === null
                || this.getBidPlayers().length === this.players.size
              ) this.finishIfPossible();
            },
          ),
        );
      });

      socket.on('start-auction', async () => {
        if (this.getState() !== 'not-started') return;
        if (this.players.size < 2) return;
        this.setState('countdown');
        await new Promise(((resolve) => setTimeout(resolve, 3000)));
        this.setState('in-progress');
        this.startTimeout(this.auctionOptions.totalTime);
      });
    });
  }

  private startTimeout(time: number): void {
    if (this.endTime) clearTimeout(this.endTime.timeoutId);
    this.endTime = {
      timestamp: Date.now() + time,
      timeoutId: setTimeout(this.timeout.bind(this), time + 1000),
    };
    this.socketNamespace.emit('time-left', this.getTimeLeft());
  }

  private getTimeLeft(): number | null {
    if (this.endTime === null) return null;
    const now = Date.now();
    if (this.endTime.timestamp < now) return null;
    return this.endTime.timestamp - now;
  }

  private getBidPlayers(): string[] {
    return Array.from(this.bids.keys());
  }

  private timeout(): void {
    this.endTime = null;
    this.socketNamespace.emit('time-left', null);
    this.finishIfPossible();
  }

  private finishIfPossible() {
    if (!this.auctionOptions.secondPriceMode && this.getBidPlayers().length < 1) return;
    if (this.auctionOptions.secondPriceMode && this.getBidPlayers().length < 2) return;
    this.socketNamespace.emit('update:result', this.getResult());
    this.setState('finished');
  }

  private getResult(): Result {
    const bids: Bid[] = _.orderBy(
      Array.from(this.bids.entries())
        .map(([playerId, price]) => ({ playerId, price })),
      ['price'],
      ['desc'],
    );
    return {
      price: bids[this.auctionOptions.secondPriceMode ? 1 : 0].price,
      bids,
      winners: bids.filter((bid) => bid.price === bids[0].price),
    };
  }

  protected pause(): void {
    if (this.endTime === null) return;
    this.timeLeftOnPause = this.endTime.timestamp - Date.now();
    clearTimeout(this.endTime.timeoutId);
    this.endTime = null;
    this.socketNamespace.emit('time-left', null);
  }

  protected resume(): void {
    if (this.timeLeftOnPause === null) return;
    this.startTimeout(Math.max(this.timeLeftOnPause, 1000));
    this.timeLeftOnPause = null;
  }
}
