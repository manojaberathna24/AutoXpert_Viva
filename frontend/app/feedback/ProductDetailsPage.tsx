import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Keyboard,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Layout from '../layout';
import * as Animatable from 'react-native-animatable';
import StarRating from 'react-native-star-rating-widget';
import { BASE_URL } from '../../constants';

const { width } = Dimensions.get('window');

type FeedbackItem = {
  user: string;
  comment: string;
  sentiment: 'positive' | 'negative';
};

type ProductType = {
  name: string;
  price: number;
  image: string;
  available: boolean;
  store: {
    name: string;
    location: string;
  };
  feedback?: FeedbackItem[];
};

const ProductDetailsPage = () => {
  const { product } = useLocalSearchParams();
  const router = useRouter();

  const [parsedProduct, setParsedProduct] = useState<ProductType | null>(null);
  const [comment, setComment] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'positive' | 'negative'>('positive');

  useEffect(() => {
    if (product) {
      try {
        const parsed = JSON.parse(product as string);
        setParsedProduct(parsed);
      } catch (e) {
        console.error('Failed to parse product param:', e);
        Alert.alert('Error', 'Invalid product data.');
      }
    }
  }, [product]);

  const [storeData, setStoreData] = useState<any>(null);
  const commentRef = React.useRef<string>("");
  const [userRating, setUserRating] = useState(0);
  const [inputKey, setInputKey] = useState(0);



  const fetchStoreData = React.useCallback(async () => {
    if (parsedProduct && parsedProduct.store && parsedProduct.store.id) {
      try {
        const response = await fetch(`${BASE_URL}/store/${parsedProduct.store.id}`);
        if (response.ok) {
          const data = await response.json();
          setStoreData(data);
        }
      } catch (error) {
        console.error("Failed to fetch store data", error);
      }
    }
  }, [parsedProduct]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const getPrediction = React.useCallback(async () => {
    const text = commentRef.current;
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    try {
      const storeId = parsedProduct?.store?.id;
      if (!storeId) {
        Alert.alert('Error', 'Store ID is missing');
        return;
      }

      const response = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          store_id: storeId,
          rating: userRating
        }),
      });

      if (!response.ok) throw new Error('Prediction request failed');

      const data = await response.json();

      setPopupType(data.prediction === 'positive' ? 'positive' : 'negative');
      setPopupMessage(`Feedback: ${data.prediction} | Rating: ${userRating}⭐`);
      setShowPopup(true);

      commentRef.current = "";
      setUserRating(0);
      setInputKey(prev => prev + 1);
      Keyboard.dismiss();

      // Refresh store data to show new rating/feedback immediately
      fetchStoreData();

      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert('Error', 'Something went wrong while sending feedback.');
    }
  }, [userRating, parsedProduct, fetchStoreData]);

  const totalFeedback = storeData?.feedback?.length || 0;
  const positiveFeedback = storeData?.feedback?.filter((f: any) => f.sentiment === 'positive').length || 0;
  const negativeFeedback = totalFeedback - positiveFeedback;
  const displayRating = storeData?.rating || parsedProduct?.store?.rating || 0;

  const handleTextChange = React.useCallback((text: string) => {
    commentRef.current = text;
  }, []);

  if (!parsedProduct) {
    return (
      <Layout>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading product details...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Improved Product Image Section removed as store owners don't upload images */}

        <View style={styles.card}>
          <Text style={styles.productName}>{parsedProduct.name}</Text>
          <Text style={styles.productPrice}>
            Rs. {(typeof parsedProduct.price === 'number' ? parsedProduct.price : parseFloat(parsedProduct.price || '0')).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.productAvailability,
              { color: parsedProduct.available ? '#28a745' : '#dc3545' },
            ]}
          >
            {parsedProduct.available ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          <Text style={styles.productStore}>🏬 {parsedProduct.store.name}</Text>
          <Text style={styles.productStoreLocation}>📍 {parsedProduct.store.location}</Text>
          {storeData?.mapslink ? (
            <TouchableOpacity 
              style={{ marginTop: 10 }}
              onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(storeData.mapslink).catch(() => Alert.alert('Error', 'Could not open map link'));
                });
              }}
            >
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>🗺️ Open Location on Google Maps</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            style={{ marginTop: 10 }}
            onPress={() => {
              router.push({
                pathname: '/feedback/StoreDetailsPage',
                params: { store: JSON.stringify(parsedProduct.store) },
              });
            }}
          >
            <Text style={{ color: '#007bff', fontWeight: 'bold' }}>🏪 View Store Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Store Feedback Summary</Text>
          <Text style={styles.feedbackSummary}>
            Total: {totalFeedback} | Positive: {positiveFeedback} | Negative: {negativeFeedback}
          </Text>

          <StarRating
            rating={displayRating}
            starSize={30}
            onChange={() => { }}
            enableHalfStar
            enableSwiping={false}
            color="#facc15"
            emptyColor="#e5e7eb"
            readonly
          />

          <Text style={styles.feedbackSummary}>
            Rating: {displayRating} out of 5
          </Text>
        </View>

        <Text style={styles.subTitle}>Store Customer Feedback</Text>
        {storeData?.feedback && storeData.feedback.length > 0 ? (
          storeData.feedback.slice(0, 3).map((item: any, index: number) => (
            <View key={index} style={styles.feedbackCard}>
              <Text style={styles.feedbackUser}>🧑 {item.user}</Text>
              <Text style={styles.feedbackComment}>💬 {item.comment}</Text>
              <Text
                style={[
                  styles.feedbackSentiment,
                  { color: item.sentiment === 'positive' ? '#10B981' : '#EF4444' },
                ]}
              >
                {item.sentiment === 'positive' ? '😊 Positive' : '😞 Negative'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noFeedback}>No feedback available.</Text>
        )}

        <Text style={styles.subTitle}>Add Store Feedback</Text>
        <TextInput
          key={inputKey}
          style={styles.input}
          placeholder="Enter your feedback here..."
          onChangeText={handleTextChange}
          multiline
        />
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <StarRating
            rating={userRating}
            onChange={setUserRating}
            starSize={40}
            enableHalfStar
            color="#facc15"
            emptyColor="#e5e7eb"
          />
        </View>
        <TouchableOpacity style={styles.feedbackButton} onPress={getPrediction}>
          <Text style={styles.buttonText}>Submit Feedback</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showPopup && (
        <Animatable.View
          animation="bounceIn"
          duration={1000}
          style={[
            styles.popupContainer,
            { backgroundColor: popupType === 'positive' ? '#10B981' : '#EF4444' },
          ]}
        >
          <Text style={styles.popupText}>{popupMessage}</Text>
        </Animatable.View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingBottom: 40,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    padding: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  productPrice: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 5,
  },
  productAvailability: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
  },
  productStore: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 5,
  },
  productStoreLocation: {
    fontSize: 16,
    color: '#6b7280',
  },
  feedbackSummary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginVertical: 5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 10,
    color: '#1f2937',
  },
  feedbackCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  feedbackUser: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#111827',
  },
  feedbackComment: {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
  },
  feedbackSentiment: {
    fontWeight: '700',
    fontSize: 13,
  },
  noFeedback: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  feedbackButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 15,
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  popupContainer: {
    position: 'absolute',
    bottom: 40,
    left: '10%',
    right: '10%',
    padding: 15,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  popupText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProductDetailsPage;
