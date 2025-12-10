import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import exphbs from "express-handlebars";
import session from "express-session";
import flash from "connect-flash";

// Import routes
import projectRouter from "./routes/project.route.js";
import indexRouter from "./routes/index.route.js";
import authRouter from "./routes/auth.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import tagRouter from "./routes/tag.route.js";
import taskRouter from "./routes/task.route.js";
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
app.use(express.static(path.join(__dirname, "public")));

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

      formatDate: (time) => {
        if (!time) return "";
        const date = new Date(time);
        return date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

//  Cấu hình Session + Flash
app.use(
  session({
    secret: process.env.SESSION_SECRET || "lifesync_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 giờ
    },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.user = req.session.user_id
    ? { id: req.session.user_id, name: req.session.full_name }
    : null;
  next();
});

// Routes
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter); // route dashboard sau đăng nhập
app.use("/health", healthRouter);
app.use("/tags", tagRouter);
app.use("/tasks", taskRouter);
app.use("/projects", projectRouter);

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
