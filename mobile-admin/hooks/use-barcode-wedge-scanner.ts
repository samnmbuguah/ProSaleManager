import { useCallback, useEffect, useRef } from "react";
import { BarcodeWedgeBuffer } from "@/services/hardware/scanner";

/**
 * Turns a normal text input into a barcode capture field for keyboard-wedge
 * (HID) scanners. Scanners that "type" the barcode then press Enter are
 * detected either via the submit handler or via inter-key timing.
 *
 * Usage:
 *   const scanner = useBarcodeWedgeScanner((code) => addByBarcode(code));
 *   <Searchbar value={q} onChangeText={scanner.handleChange} onSubmitEditing={scanner.handleSubmit} />
 */
export function useBarcodeWedgeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef(new BarcodeWedgeBuffer());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousLengthRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const emit = useCallback(
    (barcode: string | null) => {
      if (barcode) {
        onScan(barcode);
        bufferRef.current.reset();
        previousLengthRef.current = 0;
        return true;
      }
      return false;
    },
    [onScan],
  );

  const scheduleIdleDetection = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // flush() only yields a value if everything arrived quickly enough
      emit(bufferRef.current.flush());
    }, 100);
  }, [emit]);

  /** Wire to TextInput/Searchbar onChangeText. */
  const handleChange = useCallback(
    (text: string) => {
      let added = text;
      if (text.length >= previousLengthRef.current) {
        added = text.slice(previousLengthRef.current);
      }
      previousLengthRef.current = text.length;

      const scanned = bufferRef.current.feedText(added);
      if (!emit(scanned)) {
        scheduleIdleDetection();
      }
    },
    [emit, scheduleIdleDetection],
  );

  /** Wire to TextInput/Searchbar onSubmitEditing. */
  const handleSubmit = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      emit(bufferRef.current.flush() ?? (text.length >= 4 ? text : null));
    },
    [emit],
  );

  const reset = useCallback(() => {
    bufferRef.current.reset();
    previousLengthRef.current = 0;
  }, []);

  return { handleChange, handleSubmit, reset };
}
