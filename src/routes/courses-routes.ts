import { Router } from "express";
import { CoursesController } from "../controllers/courses-controller";
import { compel } from "../middlewares/auth-middlewares"; 

const router = Router();

// GET
router.get("/", compel, CoursesController.HandleGetAll);
router.get("/:id", compel, CoursesController.HandleGetById);

// POST
router.post("/", compel, CoursesController.HandleCreate);

// PUT  
router.put("/:id", compel, CoursesController.HandleUpdate);

// DEL
router.delete("/:id", compel, CoursesController.HandleDelete);

export default router;