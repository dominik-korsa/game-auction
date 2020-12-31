import SocketIO from 'socket.io';
import BaseRoom from './base-room';
import { DutchAuctionOptions } from './types';

export default class DutchAuctionRoom extends BaseRoom {
  private readonly auctionOptions: DutchAuctionOptions;

  private currentPrice: number | null = null;

  private intervalId: NodeJS.Timeout | null = null;

  private timeoutId: NodeJS.Timeout | null = null;

  private pausedState: 'interval' | 'timeout' | null = null;

  private buyer: {
    playerId: string;
    price: number;
  } | null = null;

  public constructor(socketServer: SocketIO.Server, code: number, auctionOptions: DutchAuctionOptions) {
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
      socket.emit('update:current-price', this.currentPrice);
      socket.emit('update:buyer', this.buyer);

      socket.on('bid', () => {
        if (this.getState() !== 'in-progress') {
          console.warn(`Bid attempted in ${this.getState()} state`);
          return;
        }

        if (this.currentPrice === null) {
          console.warn('No current price');
          return;
        }

        if (this.timeoutId !== null) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        this.buyer = {
          playerId,
          price: this.currentPrice,
        };
        this.socketNamespace.emit('update:buyer', this.buyer);
        this.setState('finished');
      });

      socket.on('start-auction', async () => {
        if (this.getState() !== 'not-started') return;
        if (this.players.size < 2) return;
        this.setState('countdown');
        await new Promise(((resolve) => setTimeout(resolve, 3000)));
        this.setState('in-progress');
        this.currentPrice = this.auctionOptions.startingPrice;
        this.socketNamespace.emit('update:current-price', this.currentPrice);
        this.startInterval();
      });
    });
  }

  private startInterval(): void {
    if (this.intervalId !== null) clearInterval(this.intervalId);
    const steps = (this.auctionOptions.startingPrice - this.auctionOptions.endingPrice) / this.auctionOptions.multiplier;
    const timePerStep = this.auctionOptions.totalTime / steps;
    this.intervalId = setInterval(() => {
      if (this.currentPrice === null) this.currentPrice = this.auctionOptions.startingPrice; // This should never happen
      this.currentPrice -= this.auctionOptions.multiplier;
      if (this.currentPrice <= this.auctionOptions.endingPrice) {
        this.currentPrice = this.auctionOptions.endingPrice;
        if (this.intervalId !== null) clearInterval(this.intervalId);
        this.intervalId = null;
        this.startTimeout();
      }
      this.socketNamespace.emit('update:current-price', this.currentPrice);
    }, timePerStep);
  }

  private startTimeout() {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.setState('finished');
      this.timeoutId = null;
    }, 5000);
  }

  protected pause(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.pausedState = 'interval';
    } else if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.pausedState = 'timeout';
    }
  }

  protected resume(): void {
    if (this.pausedState === 'interval') this.startInterval();
    else if (this.pausedState === 'timeout') this.startTimeout();
    this.pausedState = null;
  }
}
