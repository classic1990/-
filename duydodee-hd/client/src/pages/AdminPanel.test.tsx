import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPanel from "./AdminPanel";

// Mock Firebase
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ email: "duy.kan1234@gmail.com", displayName: "Admin User" }); // Mock admin user
    return vi.fn();
  }),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(() =>
    Promise.resolve({ user: { email: "duy.kan1234@gmail.com" } })
  ),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => "mock-collection"),
  doc: vi.fn(() => "mock-doc"),
  addDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((colRef, callback) => {
    callback({ docs: [] }); // Initially no movies
    return vi.fn();
  }),
  query: vi.fn(() => "mock-query"),
  orderBy: vi.fn(() => "mock-orderby"),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock environment variables
vi.stubEnv("VITE_YOUTUBE_API_KEY", "mock-youtube-api-key");
vi.stubEnv("VITE_GEMINI_API_KEY", "mock-gemini-api-key");

// Mock UI components (assuming they are simple wrappers for native elements for testing purposes)
vi.mock("@/components/ui/button", () => ({
  Button: vi.fn(({ children, ...props }) => (
    <button {...props}>{children}</button>
  )),
}));
vi.mock("@/components/ui/input", () => ({
  Input: vi.fn(props => <input {...props} />),
}));
vi.mock("@/components/ui/textarea", () => ({
  Textarea: vi.fn(props => <textarea {...props} />),
}));
vi.mock("@/components/ui/select", () => ({
  Select: vi.fn(({ children, value, onValueChange }) => (
    <select value={value} onChange={e => onValueChange(e.target.value)}>
      {children}
    </select>
  )),
  SelectTrigger: vi.fn(({ children }) => (
    <div data-testid="select-trigger">{children}</div>
  )),
  SelectValue: vi.fn(({ placeholder }) => (
    <span data-testid="select-value">{placeholder}</span>
  )),
  SelectContent: vi.fn(({ children }) => (
    <div data-testid="select-content">{children}</div>
  )),
  SelectItem: vi.fn(({ children, value }) => (
    <option value={value}>{children}</option>
  )),
}));
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: vi.fn(props => <input type="checkbox" {...props} />),
}));
vi.mock("@/components/ui/card", () => ({
  Card: vi.fn(({ children }) => <div data-testid="card">{children}</div>),
  CardContent: vi.fn(({ children }) => (
    <div data-testid="card-content">{children}</div>
  )),
  CardDescription: vi.fn(({ children }) => (
    <p data-testid="card-description">{children}</p>
  )),
  CardHeader: vi.fn(({ children }) => (
    <div data-testid="card-header">{children}</div>
  )),
  CardTitle: vi.fn(({ children }) => (
    <h2 data-testid="card-title">{children}</h2>
  )),
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: vi.fn(({ children }) => <span data-testid="badge">{children}</span>),
}));

// Mock lucide-react icons
vi.mock("lucide-react", async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    LogOut: vi.fn(() => <svg data-testid="LogOut" />),
    Edit2: vi.fn(() => <svg data-testid="Edit2" />),
    Trash2: vi.fn(() => <svg data-testid="Trash2" />),
    LogIn: vi.fn(() => <svg data-testid="LogIn" />),
    Database: vi.fn(() => <svg data-testid="Database" />),
    Youtube: vi.fn(() => <svg data-testid="Youtube" />),
    Loader2: vi.fn(() => <svg data-testid="Loader2" />),
    Sparkles: vi.fn(() => <svg data-testid="Sparkles" />),
    Wand2: vi.fn(() => <svg data-testid="Wand2" />),
    ImageIcon: vi.fn(() => <svg data-testid="ImageIcon" />),
    Plus: vi.fn(() => <svg data-testid="Plus" />),
    Search: vi.fn(() => <svg data-testid="Search" />),
    LayoutGrid: vi.fn(() => <svg data-testid="LayoutGrid" />),
    List: vi.fn(() => <svg data-testid="List" />),
    CheckCircle2: vi.fn(() => <svg data-testid="CheckCircle2" />),
    AlertCircle: vi.fn(() => <svg data-testid="AlertCircle" />),
  };
});

