import { StyleSheet, View } from 'react-native'
import React from 'react'
import MarketingHeroAnimation from './MarketingHeroAnimation'

const Hero = () => {
  return (
    <View style={styles.container}>
      <MarketingHeroAnimation />
    </View>
  )
}

export default Hero

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#07101e',
  }
})
