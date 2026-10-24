import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Lightbulb, SlidersHorizontal, Handshake } from 'lucide-react-native'

const PILLARS_DATA = [
  {
    id: '1',
    title: 'Strategy',
    icon: Lightbulb,
    iconColor: '#0284c7',
    iconBg: '#e0f2fe',
    description: 'A clear strategy aligns vision with measurable outcomes, focusing resources on high-impact moves that outpace competitors and mitigate risk through data.',
  },
  {
    id: '2',
    title: 'Management',
    icon: SlidersHorizontal,
    iconColor: '#0d9488',
    iconBg: '#ccfbf1',
    description: 'Effective management turns plans into performance by setting priorities, clarifying ownership, and delivering reliable results at continuous speed.',
  },
  {
    id: '3',
    title: 'Procurement',
    icon: Handshake,
    iconColor: '#7c3aed',
    iconBg: '#ede9fe',
    description: 'Modern procurement secures the right resources at the best value, strengthening partnerships, ensuring compliance, and building resilient tech supply chains.',
  },
];

const PillarCard = ({ title, description, icon: Icon, iconColor, iconBg }) => (
  <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <Icon size={22} color={iconColor} />
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  </View>
);

const Fourpillars = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={styles.badgeText}>CORE METHODOLOGY</Text>
        <Text style={styles.headingText}>How We Work</Text>
        <Text style={styles.subText}>Disciplined execution from concept to scalable reality</Text>
      </View>

      <View style={styles.cardsWrap}>
        {PILLARS_DATA.map((item) => (
          <PillarCard
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            iconColor={item.iconColor}
            iconBg={item.iconBg}
          />
        ))}
      </View>
    </View>
  )
}

export default Fourpillars

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
  cardsWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
})
