import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ScrollView } from 'react-native';
import Layout from '../layout';
import { useRouter, useFocusEffect } from 'expo-router';
import { debounce } from 'lodash';
import { BASE_URL } from '../../constants';

type Store = {
  id: number;
  name: string;
  location: string;
  contact: string;
  rating: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  available: boolean;
  image: string;
  store: Store;
};

const storeData: Store[] = [
  { id: 1, name: 'Auto Parts Store 1', location: '123 Main St, City, Country', contact: '+1234567890', rating: 4.5 },
  { id: 2, name: 'Speedy Auto Repairs', location: '456 Elm St, City, Country', contact: '+0987654321', rating: 3.9 },
  { id: 3, name: 'Parts and Service Hub', location: '789 Oak St, City, Country', contact: '+1122334455', rating: 4.7 },
  { id: 4, name: 'Engine Parts World', location: '123 Industrial Rd, City, Country', contact: '+1555555555', rating: 4.2 },
  { id: 5, name: 'Quick Fix Auto Service', location: '987 Maple St, City, Country', contact: '+1456789876', rating: 4.3 }
];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>(storeData);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minRating, setMinRating] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<'stores' | 'parts'>('stores');

  const router = useRouter();

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          // Fetch stores
          const storeRes = await fetch(`${BASE_URL}/api/all`);
          if (storeRes.ok) {
            const storeData = await storeRes.json();
            if (storeData && storeData.length > 0) setStores(storeData);
          }
          
          // Fetch products
          const prodRes = await fetch(`${BASE_URL}/api/all-products`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData && prodData.length > 0) setAllProducts(prodData);
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      };
      fetchData();
    }, [])
  );

  const handleSearch = debounce(() => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }
    const filteredProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setProducts(filteredProducts);
  }, 300);

  const navigateToStoreProfile = (store: Store) => {
    router.push({
      pathname: '/feedback/StoreDetailsPage',
      params: { store: JSON.stringify(store) },
    });
  };

  const navigateToProductDetails = (product: Product) => {
    router.push({
      pathname: '/feedback/ProductDetailsPage',
      params: { product: JSON.stringify(product) },
    });
  };

  const handleRatingFilter = (rating: number) => {
    setMinRating(rating);
  };

  const filteredStores = stores
    .filter(store => store.rating >= minRating)
    .sort((a, b) => sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating);

  return (
    <Layout>
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder={activeSection === 'stores' ? "Search for stores..." : "Search for spare parts..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          accessibilityLabel={activeSection === 'stores' ? "Search input for stores" : "Search input for spare parts"}
          accessibilityHint={activeSection === 'stores' ? "Type the name of the store you are looking for" : "Type the name of the spare part you are looking for"}
        />

        <View style={styles.sectionSelector}>
          <TouchableOpacity
            style={[styles.sectionButton, activeSection === 'stores' && styles.activeSectionButton]}
            onPress={() => setActiveSection('stores')}
          >
            <Text style={[styles.sectionButtonText, activeSection === 'stores' && styles.activeSectionButtonText]}>Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionButton, activeSection === 'parts' && styles.activeSectionButton]}
            onPress={() => setActiveSection('parts')}
          >
            <Text style={[styles.sectionButtonText, activeSection === 'parts' && styles.activeSectionButtonText]}>Spare Parts</Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'stores' ? (
          <>
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Filter Stores by Rating:</Text>
              <View style={styles.ratingFilterButtons}>
                {[0, 3, 4].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      minRating === rating && styles.activeRatingButton
                    ]}
                    onPress={() => handleRatingFilter(rating)}
                  >
                    <Text style={[
                      styles.ratingButtonText,
                      minRating === rating && styles.activeRatingButtonText
                    ]}>
                      {rating === 0 ? 'All' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortOrder === 'asc' && styles.activeSortButton
                  ]}
                  onPress={() => setSortOrder('asc')}
                >
                  <Text style={styles.sortButtonText}>Low to High</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortOrder === 'desc' && styles.activeSortButton
                  ]}
                  onPress={() => setSortOrder('desc')}
                >
                  <Text style={styles.sortButtonText}>High to Low</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Nearby Stores</Text>
            {filteredStores.length === 0 ? (
              <Text style={styles.noResults}>No stores found matching your criteria.</Text>
            ) : (
              <FlatList
                data={filteredStores}
                renderItem={({ item }) => (
                  <StoreCard store={item} onPress={() => navigateToStoreProfile(item)} />
                )}
                keyExtractor={item => item.id.toString()}
              />
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Spare Parts</Text>
            {searchQuery ? (
              <>
                <FlatList
                  data={products}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => navigateToProductDetails(item)} />
                  )}
                  keyExtractor={item => item.id.toString()}
                />
                {products.length === 0 && (
                  <Text style={styles.noResults}>No products found.</Text>
                )}
              </>
            ) : (
              <ScrollView>
                <Text style={styles.subSectionTitle}>Popular Parts</Text>
                <View style={styles.popularPartsContainer}>
                  {products.slice(0, 4).map(product => (
                    <ProductCard key={product.id} product={product} onPress={() => navigateToProductDetails(product)} />
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}
      </View>
    </Layout>
  );
};

const StoreCard = ({ store, onPress }: { store: Store; onPress: () => void }) => (
  <TouchableOpacity style={styles.storeCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Store: ${store.name}, Rating: ${store.rating}`}>
    <Text style={styles.storeName}>{store.name}</Text>
    <Text style={styles.storeLocation}>{store.location}</Text>
    <Text style={styles.storeContact}>{store.contact}</Text>
    <View style={styles.ratingContainer}>
      <Text style={styles.storeRating}>Rating: </Text>
      <Text style={[styles.storeRatingValue, { color: store.rating >= 4 ? '#28a745' : store.rating >= 3 ? '#ffc107' : '#dc3545' }]}>
        {store.rating}
      </Text>
    </View>
  </TouchableOpacity>
);

const ProductCard = ({ product, onPress }: { product: Product; onPress: () => void }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Product: ${product.name}, Price: ${product.price}`}>
    <View style={styles.productDetails}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>Rs. {product.price}</Text>
      <Text style={[styles.productAvailability, { color: product.available ? '#28a745' : '#dc3545' }]}>
        {product.available ? 'In Stock' : 'Out of Stock'}
      </Text>
      <View style={styles.storeInfo}>
        <Text style={styles.productStore}>{product.store.name}</Text>
        <Text style={styles.productStoreRating}>{product.store.rating} ★</Text>
      </View>
      <Text style={styles.productStoreLocation}>{product.store.location}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: 'white',
  },
  sectionSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionButton: {
    borderBottomColor: '#007bff',
  },
  sectionButtonText: {
    fontSize: 16,
    color: '#555',
  },
  activeSectionButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  ratingFilterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  ratingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  activeRatingButton: {
    backgroundColor: '#007bff',
  },
  ratingButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeRatingButtonText: {
    color: 'white',
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sortButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: '#007bff',
  },
  sortButtonText: {
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  storeCard: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storeLocation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  storeContact: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeRating: {
    fontSize: 14,
    color: '#555',
  },
  storeRatingValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productAvailability: {
    fontSize: 14,
    marginBottom: 4,
  },
  storeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productStore: {
    fontSize: 14,
    color: '#555',
  },
  productStoreRating: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: 'bold',
  },
  productStoreLocation: {
    fontSize: 12,
    color: '#777',
  },
  noResults: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
  popularPartsContainer: {
    marginBottom: 20,
  },
});

export default SearchPage;
