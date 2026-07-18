import app from './app';
import { createServer } from "http";
import { initSocket } from "./sockets/init";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});