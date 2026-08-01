// GET   /api/v1/payments/my
// POST  /api/v1/payments/contracts/:id/student-deposit
// POST  /api/v1/payments/contracts/:id/tutor-deposit
// POST  /api/v1/payments/contracts/:id/pay-final
// PATCH /api/v1/payments/:id/confirm-payout

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// Hàm tạo mã giao dịch
function gen_code(
  prefix: string
) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${ts}-${rnd}`;
}

export class PaymentService {
  // Hàm lấy lịch sử thanh toán của user
  static async get_my_payments(
    userId: string
  ) {
    return prisma.payment.findMany({
      where: {
        owner: userId,
      },

      orderBy: {
        created: "desc",
      },

      include: {
        contract: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
          },
        },

        bank: {
          select: {
            id: true,
            name: true,
            number: true,
            holder: true,
          },
        },
      },
    });
  }

  // Hàm học sinh đặt cọc 30% học phí
  static async student_deposit(
    contractId: string,
    userId: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
      },

      include: {
        student: {
          select: {
            user: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    if (contract.student.user !== userId) {
      throw new Error(
        "Bạn không phải học sinh của hợp đồng này!"
      );
    }

    if (contract.status !== "OPEN") {
      throw new Error(
        "Hợp đồng chưa được gia sư đồng ý!"
      );
    }

    // Kiểm tra chưa đặt cọc
    const existing = await prisma.payment.findFirst({
      where: {
        deal: contractId,
        type: "DEPOSIT",
        owner: userId,
        status: "DONE",
      },
    });

    if (existing) {
      throw new Error(
        "Bạn đã đặt cọc rồi!"
      );
    }

    const payment = await prisma.payment.create({
      data: {
        code: gen_code("DEP"),
        owner: userId,
        deal: contractId,
        type: "DEPOSIT",
        phase: "FIRST",

        // 30% học phí
        amount: Number(contract.fee),

        desc: `Đặt cọc 30% học phí – Hợp đồng ${contract.code}`,

        // TODO: tích hợp cổng thanh toán thực tế → PENDING trước khi DONE
        status: "DONE",
      },
    });

    // Nếu cả 2 bên đều đã đặt cọc thì chuyển hợp đồng sang ACTIVE
    await this.try_activate_contract(contractId, userId, "student");

    return payment;
  }

  // Hàm gia sư đặt cọc 30% phí nhận lớp
  static async tutor_deposit(
    contractId: string,
    userId: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
      },

      include: {
        teacher: {
          select: {
            user: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    if (contract.teacher.user !== userId) {
      throw new Error(
        "Bạn không phải gia sư của hợp đồng này!"
      );
    }

    if (contract.status !== "OPEN") {
      throw new Error(
        "Hợp đồng chưa ở trạng thái chờ đặt cọc!"
      );
    }

    const existing = await prisma.payment.findFirst({
      where: {
        deal: contractId,
        type: "DEPOSIT",
        owner: userId,
        status: "DONE",
      },
    });

    if (existing) {
      throw new Error(
        "Bạn đã đặt cọc rồi!"
      );
    }

    const payment = await prisma.payment.create({
      data: {
        code: gen_code("DEP"),
        owner: userId,
        deal: contractId,
        type: "DEPOSIT",
        phase: "FIRST",

        // 30% học phí, cùng mức với học sinh
        amount: Number(contract.fee),

        desc: `Gia sư đặt cọc phí nhận lớp – Hợp đồng ${contract.code}`,
        status: "DONE",
      },
    });

    await this.try_activate_contract(contractId, userId, "tutor");

    return payment;
  }

  // Hàm học sinh thanh toán 70% còn lại sau tháng đầu
  static async student_pay_final(
    contractId: string,
    userId: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
      },

      include: {
        student: {
          select: {
            user: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    if (contract.student.user !== userId) {
      throw new Error(
        "Bạn không phải học sinh của hợp đồng này!"
      );
    }

    if (contract.status !== "ACTIVE") {
      throw new Error(
        "Hợp đồng chưa ở trạng thái hoạt động!"
      );
    }

    // Kiểm tra chưa thanh toán 70%
    const existing = await prisma.payment.findFirst({
      where: {
        deal: contractId,
        type: "PAYMENT",
        phase: "FINAL",
        status: "DONE",
      },
    });

    if (existing) {
      throw new Error(
        "Bạn đã thanh toán 70% rồi!"
      );
    }

    const payment = await prisma.payment.create({
      data: {
        code: gen_code("PAY"),
        owner: userId,
        deal: contractId,
        type: "PAYMENT",
        phase: "FINAL",

        // 70% học phí
        amount: Number(contract.income),

        desc: `Thanh toán 70% học phí tháng đầu – Hợp đồng ${contract.code}`,
        status: "DONE",
      },
    });

    // Tạo lệnh chuyển tiền cho gia sư
    const tutorAccount = await prisma.tutor.findUnique({
      where: {
        id: contract.tutor,
      },

      select: {
        user: true,
      },
    });

    if (tutorAccount) {
      await prisma.payment.create({
        data: {
          code: gen_code("OUT"),
          owner: tutorAccount.user,
          deal: contractId,
          type: "PAYOUT",
          phase: "FINAL",

          // Tổng gia sư nhận = 70% thanh toán cuối + 30% cọc học sinh − 30% cọc gia sư đã đặt
          amount: Number(contract.income),
          desc: `Hệ thống chuyển học phí tháng đầu – Hợp đồng ${contract.code}`,

          // Admin xác nhận trước khi chuyển
          status: "PENDING",
        },
      });
    }

    // Hợp đồng hoàn thành
    await prisma.contract.update({
      where: {
        id: contractId,
      },

      data: {
        status: "DONE",
        escrow: "RELEASE",
      },
    });

    return payment;
  }

  // Hàm nội bộ: kích hoạt hợp đồng khi cả 2 bên đã đặt cọc
  private static async try_activate_contract(
    contractId: string,
    _userId: string,
    _role: "student" | "tutor"
  ) {
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
      },

      include: {
        student: {
          select: {
            user: true,
          },
        },

        teacher: {
          select: {
            user: true,
          },
        },
      },
    });

    if (!contract || contract.status !== "OPEN") {
      return;
    }

    const deposits = await prisma.payment.findMany({
      where: {
        deal: contractId,
        type: "DEPOSIT",
        status: "DONE",
      },
    });

    // Kiểm tra cả 2 bên đều đã có record DEPOSIT
    const hasStudentDeposit = deposits.some(
      (d) => d.owner === contract.student.user
    );

    const hasTutorDeposit = deposits.some(
      (d) => d.owner === contract.teacher.user
    );

    if (hasStudentDeposit && hasTutorDeposit) {
      await prisma.contract.update({
        where: {
          id: contractId,
        },

        data: {
          status: "ACTIVE",
        },
      });
    }
  }

  // Hàm admin xác nhận payout cho gia sư
  static async confirm_payout(
    paymentId: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new Error(
        "Giao dịch không tồn tại!"
      );
    }

    if (payment.type !== "PAYOUT") {
      throw new Error(
        "Đây không phải giao dịch payout!"
      );
    }

    if (payment.status === "DONE") {
      throw new Error(
        "Giao dịch đã được xác nhận rồi!"
      );
    }

    return prisma.payment.update({
      where: {
        id: paymentId,
      },

      data: {
        status: "DONE",
      },
    });
  }
}