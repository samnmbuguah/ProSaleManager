import { BarcodeWedgeBuffer } from "../scanner";

describe("BarcodeWedgeBuffer", () => {
  it("emits a scan when the terminator arrives", () => {
    const buffer = new BarcodeWedgeBuffer();
    let now = 0;
    for (const char of "ABC123") {
      expect(buffer.feed(char, (now += 5))).toBeNull();
    }
    expect(buffer.feed("\n", (now += 5))).toBe("ABC123");
  });

  it("resets when keys are too far apart (human typing)", () => {
    const buffer = new BarcodeWedgeBuffer({ maxInterKeyMs: 50 });
    buffer.feed("A", 0);
    buffer.feed("B", 10);
    // Long pause — the next key starts a fresh scan.
    buffer.feed("C", 500);
    expect(buffer.flush()).toBeNull();
  });

  it("rejects scans shorter than minLength", () => {
    const buffer = new BarcodeWedgeBuffer({ minLength: 4 });
    buffer.feed("A", 0);
    buffer.feed("B", 5);
    expect(buffer.flush()).toBeNull();
  });

  it("buffers a chunk without a terminator until flushed", () => {
    const buffer = new BarcodeWedgeBuffer();
    let now = 0;
    expect(buffer.feedText("1234567890", (now += 1))).toBeNull();
    expect(buffer.flush()).toBe("1234567890");
  });

  it("feedText returns the finished scan when a newline is included", () => {
    const buffer = new BarcodeWedgeBuffer();
    let now = 0;
    const result = buffer.feedText("SKU-999\n", (now += 1));
    expect(result).toBe("SKU-999");
  });

  it("reset clears buffered input", () => {
    const buffer = new BarcodeWedgeBuffer();
    buffer.feed("A", 0);
    buffer.feed("B", 1);
    buffer.reset();
    expect(buffer.flush()).toBeNull();
  });
});
