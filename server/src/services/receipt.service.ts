import twilio from "twilio";
import { Sale, Customer, Product, SaleItem } from "../models/index.js";

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

const WHATSAPP_FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const SMS_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export class ReceiptService {
  static async formatReceiptText(saleId: number): Promise<string> {
    try {
      console.log(`Formatting receipt text for sale ID: ${saleId}`);
      
      const sale = await Sale.findByPk(saleId, {
        include: [
          { model: Customer },
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product }],
          },
        ],
      });

      if (!sale) {
        console.log(`Sale not found for ID: ${saleId}`);
        throw new Error("Sale not found");
      }

      const saleWithAssociations = sale as Sale & {
        Customer?: Customer;
        items?: SaleItem[];
      };
      console.log(`Sale found:`, {
        id: saleWithAssociations.id,
        hasCustomer: !!saleWithAssociations.Customer,
        hasItems: !!saleWithAssociations.items,
        itemCount: saleWithAssociations.items?.length || 0
      });

      // Type assertion for associations
      // const saleWithAssociations = sale as any;

      // Format receipt text with improved formatting
      let receiptText = `╔══════════════════════════════════════╗\n`;
      receiptText += `║           🧾 PROSALE MANAGER           ║\n`;
      receiptText += `╚══════════════════════════════════════╝\n\n`;
      
      receiptText += `Receipt #${sale.id.toString().padStart(6, '0')}\n`;
      receiptText += `Date: ${new Date(sale.createdAt).toLocaleString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n`;
      receiptText += `Time: ${new Date(sale.createdAt).toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}\n\n`;

      if (saleWithAssociations.Customer) {
        receiptText += `Customer: ${saleWithAssociations.Customer.name}\n`;
        if (saleWithAssociations.Customer.phone) {
          receiptText += `Phone: ${saleWithAssociations.Customer.phone}\n`;
        }
        if (saleWithAssociations.Customer.email) {
          receiptText += `Email: ${saleWithAssociations.Customer.email}\n`;
        }
        receiptText += `\n`;
      } else {
        receiptText += `Customer: Walk-in Customer\n\n`;
      }

      receiptText += `Served by: System Admin\n\n`;
      
      receiptText += `╔══════════════════════════════════════╗\n`;
      receiptText += `║              ITEMS SOLD              ║\n`;
      receiptText += `╚══════════════════════════════════════╝\n\n`;

      // Use the correct property for sale items (now using 'items' alias)
      const items = saleWithAssociations.items || [];

      console.log(`Items found: ${items.length}`);
      if (items.length > 0) {
        console.log(`First item structure:`, JSON.stringify(items[0], null, 2));
      }

      let itemNumber = 1;
      for (const item of items) {
        // Add null checks for item and Product association
        const product = (item as any).Product;
        if (!item || !product) {
          console.error(`Missing product data for item:`, item);
          continue;
        }
        
        receiptText += `${itemNumber.toString().padStart(2, '0')}. ${product.name}\n`;
        receiptText += `    ${item.quantity} ${item.unit_type} × KSh ${item.unit_price.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} = KSh ${item.total.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n\n`;
        itemNumber++;
      }

      receiptText += `╔══════════════════════════════════════╗\n`;
      receiptText += `║              SUMMARY                 ║\n`;
      receiptText += `╚══════════════════════════════════════╝\n\n`;

      const subtotal = sale.total_amount - sale.delivery_fee;
      receiptText += `Subtotal:                    KSh ${subtotal.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}\n`;

      if (sale.delivery_fee > 0) {
        receiptText += `Delivery Fee:                KSh ${sale.delivery_fee.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n`;
      }

      receiptText += `──────────────────────────────────────────\n`;
      receiptText += `TOTAL:                       KSh ${sale.total_amount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}\n\n`;

      receiptText += `Payment Method: ${sale.payment_method.toUpperCase()}\n`;

      if (sale.payment_method === "cash" && sale.amount_paid) {
        const change = sale.amount_paid - sale.total_amount;
        receiptText += `Amount Paid:                 KSh ${sale.amount_paid.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n`;
        receiptText += `Change:                      KSh ${change.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}\n`;
      }

      receiptText += `\n`;
      receiptText += `╔══════════════════════════════════════╗\n`;
      receiptText += `║         THANK YOU FOR YOUR           ║\n`;
      receiptText += `║            BUSINESS!                 ║\n`;
      receiptText += `║                                      ║\n`;
      receiptText += `║        Please come again!            ║\n`;
      receiptText += `╚══════════════════════════════════════╝\n\n`;
      
      receiptText += `For inquiries: +254 XXX XXX XXX\n`;
      receiptText += `Email: info@prosalemanager.com\n\n`;
      
      receiptText += `Generated by ProSale Manager\n`;
      receiptText += `© ${new Date().getFullYear()} All rights reserved\n`;

      return receiptText;
    } catch (error) {
      console.error("Error formatting receipt text:", error);
      throw error;
    }
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
