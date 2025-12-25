import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import exphbs from "express-handlebars";
import session from "express-session";
import flash from "connect-flash";

import projectRouter from "./routes/project.route.js";
import indexRouter from "./routes/index.route.js";
import authRouter from "./routes/auth.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import tagRouter from "./routes/tag.route.js";
import taskRouter from "./routes/task.route.js";
import healthRouter from "./routes/health.route.js";
import { runMigrations } from "./configs/migrations.js";
import profileRouter from "./routes/profile.route.js";
import chatRouter from "./routes/chat.route.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hbs = exphbs.create({
  extname: ".hbs",
  layoutsDir: path.join(__dirname, "views/layouts"),
  partialsDir: path.join(__dirname, "views/partials"),
  defaultLayout: "main",
  helpers: {
    eq: (a, b) => a === b,
    json: (v) => JSON.stringify(v),
    formatTime: (time) => {
      if (!time) return "";
      const d = new Date(time);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    },
    formatDate: (time) => {
      if (!time) return "";
      const d = new Date(time);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "lifesync_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.toastMessage = req.flash("toastMessage")[0];
  res.locals.toastType = req.flash("toastType")[0];
  res.locals.user = req.session.user_id
    ? { id: req.session.user_id, name: req.session.full_name }
    : null;
  next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/health", healthRouter);
app.use("/tags", tagRouter);
app.use("/tasks", taskRouter);
app.use("/projects", projectRouter);
app.use("/profile", profileRouter);
app.use("/api/chat", chatRouter);

app.use((req, res) => {
  res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;

(async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`LifeSync running at http://localhost:${PORT}`);
  });
})();
