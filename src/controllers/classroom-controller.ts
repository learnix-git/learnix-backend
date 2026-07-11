import { Request, Response, NextFunction } from "express";
import { ClassroomService } from "../services/classroom-services";

export class ClassroomController {
  // ! GET /api/v1/classrooms

  /**
   * @returns
   * {
   *   success: true,
   *   data: [
   *     {
   *       id: "...",
   *       name: "...",
   *       code: "...",
   *       description: "...",
   *       teacher: "...",
   *       feed: "...",
   *       fee: 500000,
   *       grade: 12,
   *       capacity: 50,
   *       active: true,
   *       status: false,
   *       rating: 5.0
   *       created: "...",
   *       updated: "...",
   *       deleted: null,
   *       teacherRef: {
   *         name: "...",
   *         avatar: "..."
   *       }
   *     }
   *   ],
   *   pagination: {
   *     items: 10,
   *     pages: 1,
   *     current: 1,
   *     limit: 10
   *   }
   * }
  */

  static async HandleGetAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const current = Number(page);
      const skip = Number(limit);

      const result = await ClassroomService.HandleGetAll({ search: String(search || ""), page: current, limit: skip });

      return res.status(200).json({
        success: true,
        data: result,
        pagination: {
          items: 0,
          pages: 0,
          current: current,
          limit: limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ! GET /api/v1/classrooms/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 500000,
   *     capacity: 50,
   *     active: true,
   *     status: false,
   *     created: "...",
   *     updated: "...",
   *     deleted: null,
   *     rating: 5.0,
   *     joined: false,
   *     teacherRef: {
   *       name: "...",
   *       email: "...",
   *       avatar: "..."
   *     },
   *     members: [
   *       {
   *         id: "...",
   *         student: "...",
   *         studentRef: {
   *           name: "...",
   *           avatar: "..."
   *         }
   *       }
   *     ],
   *     exams: [
   *       {
   *         id: "...",
   *         title: "...",
   *         duration: 60,
   *         status: true,
   *         start: "...",
   *         end: "..."
   *       }
   *     ]
   *   }
   * }
  */

  static async HandleGetById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = res.locals.user.id;
      const result = await ClassroomService.HandleGetById(String(id), user);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! POST /api/v1/classrooms

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 0,
   *     grade: 1,
   *     capacity: 50,
   *     active: true,
   *     status: false,
   *     created: "...",
   *     updated: "...",
   *     deleted: null,
   *     rating: 0
   *   }
   * }
  */

  static async HandleCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const id =res.locals.user.id;
      const result = await ClassroomService.HandleCreate(id, req.body);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! PUT /api/v1/classrooms/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 500000,
   *     capacity: 50,
   *     active: true,
   *     status: false,
   *     created: "...",
   *     updated: "...",
   *     deleted: null
   *   }
   * }
  */

  static async HandleUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = res.locals.users.id;
      const result = await ClassroomService.HandleUpdate(String(id), user, req.body);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! DELETE /api/v1/classrooms/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 0,
   *     grade: 1,
   *     capacity: 50,
   *     active: true,
   *     status: false,
   *     created: "...",
   *     updated: "...",
   *     deleted: "..."
   *   }
   * }
  */

  static async HandleDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = res.locals.users.id;
      await ClassroomService.HandleDelete(String(id), user);

      return res.status(200).json({
        success: true
      });
    } catch (error) {
      next(error);
    }
  }
}