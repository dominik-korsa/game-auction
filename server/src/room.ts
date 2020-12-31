import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import SocketIO from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import {
  AuctionOptions, HistoryBid, InBid, InCreatePlayer, RoomPlayer, RoomState,
} from './types';
import { verifyRoomToken } from './utils';

export default class Room {
  public readonly id: string;

  private code: number | null;

  private readonly socketNamespace: SocketIO.Namespace;

  private auctionOptions: AuctionOptions;

  private readonly players = new Map<string, RoomPlayer>();

  private readonly socketsPlayerId = new Map<string, string>();

  private state: RoomState = 'not-started';

  private bidHistory: HistoryBid[] = [];

  private endTime: {
    timestamp: number,
    timeoutId: NodeJS.Timeout,
  } | null = null;

  public constructor(socketServer: SocketIO.Server, code: number, auctionOptions: AuctionOptions) {
    this.id = nanoid();
    this.auctionOptions = auctionOptions;
    this.code = code;
    this.socketNamespace = socketServer.of(`/room/${this.id}`);
    this.socketNamespace.use(this.namespaceMiddleware.bind(this));
    this.socketNamespace.on('connection', (socket: SocketIO.Socket) => {
      const playerId = this.socketsPlayerId.get(socket.id);
      if (!playerId) {
        console.error(`Cannot find player of socket ${socket.id}`);
        socket.disconnect();
        return;
      }
      socket.emit('update:auction-options', this.auctionOptions);
      socket.emit('update:code', this.code);
      socket.emit('update:players', this.getPlayersObject());
      socket.emit('update:state', this.state);
      socket.emit('update:bid-history', this.bidHistory);
      socket.emit('time-left', this.getTimeLeft());

      socket.on('create-player', (msg) => {
        pipe(InCreatePlayer.decode(msg), fold(
          (error) => {
            console.error(error);
          },
          (body) => {
            this.players.set(playerId, {
              id: playerId,
              color: body.color,
              name: body.name,
            });
            this.socketNamespace.emit('update:players', this.getPlayersObject());
          },
        ));
      });

      socket.on('bid', (msg) => {
        pipe(InBid.decode(msg), fold(
          (error) => {
            console.error(error);
          },
          (body) => {
            if (this.state !== 'in-progress') {
              console.warn(`Bid attempted in ${this.state} state`);
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
            if (this.endTime) clearTimeout(this.endTime.timeoutId);
            this.endTime = {
              timestamp: Date.now() + this.auctionOptions.timePerBid,
              timeoutId: setTimeout(this.timeout.bind(this), this.auctionOptions.timePerBid + 1000),
            };
            this.socketNamespace.emit('time-left', this.getTimeLeft());
            this.socketNamespace.emit('update:bid-history', this.bidHistory);
          },
        ));
      });

      socket.on('start-auction', async () => {
        if (this.state !== 'not-started') return;
        if (this.players.size < 2) return;
        this.state = 'countdown';
        this.socketNamespace.emit('update:state', 'countdown');
        await new Promise(((resolve) => setTimeout(resolve, 3000)));
        this.state = 'in-progress';
        this.socketNamespace.emit('update:state', 'in-progress');
      });

      socket.on('disconnect', () => {
        this.socketsPlayerId.delete(socket.id);
      });
    });
  }

  public getCode = (): number | null => this.code;

  private getPlayersObject() {
    return Object.fromEntries(this.players.entries());
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
    this.state = 'finished';
    this.socketNamespace.emit('update:state', 'finished');
  }

  private namespaceMiddleware(socket: SocketIO.Socket, next: (err?: ExtendedError) => void) {
    try {
      const auth = socket.handshake.auth as Record<string, unknown>;
      if (typeof auth.roomAccessToken !== 'string') {
        next(new Error('Not authenticated'));
        return;
      }
      const [authenticationType, token] = auth.roomAccessToken.split(' ');
      if (authenticationType.toLowerCase() !== 'bearer' || !token) {
        next(new Error('Invalid token format'));
        return;
      }
      let tokenDecoded;
      try {
        tokenDecoded = verifyRoomToken(token);
      } catch (err) {
        next(new Error('Invalid token'));
        console.error(err);
        return;
      }

      if (tokenDecoded.roomId !== this.id) {
        next(new Error('Token not valid for this room'));
        return;
      }

      this.socketsPlayerId.set(socket.id, tokenDecoded.playerId);

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
      console.error(err);
    }
  }
}
