# DUYDODEE-HD Architecture & Security Plan

## Project Overview

DUYDODEE-HD is a movie streaming web application with a secure admin panel for content management. The system separates public-facing content viewing from restricted administrative functions.

## System Architecture

### Frontend Structure

```
duydodee-hd/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          (หน้าแรก - ดูหนัง)
│   │   │   ├── MovieDetail.tsx   (หน้ารายละเอียดหนัง)
│   │   ├── components/
│   │   │   ├── MovieCard.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── firebase.ts       (Firebase config & helpers)
│   │   │   └── auth.ts           (Authentication logic)
│   │   ├── App.tsx
│   │   └── index.css
│   └── public/
│       └── (static assets)
```

## Firebase Setup

### Collections Structure

```
Firestore:
├── artifacts/
│   ├── {docId}
│   │   ├── title: string
│   │   ├── desc: string
│   │   ├── category: "vertical" | "series"
│   │   ├── poster: string (URL)
│   │   ├── badge: string
│   │   ├── isVip: boolean
│   │   ├── episodes: [
│   │   │   { url: string, title: string }
│   │   │ ]
│   │   ├── viewCount: number
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
```

## Security Rules

### Authentication Strategy

- **Public Access**: ทุกคนสามารถดูหนังได้โดยไม่ต้องล็อกอิน
- **Admin Access**: เฉพาะ duy.kan1234@gmail.com เท่านั้นที่สามารถแก้ไข/เพิ่ม/ลบข้อมูล
- **Login Method**: Google Sign-In (Firebase Authentication)

### Firestore Security Rules

```
1. Read (artifacts): ✅ Public - ทุกคนอ่านได้
2. Create (artifacts): ✅ Admin only - ต้อง email === 'duy.kan1234@gmail.com'
3. Update (artifacts): ✅ Admin only - ต้อง email === 'duy.kan1234@gmail.com'
   - Exception: viewCount สามารถอัปเดตได้จากทุกคน (ไม่ต้องล็อกอิน)
4. Delete (artifacts): ❌ Disabled - ต้องไปลบใน Firebase Console เท่านั้น
```

## Frontend Features

### Public Pages

1. **Home Page** - แสดงหนังทั้งหมด
   - Grid layout ของหนัง
   - Search & filter
   - Category tabs
   - VIP badge indicator

2. **Movie Detail Page** - ดูรายละเอียดและวิดีโอ
   - Video player
   - Episode list
   - Description
   - View counter

### Admin Features

1. **Admin Login** - Google Sign-In
   - Email verification (duy.kan1234@gmail.com only)
   - Auto-logout if not authorized

2. **Admin Dashboard**
   - Total views, series count, episodes count
   - Content management table

3. **Content Management**
   - Add/Edit/Delete movies
   - Manage episodes
   - Set VIP status
   - View all content

## Design System

### Color Palette

- **Primary**: #00e5ff (Cyan)
- **VIP**: #ffd700 (Gold)
- **Background**: #0a0a0c (Dark)
- **Text**: #ffffff (White)

### Typography

- Font: 'Prompt' (Thai-friendly)
- Weights: 300, 400, 500, 600, 700
