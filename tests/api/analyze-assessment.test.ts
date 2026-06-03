// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app, setGeminiClientForTesting, resetGeminiClientForTesting } from "../../app";

// Proves the app.ts / server.ts split: the Express app is importable and
// testable in isolation, with the Gemini client injectable so no real network
// calls happen.
afterEach(() => {
  resetGeminiClientForTesting();
});

describe("POST /api/simulate-analysis", () => {
  it("returns a known scenario with transcript and analysis", async () => {
    const res = await request(app)
      .post("/api/simulate-analysis")
      .send({ scenarioId: "scenario_a" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transcript)).toBe(true);
    expect(res.body.analysis).toBeTruthy();
  });

  it("404s on an unknown scenario", async () => {
    const res = await request(app)
      .post("/api/simulate-analysis")
      .send({ scenarioId: "does_not_exist" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/analyze-assessment", () => {
  it("falls back to a simulated response and remaps names when no client is configured", async () => {
    setGeminiClientForTesting(null); // force the fallback path
    const res = await request(app)
      .post("/api/analyze-assessment")
      .send({ transcriptText: "een gesprek", student1Name: "Bart", student2Name: "Lisa" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.simulated).toBe(true);
    // Fallback remaps the scenario's keys to the supplied student names.
    expect(Object.keys(res.body.analysis.scores)).toEqual(["Bart", "Lisa"]);
  });

  it("uses the injected Gemini client and returns structured analysis", async () => {
    const fakeAnalysis = {
      transcript: [{ timestamp: "00:01", speaker: "Bart", text: "hallo" }],
      analysis: {
        scores: { Bart: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 } },
        tags: { Bart: {} },
        reasoning: { Bart: {} },
        quotes: { Bart: {} },
        feedback: { Bart: { strengths: [], improvements: [] } },
      },
    };
    setGeminiClientForTesting({
      models: {
        generateContent: async () => ({ text: JSON.stringify(fakeAnalysis) }),
      },
    } as any);

    const res = await request(app)
      .post("/api/analyze-assessment")
      .send({ transcriptText: "solo gesprek", student1Name: "Bart" });

    expect(res.status).toBe(200);
    expect(res.body.simulated).toBe(false);
    expect(Object.keys(res.body.analysis.scores)).toEqual(["Bart"]);
  });

  it("returns 500 when the Gemini client throws", async () => {
    setGeminiClientForTesting({
      models: {
        generateContent: async () => {
          throw new Error("boom");
        },
      },
    } as any);

    const res = await request(app)
      .post("/api/analyze-assessment")
      .send({ transcriptText: "x", student1Name: "Bart" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});
