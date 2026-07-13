import { Request, Response, NextFunction } from "express";
import { CoursesService } from "../services/courses-services";

export class CoursesController {
  // ! GET /api/v1/courses

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
   *       thumbnail: "...",
   *       teacher: "...",
   *       feed: "...",
   *       fee: 500000,
   *       grade: 12,
   *       active: true,
   *       status: false,
   *       rating: 5.0,
   *       created: "...",
   *       updated: "...",
   *       deleted: null,
   *       teacherRef: {
   *         name: "...",
   *         avatar: "...",
   *         bio: "...",
   *         degree: "..."
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

      const result = await CoursesService.HandleGetAll({ search: String(search || ""), page: current, limit: skip });

      return res.status(200).json({
        success: true,
        data: result.courses,
        pagination: {
          items: result.items,
          pages: result.pages,
          current: current,
          limit: skip
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ! GET /api/v1/courses/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     thumbnail: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 500000,
   *     grade: 12,
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
   *       avatar: "...",
   *       bio: "...",
   *       degree: "..."
   *     },
   *     chapters: [
   *       {
   *         id: "...",
   *         title: "...",
   *         created: "...",
   *         lessons: [
   *           {
   *             id: "...",
   *             title: "...",
   *             video: "...",
   *             content: "...",
   *             created: "..."
   *           }
   *         ]
   *       }
   *     ],
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
      const result = await CoursesService.HandleGetById(String(id), user);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! POST /api/v1/courses

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     thumbnail: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 0,
   *     grade: 1,
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
      const id = res.locals.user.id;
      const result = await CoursesService.HandleCreate(id, req.body);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! PUT /api/v1/courses/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     thumbnail: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 500000,
   *     grade: 12,
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
      const user = res.locals.user.id;
      const result = await CoursesService.HandleUpdate(String(id), user, req.body);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ! DELETE /api/v1/courses/:id

  /**
   * @returns
   * {
   *   success: true,
   *   data: {
   *     id: "...",
   *     name: "...",
   *     code: "...",
   *     description: "...",
   *     thumbnail: "...",
   *     teacher: "...",
   *     feed: "...",
   *     fee: 0,
   *     grade: 1,
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
      const user = res.locals.user.id;
      await CoursesService.HandleDelete(String(id), user);

      return res.status(200).json({
        success: true
      });
    } catch (error) {
      next(error);
    }
  }
}