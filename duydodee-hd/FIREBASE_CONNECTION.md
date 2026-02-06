# 🔥 Firebase Connection Guide - DUYDODEE-HD

## ✅ การเชื่อมต่อ Firebase สำเร็จแล้ว!

โปรเจกต์นี้ได้ถูกตั้งค่าให้เชื่อมต่อกับ Firebase Project **"classic-e8ab7"** แล้ว

## 📋 สรุปการตั้งค่า

### Firebase Project Information

- **Project ID**: `classic-e8ab7`
- **Project Number**: `596308927760`
- **App ID**: `1:596308927760:web:63043fd2786459082cb195`
- **Admin Email**: `duy.kan1234@gmail.com`

### Collections ที่ใช้

- **`artifacts`** - เก็บข้อมูลหนัง/ซีรีส์
- **`comments`** - เก็บข้อมูลคอมเมนต์ (ถ้ามี)

## 🔧 การตั้งค่า Environment Variables (แนะนำ)

เพื่อความปลอดภัยและความยืดหยุ่น ควรใช้ environment variables แทนการ hardcode:

### 1. สร้างไฟล์ `.env` ใน root directory

```bash
# คัดลอกจาก .env.example
cp .env.example .env
```

### 2. แก้ไขค่าตามต้องการ

ไฟล์ `.env` จะมีหน้าตาแบบนี้:

```env
VITE_FIREBASE_API_KEY=AIzaSyBuhTA1YwcsNyxR0NLYW6JrxUQ9U7vyVeo
VITE_FIREBASE_AUTH_DOMAIN=classic-e8ab7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=classic-e8ab7
VITE_FIREBASE_STORAGE_BUCKET=classic-e8ab7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=596308927760
VITE_FIREBASE_APP_ID=1:596308927760:web:63043fd2786459082cb195
VITE_FIREBASE_MEASUREMENT_ID=G-RCDSPGQ5LE
VITE_ADMIN_EMAIL=duy.kan1234@gmail.com
```

### 3. Restart Development Server

```bash
# หยุด server (Ctrl+C) แล้วรันใหม่
pnpm dev
```

## 📁 ไฟล์ที่เกี่ยวข้อง

### `client/src/lib/firebase.ts`

ไฟล์หลักสำหรับการเชื่อมต่อ Firebase:

- ✅ ใช้ environment variables (พร้อม fallback เป็นค่า default)
- ✅ Type safety ที่ดีขึ้น
- ✅ Error handling ที่ครบถ้วน
- ✅ Performance optimization สำหรับ `incrementViewCount`

### `firestore.rules`

Security rules สำหรับ Firestore:

- ✅ Public read access
- ✅ Admin-only create/update
- ✅ View count สามารถอัปเดตได้โดยทุกคน
- ✅ Delete disabled (ต้องใช้ Firebase Console)

## 🚀 การใช้งาน

### ตรวจสอบการเชื่อมต่อ

1. **รัน development server**:

   ```bash
   pnpm dev
   ```

2. **เปิด browser console** (F12) และตรวจสอบ:
   - ไม่มี error เกี่ยวกับ Firebase
   - สามารถอ่านข้อมูลจาก Firestore ได้

3. **ทดสอบ Admin Panel**:
   - ไปที่ `/admin`
   - ล็อกอินด้วย Google Account (`duy.kan1234@gmail.com`)
   - ควรสามารถเพิ่ม/แก้ไขหนังได้

## 🔍 Troubleshooting

### ❌ Error: "Firebase: Error (auth/unauthorized-domain)"

**สาเหตุ**: Domain ไม่ได้ถูกเพิ่มใน Authorized domains

**วิธีแก้**:

1. ไปที่ Firebase Console > Authentication > Settings
2. เพิ่ม domain ในส่วน "Authorized domains"
3. สำหรับ local development: เพิ่ม `localhost`

### ❌ Error: "Permission denied"

**สาเหตุ**: Security Rules ไม่ถูกต้อง หรือ email ไม่ตรงกับ admin

**วิธีแก้**:

1. ตรวจสอบ Firestore Rules ใน Firebase Console
2. ตรวจสอบว่าใช้ email `duy.kan1234@gmail.com` ในการล็อกอิน
3. Deploy rules ใหม่: `firebase deploy --only firestore:rules`

### ❌ หนังไม่แสดง

**สาเหตุ**: ยังไม่มีข้อมูลใน Firestore

**วิธีแก้**:

1. ไปที่ Firebase Console > Firestore Database
2. เพิ่มข้อมูลตัวอย่างใน collection `artifacts`
3. หรือใช้ Admin Panel เพื่อเพิ่มข้อมูล

### ❌ Environment Variables ไม่ทำงาน

**สาเหตุ**: Vite ต้อง restart เมื่อเพิ่ม/แก้ไข `.env`

**วิธีแก้**:

1. หยุด development server (Ctrl+C)
2. รันใหม่: `pnpm dev`
3. ตรวจสอบว่าไฟล์ `.env` อยู่ใน root directory

## 📊 Firebase Services ที่ใช้

### ✅ Firestore Database

- เก็บข้อมูลหนัง/ซีรีส์
- Real-time updates ด้วย `onSnapshot`

### ✅ Firebase Authentication

- Google Sign-In สำหรับ Admin
- Email verification

### ✅ Firebase Hosting (Optional)

- สำหรับ deploy production

## 🔐 Security Best Practices

1. ✅ **Environment Variables**: ใช้ `.env` แทน hardcode
2. ✅ **Security Rules**: ตั้งค่า Firestore Rules อย่างถูกต้อง
3. ✅ **Admin Email**: ตรวจสอบ email ก่อนให้สิทธิ์ admin
4. ✅ **Error Handling**: จัดการ errors อย่างเหมาะสม

## 📝 Next Steps

1. ✅ เชื่อมต่อ Firebase สำเร็จแล้ว
2. ⏭️ เพิ่มข้อมูลหนังผ่าน Admin Panel
3. ⏭️ Deploy ไปยัง Firebase Hosting หรือ Vercel
4. ⏭️ ตั้งค่า Firebase Analytics (optional)

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**หมายเหตุ**: โปรเจกต์นี้ใช้ Firebase config ที่มี fallback เป็นค่า default ดังนั้นจะทำงานได้แม้ไม่มีไฟล์ `.env` แต่แนะนำให้ใช้ environment variables เพื่อความปลอดภัย
