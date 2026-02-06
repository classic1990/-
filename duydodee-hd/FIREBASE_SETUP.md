# Firebase Setup Guide - DUYDODEE-HD

## ขั้นตอนการตั้งค่า Firebase

### 1. สร้าง Firebase Project
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Create a new project"
3. ตั้งชื่อโปรเจค: `duydodee-hd`
4. เลือก "Realtime Database" หรือ "Firestore Database"

### 2. ตั้งค่า Firestore Database
1. ไปที่ Firestore Database
2. คลิก "Create database"
3. เลือก "Start in production mode"
4. เลือก region ที่ใกล้ที่สุด (เช่น asia-southeast1)

### 3. ตั้งค่า Security Rules
1. ไปที่ Firestore Database → Rules tab
2. คัดลอก content จากไฟล์ `firestore.rules` ในโปรเจค
3. คลิก "Publish"

### 4. ตั้งค่า Authentication
1. ไปที่ Authentication
2. คลิก "Get started"
3. เลือก "Google" provider
4. เปิดใช้งาน Google Sign-In
5. เพิ่ม authorized domains (เช่น localhost:3000 สำหรับการทดสอบ)

### 5. ตั้งค่า Firebase Config
Firebase config ถูกตั้งค่าแล้วในไฟล์ `client/src/lib/firebase.ts`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBuhTA1YwcsNyxR0NLYW6JrxUQ9U7vyVeo",
  authDomain: "classic-e8ab7.firebaseapp.com",
  projectId: "classic-e8ab7",
  storageBucket: "classic-e8ab7.firebasestorage.app",
  messagingSenderId: "596308927760",
  appId: "1:596308927760:web:63043fd2786459082cb195",
  measurementId: "G-RCDSPGQ5LE"
};
```

## Security Rules Explanation

### Artifacts Collection
```
- Read: ✅ Public - ทุกคนสามารถอ่านได้
- Create: ✅ Admin only (duy.kan1234@gmail.com)
- Update: ✅ Admin only, except viewCount
- Delete: ❌ Disabled (ต้องใช้ Firebase Console)
```

### Comments Collection
```
- Read: ✅ Public
- Create: ✅ Authenticated users
- Update: ✅ Authenticated users
- Delete: ✅ Only document owner
```

## Admin Email Configuration

ปัจจุบันตั้งค่าให้เฉพาะ `duy.kan1234@gmail.com` เท่านั้นที่สามารถเข้าถึง Admin Panel

**หากต้องการเปลี่ยน Admin Email:**
1. แก้ไขค่า `ADMIN_EMAIL` ในไฟล์ `client/src/lib/firebase.ts`
2. อัปเดต Security Rules ในไฟล์ `firestore.rules`
3. Deploy rules ใหม่ไปยัง Firebase Console

## Firestore Collections Structure

### artifacts
```
{
  title: string,
  desc: string,
  category: "vertical" | "series",
  poster: string (URL),
  badge: string,
  isVip: boolean,
  episodes: [
    { url: string, title: string }
  ],
  viewCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### comments
```
{
  userId: string,
  userName: string,
  text: string,
  movieId: string,
  likes: number,
  createdAt: timestamp
}
```

## Testing the Setup

### ทดสอบ Public Access
1. เปิดหน้าแรก (Home)
2. ตรวจสอบว่าหนังแสดงถูกต้อง
3. คลิกที่หนัง เพื่อดูรายละเอียด

### ทดสอบ Admin Access
1. คลิก "Admin" button
2. ล็อกอินด้วย Google
3. ตรวจสอบว่าแสดง Admin Panel ถูกต้อง
4. ลองเพิ่มหนังใหม่

### ทดสอบ Security
1. ล็อกอินด้วย email อื่น
2. ตรวจสอบว่าแสดง "Access Denied"
3. ตรวจสอบ Browser Console ว่าไม่มี error

## Deployment

### Deploy ไป Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init

# Deploy
firebase deploy
```

### Deploy ไป Vercel/Netlify
1. Build project: `pnpm build`
2. Deploy dist folder ไปยัง Vercel/Netlify

## Troubleshooting

### Error: "Permission denied"
- ตรวจสอบ Security Rules ว่าถูกต้อง
- ตรวจสอบ email ที่ใช้ล็อกอิน

### Error: "Firebase config not found"
- ตรวจสอบว่า Firebase config ถูกตั้งค่าในไฟล์ firebase.ts

### Movies ไม่แสดง
- ตรวจสอบ Firestore Database ว่ามีข้อมูล
- ตรวจสอบ Browser Console ว่ามี error
- ตรวจสอบ Network tab ว่า request ไปถึง Firebase

## Support

หากมีปัญหา ให้ตรวจสอบ:
1. Firebase Console logs
2. Browser Console (F12)
3. Network tab ใน Developer Tools
