import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

export default function YoutubeFrame() {
    const [videoReady, setVideoReady] = useState(false);
    const { width } = useWindowDimensions();

    // Calculate exact 16:9 aspect ratio dynamically based on available width
    const playerWidth = Math.min(width - 40, 720);
    const playerHeight = Math.round(playerWidth * (9 / 16));

    return (
        <View style={styles.container}>
            <View style={styles.headerWrap}>
                <Text style={styles.badgeText}>COMPANY SPOTLIGHT</Text>
                <Text style={styles.title}>Our Vision in Action</Text>
                <Text style={styles.subText}>
                    Watch how we engineer breakthrough solutions for modern businesses
                </Text>
            </View>

            <View style={[styles.videoWrapper, { width: playerWidth, height: playerHeight }]}>
                {!videoReady && (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="large" color="#0284c7" />
                    </View>
                )}

                <YoutubePlayer
                    width={playerWidth}
                    height={playerHeight}
                    videoId={'QsY8fnvMn6c'}
                    onReady={() => setVideoReady(true)}
                    webViewProps={{
                        showsVerticalScrollIndicator: false,
                        showsHorizontalScrollIndicator: false,
                        scrollEnabled: false,
                        overScrollMode: 'never',
                    }}
                    initialPlayerParams={{
                        preventFullScreen: false,
                        cc_load_policy: 0,
                        modestbranding: 1,
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 28,
        backgroundColor: 'transparent', // Transparent to seamlessly blend with page
        alignItems: 'center',
    },
    headerWrap: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0284c7',
        letterSpacing: 1.2,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    title: {
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
        maxWidth: 500,
    },
    videoWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000000',
        elevation: 3,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    loaderWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        zIndex: 1,
    },
});
