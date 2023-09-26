import express from "express";
import message_controller from "./messages.controller"

const router = express.Router();

router.get("/", message_controller.get_messages)
router.post("/", message_controller.create_message)

export default router;
