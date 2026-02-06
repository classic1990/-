import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  shareToFacebook,
  shareToTwitter,
  shareToLine,
  shareToWhatsApp,
  shareToTelegram,
  copyToClipboard,
  generateShareText,
  ShareData,
} from "@/lib/share";
import { toast } from "sonner";

interface ShareButtonProps {
  movie: {
    id: string;
    title: string;
    desc: string;
    poster?: string;
  };
}

export default function ShareButton({ movie }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData: ShareData = {
    title: movie.title,
    description:
      movie.desc.substring(0, 100) + (movie.desc.length > 100 ? "..." : ""),
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/movie/${movie.id}`,
    posterUrl: movie.poster,
  };

  const handleShare = (platform: string) => {
    try {
      switch (platform) {
        case "facebook":
          shareToFacebook(shareData);
          break;
        case "twitter":
          shareToTwitter(shareData);
          break;
        case "line":
          shareToLine(shareData);
          break;
        case "whatsapp":
          shareToWhatsApp(shareData);
          break;
        case "telegram":
          shareToTelegram(shareData);
          break;
      }
      toast.success(`แชร์ไปยัง ${platform} สำเร็จ`);
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast.error("เกิดข้อผิดพลาดในการแชร์");
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url);
    if (success) {
      setCopied(true);
      toast.success("คัดลอกลิงก์สำเร็จ");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  const handleCopyText = async () => {
    const text = generateShareText(shareData);
    const success = await copyToClipboard(text);
    if (success) {
      toast.success("คัดลอกข้อความสำเร็จ");
    } else {
      toast.error("คัดลอกข้อความไม่สำเร็จ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-cyan-500 hover:bg-cyan-600">
          <Share2 className="w-4 h-4" />
          แชร์
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">แชร์ "{movie.title}"</DialogTitle>
          <DialogDescription>
            เลือกช่องทางที่ต้องการแชร์ภาพยนตร์นี้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Facebook */}
            <button
              onClick={() => handleShare("facebook")}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-white">Facebook</span>
            </button>

            {/* Twitter */}
            <button
              onClick={() => handleShare("twitter")}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-white">Twitter</span>
            </button>

            {/* Line */}
            <button
              onClick={() => handleShare("line")}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-white">Line</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleShare("whatsapp")}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-white">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleShare("telegram")}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-white">Telegram</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-sm font-medium text-white">
                {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700"></div>

          {/* Copy Text Button */}
          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-white">
              คัดลอกข้อความ
            </span>
          </button>

          {/* Share Preview */}
          <div className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">{movie.title}</p>
            <p className="line-clamp-2">{shareData.description}</p>
            <p className="text-slate-500 truncate">{shareData.url}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
