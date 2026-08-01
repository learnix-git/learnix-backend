import { Request, Response } from 'express';
import { SubjectService } from '../services/subject-services';
import { GetSubjectsSchema } from '../validations/subject-validations';

export class SubjectController {
  // Hàm lấy danh sách môn học
  static async get_subjects(
    req: Request,
    res: Response
  ) {
    try {
      const validated = GetSubjectsSchema.parse(req.query);

      const subjects = await SubjectService.get_subjects(
        validated
      );

      res.status(200).json({
        code: 200,
        data: subjects,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        message:
          error.message ||
          "Không thể lấy danh sách môn học!",
      });
    }
  }
}