import React, { useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, FlatList, Image, useWindowDimensions, 
  TouchableOpacity, SafeAreaView, Animated, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const slides = [
  {
    id: '1',
    title: 'Buy Together & Save Big',
    description: 'Join smart buying groups to unlock wholesale prices for premium products.',
    image: require('../assets/images/slide1.png'), 
  },
  {
    id: '2',
    title: 'Join for only ₪1',
    description: 'Secure your spot in the group with a symbolic 1₪ deposit. No risk involved.',
    image: require('../assets/images/slide2.png'),
  },
  {
    id: '3',
    title: 'Pay Only When Successful',
    description: 'You are charged the full amount only if the group reaches its target. If not? You get a full refund!',
    // אם אין לך slide3.png, תשתמשי ב-slide2.png או תוסיפי תמונה שלישית
    image: require('../assets/images/slide3.png'), 
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768; 

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/login');
    }
  };

  const skip = () => {
      router.replace('/login');
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.itemContainer, { width }]}>
        <View style={[styles.contentWrapper, isDesktop && styles.desktopContentWrapper]}>
            <Image 
                source={item.image} 
                style={[
                    styles.image, 
                    // קבענו גובה ורוחב מפורשים - זה פותר את הבעיה בטלפון
                    { 
                      width: isDesktop ? 400 : width * 0.8, 
                      height: isDesktop ? 400 : width * 0.8,
                      resizeMode: 'contain'
                    }
                ]} 
            />
            <View style={styles.textContainer}>
                <Text style={[styles.title, isDesktop && { fontSize: 36 }]}>{item.title}</Text>
                <Text style={[styles.description, isDesktop && { fontSize: 18 }]}>{item.description}</Text>
            </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
            data={slides}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            // תיקון לגלילה בדפדפן
            pagingEnabled={Platform.OS !== 'web'} 
            bounces={false}
            keyExtractor={(item) => item.id}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
            })}
            scrollEventThrottle={32}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            ref={slidesRef}
            snapToInterval={width}
            decelerationRate="fast"
        />
      </View>

      <View style={styles.paginator}>
        {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [10, 20, 10],
                extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
            });

            return <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />;
        })}
      </View>

      <View style={[styles.bottomContainer, isDesktop && { maxWidth: 600 }]}>
          {currentIndex < slides.length - 1 ? (
              <TouchableOpacity onPress={skip} style={[styles.skipButton, isDesktop && { cursor: 'pointer' } as any]}>
                  <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
          ) : (
              <View style={{width: 50}} /> 
          )}

          <TouchableOpacity onPress={scrollTo} style={[styles.nextButton, isDesktop && { cursor: 'pointer' } as any]}>
              {currentIndex === slides.length - 1 ? (
                  <Text style={styles.nextButtonText}>Get Started</Text>
              ) : (
                  <Ionicons name="arrow-forward" size={24} color="#fff" />
              )}
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
      flex: 3,
      width: '100%',
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingHorizontal: 20,
  },
  desktopContentWrapper: {
      maxWidth: 800, 
  },
  image: {
    // 👇 התיקון הקריטי: מחקנו את flex: 0.6 שהעלים את התמונות בטלפון
    marginBottom: 40,
  },
  textContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      maxWidth: 600,
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 15,
    color: '#E91E63',
    textAlign: 'center',
  },
  description: {
    fontWeight: '400',
    fontSize: 16,
    color: '#62656b',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 28,
  },
  paginator: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E91E63',
    marginHorizontal: 8,
  },
  bottomContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 40,
      paddingBottom: 40,
      flex: 0.5,
  },
  nextButton: {
      backgroundColor: '#E91E63',
      padding: 15,
      borderRadius: 100, 
      elevation: 5,
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
  },
  nextButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      paddingHorizontal: 10,
  },
  skipButton: {
      padding: 10,
  },
  skipText: {
      color: '#999',
      fontSize: 16,
      fontWeight: '600',
  }
});