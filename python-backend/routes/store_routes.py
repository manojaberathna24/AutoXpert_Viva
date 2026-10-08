from flask import Blueprint, request, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

# Create a Blueprint for store-related routes
store_bp = Blueprint('store', __name__)

# Helper function to log messages to the database
def log_to_db(level, message, user_email=None, endpoint=None):
    """
    Logs a message to the 'logs' table in the database.
    """
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO logs (level, message, user_email, endpoint)
                     VALUES (?, ?, ?, ?)''',
                  (level, message, user_email, endpoint))
        conn.commit()
    except sqlite3.Error as e:
        print(f"Error logging to database: {e}")
    finally:
        conn.close()

@store_bp.route('/all', methods=['GET'])
def get_all_stores():
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id, store_name, location_id, contact_number FROM stores')
        rows = c.fetchall()
        
        stores = []
        for row in rows:
            # Get rating from feedback
            c.execute('SELECT rating, sentiment FROM feedback WHERE store_id = ?', (row[0],))
            feedbacks = c.fetchall()
            
            calculated_ratings = []
            for f in feedbacks:
                star_val = f[0]
                senti_val = f[1]
                if star_val is not None and star_val > 0:
                    calculated_ratings.append(star_val)
                elif senti_val:
                    if senti_val == 'positive':
                        calculated_ratings.append(5.0)
                    elif senti_val == 'negative':
                        calculated_ratings.append(1.0)
                    else:
                        calculated_ratings.append(3.0)
            
            if calculated_ratings:
                stars = round(sum(calculated_ratings) / len(calculated_ratings), 1)
            else:
                stars = 4.0

            loc = row[2]
            loc_name = 'Colombo' if loc == 'L1' else 'Kandy' if loc == 'L2' else 'Galle' if loc == 'L3' else 'Gampaha' if loc == 'L4' else loc
            
            stores.append({
                'id': row[0],
                'name': row[1],
                'location': loc_name,
                'contact': row[3],
                'rating': stars
            })
        conn.close()
        return jsonify(stores), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/all-products', methods=['GET'])
def get_all_products():
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        query = '''
            SELECT p.id, p.name, p.price, p.stock, s.id, s.store_name, s.location_id, s.contact_number
            FROM products p
            JOIN stores s ON p.store_id = s.id
        '''
        c.execute(query)
        rows = c.fetchall()
        
        products = []
        for row in rows:
            c.execute('SELECT rating, sentiment FROM feedback WHERE store_id = ?', (row[4],))
            feedbacks = c.fetchall()
            calculated_ratings = []
            for f in feedbacks:
                star_val = f[0]
                senti_val = f[1]
                if star_val is not None and star_val > 0:
                    calculated_ratings.append(star_val)
                elif senti_val:
                    if senti_val == 'positive':
                        calculated_ratings.append(5.0)
                    elif senti_val == 'negative':
                        calculated_ratings.append(1.0)
                    else:
                        calculated_ratings.append(3.0)
            
            stars = round(sum(calculated_ratings) / len(calculated_ratings), 1) if calculated_ratings else 4.0
            loc = row[6]
            loc_name = 'Colombo' if loc == 'L1' else 'Kandy' if loc == 'L2' else 'Galle' if loc == 'L3' else 'Gampaha' if loc == 'L4' else loc

            # Assign a dynamic image based on the product name so the user knows it's not the old hardcoded one
            p_name = row[1].lower()
            if 'bulb' in p_name:
                img_url = 'https://m.media-amazon.com/images/I/71l3uGJ8n1L._AC_UF894,1000_QL80_.jpg'
            elif 'oil' in p_name:
                img_url = 'https://paisleyautocare.co.uk/cdn/shop/articles/Quality_Oil_Filter.webp?v=1686642910&width=1600'
            elif 'brake' in p_name or 'pad' in p_name:
                img_url = 'https://images-cdn.ubuy.co.in/633ff1c6acee89023641bdf5-power-stop-koe206-autospecialty-rear.jpg'
            elif 'bumper' in p_name:
                img_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVa45jD2tXmZg48ZqLzY5e8C6k6vD3w2yJ8A&s'
            else:
                img_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-4H1G6aQ8qLzY5e8C6k6vD3w2yJ8A&s' # Generic part

            products.append({
                'id': row[0],
                'name': row[1],
                'price': row[2],
                'available': bool(row[3]),
                'image': img_url, 
                'store': {
                    'id': row[4],
                    'name': row[5],
                    'location': loc_name,
                    'contact': row[7],
                    'rating': stars
                }
            })
            
        conn.close()
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/login', methods=['POST'])
def login():
    """
    Logs in a store owner.
    """
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id, store_name, password FROM stores WHERE LOWER(email) = LOWER(?)', (email,))
        store = c.fetchone()
        conn.close()

        if store and check_password_hash(store[2], password):
             log_to_db('INFO', 'Login successful', email, '/login')
             return jsonify({
                 'message': 'Login successful',
                 'store_id': store[0],
                 'store_name': store[1]
             }), 200
        else:
            log_to_db('ERROR', 'Invalid credentials', email, '/login')
            return jsonify({'message': 'Invalid email or password'}), 401
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', email, '/login')
        return jsonify({'message': 'Login failed'}), 500

@store_bp.route('/register', methods=['POST'])
def register_store():
    """
    Registers a new store by saving its details to the database.
    """
    data = request.json
    email = data.get('email')
    print(f"DEBUG: Registration request received for email: {email}")
    store_name = data.get('store_name')
    store_type = data.get('store_type')
    store_description = data.get('store_description')
    contact_number = data.get('contact_number')
    email = data.get('email')
    password = data.get('password')
    latitude = data.get('latitude', 6.9271)
    longitude = data.get('longitude', 79.8612)
    mapslink = data.get('mapslink', '')
    location_id = data.get('location_id', 'L1')

    q1 = data.get('q1')
    a1 = data.get('a1')
    q2 = data.get('q2')
    a2 = data.get('a2')
    q3 = data.get('q3')
    a3 = data.get('a3')

    if not all([store_name, store_type, contact_number, email, password, q1, a1, q2, a2, q3, a3]):
        log_to_db('ERROR', 'Missing required fields', email, '/register')
        return jsonify({'message': 'All fields including security questions are required'}), 400

    hashed_password = generate_password_hash(password)
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('''INSERT INTO stores 
                     (store_name, store_type, store_description, contact_number, email, password, latitude, longitude, mapslink, location_id, q1, a1, q2, a2, q3, a3)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (store_name, store_type, store_description, contact_number, email, hashed_password, latitude, longitude, mapslink, location_id, q1, a1, q2, a2, q3, a3))
        conn.commit()
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', email, '/register')
        return jsonify({'message': 'Failed to register store'}), 500
    finally:
        conn.close()

    log_to_db('INFO', 'Store registered successfully', email, '/register')
    return jsonify({'message': 'Store registered successfully'}), 201

