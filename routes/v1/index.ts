import express, { Router } from "express";
import userRoute from "./user.route";
import authRoute from "./auth.route";
import mediaRoute from "./media.route";
import cors from "cors";

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}
router.use(cors());
router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/media", mediaRoute);
export default router;
