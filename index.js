const mongoose = require("mongoose");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");
const http = require("http");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const path = require("path");
const oneToOneMessage = require("./models/oneToOneMessage");

const server = http.createServer(app);

// creating the instance of io
const io = new Server(server, {
  cors: { origin: process.env.BASE_URL, methods: ["GET", "POST"] },
});

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1);
});

const DB = process.env.DBURI.replace("<password>", process.env.DBPASSWORD);

mongoose
  .connect(DB)
  .then((con) => {
    console.log("DB connection is successful");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// it is fired when client try to connect

io.on("connection", async (socket) => {
  // we can here implement middleware so that client send token with
  // emitter and in backend we verify or implement privacy issue

  const user_id = socket.handshake.query["user_id"];
  const socket_id = socket.id;

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, { socket_id, status: "Online" });
  }

  //   // socket event listeners here...

  socket.on("friend_request", async (data) => {
    console.log(data.to, "data to");
    //data =>> {to, from} =>> from =>> who is sending the friend request
    const to_user = await User.findById(data.to).select("socket_id");
    const from_user = await User.findById(data.from).select("socket_id");

    // create a friend request

    await FriendRequest.create({ sender: data.from, recipient: data.to });

    // io.to =>> here we used broadcast features of socket
    //emit event =>> new friend request
    io.to(to_user.socket_id).emit("new_friend_request", {
      message: "New Friend Request Received",
    });
    // emit event =>> request sent
    io.to(from_user.socket_id).emit("request_sent", {
      message: "Request sent successfully",
    });
  });

  //   // event emitter =>> for notify to accept the request
  socket.on("accept_request", async (data) => {
    console.log(data, "accept_request");
    const request_doc = await FriendRequest.findById(data.request_id);
    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);

    await sender.save({ new: true, validateModifiedOnly: true });
    await receiver.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    io.to(sender.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });

    io.to(receiver.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      const { messages } = await oneToOneMessage
        .findById(data.conversation_id)
        .select("messages");
      callback(messages);
    } catch (error) {
      console.log(error);
    }
  });

  //   // handle text/link messages

  socket.on("text_message", async (data) => {

    // data {to,from,message, conversation_id, type}
    const { message, conversation_id, from, to, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // message => {to, from, type, created_at, text, file}

    const new_message = {
      to: to,
      from: from,
      type: type,
      created_at: Date.now(),
      text: message,
    };

    // create a new conversation if it doesn't exist yet or add new message to the messages list
    const chat = await oneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });

    // emit incoming message =>> recipient user

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    // emit outgoing message =>>sender user
    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });
  });

  //   socket.on("file_message", async (data) => {
  //     console.log(data, "file_message");
  //     // data {to,from,text,file}
  //     // get the file extension

  //     const fileExtension = path.extname(data.file.name);

  //     // generate a unique file name
  //     const fileName = `${Date.now()}_${Math.floor(
  //       Math.random() * 10000
  //     )}${fileExtension}`;

  //     // upload file amazon s3

  //     // create a new conversation if it doesn't exist yet or add new message to the messages list

  //     // save to db

  //     // emit incoming message =>> recipient user

  //     // emit outgoing message =>>sender user
  //   });

  socket.on("get_direct_conversation", async ({ user_id }, callback) => {
    const existing_conversation = await oneToOneMessage
      .find({
        participants: { $all: [user_id] },
      })
      .populate("participants", "firstName lastName _id email status");
    callback(existing_conversation);
  });

  socket.on("start_conversation", async (data) => {
    // data =>> {to,from}

    const { to, from } = data;

    // checking it there is any existing conversation between these users
    const existing_conversation = await oneToOneMessage
      .find({
        participants: { $size: 2, $all: [to, from] },
      })
      .populate("participants", "firstName lastName _id email status");

    // if there is no existing_conversation
    if (existing_conversation.length === 0) {
      let new_chat = await oneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await oneToOneMessage
        .findById(new_chat._id)
        .populate("participants", "firstName lastName _id email status");
      socket.emit("start_chat", new_chat);
    }

    //  if there is existing_conversation
    else {
      socket.emit("start_chat", existing_conversation[0]);
    }
  });

  //   // disconnect the socket
  socket.on("end", async (data) => {
    // find user by id and set the status to offline
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, {
        status: "offline",
      });
    }

    // going to broadcast the user is disconnected
    console.log("Closing Connection");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1);
  });
});
