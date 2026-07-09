import { Router } from "express";
import { ClassroomController } from "../controllers/classroom";
import { compel } from "../middlewares/auth"; 

const router = Router();

router.get("/", compel, ClassroomController.get_classroom);
router.post("/create", compel, ClassroomController.create_classroom);

export default router;