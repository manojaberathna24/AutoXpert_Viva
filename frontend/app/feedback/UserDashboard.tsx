import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import Layout from '../layout';
import { useFocusEffect } from 'expo-router';
import { BASE_URL } from '../../constants';

// Sample data for registered stores
const storeData = [
  {
    id: 1,
    name: 'Auto Parts Store 1',
    location: '123 Main St, City, Country',
    contact: '+1234567890',
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Speedy Auto Repairs',
    location: '456 Elm St, City, Country',
    contact: '+0987654321',
    rating: 3.9,
  },
  {
    id: 3,
    name: 'Parts and Service Hub',
    location: '789 Oak St, City, Country',
    contact: '+1122334455',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Engine Parts World',
    location: '123 Industrial Rd, City, Country',
    contact: '+1555555555',
    rating: 4.2,
  },
  {
    id: 5,
    name: 'Quick Fix Auto Service',
    location: '987 Maple St, City, Country',
    contact: '+1456789876',
    rating: 4.3,
  }
];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>(storeData);
  const [allProducts, setAllProducts] = useState<any[]>([]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }
    const filteredProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setProducts(filteredProducts);
  };

  return (
    <Layout>
      <View style={styles.container}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for spare parts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Trigger search when the user presses "enter"
        />

        {/* Display registered stores before search */}
        <Text style={styles.storeTitle}>Registered Stores</Text>
        <FlatList
          data={stores}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.storeCard}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeLocation}>{item.location}</Text>
              <Text style={styles.storeContact}>{item.contact}</Text>
              <Text style={styles.storeRating}>Rating: {item.rating}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id.toString()}
        />

        {/* Display products after search */}
        {products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard}>
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>Rs. {item.price}</Text>
                  <Text style={styles.productAvailability}>
                    {item.available ? 'In Stock' : 'Out of Stock'}
                  </Text>
                  <Text style={styles.productStore}>{item.store.name}</Text>
                  <Text style={styles.productStoreLocation}>{item.store.location}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id.toString()}
          />
        ) : (
          <Text style={styles.noResults}>No products found.</Text>
        )}
      </View>
    </Layout>
  );
};

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
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  storeCard: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  storeName: { fontSize: 16, fontWeight: 'bold' },
  storeLocation: { fontSize: 14, color: '#555' },
  storeContact: { fontSize: 12, color: '#888' },
  storeRating: { fontSize: 12, color: '#28a745' },
  productCard: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productDetails: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productPrice: { fontSize: 14, color: '#28a745' },
  productAvailability: { fontSize: 12, color: '#dc3545' },
  productStore: { fontSize: 12, color: '#007bff' },
  productStoreLocation: { fontSize: 12, color: '#555' },
  noResults: { fontSize: 16, color: '#dc3545', textAlign: 'center', marginTop: 20 },
});

export default SearchPage;
