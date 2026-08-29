import { describe, expect, it } from "vitest";
import { detectReplyLanguage } from "@/lib/nico/reply-language";

describe("detectReplyLanguage", () => {
  it("defaults to English", () => {
    expect(detectReplyLanguage("how does Tamarindo work")).toBe("en");
    expect(detectReplyLanguage("show me the books")).toBe("en");
  });

  it("detects Spanish from cues and explicit asks", () => {
    expect(detectReplyLanguage("cómo funciona Tamarindo")).toBe("es");
    expect(detectReplyLanguage("muéstrame los libros")).toBe("es");
    expect(detectReplyLanguage("cuál es la TIR")).toBe("es");
    expect(detectReplyLanguage("estado de resultados")).toBe("es");
    expect(detectReplyLanguage("in spanish please")).toBe("es");
  });

  it("honors an explicit English override", () => {
    expect(detectReplyLanguage("en inglés, how does Tamarindo work")).toBe("en");
  });
});
