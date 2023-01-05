import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import UserModel from "./models/user.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
session;
import Cors from "cors";
dotenv.config();

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(Cors(corsOptions));

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
  })
  .then((res) => {
    console.log("DB CONNECTED");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(
  session({
    secret: "gowtham",
    cookie: {},
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_URI,
    }),
  })
);

app.post("/", (req, res) => {
  req.session.user = req.body.email;
  console.log(req.body);
  UserModel.findOne({ email: req.body.email }, (err, result) => {
    if (err) {
      res.status(500).send(err);
    }
    if (!result) {
      console.log(result);
      UserModel.create(req.body)
        .then((result) => {
          const user = result;
          console.log("This is create user ", user);
          const token = jwt.sign(user.toJSON(), process.env.MY_SECRET, {
            expiresIn: "60s",
          });
          console.log("This is token ", token);
          res.cookie("token", token, {
            httpOnly: false,
          });
          res.status(201).send("Successfully created");
        })
        .catch((e) => {
          console.log(e);
        });
    }
    if (result) {
      if (result.password !== req.body.password) {
        result.status(403).send("Invalid Password");
      } else {
        const user = req.body;
        const token = jwt.sign(user.toJSON(), process.env.MY_SECRET, {
          expiresIn: "60s",
        });
        res.cookie("token", token, {
          httpOnly: false,
        });
      }
    }
  });
});

app.get("/", (req, res) => {
  console.log("This is cookies ", req.cookies);
  jwt.verify(req.cookies.token, process.env.MY_SECRET, (err, result) => {
    if (err) {
      res.status(404).send("Cannot find the credentials");
    } else {
      console.log("This is email ", result.email);
      res.status(200).send(result.email);
    }
  });
});

const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log("Localhost listening on", port);
});
