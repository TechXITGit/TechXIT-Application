import { StyleSheet, Text, View, Image, Dimensions } from 'react-native'
import React from 'react'

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const CAPABILITIES_DATA = [
  {
    id: '1',
    title: 'Agility',
    content: 'Sense market change early and respond fast with minimal friction through short iterations.',
    imageUrl: 'https://www.techxitservices.com/assets/feature-agility-D-kJEicL.jpg',
  },
  {
    id: '2',
    title: 'Strength',
    content: 'Disciplined processes, reliable systems, and skilled engineering delivering at scale.',
    imageUrl: 'https://www.techxitservices.com/assets/feature-strength-BSh8oo4B.jpg',
  },
  {
    id: '3',
    title: 'Quickness',
    content: 'Speed with clarity—short decision paths that take digital concepts into production rapidly.',
    imageUrl: 'https://www.techxitservices.com/assets/feature-quickness-CmqBa_bo.jpg',
  },
  {
    id: '4',
    title: 'Power',
    content: 'Outsized commercial results by unifying deep technical expertise and strategic leadership.',
    imageUrl: 'https://www.techxitservices.com/assets/feature-power-C22ljCEj.jpg',
  },
];

const CapabilityCard = ({ title, content, imageUrl }) => (
  <View style={styles.card}>
    <View style={styles.imageWrap}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
      <View style={styles.titleBadge}>
        <Text style={styles.titleBadgeText}>{title}</Text>
      </View>
    </View>
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardContent}>{content}</Text>
    </View>
  </View>
);

const Capability = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.badgeText}>ENGINEERING EXCELLENCE</Text>
        <Text style={styles.headingText}>Our Capabilities</Text>
        <Text style={styles.subText}>Built with modern architecture and high-performance standards</Text>
      </View>

      <View style={styles.grid}>
        {CAPABILITIES_DATA.map((item) => (
          <CapabilityCard
            key={item.id}
            title={item.title}
            content={item.content}
            imageUrl={item.imageUrl}
          />
        ))}
      </View>
    </View>
  )
}

export default Capability

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
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
    rowGap: 14,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 110,
    backgroundColor: '#e2e8f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  titleBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  titleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardTextContainer: {
    padding: 12,
  },
  cardContent: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
})
