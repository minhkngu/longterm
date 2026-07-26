<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LongTerm - Hệ thống quản lý cho thuê phòng trọ dài hạn

Ứng dụng web hiển thị danh sách các cơ sở cho thuê phòng trọ dài hạn, bao gồm thông tin chi tiết về từng cơ sở, loại phòng, tiện ích, chính sách thuê và giá cả. Dữ liệu được đồng bộ từ Supabase.

## Tính năng

- Hiển thị danh sách các cơ sở cho thuê với tab điều hướng
- Xem thông tin chi tiết từng cơ sở: địa chỉ, tiện ích, chính sách thuê
- Danh sách các loại phòng kèm hình ảnh, tiện ích và bảng giá
- Hỗ trợ hiển thị surcharge/discount theo ngày
- Tích hợp Supabase để quản lý dữ liệu
- Responsive design, hỗ trợ mobile

## Công nghệ sử dụng

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (styling)
- **Supabase** (database & storage)
- **Lucide React** (icons)
- **Motion** (animations)

## Chạy local

**Yêu cầu:** Node.js

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. Tạo file `.env.local` với các biến môi trường:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Chạy ứng dụng:
   ```bash
   npm run dev
   ```

4. Mở trình duyệt tại `http://localhost:3000`

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
├── lib/            # Thư viện (Supabase client)
│   └── supabase.ts
├── services/       # Data services
│   └── dataService.ts
├── App.tsx         # Component chính
├── main.tsx        # Entry point
├── types.ts        # TypeScript types
└── translations.ts # i18n