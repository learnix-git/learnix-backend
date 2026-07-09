import { Router } from "express";
import { ClassroomController } from "../controllers/classroom";
import { compel } from "../middlewares/auth"; 

const router = Router();

// GET
router.get("/", compel, ClassroomController.get_all_classroom);

// POST
router.post("/", compel, ClassroomController.create_classroom);

// PUT

// DEL

export default router;