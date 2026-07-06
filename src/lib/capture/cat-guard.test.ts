import { describe, expect, it } from "vitest";

import { evaluateResults } from "./cat-guard";

type Prediction = { label: string; score: number };

/**
 * Fixtures use real ImageNet-1k class names (what MobileNet actually returns),
 * so these tests exercise the guard the same way live predictions would.
 */

describe("evaluateResults — accepts cats", () => {
  it("accepts a confident tabby", () => {
    const preds: Prediction[] = [
      { label: "tabby, tabby cat", score: 0.82 },
      { label: "tiger cat", score: 0.09 },
      { label: "Egyptian cat", score: 0.03 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(true);
  });

  it("accepts a Siamese cat", () => {
    const preds: Prediction[] = [
      { label: "Siamese cat, Siamese", score: 0.66 },
      { label: "lynx, catamount", score: 0.05 },
    ];
    expect(evaluateResults(preds).ok).toBe(true);
  });

  it("accepts a cat on a plain background where scores stay modest", () => {
    // Real cats on flat backgrounds keep the cat class low but still leading.
    const preds: Prediction[] = [
      { label: "Egyptian cat", score: 0.09 },
      { label: "tabby, tabby cat", score: 0.07 },
      { label: "quilt, comforter", score: 0.05 },
      { label: "doormat, welcome mat", score: 0.04 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(true);
  });

  it("reports the detected cat label", () => {
    const result = evaluateResults([{ label: "Persian cat", score: 0.5 }]);
    expect(result).toMatchObject({ ok: true, label: "Persian cat" });
  });
});

describe("evaluateResults — rejects non-cats (the bug this fixes)", () => {
  it("rejects a dog (breed labels never contained the word 'dog')", () => {
    const preds: Prediction[] = [
      { label: "golden retriever", score: 0.61 },
      { label: "Labrador retriever", score: 0.22 },
      { label: "kuvasz", score: 0.05 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(false);
  });

  it("rejects a person (ImageNet labels people as clothing/objects)", () => {
    const preds: Prediction[] = [
      { label: "suit, suit of clothes", score: 0.44 },
      { label: "Windsor tie", score: 0.18 },
      { label: "jersey, T-shirt, tee shirt", score: 0.09 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(false);
  });

  it("rejects a person flagged by a human-adjacent label with a clear message", () => {
    const preds: Prediction[] = [
      { label: "bridegroom, groom", score: 0.52 },
      { label: "suit, suit of clothes", score: 0.2 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/person/i);
  });

  it("rejects a random object", () => {
    const preds: Prediction[] = [
      { label: "coffee mug", score: 0.7 },
      { label: "cup", score: 0.15 },
    ];
    expect(evaluateResults(preds).ok).toBe(false);
  });

  it("names a strongly-dominant known non-cat animal", () => {
    const preds: Prediction[] = [
      { label: "African hunting dog, hyena dog", score: 0.63 },
      { label: "dingo, warrigal", score: 0.11 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/African hunting dog/);
  });

  it("rejects when a weak cat signal is drowned by a dominant known non-cat", () => {
    const preds: Prediction[] = [
      { label: "bird", score: 0.6 },
      { label: "tabby, tabby cat", score: 0.08 },
    ];
    const result = evaluateResults(preds);
    expect(result.ok).toBe(false);
  });
});

describe("evaluateResults — edge cases", () => {
  it("rejects empty predictions", () => {
    expect(evaluateResults([]).ok).toBe(false);
  });

  it("rejects noise below the cat floor", () => {
    const preds: Prediction[] = [
      { label: "tabby, tabby cat", score: 0.02 },
      { label: "fire screen, fireguard", score: 0.4 },
    ];
    expect(evaluateResults(preds).ok).toBe(false);
  });
});
