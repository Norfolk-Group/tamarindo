import { describe, expect, it } from "vitest";
import {
  isChitChat,
  isLifeTalk,
  parseWorldAsk,
} from "@/lib/nico/world-intent";

describe("world-intent", () => {
  it("treats rapport as life talk, not a thesis dump", () => {
    expect(isChitChat("Hey, how are you?")).toBe(true);
    expect(isLifeTalk("I need a break")).toBe(true);
  });

  it("does not treat an LTV question as small talk", () => {
    expect(isLifeTalk("What LTV do we use in Medellín?")).toBe(false);
  });

  it("routes weather, tape, FX, coffee, and headlines", () => {
    expect(parseWorldAsk("what's the weather in Cartagena?")).toEqual({
      kind: "weather",
      place: "Cartagena",
    });
    expect(parseWorldAsk("How is the NASDAQ today?")).toEqual({
      kind: "markets",
      focus: "indices",
    });
    expect(parseWorldAsk("USD/COP right now?")).toEqual({
      kind: "markets",
      focus: "fx",
    });
    expect(parseWorldAsk("how is coffee trading?")).toEqual({
      kind: "markets",
      focus: "coffee",
    });
    expect(parseWorldAsk("top news of the hour")).toEqual({
      kind: "news",
      window: "hour",
      region: "world",
    });
    expect(parseWorldAsk("Colombia headlines today")).toEqual({
      kind: "news",
      window: "day",
      region: "colombia",
    });
    expect(parseWorldAsk("catch me up on the world")).toEqual({
      kind: "pulse",
    });
    expect(parseWorldAsk("real estate news around Medellín")).toEqual({
      kind: "news",
      window: "day",
      region: "medellin_re",
    });
    expect(parseWorldAsk("inmobiliario en Poblado y Llanogrande")).toEqual({
      kind: "news",
      window: "day",
      region: "medellin_re",
    });
    expect(
      parseWorldAsk("Cartagena walled city real estate news"),
    ).toEqual({
      kind: "news",
      window: "day",
      region: "cartagena_re",
    });
    expect(parseWorldAsk("inmobiliario en el Centro Histórico")).toEqual({
      kind: "news",
      window: "day",
      region: "cartagena_re",
    });
  });

  it("does not steal Intervest news for the world feed", () => {
    expect(parseWorldAsk("any Intervest news on the raise?")).toBeNull();
  });
});
