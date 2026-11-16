import http from "node:http";
import { WebSocketServer } from "ws";
import { handleConnection } from "./router.js";

const server = http.createServer((_req, res) => {
  res.writeHead(200);
  res.end("OK");
});

const wss = new WebSocketServer({ server });
wss.on("connection", handleConnection);

const port = Number(process.env.PORT ?? 8080);
server.listen(port, () => console.log(`Server on http://localhost:${port}`));
