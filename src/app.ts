import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";


const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

export default app;
