import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import uploadRoute from "./routes/receipt.route";
dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Simple Express API");
});

app.use("/upload", uploadRoute);

export default app
