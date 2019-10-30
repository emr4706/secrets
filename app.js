//jshint esversion:6
require("dotenv").config(); //everytime write to top the phage
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//set up session
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

//////connect to the database////////

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true); //(node:1926) DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//// CREAT THE COLLECTION IN DATABASE /////////
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

////////GOOGLE LOGIN STRATEGY //////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //handle new user info endpoint "githup"
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

////////FACEBOOK LOGIN STRATEGY //////
passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

////////TWITTER LOGIN STRATEGY //////
// passport.use(new TwitterStrategy({
//   consumerKey: precess.env.CONSUMER_KEY,
//   consumerSecret: process.env.CONSUMER_SECRET,
//   callbackURL: "http://localhost:3000/auth/twitter/secrets"
// },
// function(token, tokenSecret, profile, cb) {
//   User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//     return cb(err, user);
//   });
// }
// ));

////////LOGIN WITH GOOGLE ///////////
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

///// LOGIN WITH FACEBOOK/////
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);


///// LOGIN WITH TWITTER/////
app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);;


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

///////for save the secrets in secrets page///////
app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } }, (err, foundUsers) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", { userWithSecrets: foundUsers });
      }
    }
  });
});

/////// for you go to submit page ///////
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

////// save user's secrets in database//////
app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

///// logout ////
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

////// register /////
app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

/////// login ////////
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, err => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: "/login" })(
        req,
        res,
        () => {
          res.redirect("/secrets");
        }
      );
    }
  });
});



app.listen(3000, () => {
  console.log("Server starter on http://localhost:3000");
});
