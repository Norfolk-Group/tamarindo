import { describe, expect, it } from "vitest";
import { nicoSystemPrompt } from "@/lib/nico/prompts";

describe("nicoSystemPrompt", () => {
  it("keeps chat markup and voice speech rules in different registers", () => {
    const chat = nicoSystemPrompt("chat");
    const voice = nicoSystemPrompt("voice");
    expect(chat).toContain("```chart");
    expect(chat).not.toContain("You are being spoken aloud");
    expect(voice).toContain("You are being spoken aloud");
    expect(voice).toContain("No markdown");
    expect(voice).not.toContain("```chart");
    expect(chat).toContain('Do not open with "Great question"');
    expect(chat).toContain("would a human answer this way?");
    expect(voice).toContain("would a human answer this way?");
    expect(voice).toContain("eleven point eight four percent");
    expect(chat).toContain("Files");
    expect(chat).not.toContain("point at Artifacts");
    expect(chat).toContain("Answer in the language they just used");
    expect(nicoSystemPrompt("chat", "es")).toContain("arrendamiento con opción de compra");
    expect(nicoSystemPrompt("chat", "es")).toMatch(/usted/i);
  });
});