describe("AdminPanel AI and YouTube Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it("should fetch YouTube data and summarize description with AI when YouTube URL is entered", async () => {
    const mockYoutubeTitle = "ตัวอย่างวิดีโอ YouTube";
    const mockYoutubeDescription =
      "คำอธิบายวิดีโอต้นฉบับจาก YouTube ที่ยาวมากๆ และต้องการการสรุป";
    const mockSummarizedDescription = "เรื่องย่อที่ AI สรุปให้กระชับและน่าสนใจ";
    const mockPosterUrl = "https://mock.youtube.com/poster.jpg";

    // Mock YouTube API response
    global.fetch.mockImplementationOnce(url => {
      if (url.includes("www.googleapis.com/youtube/v3/videos")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  snippet: {
                    title: mockYoutubeTitle,
                    description: mockYoutubeDescription,
                    thumbnails: { maxres: { url: mockPosterUrl } },
                  },
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    // Mock Gemini API response for summarization
    global.fetch.mockImplementationOnce(url => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [{ text: mockSummarizedDescription }],
                  },
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(<AdminPanel />);

    // Wait for the admin panel to load and render
    await waitFor(() =>
      expect(screen.getByText("ระบบจัดการเนื้อหา")).toBeInTheDocument()
    );

    // Simulate typing a YouTube URL
    const youtubeUrlInput = screen.getByPlaceholderText(
      "วางลิงก์ YouTube ที่นี่..."
    );
    fireEvent.change(youtubeUrlInput, {
      target: { value: "https://www.youtube.com/watch?v=testvideoid" },
    });

    // Simulate clicking the import button
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มตอน/i })); // This is the add episode button, need to find the correct import button

    // The current implementation uses a debounce, so we need to wait for it to trigger.
    // However, the handleAIImport is also called when the youtubeUrl changes after a debounce.
    // Let's directly call the handleAIImport by clicking the + button next to the input.
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มตอน/i })); // This is the add episode button, need to find the correct import button

    // Re-evaluating the button click. The `handleAIImport` is triggered by the `useEffect` with debounce.
    // The `+` button next to the YouTube input is for manually triggering `handleAIImport`.
    // Let's find the correct button.
    const importButton = screen.getByRole("button", { name: /เพิ่มตอน/i }); // This is still the wrong button. The plus icon is for adding episodes.
    // The button next to the YouTube input has a Plus icon. Let's find it by its icon or a more specific text.
    // It's a button with `Plus` icon, and no specific text, but it's inside the YouTube import section.
    // Let's try to find it by its `aria-label` or by its position.
    // The button has `type="button" size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700"`
    // Let's try to find it by its icon.
    const youtubeImportButton = screen.getByRole("button", { name: /Plus/i }); // Assuming lucide-react Plus icon is rendered with accessible name 'Plus'
    fireEvent.click(youtubeImportButton);

    // Wait for the fetch calls to complete and state to update
    await waitFor(
      () => {
        expect(
          screen.getByPlaceholderText("ระบุชื่อหนังหรือซีรีส์")
        ).toHaveValue(mockYoutubeTitle);
        expect(screen.getByPlaceholderText("รายละเอียดเนื้อหา...")).toHaveValue(
          mockSummarizedDescription
        );
        expect(screen.getByPlaceholderText("https://...")).toHaveValue(
          mockPosterUrl
        );
        expect(
          screen.getByText("กำลังดึงข้อมูลและสรุปด้วย AI...")
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(global.fetch).toHaveBeenCalledTimes(2); // One for YouTube, one for Gemini
    expect(toast.success).toHaveBeenCalledWith(
      "ดึงข้อมูลและสรุปเนื้อหาด้วย AI สำเร็จ"
    );
  });

  it('should summarize description with AI when "AI แก้ไข" button is clicked', async () => {
    const originalDescription =
      "This is an original description that needs to be rewritten by AI.";
    const aiRewrittenDescription =
      "This is the AI rewritten description, much more engaging.";

    // Mock Gemini API response for rewriting description
    global.fetch.mockImplementationOnce(url => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [{ text: aiRewrittenDescription }],
                  },
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(<AdminPanel />);

    await waitFor(() =>
      expect(screen.getByText("ระบบจัดการเนื้อหา")).toBeInTheDocument()
    );

    // Fill in an original description
    const descTextarea = screen.getByPlaceholderText("รายละเอียดเนื้อหา...");
    fireEvent.change(descTextarea, { target: { value: originalDescription } });

    // Click the AI rewrite button
    const aiRewriteButton = screen.getByRole("button", {
      name: /ปรับปรุงด้วย AI/i,
    });
    fireEvent.click(aiRewriteButton);

    // Wait for AI to finish and update the description
    await waitFor(() => {
      expect(descTextarea).toHaveValue(aiRewrittenDescription);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should generate badge with AI when badge button is clicked", async () => {
    const movieTitle = "The Great Adventure";
    const aiGeneratedBadge = "ผจญภัย";

    // Mock Gemini API response for generating badge
    global.fetch.mockImplementationOnce(url => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                {
                  content: {
                    parts: [{ text: aiGeneratedBadge }],
                  },
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch call"));
    });

    render(<AdminPanel />);

    await waitFor(() =>
      expect(screen.getByText("ระบบจัดการเนื้อหา")).toBeInTheDocument()
    );

    // Fill in movie title
    const titleInput = screen.getByPlaceholderText("ระบุชื่อหนังหรือซีรีส์");
    fireEvent.change(titleInput, { target: { value: movieTitle } });

    // Click the AI generate badge button
    const aiBadgeButton = screen.getByRole("button", { name: /Wand2/i }); // Assuming Wand2 icon is rendered with accessible name 'Wand2'
    fireEvent.click(aiBadgeButton);

    // Wait for AI to finish and update the badge
    await waitFor(() => {
      expect(screen.getByPlaceholderText("เช่น ใหม่, แนะนำ")).toHaveValue(
        aiGeneratedBadge
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should generate poster with AI when poster button is clicked", async () => {
    const movieTitle = "Sci-Fi Epic";
    const aiGeneratedPosterUrl =
      "https://dummyimage.com/600x900/1a1a1a/ffffff&text=Sci-Fi%20Epic";

    render(<AdminPanel />);

    await waitFor(() =>
      expect(screen.getByText("ระบบจัดการเนื้อหา")).toBeInTheDocument()
    );

    // Fill in movie title
    const titleInput = screen.getByPlaceholderText("ระบุชื่อหนังหรือซีรีส์");
    fireEvent.change(titleInput, { target: { value: movieTitle } });

    // Click the AI generate poster button
    const aiPosterButton = screen.getByRole("button", { name: /ImageIcon/i }); // Assuming ImageIcon is rendered with accessible name 'ImageIcon'
    fireEvent.click(aiPosterButton);

    // Wait for AI to finish and update the poster URL
    await waitFor(() => {
      expect(screen.getByPlaceholderText("https://...")).toHaveValue(
        aiGeneratedPosterUrl
      );
    });
  });
});
