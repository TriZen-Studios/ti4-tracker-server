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

const lobby = {};

function handleMessage(event: MessageEvent) {
  try {
    const data = event.data as string;
    const webSocket = event.target;
    handleParsedMessage(webSocket, JSON.parse(data));
  } catch (error) {
    console.error(error);
  }
}

function handleParsedMessage(webSocket: WebSocket, json: string) {
  const playerId = _.get(webSocket, "id");
  const action = _.get(json, "action");

  switch (action) {
    case "CREATE_LOBBY":
    case "JOIN_LOBBY":
    default:
      throw new Error(`${action} not implemented`);
  }
}

// Emitted when the handshake is complete
webSocketServer.on("connection", (webSocket: WebSocket, request: IncomingMessage) => {
  const parsedUrl = url.parse(request.url || "");
  const parseQs = qs.parse(parsedUrl.query || "");
  _.set(webSocket, "id", parseQs["id"]);
  webSocket.onmessage = handleMessage;
  webSocket.send("connected");
});

// Emitted when an error occurs on the underlying server.
webSocketServer.on("error", console.error);

//start our server
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started`);
});
