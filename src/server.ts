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

const DUMMY_SESSIONS = [
  {
    data: ["session #1"]
  },
  {
    data: ["session #2"]
  }
];
function handleMessage(event: MessageEvent) {
  try {
    const data = event.data as string;
    const webSocket = event.target;
    handleParsedMessage(webSocket, JSON.parse(data));
  } catch (error) {
    console.error(error);
  }
}

function handleParsedMessage(webSocketClient: WebSocket, json: string) {
  const playerId = _.get(webSocketClient, "id");
  const action = _.get(json, "action");

  let payload: any = {
    action: null,
    data: null
  };

  switch (action) {
    case "GET_GAME_SESSIONS":
      payload = _.merge({}, payload, {
        data: DUMMY_SESSIONS,
        action
      });
      break;
    default:
      throw new Error(`${action} not implemented`);
  }

  webSocketClient.send(JSON.stringify(payload));
}

// Emitted when the handshake is complete
webSocketServer.on("connection", (webSocketClient: WebSocket, request: IncomingMessage) => {
  const parsedUrl = url.parse(request.url || "");
  const parseQs = qs.parse(parsedUrl.query || "");
  _.set(webSocketClient, "id", parseQs["id"]);
  webSocketClient.onmessage = handleMessage;

  webSocketClient.send("connected");
});

// Emitted when an error occurs on the underlying server.
webSocketServer.on("error", console.error);

//start our server
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started`);
});
