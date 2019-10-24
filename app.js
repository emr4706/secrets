//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const userSchema = {
    email: String,
    password: String
};

const User = mongoose.model("User", userSchema);

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
    newUser.save().then(() => {
        res.render("secrets");
    }).catch((err) => {
        console.log(err);
        
    });
});

app.post("/login", (req, res) => {
    let { username, password } = req.body;

    User.findOne({ email:username }).then(foundUser => {
       if (password===password){
           res.render("secrets");
       }
    }).catch((err) => {
        console.log(err);
        
    });
});