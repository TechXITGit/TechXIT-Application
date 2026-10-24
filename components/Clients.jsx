import { StyleSheet, Text, View, Image, Dimensions } from 'react-native'
import React from 'react'

const { width } = Dimensions.get('window');
const LOGO_WIDTH = (width - 64) / 3;

const CLIENTS_DATA = [
    { id: '1', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1f3hjLQtFCFGmRgqo9HwcKigpnV40ae4e98MndgR08g&s=10' },
    { id: '2', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJubRpf9W9gjJ8LbSipepI1vqI-VSdYLVGZRDZue9oOA&s=10' },
    { id: '3', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNViCZvfIi6yxc37bNEagdWiNoeIdiS9gIvDxqzgjEJbsYwTVMukVvcAG4&s=10' },
    { id: '4', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJ6yv9cPXeNzro62sSK4IoxVKFA5PRsoqI3Zw8zmisdw&s=10' },
    { id: '5', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz44xGQM6uDwa-_8jAtCTxbb468RvV4hizRWoO-8TAuQ&s=10' },
    { id: '6', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBlxUT3iWGnMGkwDQh-UAG6nm-J6oNJ9NksvrVuFVoCg&s=10' },
];

const ClientLogo = ({ logoUrl }) => (
    <View style={styles.logoCard}>
        <Image
            source={{ uri: logoUrl }}
            style={styles.logoImage}
            resizeMode="contain"
        />
    </View>
);

const Clients = () => {
    return (
        <View style={styles.container}>
            <View style={styles.headerWrap}>
                <Text style={styles.badgeText}>PARTNERSHIPS</Text>
                <Text style={styles.headingText}>Trusted by Brands</Text>
                <Text style={styles.subText}>Powering startups, enterprises, and visionary creators</Text>
            </View>

            <View style={styles.grid}>
                {CLIENTS_DATA.map((item) => (
                    <ClientLogo key={item.id} logoUrl={item.logoUrl} />
                ))}
            </View>
        </View>
    )
}

export default Clients

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 28,
    },
    headerWrap: {
        alignItems: 'center',
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0284c7',
        letterSpacing: 1.2,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    headingText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    logoCard: {
        width: LOGO_WIDTH,
        height: 72,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    logoImage: {
        width: '70%',
        height: '70%',
    },
})
