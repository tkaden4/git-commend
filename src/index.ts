import bodyParser from "body-parser";
import dot from "dotenv";
import express, { Handler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GithubStrategy } from "passport-github2";

const config = dot.config().parsed!;
const PORT: number = +config.PORT;
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;
const PASSPORT_SECRET = config.PASSPORT_SECRET;

function ensureAuthenticated(): Handler {
  return async (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  };
}

passport.use(
  new GithubStrategy(
    {
      clientSecret: CLIENT_SECRET,
      clientID: CLIENT_ID,
      callbackURL: "http://localhost:8888/callback",
    },
    (token: any, refresh: any, profile: any, done: any) => {
      return done(null, profile);
    }
  )
);

const app = express();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: PASSPORT_SECRET, resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", ensureAuthenticated(), async (req, res) => {
  res.json({ username: (req.user as any).username });
});

app.get("/login", passport.authenticate("github", { scope: ["user:email"] }));
app.get("/callback", passport.authenticate("github", { failureRedirect: "/login" }), async (req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
