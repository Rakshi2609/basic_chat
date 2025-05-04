const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Serve public and uploads folder
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Image upload configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Route to handle image uploads
app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Socket.io logic
io.on("connection", (socket) => {
  socket.on("setUsername", (username) => {
    socket.username = username;
    socket.broadcast.emit("message", {
      sender: "Server",
      text: `${username} joined the chat.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  });

  socket.on("chatMessage", (text) => {
    io.emit("message", {
      sender: socket.username,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  });

  socket.on("imageMessage", (imageUrl) => {
    io.emit("image", {
      sender: socket.username,
      imageUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  });

  socket.on("typing", (name) => {
    socket.broadcast.emit("typing", name);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      socket.broadcast.emit("message", {
        sender: "Server",
        text: `${socket.username} left the chat.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
  });
});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running at http://localhost:3000");
});
