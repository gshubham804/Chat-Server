const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const routes = require("./routes/index");
const cookieParser = require("cookie-parser");

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(mongoSanitize());
//   app.use(xss());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // one hour in millisecond
  message: "Too many requests from this IP, Please try again in an hour",
});

app.use("/chatapp", limiter);

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, this is a simple Express API!');
});
app.use(routes);

module.exports = app;

// express-generator
// what is the use of views in this folder structure
// protected route and also check in luster backend repo
// learn how to make sending file in postman
// virtual fields in schema
// how to write good commit message (professional)
// fix ==>> calling the api again and again ==>> get-users, get-friends, get-requests
