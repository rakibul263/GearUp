import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import apiRoutes from "./routes/index.js";


const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GearUp API is running");
});

app.get("/health", (req, res) => {
  try{
    res.status(200).json({ status: "success", message: "API is healthy" });
  }catch(error){
    res.status(500).json({ status: "error", message: "API is not healthy" });
  }
});

app.use("/api", apiRoutes)

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
