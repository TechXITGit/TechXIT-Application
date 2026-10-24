import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Image } from 'react-native'
import React from 'react'
import { MoveRight, Briefcase, ShieldCheck, Users } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RoleSelect = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <View style={styles.container}>

                {/* Top Logo and Header Wrap */}
                <View style={styles.logoWrap}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={{ uri: "https://www.techxitservices.com/assets/logo-BJVYMtk9.png" }}
                            style={styles.logoImage}
                        />
                    </View>
                    <Text style={styles.welcomeText}>Welcome To Tech X IT</Text>
                    <Text style={styles.subText}>Choose your account type to continue</Text>
                </View>

                {/* Main Cards Selection */}
                <View style={styles.cardsWrap}>

                    <TouchableOpacity
                        style={styles.roleCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ClientLogin')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                            <Briefcase size={22} color="#0284c7" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.roleTitle}>Client</Text>
                            <Text style={styles.roleDesc}>Access solutions, request services & track milestones</Text>
                        </View>
                        <MoveRight size={20} color="#0284c7" style={styles.arrow} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('AdminLogin')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                            <ShieldCheck size={22} color="#dc2626" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.roleTitle}>Admin</Text>
                            <Text style={styles.roleDesc}>Executive oversight, team approvals & operations</Text>
                        </View>
                        <MoveRight size={20} color="#dc2626" style={styles.arrow} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('EmployeeLogin')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#ccfbf1' }]}>
                            <Users size={22} color="#0d9488" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.roleTitle}>Employee</Text>
                            <Text style={styles.roleDesc}>View internal payslips, assignments & deliverables</Text>
                        </View>
                        <MoveRight size={20} color="#0d9488" style={styles.arrow} />
                    </TouchableOpacity>

                </View>

                {/* Footer Section */}
                <View style={styles.footerWrap}>
                    <Text style={styles.dividerText}>-------- secure . simple . Reliable --------</Text>
                    <Text style={styles.footerBrand}>Tech X IT</Text>
                    <Text style={styles.footerTagline}>Building a Smarter Tomorrow</Text>
                </View>

            </View>
        </SafeAreaView>
    )
}

export default RoleSelect

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#eaf6ff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    logoWrap: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#ffffff',
        elevation: 6,
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    logoImage: {
        width: '75%',
        height: '75%',
        resizeMode: 'contain',
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0b3d5c',
    },
    subText: {
        fontSize: 14,
        color: '#5a7d94',
        marginTop: 6,
    },
    cardsWrap: {
        gap: 16,
        flex: 1, // Let cards layout take available central area
    },
    roleCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d6ecfb',
        elevation: 3,
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        flexDirection: 'row', // Horizontal alignment configuration
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#eaf6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cfe9fb',
    },
    iconText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e90ff',
    },
    textContainer: {
        flex: 1, // Expands to push the right arrow gracefully to the edge
        paddingHorizontal: 14,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0b3d5c',
    },
    roleDesc: {
        fontSize: 12,
        color: '#5a7d94',
        marginTop: 2,
        lineHeight: 16,
    },
    arrow: {
        opacity: 0.8,
    },
    footerWrap: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    dividerText: {
        fontSize: 12,
        color: '#8da8b8',
        letterSpacing: 1,
    },
    footerBrand: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0b3d5c',
        marginTop: 6,
    },
    footerTagline: {
        fontSize: 12,
        color: '#5a7d94',
        marginTop: 2,
        fontStyle: 'italic',
    },
})
