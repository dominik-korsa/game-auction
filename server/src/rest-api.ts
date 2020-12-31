import express from 'express';
import { fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import { nanoid } from 'nanoid';
import { CreateRoomBody, JoinRoomBody, RestApiFunctions } from './types';
import { createRoomToken } from './utils';

export default class RestApi {
  private app: express.Express;

  private functions: RestApiFunctions;

  public constructor(app: express.Express, functions: RestApiFunctions) {
    this.functions = functions;
    this.app = app;
    this.app.post('/api/create-room', (req, res) => {
      pipe(CreateRoomBody.decode(req.body), fold(
        (schemaErrors) => {
          res.status(400).send({
            schemaErrors,
            message: 'Request body doesn\'t match schema',
          });
        },
        (body) => {
          const roomId = this.functions.createRoom(body.auctionOptions);
          const playerId = nanoid();
          res.send({
            roomId,
            playerId,
            roomToken: createRoomToken(roomId, playerId),
          });
        },
      ));
    });

    this.app.post('/api/join-room', (req, res) => {
      pipe(JoinRoomBody.decode(req.body), fold(
        (schemaErrors) => {
          res.status(400).send({
            schemaErrors,
            message: 'Request body doesn\'t match schema',
          });
        },
        (body) => {
          const playerId = nanoid();
          const roomId = this.functions.joinRoom(body.code);
          if (!roomId) {
            res.send({
              found: false,
            });
            return;
          }
          res.send({
            found: true,
            roomId,
            playerId,
            roomToken: createRoomToken(roomId, playerId),
          });
        },
      ));
    });
  }
}
