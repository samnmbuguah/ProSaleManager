export type NotificationItem = {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    type: string;
    data?: {
        link?: string;
        orderId?: number;
        stockTakeId?: number;
        [key: string]: unknown;
    };
    createdAt?: string;
};
