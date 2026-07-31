import { PrismaClient, State } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Sinh mã hợp đồng duy nhất
function genCode(prefix: string) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

export class ContractService {

  // ── Lấy hợp đồng của học sinh ────────────────────────────────────────────
  static async get_my_contracts_student(userId: string) {
    const student = await prisma.student.findUnique({ where: { user: userId } });
    if (!student) throw new Error('Bạn chưa có hồ sơ học sinh!');

    return prisma.contract.findMany({
      where: { learner: student.id },
      orderBy: { created: 'desc' },
      include: {
        teacher: {
          select: {
            id: true, rating: true,
            account: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        request: { select: { id: true, alias: true, title: true } },
        class:   { select: { id: true, alias: true, title: true } },
        bills:   { select: { id: true, type: true, phase: true, amount: true, status: true, created: true } },
      },
    });
  }

  // ── Lấy hợp đồng của gia sư ──────────────────────────────────────────────
  static async get_my_contracts_tutor(userId: string) {
    const tutor = await prisma.tutor.findUnique({ where: { user: userId } });
    if (!tutor) throw new Error('Bạn chưa có hồ sơ gia sư!');

    return prisma.contract.findMany({
      where: { tutor: tutor.id },
      orderBy: { created: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            account: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        request: { select: { id: true, alias: true, title: true } },
        class:   { select: { id: true, alias: true, title: true } },
        bills:   { select: { id: true, type: true, phase: true, amount: true, status: true, created: true } },
      },
    });
  }

  // ── Lấy chi tiết 1 hợp đồng ──────────────────────────────────────────────
  static async get_contract(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: {
          select: {
            id: true,
            account: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        teacher: {
          select: {
            id: true, rating: true, major: true,
            account: { select: { id: true, name: true, alias: true, avatar: true } },
          },
        },
        request: { select: { id: true, alias: true, title: true } },
        class:   { select: { id: true, alias: true, title: true } },
        bills:   { orderBy: { created: 'desc' } },
        items:   { orderBy: { start: 'asc' } },
        reviews: true,
      },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');

    // Kiểm tra quyền xem
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Người dùng không tồn tại!');

    const isStudent = contract.student.user.id === userId;
    const isTutor   = contract.teacher.user.id === userId;
    const isAdmin   = user.role === 'ADMIN';

    if (!isStudent && !isTutor && !isAdmin) {
      throw new Error('Bạn không có quyền xem hợp đồng này!');
    }

    return contract;
  }

  // ── Tạo hợp đồng mới (học sinh mời gia sư) ───────────────────────────────
  // Trạng thái ban đầu: PENDING (chờ gia sư đồng ý)
  static async create_contract(
    userId: string,
    data: {
      tutorId: string;      // ID của Tutor (bảng Tutor, không phải User)
      requestId?: string;   // Yêu cầu tìm gia sư (nếu có)
      postId?: string;      // Bài đăng của gia sư (nếu có)
      title: string;
      total: number;        // Học phí toàn tháng đầu
      count: number;        // Số buổi / tháng
    }
  ) {
    const student = await prisma.student.findUnique({ where: { user: userId } });
    if (!student) throw new Error('Bạn chưa có hồ sơ học sinh!');

    const tutor = await prisma.tutor.findUnique({ where: { id: data.tutorId } });
    if (!tutor) throw new Error('Gia sư không tồn tại!');

    // 30% học phí học sinh cọc + 30% phí nhận lớp gia sư cọc
    const depositRate = 0.3;
    const fee    = Number((data.total * depositRate).toFixed(2)); // 30% học phí → học sinh đặt cọc
    const income = Number((data.total * (1 - depositRate)).toFixed(2)); // 70% còn lại → trả sau tháng đầu

    const contract = await prisma.contract.create({
      data: {
        code:    genCode('HD'),
        learner: student.id,
        tutor:   tutor.id,
        need:    data.requestId ?? undefined,
        post:    data.postId    ?? undefined,
        title:   data.title,
        total:   data.total,
        fee,
        income,
        count:   data.count,
        status:  'PENDING',  // chờ gia sư đồng ý
        escrow:  'HOLD',
      },
    });

    return contract;
  }

  // ── Gia sư đồng ý hợp đồng ───────────────────────────────────────────────
  // Chuyển status: PENDING → OPEN
  // Cả 2 bên cần đặt cọc 30% trước khi lớp bắt đầu
  static async accept_contract(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { teacher: { select: { user: true } } },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');
    if (contract.teacher.user !== userId) throw new Error('Bạn không phải gia sư của hợp đồng này!');
    if (contract.status !== 'PENDING') throw new Error('Hợp đồng không ở trạng thái chờ duyệt!');

    return prisma.contract.update({
      where: { id: contractId },
      data: { status: 'OPEN' }, // OPEN = 2 bên đã đồng ý, chờ đặt cọc
    });
  }

  // ── Gia sư từ chối hợp đồng ──────────────────────────────────────────────
  static async reject_contract(contractId: string, userId: string, reason: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { teacher: { select: { user: true } } },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');
    if (contract.teacher.user !== userId) throw new Error('Bạn không phải gia sư của hợp đồng này!');
    if (contract.status !== 'PENDING') throw new Error('Hợp đồng không ở trạng thái chờ duyệt!');

    return prisma.contract.update({
      where: { id: contractId },
      data: { status: 'CANCEL', reason },
    });
  }

  // ── Hủy hợp đồng sau khi đã đặt cọc ─────────────────────────────────────
  // Quy tắc: bên nào hủy thì mất cọc 30%
  // status: ACTIVE → CANCEL, escrow: HOLD (cọc bị mất)
  static async cancel_contract(contractId: string, userId: string, reason: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: { select: { user: true } },
        teacher: { select: { user: true } },
        bills:   true,
      },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');

    const isStudent = contract.student.account.id === userId;
    const isTutor   = contract.teacher.account.id === userId;

    if (!isStudent && !isTutor) throw new Error('Bạn không có quyền hủy hợp đồng này!');

    // Chỉ hủy được khi đang ở trạng thái OPEN hoặc ACTIVE
    if (!['OPEN', 'ACTIVE'].includes(contract.status)) {
      throw new Error('Hợp đồng không thể hủy ở trạng thái này!');
    }

    // Tạo bản ghi phạt (penalty) cho bên hủy
    const penaltyAmount = Number(contract.fee); // = 30% học phí
    const penaltyDesc   = isStudent
      ? `Phạt hủy hợp đồng ${contract.code} – Học sinh hủy lớp`
      : `Phạt hủy hợp đồng ${contract.code} – Gia sư hủy lớp`;

    await prisma.payment.create({
      data: {
        code:   genCode('PNT'),
        owner:  userId,
        deal:   contractId,
        type:   'PENALTY',
        amount: penaltyAmount,
        desc:   penaltyDesc,
        status: 'DONE',
      },
    });

    return prisma.contract.update({
      where: { id: contractId },
      data:  { status: 'CANCEL', reason },
    });
  }

  // ── Hoàn thành tháng đầu (admin/system gọi sau xác nhận) ─────────────────
  // Học sinh thanh toán 70% còn lại, hệ thống chuyển cho gia sư
  static async complete_first_month(contractId: string, adminId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');
    if (contract.status !== 'ACTIVE') throw new Error('Hợp đồng chưa ở trạng thái hoạt động!');

    // Kiểm tra cọc đã đủ chưa (cả 2 bên đã đặt cọc 30%)
    const deposits = await prisma.payment.findMany({
      where: { deal: contractId, type: 'DEPOSIT', status: 'DONE' },
    });

    if (deposits.length < 2) {
      throw new Error('Cả 2 bên chưa hoàn thành đặt cọc!');
    }

    // Tạo thanh toán 70% còn lại từ học sinh
    const finalPayment = await prisma.payment.create({
      data: {
        code:   genCode('PAY'),
        owner:  adminId, // sẽ được thay bằng userId học sinh khi có cổng thanh toán
        deal:   contractId,
        type:   'PAYMENT',
        phase:  'FINAL',
        amount: Number(contract.income), // 70%
        desc:   `Thanh toán 70% học phí tháng đầu – Hợp đồng ${contract.code}`,
        status: 'PENDING',
      },
    });

    return finalPayment;
  }

  // ── Kết thúc hợp đồng ────────────────────────────────────────────────────
  static async finish_contract(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: { select: { user: true } },
        teacher: { select: { user: true } },
      },
    });

    if (!contract) throw new Error('Hợp đồng không tồn tại!');

    const isParty = [contract.student.user, contract.teacher.user].includes(userId);
    if (!isParty) throw new Error('Bạn không có quyền kết thúc hợp đồng này!');

    if (contract.status !== 'ACTIVE') throw new Error('Hợp đồng chưa đang hoạt động!');

    return prisma.contract.update({
      where: { id: contractId },
      data:  { status: 'DONE', escrow: 'RELEASE' },
    });
  }
}
