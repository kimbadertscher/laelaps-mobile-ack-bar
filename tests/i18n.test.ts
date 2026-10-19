import { describe, expect, it } from "vitest";
import { createFixtures } from "@/data/fixtures";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

const flatten = (value: unknown, prefix = ""): string[] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

describe("messages", () => {
  it("has the same keys in en and de", () => {
    expect(flatten(de).sort()).toEqual(flatten(en).sort());
  });

  it("has no empty strings", () => {
    for (const messages of [en, de]) {
      for (const key of flatten(messages)) {
        const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages);
        expect(value, key).not.toBe("");
      }
    }
  });

  it("translates every outcome id used by the fixtures in both locales", () => {
    const ids = Object.values(createFixtures()).flatMap((event) => event.outcomes.map((o) => o.id));
    for (const id of ids) {
      expect(en.outcomes, `en outcomes.${id}`).toHaveProperty(id);
      expect(de.outcomes, `de outcomes.${id}`).toHaveProperty(id);
    }
  });
});
