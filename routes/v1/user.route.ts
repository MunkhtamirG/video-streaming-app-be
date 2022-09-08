import express, { Router } from "express";
import { userController } from "../../modules/user";

const router: Router = express.Router();

router.post("/", userController.createUser);

router.post("/update/:id", userController.updateUser);

router.get("/:id", userController.getUserById);

router.get("/", userController.getUsers);

router.post("/playlist", userController.addPlaylist);

router.post("/removeplaylist", userController.removePlaylist);

export default router;
