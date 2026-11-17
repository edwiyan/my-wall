import { describe, expect, it } from "vitest";
import {
  FEED_LIMIT,
  MAX_LENGTH,
  imageExtension,
  mergePosts,
  timeAgo,
  validateImage,
  validateMessage,
  type Post,
} from "./wall";

const post = (id: string, created_at: string): Post => ({
  id,
  name: "Edrian Reyes",
  body: `post ${id}`,
  image_url: null,
  created_at,
});

describe("validateMessage", () => {
  it("rejects empty and whitespace-only messages", () => {
    expect(validateMessage("")).not.toBeNull();
    expect(validateMessage("   \n ")).not.toBeNull();
  });

  it("accepts a message up to 280 characters", () => {
    expect(validateMessage("hello")).toBeNull();
    expect(validateMessage("a".repeat(MAX_LENGTH))).toBeNull();
  });

  it("rejects a message over 280 characters", () => {
    expect(validateMessage("a".repeat(MAX_LENGTH + 1))).toMatch(/280/);
  });

  it("asks for words when only a photo is attached", () => {
    expect(validateMessage("", true)).toMatch(/photo/);
  });
});

describe("validateImage", () => {
  it("accepts images up to 5 MB", () => {
    expect(validateImage({ type: "image/png", size: 1000 })).toBeNull();
  });
  it("rejects other file types and large files", () => {
    expect(validateImage({ type: "application/pdf", size: 1000 })).not.toBeNull();
    expect(validateImage({ type: "image/svg+xml", size: 1000 })).not.toBeNull();
    expect(validateImage({ type: "image/jpeg", size: 6 * 1024 * 1024 })).not.toBeNull();
  });
});

describe("imageExtension", () => {
  it("maps MIME types to file extensions", () => {
    expect(imageExtension("image/jpeg")).toBe("jpg");
    expect(imageExtension("image/png")).toBe("png");
    expect(imageExtension("image/../x")).toBe("img");
  });
});

describe("mergePosts", () => {
  it("sorts newest first and drops duplicates", () => {
    const a = post("a", "2026-11-17T10:00:00Z");
    const b = post("b", "2026-11-17T11:00:00Z");
    const merged = mergePosts([a], [b, a]);
    expect(merged.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("keeps at most FEED_LIMIT posts", () => {
    const many = Array.from({ length: FEED_LIMIT + 5 }, (_, i) =>
      post(String(i), new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()),
    );
    expect(mergePosts([], many)).toHaveLength(FEED_LIMIT);
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-17T12:00:00Z");
  it("formats recent times", () => {
    expect(timeAgo("2026-11-17T11:59:50Z", now)).toBe("just now");
    expect(timeAgo("2026-11-17T11:55:00Z", now)).toBe("5 minutes ago");
    expect(timeAgo("2026-11-17T10:00:00Z", now)).toBe("2 hours ago");
    expect(timeAgo("2026-11-16T12:00:00Z", now)).toBe("yesterday");
  });
  it("shows a date for older posts", () => {
    expect(timeAgo("2026-10-01T12:00:00Z", now)).toBe("October 1, 2026");
  });
});
