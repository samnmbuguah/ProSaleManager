import twilio from "twilio";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import SaleItem from "../models/SaleItem.js";

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const WHATSAPP_FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const SMS_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export class ReceiptService {
  static async formatReceiptText(saleId: number): Promise<string> {
    const sale = await Sale.findByPk(saleId, {
      include: [
        { model: Customer },
        {
          model: SaleItem,
          include: [{ model: Product }],
        },
      ],
    });

    if (!sale) {
      throw new Error("Sale not found");
    }

    // Format receipt text
    let receiptText = `🧾 PROSALE MANAGER\n`;
    receiptText += `------------------\n`;
    receiptText += `Receipt #${sale.id}\n`;
    receiptText += `Date: ${new Date(sale.createdAt).toLocaleString()}\n\n`;

    if (sale.customer) {
      receiptText += `Customer: ${sale.customer.name}\n`;
    }

    receiptText += `\nItems:\n`;
    for (const item of sale.items) {
      receiptText += `${item.product.name}\n`;
      receiptText += `${item.quantity} x KSh ${item.unit_price} = KSh ${item.total}\n`;
    }

    receiptText += `\n------------------\n`;
    receiptText += `Total: KSh ${sale.total_amount}\n`;
    receiptText += `Payment Method: ${sale.payment_method}\n`;

    if (sale.payment_method === "cash" && sale.amount_paid) {
      receiptText += `Amount Paid: KSh ${sale.amount_paid}\n`;
      receiptText += `Change: KSh ${sale.amount_paid - sale.total_amount}\n`;
    }

    receiptText += `\nThank you for your business!\n`;

    return receiptText;
  }

  static async sendWhatsApp(
    saleId: number,
    phoneNumber: string,
  ): Promise<boolean> {
    try {
      const receiptText = await this.formatReceiptText(saleId);

      await twilioClient.messages.create({
        body: receiptText,
        from: `whatsapp:${WHATSAPP_FROM_NUMBER}`,
        to: `whatsapp:${phoneNumber}`,
      });

      // Update receipt status
      await Sale.update(
        {
          receipt_status: {
            whatsapp: true,
            last_sent_at: new Date(),
          },
        },
        { where: { id: saleId } },
      );

      return true;
    } catch (error) {
      console.error("WhatsApp sending error:", error);
      return false;
    }
  }

  static async sendSMS(saleId: number, phoneNumber: string): Promise<boolean> {
    try {
      const receiptText = await this.formatReceiptText(saleId);

      await twilioClient.messages.create({
        body: receiptText,
        from: SMS_FROM_NUMBER,
        to: phoneNumber,
      });

      // Update receipt status
      await Sale.update(
        {
          receipt_status: {
            sms: true,
            last_sent_at: new Date(),
          },
        },
        { where: { id: saleId } },
      );

      return true;
    } catch (error) {
      console.error("SMS sending error:", error);
      return false;
    }
  }
}
