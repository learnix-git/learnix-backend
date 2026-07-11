import { Router } from "express";
import { ClassroomController } from "../controllers/classroom-controller";
import { compel } from "../middlewares/auth-middlewares"; 

const router = Router();

// GET
router.get("/", compel, ClassroomController.HandleGetAll);
router.get("/:id", compel, ClassroomController.HandleGetById);

// POST
router.post("/", compel, ClassroomController.HandleCreate);

// PUT  
router.put("/:id", compel, ClassroomController.HandleUpdate);

// DEL
router.delete("/:id", compel, ClassroomController.HandleDelete);

export default router;