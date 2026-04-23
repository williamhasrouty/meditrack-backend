require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const { PORT, MONGODB_URI, NODE_ENV } = require("./config/config");
const { NotFoundError } = require("./errors/errors");

const app = express();

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? [
          "https://meditrack.jumpingcrab.com",
          "https://williamhasrouty.github.io",
        ]
      : "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting (more lenient in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === "production" ? 100 : 1000, // 100 in prod, 1000 in dev
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Root route
app.get("/", (req, res) => {
  res.status(200).send("MediTrack backend is running 🚀");
});

// Routes
app.use(routes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new NotFoundError("Requested resource not found"));
});

// Error logging
app.use(errorLogger);

// Custom error handler (now handles celebrate errors too)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
