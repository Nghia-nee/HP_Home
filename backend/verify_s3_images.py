#!/usr/bin/env python3
"""Verify all rooms have valid S3 images"""

import os
import json
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.environ.get('S3_BUCKET')
S3_REGION = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION')

# Load rooms.json from S3
print("Loading rooms.json from S3...")
s3_client = boto3.client('s3', region_name=S3_REGION)
obj = s3_client.get_object(Bucket=S3_BUCKET, Key='data/rooms.json')
rooms = json.loads(obj['Body'].read().decode('utf-8'))
print(f"Found {len(rooms)} rooms\n")

# Check each room
issues = []
for room in rooms:
    room_id = room['roomId']
    images = room.get('images', [])
    
    if not images:
        issues.append(f"❌ {room_id}: No images")
        continue
    
    print(f"Checking {room_id} ({len(images)} images)...")
    for img_url in images:
        # Extract S3 key from URL
        if S3_BUCKET in img_url:
            key = img_url.split('.amazonaws.com/')[-1]
            try:
                s3_client.head_object(Bucket=S3_BUCKET, Key=key)
                print(f"  ✅ {key}")
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    issues.append(f"❌ {room_id}: Missing file {key}")
                    print(f"  ❌ {key} NOT FOUND")
                else:
                    issues.append(f"❌ {room_id}: Error checking {key}: {e}")
                    print(f"  ❌ {key} ERROR: {e}")
        else:
            issues.append(f"⚠️  {room_id}: Non-S3 URL: {img_url}")
            print(f"  ⚠️  Non-S3 URL: {img_url}")

print("\n" + "="*60)
if issues:
    print(f"Found {len(issues)} issues:")
    for issue in issues:
        print(issue)
else:
    print("✅ All rooms have valid S3 images!")
print("="*60)
