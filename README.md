# LongTerm - Hệ thống quản lý cho thuê phòng trọ dài hạn

Ứng dụng web hiển thị danh sách các cơ sở cho thuê phòng trọ dài hạn. Dữ liệu đọc từ nhóm `long-term` trong Base **Siris Web** qua API phía server.

## Tính năng

- Hiển thị danh sách các cơ sở cho thuê với tab điều hướng
- Xem thông tin chi tiết từng cơ sở: địa chỉ, tiện ích, chính sách thuê
- Danh sách các loại phòng kèm hình ảnh, tiện ích và bảng giá
- Hỗ trợ hiển thị surcharge/discount theo ngày
- Đọc dữ liệu Lark Base qua Vercel Function
- Refresh giữ tab cơ sở và vị trí cuộn trong cùng phiên trình duyệt
- Responsive design, hỗ trợ mobile

## Công nghệ sử dụng

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (styling)
- **Lark Base** (dữ liệu)
- **Lucide React** (icons)
- **Motion** (animations)

## Chạy local

**Yêu cầu:** Node.js

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. App nội bộ **Siris Web Read Only** (`cli_aa5471c51ff85f02`) có quyền đọc Base (`bitable:app:readonly`) và thông tin Wiki node (`wiki:node:read`), đồng thời được thêm làm cộng tác viên **Can view** cho Siris Web.

3. Cấu hình các biến môi trường **chỉ phía server** trong Vercel (và `.env.local` khi chạy local):
   ```
   LARK_APP_ID=cli_aa5471c51ff85f02
   LARK_APP_SECRET=your_app_secret
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

   API tự đổi Wiki node `F8RAwt5OViGWYukD5Qalm7pVgQd` thành Base token. Nếu đã biết Base token, có thể đặt `LARK_BASE_TOKEN` để bỏ qua bước này (không cần scope Wiki). Ba bảng trong nhóm `long-term` đã có ID mặc định; có thể ghi đè bằng `LARK_BRANCHES_TABLE_ID`, `LARK_ROOMS_TABLE_ID`, `LARK_SETTINGS_TABLE_ID`.

   Không đặt secret trong biến `VITE_`. API public chỉ trả về những cột được phép của ba bảng `longterm_branches`, `longterm_room_types`, `longterm_settings` (chỉ dòng chính sách chung). API loại bỏ cơ sở ẩn, phòng ẩn và phòng thuộc cơ sở ẩn trước khi trả dữ liệu; phản hồi không được cache để trạng thái ẩn luôn cập nhật. Token xác thực được tái sử dụng đến gần hết hạn, Base token từ Wiki được lưu 5 phút trong tiến trình server; ba bảng được tải song song. Các yêu cầu Lark có thời gian chờ 15 giây. Ảnh lấy từ Cloudinary.

4. Chạy ứng dụng local, bao gồm `/api/properties`:
   ```bash
   npm run dev
   ```

   Mở `http://localhost:3000`. Khi chưa có `LARK_APP_SECRET`, API sẽ báo chưa được cấu hình.

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server tại port 3000 |
| `npm run build` | Build production |
| `npm run preview` | Preview bản build |
| `npm run lint` | Kiểm tra TypeScript |
| `npm run clean` | Xoá thư mục dist |

## Cấu trúc thư mục

```
src/
├── components/     # React components
│   ├── AmenityList.tsx
│   ├── GeneralPolicies.tsx
│   ├── PropertyCard.tsx
│   ├── RoomCard.tsx
│   └── SurchargeBanner.tsx
├── hooks/          # Custom hooks
│   └── useCloudinaryImages.ts
├── services/       # Data services
│   └── dataService.ts
├── App.tsx         # Component chính
├── main.tsx        # Entry point
├── types.ts        # TypeScript types
└── translations.ts # i18n
api/properties.js     # Lark serverless API
```
