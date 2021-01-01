import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import * as t from 'io-ts';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import SocketIO from 'socket.io';
import { BritishAuctionOptions } from '../types';
import BaseRoom from './base';

const InBid = t.type({
  price: t.number,
});

interface HistoryBid {
  id: string;
  playerId: string;
  price: number;
}

export default class BritishAuctionRoom extends BaseRoom {
  private readonly auctionOptions: BritishAuctionOptions;

  private readonly bidHistory: HistoryBid[] = [];

  private endTime: {
    timestamp: number,
    timeoutId: NodeJS.Timeout,
  } | null = null;

  public constructor(socketServer: SocketIO.Server, code: number, auctionOptions: BritishAuctionOptions) {
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
      socket.emit('update:bid-history', this.bidHistory);
      socket.emit('time-left', this.getTimeLeft());

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
                return;
              }

              const lastBid = _.last(this.bidHistory);
              const minPrice = lastBid === undefined ? this.auctionOptions.startingPrice : lastBid.price + this.auctionOptions.minIncrement;
              if (body.price < minPrice) {
                console.warn(`${body.price} less than min price (${minPrice})`);
                return;
              }
              if (body.price % this.auctionOptions.multiplier !== 0) {
                console.warn(`${body.price} not a multiple of (${this.auctionOptions.multiplier})`);
                return;
              }
              this.bidHistory.push({
                id: nanoid(),
                playerId,
                price: body.price,
              });
              this.startTimeout();
              this.socketNamespace.emit('lock');
              this.socketNamespace.emit('update:bid-history', this.bidHistory);
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
      });
    });
  }

  private getTimeLeft(): number | null {
    if (this.endTime === null) return null;
    const now = Date.now();
    if (this.endTime.timestamp < now) return null;
    return this.endTime.timestamp - now;
  }

  private timeout() {
    this.endTime = null;
    this.socketNamespace.emit('time-left', null);
    this.setState('finished');
  }

  private startTimeout(): void {
    if (this.endTime) clearTimeout(this.endTime.timeoutId);
    this.endTime = {
      timestamp: Date.now() + this.auctionOptions.timePerBid,
      timeoutId: setTimeout(this.timeout.bind(this), this.auctionOptions.timePerBid + 1000),
    };
    this.socketNamespace.emit('time-left', this.getTimeLeft());
  }

  protected pause(): void {
    if (this.endTime !== null) clearTimeout(this.endTime.timeoutId);
    this.endTime = null;
    this.socketNamespace.emit('time-left', null);
  }

  protected resume(): void {
    this.startTimeout();
  }
}
