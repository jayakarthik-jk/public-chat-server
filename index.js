import express from "express";
import helmet from "helmet";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import c from "config";

const app = express();
app.use(helmet());
app.use(cors());
const server = http.createServer(app);

const port = c.get("port");
server.listen(port, () => {
  console.log(`Server started listening at port ${port}`);
});
const origin = c.get("origin");
const io = new Server(server, {
  cors: {
    origin,
  },
});

const roomId = c.get("roomId");
const room = [];
try {
  io.on("connection", (socket) => {
    socket.on("join_room", (username) => {
      room.push({ id: socket.id, name: username });
      socket.broadcast.to(roomId).emit("user_joined", username);
      socket.join(roomId);
    });
    socket.on("send_message", (message) => {
      socket.broadcast.to(roomId).emit("receive_message", message);
    });
    socket.on("disconnect", () => {
      const user = room.find((u) => u.id === socket.id);
      if (!user) return;
      const username = user.name || "User";
      const index = room.indexOf(user);
      room.splice(index, 1);
      socket.broadcast.to(roomId).emit("user_left", username);
    });
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
  });
} catch (error) {
  console.log(error);
}
