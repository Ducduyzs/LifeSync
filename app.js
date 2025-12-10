import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import exphbs from "express-handlebars";
import session from "express-session";
import flash from "connect-flash";
import indexRouter from "./routes/index.route.js";
import authRouter from "./routes/auth.route.js";
import tagRouter from "./routes/tag.route.js";
import taskRouter from "./routes/task.route.js";

import dashboardRouter from "./routes/dashboard.route.js"; // ⚡ thêm route dashboard
import healthRouter from "./routes/health.route.js";
import { runMigrations } from "./configs/migrations.js";






dotenv.config();
const app = express();

// Đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware cơ bản
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "Public")));

// Handlebars setup
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    defaultLayout: "main",
    helpers: {
      eq: (a, b) => a === b,
      formatTime: (time) => {
        if (!time) return "";
        const date = new Date(time);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
      formatDate: (date) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Session + Flash
app.use(
  session({
    secret: "lifesync_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Flash messages
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter); // route dashboard sau đăng nhập
app.use("/health", healthRouter);
app.use("/tags", tagRouter);
app.use("/tasks", taskRouter);

// 404
app.use((req, res) => {
  res.status(404).render("404", { layout: false }, (err, html) => {
    if (err) {
      res.send("<h1>404 Not Found</h1><p>The page you're looking for does not exist.</p>");
    } else {
      res.send(html);
    }
  });
});

//Start server
const PORT = process.env.PORT || 3000;

// Run migrations before starting server
(async () => {
  await runMigrations();
  
  app.listen(PORT, () =>
    console.log(`LifeSync running at http://localhost:${PORT}`)
  );
})();
