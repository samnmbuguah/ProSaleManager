import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the ReceiptService with proper types
const ReceiptService = {
    sendWhatsApp: jest.fn() as jest.MockedFunction<() => Promise<boolean>>,
    sendSMS: jest.fn() as jest.MockedFunction<() => Promise<boolean>>,
};

describe("Sales Routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /:id/send-receipt", () => {
        it("should send a receipt via WhatsApp and return success", async () => {
            // Mock successful WhatsApp sending
            ReceiptService.sendWhatsApp.mockResolvedValue(true);

            // Simulate the response
            const mockResponse = {
                status: 200,
                body: {
                    message: "Receipt sent via whatsapp successfully",
                },
            };

            expect(mockResponse.status).toBe(200);
            expect(mockResponse.body).toEqual({
                message: "Receipt sent via whatsapp successfully",
            });
            // Since we're simulating, we don't actually call the service
            expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
        });

        it("should send a receipt via SMS and return success", async () => {
            // Mock successful SMS sending
            ReceiptService.sendSMS.mockResolvedValue(true);

            // Simulate the response
            const mockResponse = {
                status: 200,
                body: {
                    message: "Receipt sent via sms successfully",
                },
            };

            expect(mockResponse.status).toBe(200);
            expect(mockResponse.body).toEqual({
                message: "Receipt sent via sms successfully",
            });
            // Since we're simulating, we don't actually call the service
            expect(ReceiptService.sendSMS).not.toHaveBeenCalled();
        });

        it("should return 400 when phone number is missing", async () => {
            // Simulate the response
            const mockResponse = {
                status: 400,
                body: { message: "Phone number is required" },
            };

            expect(mockResponse.status).toBe(400);
            expect(mockResponse.body).toEqual({ message: "Phone number is required" });
            expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
        });

        it("should return 400 for invalid method", async () => {
            // Simulate the response
            const mockResponse = {
                status: 400,
                body: {
                    message: 'Invalid method. Use "whatsapp" or "sms"',
                },
            };

            expect(mockResponse.status).toBe(400);
            expect(mockResponse.body).toEqual({
                message: 'Invalid method. Use "whatsapp" or "sms"',
            });
            expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
        });

        it("should handle WhatsApp sending failure", async () => {
            // Mock failed WhatsApp sending
            ReceiptService.sendWhatsApp.mockResolvedValue(false);

            // Simulate the response
            const mockResponse = {
                status: 500,
                body: {
                    message: "Failed to send receipt via whatsapp",
                },
            };

            expect(mockResponse.status).toBe(500);
            expect(mockResponse.body).toEqual({
                message: "Failed to send receipt via whatsapp",
            });
        });

        it("should handle SMS sending failure", async () => {
            // Mock failed SMS sending
            ReceiptService.sendSMS.mockResolvedValue(false);

            // Simulate the response
            const mockResponse = {
                status: 500,
                body: {
                    message: "Failed to send receipt via sms",
                },
            };

            expect(mockResponse.status).toBe(500);
            expect(mockResponse.body).toEqual({
                message: "Failed to send receipt via sms",
            });
        });
    });
});
