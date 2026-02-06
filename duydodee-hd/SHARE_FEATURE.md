# 📱 Social Media Share Feature

## Overview

ระบบแชร์ภาพยนตร์ไปยังโซเชียลมีเดีย พร้อมฟังก์ชัน Copy Link

## Features

### Supported Platforms

- ✅ Facebook
- ✅ Twitter/X
- ✅ Line
- ✅ WhatsApp
- ✅ Telegram
- ✅ Copy Link
- ✅ Copy Text

## Implementation

### Files Added

#### 1. `client/src/lib/share.ts`

Utility functions สำหรับการแชร์:

- `shareToFacebook()` - แชร์ไปยัง Facebook
- `shareToTwitter()` - แชร์ไปยัง Twitter
- `shareToLine()` - แชร์ไปยัง Line
- `shareToWhatsApp()` - แชร์ไปยัง WhatsApp
- `shareToTelegram()` - แชร์ไปยัง Telegram
- `copyToClipboard()` - คัดลอกไปยัง clipboard
- `generateShareText()` - สร้างข้อความแชร์
- `generateShareableUrl()` - สร้าง URL ที่แชร์ได้

#### 2. `client/src/components/ShareButton.tsx`

React component สำหรับแสดง Share Dialog:

- Share Dialog Modal
- Social Media Buttons
- Copy Link Button
- Copy Text Button
- Share Preview

### Integration

#### MovieDetail Page

ปุ่ม Share ถูกเพิ่มในหน้ารายละเอียดหนัง:

```tsx
<ShareButton movie={movie} />
```

## Usage

### For Users

1. เปิดหน้ารายละเอียดหนัง
2. คลิกปุ่ม "แชร์"
3. เลือกช่องทางที่ต้องการแชร์:
   - Facebook
   - Twitter
   - Line
   - WhatsApp
   - Telegram
   - Copy Link
   - Copy Text

### Share Data

ข้อมูลที่แชร์ประกอบด้วย:

- ชื่อหนัง
- เรื่องย่อ (100 ตัวอักษรแรก)
- URL ของหนัง
- รูปโปสเตอร์ (ถ้ามี)

### Share Text Format

```
🎬 [ชื่อหนัง]

[เรื่องย่อ]

👉 ดูเลยที่: [URL]
```

## Technical Details

### ShareData Interface

```typescript
interface ShareData {
  title: string;
  description: string;
  url: string;
  posterUrl?: string;
}
```

### ShareButton Props

```typescript
interface ShareButtonProps {
  movie: {
    id: string;
    title: string;
    desc: string;
    poster?: string;
  };
}
```

## Social Media URLs

### Facebook Share

```
https://www.facebook.com/sharer/sharer.php?u=[URL]&quote=[TEXT]
```

### Twitter Share

```
https://twitter.com/intent/tweet?text=[TEXT]&url=[URL]&hashtags=[TAGS]
```

### Line Share

```
https://social-plugins.line.me/web/share?url=[URL]&text=[TEXT]
```

### WhatsApp Share

```
https://wa.me/?text=[TEXT]
```

### Telegram Share

```
https://t.me/share/url?url=[URL]&text=[TEXT]
```

## Features

### 1. Social Media Integration

- Direct links to social media platforms
- Pre-filled content
- Hashtags support

### 2. Copy to Clipboard

- Copy full share link
- Copy share text
- Visual feedback (Check icon)
- Toast notification

### 3. Share Dialog

- Modal dialog for share options
- Social media icons
- Share preview
- Responsive design

### 4. Error Handling

- Try-catch blocks
- Toast notifications for errors
- Console logging

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Security

- No sensitive data in share URLs
- No authentication required
- Public share links only
- Safe for all users

## Future Enhancements

1. **Analytics Tracking**
   - Track share counts
   - Track which platforms are used
   - User engagement metrics

2. **Custom Share Messages**
   - Allow users to customize share text
   - Add emojis
   - Add personal notes

3. **QR Code**
   - Generate QR code for movie
   - Share QR code image

4. **Email Share**
   - Share via email
   - Email templates

5. **Social Media Analytics**
   - Track shares per movie
   - Popular movies by shares
   - Share trends

## Troubleshooting

### Share button not working

- Check browser console for errors
- Verify social media URLs are correct
- Check if popups are blocked

### Copy to clipboard not working

- Check browser permissions
- Verify clipboard API support
- Check for HTTPS (required for clipboard API)

### Social media not opening

- Check if social media URLs are correct
- Verify internet connection
- Check browser popup settings

## Testing

### Manual Testing Checklist

- [ ] Facebook share works
- [ ] Twitter share works
- [ ] Line share works
- [ ] WhatsApp share works
- [ ] Telegram share works
- [ ] Copy link works
- [ ] Copy text works
- [ ] Share dialog appears
- [ ] Share preview displays correctly
- [ ] Toast notifications show
- [ ] Mobile responsive

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Documentation

- See `README.md` for project overview
- See `USAGE_GUIDE.md` for user guide
- See `FIREBASE_SETUP.md` for Firebase setup

## Support

For issues or questions about the share feature, check:

1. Browser console for errors
2. Network tab for failed requests
3. Social media platform documentation
