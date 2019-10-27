//jshint esversion:6
require('dotenv').config();//everytime write to top the phage
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
// creat encryption 

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });//just encrypt the password

const User = new mongoose.model("User", userSchema);

//routs

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.listen(3000, () => {
  console.log("Server starter on http://localhost:3000");
});

//creat user database AND registration

app.post("/register", (req, res) => {
  let { username, password } = req.body;

  const newUser = new User({
    email: username,
    password: password
  });
  newUser
    .save()
    .then(() => {
      res.render("secrets");
    })
    .catch(err => {
      console.log(err);
    });
});
// find user in database then go to secrets page

app.post("/login", (req, res) => {
  let { username, password } = req.body;

  User.findOne({ email: username })
    .then((foundUser) => {
      if (foundUser.password === password) {
        res.render("secrets");
      }
    })
    .catch((err) => {
      console.log("Place write the correct email and password!");
    });
});

