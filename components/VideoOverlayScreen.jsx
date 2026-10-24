import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Linking } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable } from 'react-native';
import { MoveRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const videoSource = require('../assets/videos/Overlay-Video.mp4');

const PHONE_NUMBER = '+911234567890';

export default function VideoOverlayScreen() {
  const player = useVideoPlayer(videoSource);
  const navigation = useNavigation();

  useEffect(() => {
    if (player) {
      player.muted = true;
      player.loop = true;
      player.play();
    }
  }, [player]);

  const handleLetsTalk = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleViewService = () => {
    navigation.navigate('Services');
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          nativeControls={false}
          contentFit="cover"
        />

        <View style={styles.overlayContainer}>
          <View style={styles.spanText}>
            <Text style={styles.spanInsideText}>✨ Technology Infused with Marketing</Text>
          </View>

          <Text style={styles.overlayText}>Build Bold Brands</Text>
          <View style={styles.secondLineRow}>
            <Text style={styles.overlayText}>with </Text>
            <Text style={styles.gradientText}>Tech X IT</Text>
          </View>

          <Text style={styles.subText}>Engineered for exponential growth & conversions</Text>

          <View style={styles.buttonsContainer}>
            <Pressable
              style={({ pressed }) => [styles.preBtn, pressed && styles.preBtnPressed]}
              onPress={handleLetsTalk}
            >
              <Text style={styles.btnText}>Let's Talk</Text>
              <MoveRight size={16} color="#ffffff" style={styles.arrow} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secBtn, pressed && styles.secBtnPressed]}
              onPress={handleViewService}
            >
              <Text style={styles.secBtnText}>Explore Services</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 12, 20, 0.55)',
    paddingHorizontal: 24,
  },
  spanText: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: 'rgba(234, 246, 255, 0.92)',
    borderRadius: 30,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.25)',
  },
  spanInsideText: {
    color: '#0b3d5c',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
  },
  secondLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  gradientText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#4fd8ff',
    textShadowColor: 'rgba(79, 216, 255, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  preBtn: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    backgroundColor: '#0284c7',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  preBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  arrow: {
    marginLeft: 6,
  },
  secBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  secBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
});