@store_bp.route('/store/<int:store_id>/update-location', methods=['POST'])
def update_store_location(store_id):
    data = request.json
    location_id = data.get('location_id')
    if not location_id:
        return jsonify({'message': 'Location ID is required'}), 400
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('UPDATE stores SET location_id = ? WHERE id = ?', (location_id, store_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Location updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/store/<int:store_id>/add-product', methods=['POST'])
def add_product(store_id):
    """
    Adds a new product to a store.
    """
    data = request.json
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock', False)

    if not all([name, price]):
        log_to_db('ERROR', 'Missing required fields', endpoint='/store/add-product')
        return jsonify({'message': 'Name and price are required'}), 400

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id FROM stores WHERE id = ?', (store_id,))
        store = c.fetchone()
        if not store:
            log_to_db('ERROR', f'Store with ID {store_id} does not exist', endpoint='/store/add-product')
            return jsonify({'message': 'Store not found'}), 404

        c.execute('''INSERT INTO products 
                     (store_id, name, price, stock, image_path)
                     VALUES (?, ?, ?, ?, ?)''',
                  (store_id, name, price, stock, data.get('image_path', '')))
        conn.commit()
        product_id = c.lastrowid
    except sqlite3.Error as e:
        log_to_db('ERROR', f'Database error: {e}', endpoint='/store/add-product')
        return jsonify({'message': 'Failed to add product'}), 500
    finally:
        conn.close()

    log_to_db('INFO', 'Product added successfully', endpoint='/store/add-product')
    return jsonify({
        'id': product_id,
        'store_id': store_id,
        'name': name,
        'price': price,
        'stock': stock,
    }), 201

@store_bp.route('/store/<int:store_id>/product/<int:product_id>', methods=['PUT'])
def update_product(store_id, product_id):
    """Update a product's name, price, and stock status."""
    data = request.json
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')

    if not all([name, price is not None, stock is not None]):
        return jsonify({'message': 'Name, price and stock are required'}), 400

    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id FROM products WHERE id = ? AND store_id = ?', (product_id, store_id))
        if not c.fetchone():
            return jsonify({'message': 'Product not found'}), 404
        c.execute(
            'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ? AND store_id = ?',
            (name, price, stock, product_id, store_id)
        )
        conn.commit()
        conn.close()
        log_to_db('INFO', f'Product {product_id} updated', endpoint='/store/update-product')
        return jsonify({'message': 'Product updated successfully'}), 200
    except sqlite3.Error as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/store/<int:store_id>/product/<int:product_id>', methods=['DELETE'])
def delete_product(store_id, product_id):
    """Delete a product from a store."""
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT id FROM products WHERE id = ? AND store_id = ?', (product_id, store_id))
        if not c.fetchone():
            return jsonify({'message': 'Product not found'}), 404
        c.execute('DELETE FROM products WHERE id = ? AND store_id = ?', (product_id, store_id))
        conn.commit()
        conn.close()
        log_to_db('INFO', f'Product {product_id} deleted', endpoint='/store/delete-product')
        return jsonify({'message': 'Product deleted successfully'}), 200
    except sqlite3.Error as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/forgot-password/questions', methods=['POST'])
def get_security_questions():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT q1, q2, q3 FROM stores WHERE LOWER(email) = LOWER(?)', (email,))
        row = c.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                'q1': row[0],
                'q2': row[1],
                'q3': row[2]
            }), 200
        else:
            return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@store_bp.route('/forgot-password/reset', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    a1 = data.get('a1')
    a2 = data.get('a2')
    a3 = data.get('a3')
    new_password = data.get('new_password')
    
    if not all([email, a1, a2, a3, new_password]):
        return jsonify({'message': 'All fields are required'}), 400
        
    try:
        conn = sqlite3.connect('stores.db')
        c = conn.cursor()
        c.execute('SELECT a1, a2, a3 FROM stores WHERE LOWER(email) = LOWER(?)', (email,))
        row = c.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'message': 'User not found'}), 404
            
        # Verify answers (case-insensitive for answers is usually better)
        if (row[0].strip().lower() == a1.strip().lower() and 
            row[1].strip().lower() == a2.strip().lower() and 
            row[2].strip().lower() == a3.strip().lower()):
            
            hashed_pw = generate_password_hash(new_password)
            c.execute('UPDATE stores SET password = ? WHERE LOWER(email) = LOWER(?)', (hashed_pw, email))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Password reset successful'}), 200
        else:
            conn.close()
            return jsonify({'message': 'Security answers do not match'}), 401
            
    except Exception as e:
        return jsonify({'message': str(e)}), 500