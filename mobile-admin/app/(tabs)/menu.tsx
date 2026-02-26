import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MenuScreen() {
    const { logout, user } = useAuth();
    const theme = useTheme();

    const menuItems = [
        {
            title: 'Profile',
            icon: 'person.circle',
            route: '/features/profile',
            description: 'Manage your account settings'
        },
        {
            title: 'User Management',
            icon: 'person.2.fill',
            route: '/features/users',
            description: 'Manage staff and permissions'
        },
        {
            title: 'Expenses',
            icon: 'banknote',
            route: '/features/expenses',
            description: 'Track store expenses'
        },
        {
            title: 'Reports',
            icon: 'chart.bar.fill',
            route: '/features/reports',
            description: 'Sales and inventory analytics'
        },
    ];

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader>Admin Console</List.Subheader>
                    {menuItems.map((item, index) => (
                        <View key={item.route}>
                            <List.Item
                                title={item.title}
                                description={item.description}
                                left={(props) => <List.Icon {...props} icon={() => <IconSymbol size={24} name={item.icon as any} color={props.color} />} />}
                                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                                onPress={() => router.push(item.route as any)}
                                style={{ backgroundColor: theme.colors.surface }}
                            />
                            {index < menuItems.length - 1 && <Divider />}
                        </View>
                    ))}
                </List.Section>

                <Divider style={{ marginVertical: 20 }} />

                <List.Section>
                    <List.Item
                        title="Logout"
                        titleStyle={{ color: 'red' }}
                        left={(props) => <List.Icon {...props} icon={() => <IconSymbol size={24} name="rectangle.portrait.and.arrow.right" color="red" />} />}
                        onPress={logout}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                </List.Section>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
