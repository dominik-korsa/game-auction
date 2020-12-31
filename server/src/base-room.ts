import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import { nanoid } from 'nanoid';
import SocketIO from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { InCreatePlayer, RoomPlayer, RoomState } from './types';
import { verifyRoomToken } from './utils';

export default abstract class BaseRoom {
  public readonly id: string;

  private code: number | null;

  protected readonly socketNamespace: SocketIO.Namespace;

  private readonly socketsPlayerId = new Map<string, string>();

  protected readonly players = new Map<string, RoomPlayer>();

  private state: RoomState = 'not-started';

  private paused = false;

  protected constructor(socketServer: SocketIO.Server, code: number) {
    this.id = nanoid();
    this.code = code;

    this.socketNamespace = socketServer.of(`/room/${this.id}`);
    this.socketNamespace.use(this.namespaceMiddleware.bind(this));
    this.socketNamespace.on('connection', (socket: SocketIO.Socket) => {
      const playerId = this.getPlayerId(socket.id);
      if (!playerId) {
        console.error(`Cannot find player of socket ${socket.id}`);
        socket.disconnect();
        return;
      }

      socket.emit('update:code', this.getCode());
      socket.emit('update:state', this.getState());
      socket.emit('update:players', this.getPlayersObject());
      socket.emit('update:paused', this.paused);

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

      socket.on('disconnect', () => {
        this.socketsPlayerId.delete(socket.id);
      });

      socket.on('pause', () => {
        if (this.paused) {
          console.warn('Already paused');
          return;
        }

        if (this.state !== 'in-progress') {
          console.warn(`Pause attempted in ${this.getState()} state`);
          return;
        }

        this.pause();
        this.paused = true;
        this.socketNamespace.emit('update:paused', true);
      });

      socket.on('resume', () => {
        if (!this.paused) {
          console.warn('Already resumed');
          return;
        }

        this.resume();
        this.paused = false;
        this.socketNamespace.emit('update:paused', false);
      });
    });
  }

  public getCode = (): number | null => this.code;

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

  protected getState(): RoomState {
    return this.state;
  }

  protected setState(state: RoomState): void {
    this.state = state;
    this.socketNamespace.emit('update:state', state);
  }

  private getPlayersObject() {
    return Object.fromEntries(this.players.entries());
  }

  protected getPlayerId(socketId: string): string | null {
    return this.socketsPlayerId.get(socketId) ?? null;
  }

  protected abstract pause(): void;

  protected abstract resume(): void;
}
