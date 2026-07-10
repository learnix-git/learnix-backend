import { Router } from "express";
import { ClassroomController } from "../controllers/classroom";
import { compel } from "../middlewares/auth"; 

const router = Router();

// GET
router.get("/", compel, ClassroomController.HandleGetAll);
router.get("/:id", compel, ClassroomController.HandleGetById);

// POST
router.post("/", compel, ClassroomController.HandleCreate);

// PUT  

// DEL

export default router;