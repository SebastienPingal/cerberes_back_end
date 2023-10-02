import express from "express";
import message_controller from "./messages.controller"

const router = express.Router();

router.get("/", message_controller.get_all_new_messages_of_user)
router.post("/", message_controller.create_message)
router.delete("/", message_controller.delete_messages)

export default router;
