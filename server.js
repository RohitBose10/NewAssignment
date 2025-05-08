const express = require("express");
const path = require("path");
require("dotenv").config();
const db = require("./config/db");
const session = require("express-session");
const flash = require("connect-flash");

const app = express();

// View Engine Setup
app.set("view engine", "ejs");
app.set("views", "views");

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Middleware
app.use(
  session({
    secret: "MyS3CR3T#@!@CGGmn",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Flash Messages
app.use(flash());

// Auth Middleware Setup
app.use((req, res, next) => {
  let auth = require("./middlewares/auth")(req, res, next);
  app.use(auth.initialize());

  if (req.session.token && req.session.token !== null) {
    req.headers["token"] = req.session.token;
  }

  res.locals.success_message = req.flash("success");
  res.locals.error_message = req.flash("error");

  next();
});

// Routes
app.use(require("./routes/user.routes"));

// Server
app.listen(process.env.PORT, async () => {
  await db.connectDb();
  console.log(`Server is running on http://127.0.0.1:${process.env.PORT}`);
});
