#!/usr/bin/env python3
"""Upload local rooms.json to S3"""

import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.environ.get('S3_BUCKET')
S3_REGION = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION')

local_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'rooms.json')

if not os.path.exists(local_file):
    print(f"❌ Local file not found: {local_file}")
    exit(1)

print(f"Uploading {local_file} to S3...")
print(f"Bucket: {S3_BUCKET}")
print(f"Key: data/rooms.json")

try:
    s3_client = boto3.client('s3', region_name=S3_REGION)
    s3_client.upload_file(
        local_file,
        S3_BUCKET,
        'data/rooms.json',
        ExtraArgs={'ContentType': 'application/json'}
    )
    print("✅ Successfully uploaded rooms.json to S3")
    
    # Verify
    obj = s3_client.get_object(Bucket=S3_BUCKET, Key='data/rooms.json')
    content = obj['Body'].read().decode('utf-8')
    import json
    rooms = json.loads(content)
    print(f"✅ Verified: {len(rooms)} rooms in S3")
    
except Exception as e:
    print(f"❌ Upload failed: {e}")
    exit(1)
