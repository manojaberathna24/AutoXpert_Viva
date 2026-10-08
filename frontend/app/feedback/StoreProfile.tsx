import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Modal, Alert, ActivityIndicator
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Layout from '../layout';
import { BASE_URL } from '../../constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: string;
};

const StoreProfileScreen = () => {
  const params = useLocalSearchParams();
  const storeId = params.storeId || 1;
  const router = useRouter();

  const [storeName, setStoreName] = useState('Loading...');
  const [storeContact, setStoreContact] = useState('');
  const [locationId, setLocationId] = useState('L1');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Add modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock_status: 'Available' });

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/store/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setStoreName(data.name);
        setStoreContact(data.contact);
        setLocationId(data.location_id || 'L1');
        setProducts(data.products || []);
      } else {
        Alert.alert('Error', 'Failed to load store data');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error fetching store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (storeId) fetchStoreData(); }, [storeId]);

  // ── ADD ──────────────────────────────────────────────
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Name and Price are required.');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/api/store/${storeId}/add-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: newProduct.stock_status,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Product added!');
        setAddModalVisible(false);
        setNewProduct({ name: '', price: '', stock_status: 'Available' });
        fetchStoreData();
      } else {
        Alert.alert('Error', data.message || 'Failed to add product');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    }
  };

  // ── UPDATE ───────────────────────────────────────────
  const updateProduct = async () => {
    if (!editProduct) return;
    if (!editProduct.name || !editProduct.price) {
      Alert.alert('Error', 'Name and Price are required.');
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/api/store/${storeId}/product/${editProduct.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editProduct.name,
            price: parseFloat(String(editProduct.price)),
            stock: editProduct.stock,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Product updated!');
        setEditModalVisible(false);
        setEditProduct(null);
        fetchStoreData();
      } else {
        Alert.alert('Error', data.message || 'Failed to update');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    }
  };

  // ── DELETE ───────────────────────────────────────────
  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `"${product.name}" delete කරන්නද?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${BASE_URL}/api/store/${storeId}/product/${product.id}`,
                { method: 'DELETE' }
              );
              if (response.ok) {
                Alert.alert('Deleted', 'Product removed!');
                fetchStoreData();
              } else {
                Alert.alert('Error', 'Failed to delete');
              }
            } catch {
              Alert.alert('Error', 'Network error');
            }
          },
        },
      ]
    );
  };

  const stockColor = (stock: string) => {
    if (stock === 'Available') return 'green';
    if (stock === 'Limited Stock') return 'orange';
    return 'red';
  };

  return (
    <Layout>
      <ScrollView style={styles.container}>
        {loading && <ActivityIndicator size="large" color="#007BFF" />}

        {/* Store Info */}
        <View style={styles.card}>
          <Text style={styles.title}>Store Profile</Text>
          <Text style={styles.label}>Store Name:</Text>
          <TextInput style={styles.input} value={storeName} editable={false} />
          <Text style={styles.label}>Contact:</Text>
          <TextInput style={styles.input} value={storeContact} editable={false} />
          <Text style={styles.label}>District:</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={locationId} onValueChange={async (v) => {
              setLocationId(v);
              try {
                await fetch(`${BASE_URL}/api/store/${storeId}/update-location`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ location_id: v }),
                });
              } catch { }
            }}>
              <Picker.Item label="Colombo" value="L1" />
              <Picker.Item label="Kandy" value="L2" />
              <Picker.Item label="Galle" value="L3" />
              <Picker.Item label="Gampaha" value="L4" />
            </Picker>
          </View>
        </View>

        {/* Products */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Products ({products.length})</Text>
          {products.length === 0 && <Text style={styles.emptyText}>No products yet. Add one!</Text>}
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>LKR {product.price}</Text>
                <Text style={[styles.stockBadge, { color: stockColor(product.stock) }]}>
                  ● {product.stock}
                </Text>
              </View>
              {/* Edit Button */}
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => { setEditProduct({ ...product }); setEditModalVisible(true); }}
              >
                <MaterialIcons name="edit" size={20} color="white" />
              </TouchableOpacity>
              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteProduct(product)}
              >
                <AntDesign name="delete" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
            <AntDesign name="pluscircle" size={22} color="white" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/feedback/LoginScreen')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── ADD MODAL ─────────────────────────────────── */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={newProduct.name}
              onChangeText={t => setNewProduct({ ...newProduct, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (LKR)"
              keyboardType="numeric"
              value={newProduct.price}
              onChangeText={t => setNewProduct({ ...newProduct, price: t })}
            />
            <Text style={styles.label}>Stock Status:</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={newProduct.stock_status}
                onValueChange={v => setNewProduct({ ...newProduct, stock_status: v })}
              >
                <Picker.Item label="✅ Available" value="Available" />
                <Picker.Item label="⚠️ Limited Stock" value="Limited Stock" />
                <Picker.Item label="❌ Out of Stock" value="Out of Stock" />
              </Picker>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addProduct}>
              <Text style={styles.addBtnText}>Save Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── EDIT MODAL ─────────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {editProduct && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Product Name"
                  value={editProduct.name}
                  onChangeText={t => setEditProduct({ ...editProduct, name: t })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Price (LKR)"
                  keyboardType="numeric"
                  value={String(editProduct.price)}
                  onChangeText={t => setEditProduct({ ...editProduct, price: parseFloat(t) || 0 })}
                />
                <Text style={styles.label}>Stock Status:</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={editProduct.stock}
                    onValueChange={v => setEditProduct({ ...editProduct, stock: v })}
                  >
                    <Picker.Item label="✅ Available" value="Available" />
                    <Picker.Item label="⚠️ Limited Stock" value="Limited Stock" />
                    <Picker.Item label="❌ Out of Stock" value="Out of Stock" />
                  </Picker>
                </View>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#28a745' }]} onPress={updateProduct}>
                  <Text style={styles.addBtnText}>Update Product</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  card: { backgroundColor: 'white', padding: 20, margin: 10, borderRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  label: { fontSize: 14, color: '#555', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, color: '#333' },
  pickerWrap: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
  emptyText: { color: '#aaa', textAlign: 'center', marginVertical: 10 },
  productCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10, backgroundColor: '#f9f9f9', borderRadius: 10, elevation: 2 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  productPrice: { fontSize: 15, color: '#007BFF', marginTop: 2 },
  stockBadge: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  editBtn: { backgroundColor: '#ffa500', padding: 8, borderRadius: 8, marginLeft: 8 },
  deleteBtn: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 8, marginLeft: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007BFF', padding: 12, borderRadius: 8, marginTop: 10 },
  addBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  logoutBtn: { backgroundColor: '#e74c3c', padding: 15, margin: 20, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: 'white', padding: 24, borderRadius: 14, width: '88%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#333', textAlign: 'center' },
  cancelBtn: { marginTop: 10, padding: 12, backgroundColor: '#aaa', borderRadius: 8, alignItems: 'center' },
  cancelText: { color: 'white', fontSize: 15 },
});

export default StoreProfileScreen;
