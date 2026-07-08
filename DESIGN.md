# Learnix Backend - System Architecture & Design Standards

Tài liệu này định nghĩa tiêu chuẩn kiến trúc phần mềm, quy chuẩn thiết kế Database và giao thức giao tiếp cho hệ thống Backend của dự án **Learnix**.

---

## 1. Kiến trúc Tổng thể (3-Layer Layered Architecture)

Hệ thống bắt buộc tuân thủ kiến trúc 3 tầng phân tách trách nhiệm rõ ràng (Separation of Concerns):

```text
[Client / Next.js] 
       │              ──► HTTP REST / Socket.io
[Routes Layer]        
       │
[Controllers Layer]   
       │
[Services Layer]      
       │
[Data Access / ORM]   
```

### Quy tắc bất di bất dịch:
* **Route** KHÔNG ĐƯỢC chứa logic nghiệp vụ hay truy vấn DB.
* **Controller** KHÔNG ĐƯỢC viết câu lệnh SQL/Prisma trực tiếp, bắt buộc phải gọi qua **Service**.
* **Service** KHÔNG ĐƯỢC dính dáng đến `req`, `res` của HTTP Express (để có thể tái sử dụng logic trong Socket.io hoặc Cronjob).

---

## 2. Tiêu chuẩn Thiết kế Database (Prisma + Minimalist 1-Word)

Toàn bộ hệ thống cơ sở dữ liệu sử dụng **PostgreSQL** thông qua **Prisma ORM**, tuân thủ triết lý **"Minimalist 1-Word Naming"** và các chuẩn công nghiệp sau:

### 2.1. Quy tắc đặt tên (Naming Conventions)
* **Tên cột (Fields):** Tối giản đúng 1 từ tiếng Anh dễ hiểu, dùng camelCase (VD: `name`, `email`, `password`, `active`, `created`, `updated`, `deleted`).
* **Khóa ngoại (Foreign Keys):** Rút gọn thành tên đối tượng số ít (VD: `teacher`, `student`, `classroom`, `exam`).
* **Tên bảng (Models):** Viết hoa chữ cái đầu, số ít trong Prisma Schema, map sang tên số nhiều snake_case dưới DB bằng `@@map("users")`.

### 2.2. Trường bắt buộc (Mandatory Audit Fields)
Bất kỳ bảng nghiệp vụ nào cũng phải có bộ 3 trường kiểm toán thời gian:
* `created DateTime @default(now())`: Thời gian tạo.
* `updated DateTime @updatedAt`: Tự động cập nhật giờ sửa cuối.
* `deleted DateTime?`: Hỗ trợ **Soft Delete (Xóa mềm)**. Tuyệt đối không dùng lệnh `DELETE` xóa vĩnh viễn dữ liệu hệ thống; chỉ set timestamp vào cột `deleted`.

### 2.3. Cấu trúc linh hoạt với JSONB
Tận dụng sức mạnh của kiểu `Json` (JSONB trong Postgres) cho các dữ liệu động, thay vì tạo bảng con rời rạc:
* `options Json`: Lưu 4 đáp án `["A. ...", "B. ..."]` trong bảng `Question`.
* `solution Json`: Lưu đáp án đúng trong bảng `Question` (**Tuyệt đối giấu kín ở Backend**).
* `config Json`: Lưu cấu hình đề thi `{ "shuffle": true, "antiCheat": true }` trong bảng `Exam`.
* `answers Json`: Lưu chi tiết bài làm của học sinh trong bảng `Submission`.

---

## 3. Quy chuẩn API RESTful & Response Format

Toàn bộ API endpoints có tiền tố `/api/v1`. Dữ liệu trả về cho Frontend bắt buộc phải đóng gói theo 1 cấu trúc JSON chuẩn duy nhất:

### Thành công (200 OK / 201 Created):
```json
{
  "status": "SUCCESS",
  "message": "Nộp bài thi thành công!",
  "data": {
    "id": "sub_123",
    "score": 8.5
  },
  "meta": { "page": 1, "limit": 10, "total": 50 }
}
```

### Thất bại (400 Bad Request / 401 Unauthorized / 403 Forbidden / 500 Server Error):
```json
{
  "status": "ERROR",
  "message": "Thời gian làm bài đã hết, không thể nộp bài!",
  "errors": [
    { "field": "examId", "message": "ID đề thi không hợp lệ" }
  ]
}
```

---

## 4. Nghiệp vụ cốt lõi: Bảo mật & Chống gian lận (Azota Workflow)

1. **Bảo mật đáp án (`solution`):** Khi học sinh gọi API lấy đề thi (`GET /api/v1/exams/:id`), Service bắt buộc phải dùng lệnh `select` của Prisma để **loại bỏ hoàn toàn trường `solution`** trước khi trả data xuống Frontend.
2. **Khóa bảo vệ tầng (Never Trust Client):** Mọi request tạo lớp, nộp bài, chấm điểm đều phải đi qua middleware `authMiddleware` (kiểm tra JWT) và `roleMiddleware` (đúng Role `TEACHER` mới được tạo đề/chấm điểm).
3. **Realtime Socket.io:** Khi kết nối Socket.io cho phòng thi, phải xác thực Token JWT trong `socket.handshake.auth`. Lắng nghe event `CHEAT_WARNING` từ client để tự động cộng `cheats + 1` và đẩy vào cột `logs` của bảng `Submission`.