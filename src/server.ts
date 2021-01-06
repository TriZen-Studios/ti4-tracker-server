import express, {Express} from "express";
import {createServer, IncomingMessage} from "http";
import WebSocket, {Server, ServerOptions, MessageEvent} from "ws";
import _ from "lodash";
import qs from "querystring";
import url from "url";
const app: Express = express();

//initialize a simple http server, using express to handle requests
const server = createServer(app);

//initialize the WebSocket server instance
const wssOptions: ServerOptions = {
  server
};
const webSocketServer = new Server(wssOptions);

const sessions: any = {};

function handleMessage(event: MessageEvent) {
  try {
    const parsedData = JSON.parse(event.data as string);
    const webSocket = event.target;
    handleParsedMessage(webSocket, parsedData);
  } catch (error) {
    console.error(error);
  }
}

function handleParsedMessage(webSocketClient: WebSocket, request: string) {
  const playerId = _.get(webSocketClient, "id");
  const action = _.get(request, "action");
  const data = _.get(request, "data", null);

  switch (action) {
    case "GET_GAME_SESSIONS":
      webSocketClient.send(
        JSON.stringify({
          action: "UPDATE_STATE",
          path: "sessions",
          value: sessions
        })
      );
      break;
    case "CREATE_GAME_SESSION":
      createGameSession(webSocketClient, data);
      break;
    case "ADD_PLAYER_TO_GAME_SESSION":
      addPlayerToSession(webSocketClient, data);
      break;
    case "REMOVE_PLAYER_FROM_GAME_SESSION":
      removePlayerFromSession(webSocketClient, data);
      break;
    default:
      throw new Error(`${action} not implemented`);
  }
}

function createGameSession(webSocketClient: WebSocket, data: any) {
  const session = {
    name: data.name,
    players: {}
  };
  sessions[data.sessionId] = session;
  webSocketClient.send(
    JSON.stringify({
      action: "UPDATE_STATE",
      path: "sessions",
      value: sessions
    })
  );
}

function addPlayerToSession(webSocketClient: WebSocket, data: any) {
  const player = {
    client: webSocketClient,
    name: data.name,
    faction: "test faction"
  };
  const players = sessions[data.sessionId].players;
  players[data.playerId] = player;

  const response = JSON.stringify({
    action: "UPDATE_STATE",
    path: "sessions",
    value: sessions
  });

  notifyPlayers(players, response);
}

function removePlayerFromSession(webSocketClient: WebSocket, data: any) {
  _.unset(sessions[data.sessionId].players, `${data.playerId}`);
  if (data.sessionId == data.playerId) {
    console.log("host leaving the game");
  }

  const response = JSON.stringify({
    action: "UPDATE_STATE",
    path: "sessions",
    value: sessions
  });

  // update the player who left the session since he won't be in the players collection anymore
  webSocketClient.send(response);
  notifyPlayers(sessions[data.sessionId].players, response);
}

function notifyPlayers(players: any, response: any) {
  Object.entries(players).map(([id, player]: [string, any]) => {
    player.client.send(response);
  });
}

// Emitted when the handshake is complete
webSocketServer.on("connection", (webSocketClient: WebSocket, request: IncomingMessage) => {
  const parsedUrl = url.parse(request.url || "");
  const parseQs = qs.parse(parsedUrl.query || "");
  _.set(webSocketClient, "id", parseQs["id"]);
  webSocketClient.onmessage = handleMessage;

  webSocketClient.send(
    JSON.stringify({
      action: "UPDATE_STATE",
      path: "sessions",
      value: sessions
    })
  );
});

//start our server
server.listen(process.env.PORT || 3000, () => {
  const port = process.env.PORT || 3000;
  console.log(`Server started on port ${port}`);
  console.log(`local development, connect to: ws://localhost:3000 or if from emulator: ws://10.0.2.2:3000`)
});
