import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useAuthContext } from "@/contexts/AuthContext";
import { NotificationItem } from "@/types/notification";

// Duplicate type definition if needed since I can't easily see types/notification.ts right now
// But typically headers are enough.
// Actually MainNav.tsx had NotificationItem used.
// Let's assume it matches.

interface NotificationData {
    notifications: NotificationItem[];
    pendingOrdersCount: number;
}

export function useNotifications() {
    const { user } = useAuthContext();

    return useQuery<NotificationData>({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            const [notifsRes, ordersRes] = await Promise.all([
                api.get(API_ENDPOINTS.notifications.list),
                api.get('/orders?status=pending')
            ]);

            let loadedParams: NotificationItem[] = [];
            if (notifsRes.data) {
                if (Array.isArray(notifsRes.data)) {
                    loadedParams = notifsRes.data;
                } else if (notifsRes.data.data && Array.isArray(notifsRes.data.data)) {
                    loadedParams = notifsRes.data.data;
                }
            }

            const pendingOrders = ordersRes.data && Array.isArray(ordersRes.data) ? ordersRes.data :
                (ordersRes.data?.data && Array.isArray(ordersRes.data.data) ? ordersRes.data.data : []);

            const pCount = pendingOrders.length;

            if (pCount > 0) {
                // Synthesize a notification for pending orders
                const orderNotif: NotificationItem = {
                    id: -1,
                    title: "Pending Orders",
                    message: `You have ${pCount} uncompleted order${pCount !== 1 ? 's' : ''} waiting for action.`,
                    is_read: false,
                    createdAt: new Date().toISOString()
                };
                loadedParams = [orderNotif, ...loadedParams];
            }

            return {
                notifications: loadedParams,
                pendingOrdersCount: pCount
            };
        },
        enabled: !!user,
        refetchInterval: 60000, // Poll every minute
        staleTime: 50000, // Data is fresh for nearly a minute
    });
}
