# DUYDODEE-HD - Movie Streaming Platform

เว็บไซต์ดูหนังออนไลน์พร้อมระบบจัดการเนื้อหา (Admin Panel) ที่ปลอดภัย

## 🎬 Features

### Public Features
- ✅ ดูหนังออนไลน์ฟรี (ไม่ต้องล็อกอิน)
- ✅ ค้นหาและกรองหนังตามหมวดหมู่
- ✅ ดูรายละเอียดและวิดีโอ
- ✅ เพิ่มเข้ารายการโปรด (localStorage)
- ✅ นับยอดวิว

### Admin Features
- ✅ เข้าสู่ระบบด้วย Google (ปลอดภัย)
- ✅ เพิ่ม/แก้ไข/ลบหนัง
- ✅ จัดการตอนวิดีโอ
- ✅ ตั้งค่า VIP badge
- ✅ ดูสถิติ (ยอดวิว, จำนวนซีรีส์, จำนวนตอน)

## 🔐 Security

- **Public Access**: ทุกคนสามารถดูหนังได้
- **Admin Access**: เฉพาะ `duy.kan1234@gmail.com` เท่านั้น
- **Authentication**: Google Sign-In (Firebase Auth)
- **Database**: Firestore with Security Rules
- **Delete Protection**: ลบได้เฉพาะผ่าน Firebase Console เท่านั้น

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Sign-In)
- **Build Tool**: Vite
- **UI Components**: shadcn/ui

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🚀 Deployment

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

### Vercel/Netlify
1. Build: `pnpm build`
2. Deploy `dist` folder

## 📋 Firebase Setup

ดูรายละเอียดการตั้งค่า Firebase ใน [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Quick Setup
1. สร้าง Firebase Project
2. ตั้งค่า Firestore Database
3. ตั้งค่า Authentication (Google)
4. Deploy Security Rules จากไฟล์ `firestore.rules`

## 📁 Project Structure

```
duydodee-hd/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx           # หน้าแรก
│   │   │   ├── MovieDetail.tsx    # หน้ารายละเอียด
│   │   │   ├── AdminPanel.tsx     # หน้าแอดมิน
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── MovieCard.tsx
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── lib/
│   │   │   └── firebase.ts       # Firebase config & helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   └── index.html
├── firestore.rules               # Security rules
├── FIREBASE_SETUP.md             # Firebase setup guide
├── ARCHITECTURE.md               # Architecture documentation
└── README.md
```

## 🎨 Design

- **Theme**: Dark mode (Slate + Cyan)
- **Typography**: Prompt font (Thai-friendly)
- **Layout**: Responsive grid layout
- **Colors**:
  - Primary: Cyan (#00e5ff)
  - VIP: Gold (#ffd700)
  - Background: Dark Slate (#0a0a0c)

## 📝 Usage

### Viewing Movies
1. เปิดหน้าแรก
2. ค้นหาหรือกรองหนัง
3. คลิกที่หนังเพื่อดูรายละเอียด
4. เลือกตอนและดูวิดีโอ

### Managing Content (Admin)
1. คลิก "Admin" button
2. ล็อกอินด้วย Google
3. เพิ่ม/แก้ไข/ลบหนัง
4. ตั้งค่า VIP status
5. จัดการตอนวิดีโอ

## 🔧 Configuration

### Change Admin Email
แก้ไข `ADMIN_EMAIL` ใน `client/src/lib/firebase.ts`:

```typescript
export const ADMIN_EMAIL = "your-email@gmail.com";
```

จากนั้นอัปเดต Security Rules ใน `firestore.rules`

## 🐛 Troubleshooting

### Movies not showing
- ตรวจสอบ Firestore Database ว่ามีข้อมูล
- ตรวจสอบ Browser Console ว่ามี error
- ตรวจสอบ Security Rules

### Admin login not working
- ตรวจสอบ Firebase Authentication setup
- ตรวจสอบ Google OAuth configuration
- ตรวจสอบ authorized domains

### Video not playing
- ตรวจสอบ URL ของวิดีโอ
- ตรวจสอบ CORS settings
- ลองใช้ embed URL แทน direct URL

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - โครงสร้างโปรเจค
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - การตั้งค่า Firebase
- [firestore.rules](./firestore.rules) - Security Rules

## 📄 License

MIT License

## 👤 Author

Created for DUYDODEE-HD Movie Platform

---

**Note**: ระบบนี้ใช้ Firebase Firestore สำหรับเก็บข้อมูล และ Google Sign-In สำหรับ Authentication ดังนั้นจึงต้องมี Firebase Project และ Google OAuth setup ก่อนใช้งาน
