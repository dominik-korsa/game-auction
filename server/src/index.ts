import http from 'http';
import bodyParser from 'body-parser';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import _ from 'lodash';
import SocketIO from 'socket.io';
import BaseRoom from './base-room';
import BritishAuctionRoom from './british-auction-room';
import DutchAuctionRoom from './dutch-auction-room';
import RestApi from './rest-api';
import { AuctionOptions } from './types';
import { requireEnv } from './utils';

dotenv.config();

const rooms = new Map<string, BaseRoom>();

const app = express();
app.use(bodyParser.json());

if (process.env.WEBSITE_BUILD_PATH !== undefined) {
  console.log('Serving website');
  app.use(history({
    index: 'index.html',
  }));
  app.use(express.static(process.env.WEBSITE_BUILD_PATH));
  app.use(cors({
    origin: false,
  }));
} else {
  app.use(cors({
    origin: '*',
  }));
}

const server = http.createServer(app);
const socketServer = new SocketIO.Server(server, {
  cors: {
    origin: '*',
  },
});
const restApi = new RestApi(app, {
  createRoom: (auctionOptions: AuctionOptions) => {
    const codes = Array.from(rooms.values()).map((room) => room.getCode());
    let code;
    do {
      code = _.random(10000, 99999, false);
    } while (codes.includes(code));
    let room;
    if (auctionOptions.type === 'british') room = new BritishAuctionRoom(socketServer, code, auctionOptions);
    else if (auctionOptions.type === 'dutch') room = new DutchAuctionRoom(socketServer, code, auctionOptions);
    else throw new Error('This type of auction is not yet supported');
    rooms.set(room.id, room);
    return room.id;
  },
  joinRoom: (code) => {
    const room = Array.from(rooms.values()).find((e) => e.getCode() === code);
    if (!room) return null;
    return room.id;
  },
});

const port = requireEnv('PORT');
server.listen((port), () => {
  console.log(`✔ listening on port ${port}`);
});
