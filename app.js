import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import exphbs from "express-handlebars";
import session from "express-session";
import flash from "connect-flash";

// 🧩 Import routes
import projectRouter from "./routes/project.route.js";
import indexRouter from "./routes/index.route.js";
import authRouter from "./routes/auth.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import tagRouter from "./routes/tag.route.js";
import taskRouter from "./routes/task.route.js";

// 🌸 Load environment variables
dotenv.config();
const app = express();

// 🧱 Lấy đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ Middleware cơ bản
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧁 Cấu hình static files
app.use(express.static(path.join(__dirname, "Public")));

// 🌸 Cấu hình Handlebars
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    defaultLayout: "main",
    helpers: {
      // So sánh giá trị
      eq: (a, b) => a === b,

      // 🕒 Định dạng giờ phút (12h format)
      formatTime: (time) => {
        if (!time) return "";
        const date = new Date(time);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },

      // 📅 Định dạng ngày (dd/mm/yyyy)
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

// 💾 Cấu hình Session + Flash
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

// 🧠 Biến toàn cục cho flash message và user session
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.user = req.session.user_id
    ? { id: req.session.user_id, name: req.session.full_name }
    : null;
  next();
});

// 🛣️ Đăng ký routes chính
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/tags", tagRouter);
app.use("/tasks", taskRouter);
app.use("/projects", projectRouter);


// 🚀 Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌸 LifeSync running at http://localhost:${PORT}`);
});
