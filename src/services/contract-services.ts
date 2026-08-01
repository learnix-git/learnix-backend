// GET /api/v1/contracts/my
// GET /api/v1/contracts/tutor
// GET /api/v1/contracts/:id

// POST /api/v1/contracts

// PATCH /api/v1/contracts/:id/accept
// PATCH /api/v1/contracts/:id/reject
// PATCH /api/v1/contracts/:id/cancel
// PATCH /api/v1/contracts/:id/finish

import { PrismaClient, State } from "@prisma/client";
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

// Hàm sinh mã hợp đồng duy nhất
function gen_code(
  prefix: string
) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${ts}-${rnd}`;
}

export class ContractService {
  // Hàm lấy hợp đồng của học sinh
  static async get_my_contracts_student(
    userId: string
  ) {
    const student = await prisma.student.findUnique({
      where: {
        user: userId,
      },
    });

    if (!student) {
      throw new Error(
        "Bạn chưa có hồ sơ học sinh!"
      );
    }

    return prisma.contract.findMany({
      where: {
        learner: student.id,
      },

      orderBy: {
        created: "desc",
      },

      include: {
        teacher: {
          select: {
            id: true,
            rating: true,

            account: {
              select: {
                id: true,
                name: true,
                alias: true,
                avatar: true,
              },
            },
          },
        },

        request: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        class: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        bills: {
          select: {
            id: true,
            type: true,
            phase: true,
            amount: true,
            status: true,
            created: true,
          },
        },
      },
    });
  }

  // Hàm lấy hợp đồng của gia sư
  static async get_my_contracts_tutor(
    userId: string
  ) {
    const tutor = await prisma.tutor.findUnique({
      where: {
        user: userId,
      },
    });

    if (!tutor) {
      throw new Error(
        "Bạn chưa có hồ sơ gia sư!"
      );
    }

    return prisma.contract.findMany({
      where: {
        tutor: tutor.id,
      },

      orderBy: {
        created: "desc",
      },

      include: {
        student: {
          select: {
            id: true,

            account: {
              select: {
                id: true,
                name: true,
                alias: true,
                avatar: true,
              },
            },
          },
        },

        request: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        class: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        bills: {
          select: {
            id: true,
            type: true,
            phase: true,
            amount: true,
            status: true,
            created: true,
          },
        },
      },
    });
  }

  // Hàm lấy chi tiết 1 hợp đồng
  static async get_contract(
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
            id: true,
            user: true,

            account: {
              select: {
                id: true,
                name: true,
                alias: true,
                avatar: true,
              },
            },
          },
        },

        teacher: {
          select: {
            id: true,
            user: true,
            rating: true,
            major: true,

            account: {
              select: {
                id: true,
                name: true,
                alias: true,
                avatar: true,
              },
            },
          },
        },

        request: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        class: {
          select: {
            id: true,
            alias: true,
            title: true,
          },
        },

        bills: {
          orderBy: {
            created: "desc",
          },
        },

        items: {
          orderBy: {
            start: "asc",
          },
        },

        reviews: true,
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    // Kiểm tra quyền xem
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error(
        "Người dùng không tồn tại!"
      );
    }

    const isStudent = contract.student.user === userId;
    const isTutor = contract.teacher.user === userId;
    const isAdmin = user.role === "ADMIN";

    if (!isStudent && !isTutor && !isAdmin) {
      throw new Error(
        "Bạn không có quyền xem hợp đồng này!"
      );
    }

    return contract;
  }

  // Hàm tạo hợp đồng mới, trạng thái ban đầu PENDING
  static async create_contract(
    userId: string,
    data: {
      tutorId: string;
      requestId?: string;
      postId?: string;
      title: string;
      total: number;
      count: number;
    }
  ) {
    const student = await prisma.student.findUnique({
      where: {
        user: userId,
      },
    });

    if (!student) {
      throw new Error(
        "Bạn chưa có hồ sơ học sinh!"
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: {
        id: data.tutorId,
      },
    });

    if (!tutor) {
      throw new Error(
        "Gia sư không tồn tại!"
      );
    }

    // 30% học phí học sinh cọc + 30% phí nhận lớp gia sư cọc
    const depositRate = 0.3;

    // 30% học phí → học sinh đặt cọc
    const fee = Number((data.total * depositRate).toFixed(2));

    // 70% còn lại → trả sau tháng đầu
    const income = Number((data.total * (1 - depositRate)).toFixed(2));

    const contract = await prisma.contract.create({
      data: {
        code: gen_code("HD"),
        learner: student.id,
        tutor: tutor.id,
        need: data.requestId ?? undefined,
        post: data.postId ?? undefined,
        title: data.title,
        total: data.total,
        fee,
        income,
        count: data.count,

        // Chờ gia sư đồng ý
        status: State.PENDING,
        escrow: "HOLD",
      },
    });

    return contract;
  }

  // Hàm gia sư đồng ý hợp đồng, chuyển status PENDING → OPEN
  static async accept_contract(
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

    if (contract.status !== State.PENDING) {
      throw new Error(
        "Hợp đồng không ở trạng thái chờ duyệt!"
      );
    }

    return prisma.contract.update({
      where: {
        id: contractId,
      },

      data: {
        // OPEN = 2 bên đã đồng ý, chờ đặt cọc
        status: State.OPEN,
      },
    });
  }

  // Hàm gia sư từ chối hợp đồng
  static async reject_contract(
    contractId: string,
    userId: string,
    reason: string
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

    if (contract.status !== State.PENDING) {
      throw new Error(
        "Hợp đồng không ở trạng thái chờ duyệt!"
      );
    }

    return prisma.contract.update({
      where: {
        id: contractId,
      },

      data: {
        status: State.CANCEL,
        reason,
      },
    });
  }

  // Hàm hủy hợp đồng sau khi đã đặt cọc, bên hủy sẽ mất cọc 30%
  static async cancel_contract(
    contractId: string,
    userId: string,
    reason: string
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

        bills: true,
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    const isStudent = contract.student.user === userId;
    const isTutor = contract.teacher.user === userId;

    if (!isStudent && !isTutor) {
      throw new Error(
        "Bạn không có quyền hủy hợp đồng này!"
      );
    }

    // Chỉ hủy được khi đang ở trạng thái OPEN hoặc ACTIVE
    const cancelable: State[] = [State.OPEN, State.ACTIVE];

    if (!cancelable.includes(contract.status)) {
      throw new Error(
        "Hợp đồng không thể hủy ở trạng thái này!"
      );
    }

    // Tạo bản ghi phạt cho bên hủy
    const penaltyAmount = Number(contract.fee); // = 30% học phí

    const penaltyDesc = isStudent
      ? `Phạt hủy hợp đồng ${contract.code} – Học sinh hủy lớp`
      : `Phạt hủy hợp đồng ${contract.code} – Gia sư hủy lớp`;

    await prisma.payment.create({
      data: {
        code: gen_code("PNT"),
        owner: userId,
        deal: contractId,
        type: "PENALTY",
        amount: penaltyAmount,
        desc: penaltyDesc,
        status: "DONE",
      },
    });

    return prisma.contract.update({
      where: {
        id: contractId,
      },

      data: {
        status: State.CANCEL,
        reason,
      },
    });
  }

  // Hàm hoàn thành tháng đầu, học sinh thanh toán 70% còn lại cho gia sư
  static async complete_first_month(
    contractId: string,
    adminId: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
      },
    });

    if (!contract) {
      throw new Error(
        "Hợp đồng không tồn tại!"
      );
    }

    if (contract.status !== State.ACTIVE) {
      throw new Error(
        "Hợp đồng chưa ở trạng thái hoạt động!"
      );
    }

    // Kiểm tra cọc đã đủ chưa
    const deposits = await prisma.payment.findMany({
      where: {
        deal: contractId,
        type: "DEPOSIT",
        status: "DONE",
      },
    });

    if (deposits.length < 2) {
      throw new Error(
        "Cả 2 bên chưa hoàn thành đặt cọc!"
      );
    }

    // Tạo thanh toán 70% còn lại từ học sinh
    const finalPayment = await prisma.payment.create({
      data: {
        code: gen_code("PAY"),

        // Sẽ được thay bằng userId học sinh khi có cổng thanh toán
        owner: adminId,

        deal: contractId,
        type: "PAYMENT",
        phase: "FINAL",

        // 70% học phí
        amount: Number(contract.income),

        desc: `Thanh toán 70% học phí tháng đầu – Hợp đồng ${contract.code}`,
        status: "PENDING",
      },
    });

    return finalPayment;
  }

  // Hàm kết thúc hợp đồng
  static async finish_contract(
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

    const isParty = [contract.student.user, contract.teacher.user].includes(
      userId
    );

    if (!isParty) {
      throw new Error(
        "Bạn không có quyền kết thúc hợp đồng này!"
      );
    }

    if (contract.status !== State.ACTIVE) {
      throw new Error(
        "Hợp đồng chưa đang hoạt động!"
      );
    }

    return prisma.contract.update({
      where: {
        id: contractId,
      },

      data: {
        status: State.DONE,
        escrow: "RELEASE",
      },
    });
  }
}