from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__)

# Load data
with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'tag-definitions.json'), 'r', encoding='utf-8') as f:
    tag_definitions = json.load(f)

with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'rooms.json'), 'r', encoding='utf-8') as f:
    rooms = json.load(f)

def get_price_filter(price_range):
    if price_range == 'under-4m':
        return lambda p: p < 4000000
    elif price_range == 'over-4m':
        return lambda p: p >= 4000000
    return lambda p: True

@app.route('/')
def index():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), path)

@app.route('/districts')
def get_districts():
    price_range = request.args.get('priceRange')
    price_filter = get_price_filter(price_range)
    districts = {}
    for room in rooms:
        if price_filter(room['price']):
            dist = room['district']
            districts[dist] = districts.get(dist, 0) + 1
    return jsonify([{'name': d, 'roomCount': c} for d, c in districts.items() if c > 0])

@app.route('/wards')
def get_wards():
    district = request.args.get('district')
    price_range = request.args.get('priceRange')
    price_filter = get_price_filter(price_range)
    wards = {}
    for room in rooms:
        if room['district'] == district and price_filter(room['price']):
            ward = room['ward']
            wards[ward] = wards.get(ward, 0) + 1
    return jsonify([{'name': w, 'roomCount': c} for w, c in wards.items() if c > 0])

@app.route('/rooms')
def get_rooms():
    district = request.args.get('district')
    ward = request.args.get('ward')
    price_range = request.args.get('priceRange')
    price_filter = get_price_filter(price_range)
    filtered_rooms = [
        room for room in rooms
        if (not district or room['district'] == district) and
           (not ward or room['ward'] == ward) and
           price_filter(room['price'])
    ]
    return jsonify(filtered_rooms)

@app.route('/tags')
def get_tags():
    return jsonify(tag_definitions)

if __name__ == '__main__':
    app.run(debug=True)