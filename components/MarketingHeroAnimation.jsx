import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Pressable,
  Linking,
  Dimensions,
} from 'react-native';
import { MoveRight, Sparkles, TrendingUp, Rocket, Flame, Target, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const PHONE_NUMBER = '+911234567890';
const { width } = Dimensions.get('window');

export default function MarketingHeroAnimation() {
  const navigation = useNavigation();

  // Floating animation values
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating loop for Badge 1 (Rocket / Growth)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -10,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating loop for Badge 2 (Analytics / ROI)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 12,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating loop for Mascot Illustration
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim3, {
          toValue: 4,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle pulse for creative background aura
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for graphic gear
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLetsTalk = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleViewService = () => {
    navigation.navigate('Services');
  };

  return (
    <View style={styles.container}>
      {/* Background Animated Glows & Shapes */}
      <Animated.View
        style={[
          styles.glowCircleLarge,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />
      <View style={styles.glowCircleSmall} />

      {/* Rotating Background Tech Ring */}
      <Animated.View
        style={[
          styles.techRing,
          { transform: [{ rotate: spin }] },
        ]}
      />

      {/* Floating Marketing Badge 1 - Growth (Top Right) */}
      <Animated.View
        style={[
          styles.floatingBadgeRight,
          { transform: [{ translateY: floatAnim1 }] },
        ]}
      >
        <Rocket size={15} color="#38bdf8" />
        <Text style={styles.floatingBadgeText}>+380% Organic ROI</Text>
      </Animated.View>

      {/* Floating Marketing Badge 2 - Target / Conversion (Top Left) */}
      <Animated.View
        style={[
          styles.floatingBadgeLeft,
          { transform: [{ translateY: floatAnim2 }] },
        ]}
      >
        <Target size={14} color="#f43f5e" />
        <Text style={styles.floatingBadgeText}>Viral Performance</Text>
      </Animated.View>

      {/* Center Cartoon Marketing Mascot Illustration */}
      <Animated.View
        style={[
          styles.mascotContainer,
          { transform: [{ translateY: floatAnim3 }] },
        ]}
      >
        <View style={styles.mascotCard}>
          {/* Animated Mascot Graphic Elements */}
          <View style={styles.mascotAura} />
          
          <View style={styles.cartoonSceneRow}>
            {/* Tech Icon Bubble */}
            <View style={styles.sceneBubble}>
              <Flame size={20} color="#f97316" />
            </View>

            {/* Central Creative Screen Character */}
            <View style={styles.characterBox}>
              <View style={styles.characterScreen}>
                <View style={styles.characterEyeRow}>
                  <View style={styles.characterEye} />
                  <View style={styles.characterEye} />
                </View>
                <View style={styles.characterSmile} />
                <View style={styles.codeLine} />
              </View>
              <View style={styles.characterBase} />
            </View>

            {/* Analytics Bubble */}
            <View style={styles.sceneBubble}>
              <TrendingUp size={20} color="#10b981" />
            </View>
          </View>

          {/* Sparkles pill under mascot */}
          <View style={styles.mascotCaption}>
            <Sparkles size={12} color="#38bdf8" />
            <Text style={styles.mascotCaptionText}>Next-Gen Tech Marketing Company</Text>
          </View>
        </View>
      </Animated.View>

      {/* Headline & Value Proposition */}
      <View style={styles.contentWrap}>
        <View style={styles.spanText}>
          <Text style={styles.spanInsideText}>✨ Technology Infused with Marketing</Text>
        </View>

        <Text style={styles.overlayText}>Build Bold Brands</Text>
        <View style={styles.secondLineRow}>
          <Text style={styles.overlayTextSecondLine}>with </Text>
        </View>
        <Text style={styles.gradientText}>Tech X IT</Text>

        <Text style={styles.subText}>
          High-conversion web platforms, viral digital marketing, and engineered software.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [styles.preBtn, pressed && styles.preBtnPressed]}
            onPress={handleLetsTalk}
          >
            <Phone size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Let's Talk</Text>
            <MoveRight size={15} color="#ffffff" style={styles.arrow} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#07101e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
    position: 'relative',
  },

  // Glowing Backdrop Auras
  glowCircleLarge: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    top: 30,
  },
  glowCircleSmall: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    bottom: 20,
  },
  techRing: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
    borderStyle: 'dashed',
  },

  // Floating Pills
  floatingBadgeRight: {
    position: 'absolute',
    top: 32,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  floatingBadgeLeft: {
    position: 'absolute',
    top: 50,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  floatingBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Central Mascot & Cartoon Scene
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    zIndex: 5,
  },
  mascotCard: {
    alignItems: 'center',
  },
  mascotAura: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    top: -10,
  },
  cartoonSceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sceneBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  characterBox: {
    alignItems: 'center',
  },
  characterScreen: {
    width: 86,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#0284c7',
    borderWidth: 3,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
    padding: 6,
  },
  characterEyeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  characterEye: {
    width: 8,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  characterSmile: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginBottom: 4,
  },
  codeLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  characterBase: {
    width: 34,
    height: 8,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#0369a1',
  },
  mascotCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  mascotCaptionText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Content Area
  contentWrap: {
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  spanText: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  spanInsideText: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  overlayText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  overlayTextSecondLine: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  secondLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(56, 189, 248, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 22,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  preBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    fontSize: 13,
  },
  arrow: {
    marginLeft: 6,
  },
  secBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  secBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
});
