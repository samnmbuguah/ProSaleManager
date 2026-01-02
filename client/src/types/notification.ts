export type NotificationType = "stock_take" | "system" | "info";

export type NotificationItem = {
    id: number;
    user_id?: number;  // Optional for client-created notifications
    title: string;
    message: string;
    is_read: boolean;
    type: NotificationType;
    data?: {
        link?: string;
        orderId?: number;
        stockTakeId?: number;
        [key: string]: unknown;
    };
    read_at?: string | null;
    createdAt?: string;
    updatedAt?: string;
};
