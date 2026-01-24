from flask import Flask, request, jsonify, send_from_directory
import json
import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'assets', 'images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# S3 config
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_REGION = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION')
USE_S3 = bool(S3_BUCKET)

# Allowed extensions
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def build_s3_client():
    return boto3.client('s3', region_name=S3_REGION)


def build_s3_url(bucket, region, key):
    if region == 'us-east-1':
        return f"https://{bucket}.s3.amazonaws.com/{key}"
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

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

@app.route('/rooms', methods=['POST'])
def add_room():
    try:
        folder_name = request.form.get('folderName')
        room_data = {
            'roomId': request.form.get('roomId'),
            'district': request.form.get('district'),
            'districtLabel': request.form.get('districtLabel'),
            'ward': request.form.get('ward'),
            'wardLabel': request.form.get('wardLabel'),
            'price': int(request.form.get('price')),
            'tags': json.loads(request.form.get('tags')),
            'note': request.form.get('note', ''),
            'images': []
        }
        
        files = request.files.getlist('images')

        if USE_S3:
            if not S3_REGION:
                return jsonify({'error': 'Missing AWS_REGION for S3 upload'}), 400
            s3_client = build_s3_client()
            for i, file in enumerate(files, 1):
                if file and allowed_file(file.filename):
                    ext = file.filename.rsplit('.', 1)[1].lower()
                    key = f"rooms/{folder_name}/{i}.{ext}"
                    try:
                        s3_client.upload_fileobj(
                            file,
                            S3_BUCKET,
                            key,
                            ExtraArgs={
                                'ContentType': file.mimetype
                            }
                        )
                    except (BotoCoreError, ClientError) as e:
                        return jsonify({'error': f"S3 upload failed: {str(e)}"}), 500
                    room_data['images'].append(build_s3_url(S3_BUCKET, S3_REGION, key))
        else:
            room_folder = os.path.join(app.config['UPLOAD_FOLDER'], folder_name)
            os.makedirs(room_folder, exist_ok=True)
            for i, file in enumerate(files, 1):
                if file and allowed_file(file.filename):
                    ext = file.filename.rsplit('.', 1)[1].lower()
                    filename = f"{i}.{ext}"
                    file.save(os.path.join(room_folder, filename))
                    room_data['images'].append(f"/assets/images/{folder_name}/{filename}")
        
        rooms.append(room_data)
        # Save to file
        with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'rooms.json'), 'w', encoding='utf-8') as f:
            json.dump(rooms, f, ensure_ascii=False, indent=2)
        return jsonify({'message': 'Room added', 'roomId': room_data['roomId']}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/rooms/<room_id>', methods=['DELETE'])
def delete_room(room_id):
    global rooms
    # Find room to delete
    room = next((r for r in rooms if r['roomId'] == room_id), None)
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    # Delete images from S3 or local
    if USE_S3:
        s3_client = build_s3_client()
        for image_url in room.get('images', []):
            # Extract key from URL: https://{bucket}.s3.{region}.amazonaws.com/{key}
            if S3_BUCKET in image_url:
                parts = image_url.split('.amazonaws.com/')
                if len(parts) > 1:
                    key = parts[1]
                    try:
                        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
                        print(f"Deleted S3 object: {key}")
                    except (BotoCoreError, ClientError) as e:
                        print(f"Failed to delete {key}: {e}")

        # Also clean up any leftover objects in the room prefix
        prefix = f"rooms/{room_id}/"
        try:
            resp = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
            keys = [obj['Key'] for obj in resp.get('Contents', [])]
            if keys:
                delete_payload = {'Objects': [{'Key': k} for k in keys]}
                s3_client.delete_objects(Bucket=S3_BUCKET, Delete=delete_payload)
                print(f"Deleted remaining objects under prefix: {prefix}")
        except (BotoCoreError, ClientError) as e:
            print(f"Failed to clean prefix {prefix}: {e}")
    else:
        # Delete local folder
        room_folder = os.path.join(app.config['UPLOAD_FOLDER'], room_id)
        if os.path.exists(room_folder):
            import shutil
            shutil.rmtree(room_folder)
    
    # Remove from rooms list
    rooms = [r for r in rooms if r['roomId'] != room_id]
    # Save to file
    with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'rooms.json'), 'w', encoding='utf-8') as f:
        json.dump(rooms, f, ensure_ascii=False, indent=2)
    return jsonify({'message': 'Room deleted'})

# Serve uploaded images
@app.route('/assets/images/<path:path>')
def serve_images(path):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER']), path)

if __name__ == '__main__':
    app.run(debug=False)