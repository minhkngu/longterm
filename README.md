# LongTerm - Hệ thống quản lý cho thuê phòng trọ dài hạn

Ứng dụng web hiển thị danh sách các cơ sở cho thuê phòng trọ dài hạn. Dữ liệu được đọc từ Supabase; hình ảnh được tải từ Cloudinary.

## Tính năng

- Hiển thị danh sách các cơ sở cho thuê với tab điều hướng
- Xem thông tin chi tiết từng cơ sở: địa chỉ, tiện ích, chính sách thuê
- Danh sách các loại phòng kèm hình ảnh, tiện ích và bảng giá
- Hỗ trợ hiển thị surcharge/discount theo ngày
- Đọc dữ liệu từ Supabase
- Refresh giữ tab cơ sở và vị trí cuộn trong cùng phiên trình duyệt
- Responsive design, hỗ trợ mobile

## Công nghệ sử dụng

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (styling)
- **Supabase** (dữ liệu)
- **Lucide React** (icons)
- **Motion** (animations)

## Chạy local

**Yêu cầu:** Node.js

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. Tạo file `.env.local` và cấu hình các biến sau (cũng đặt trong môi trường triển khai):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

   Khóa anon/publishable được đưa vào trình duyệt. Không sử dụng service role hoặc secret key; cấu hình quyền truy cập và RLS phù hợp cho các bảng công khai. Ứng dụng đọc `longterm_branches`, `longterm_room_types` (hoặc `rooms`) và các bảng tùy chọn `stay_discounts`, `amenities`, `branch_amenities`, `room_amenities`, `longterm_settings`, `date_adjustments`.

3. Chạy `npm run dev` và mở `http://localhost:3000`.

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
├── lib/            # Supabase client
├── services/       # Data services
│   └── dataService.ts
├── App.tsx         # Component chính
├── main.tsx        # Entry point
├── types.ts        # TypeScript types
└── translations.ts # i18n
```
