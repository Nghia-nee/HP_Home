#!/usr/bin/env python3
"""Test S3 connection and permissions"""

import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.environ.get('S3_BUCKET')
S3_REGION = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')

print("=" * 60)
print("S3 Configuration Test")
print("=" * 60)
print(f"S3_BUCKET: {S3_BUCKET}")
print(f"S3_REGION: {S3_REGION}")
print(f"AWS_ACCESS_KEY_ID: {'*' * 10 if AWS_ACCESS_KEY_ID else 'NOT SET'}")
print(f"AWS_SECRET_ACCESS_KEY: {'*' * 10 if AWS_SECRET_ACCESS_KEY else 'NOT SET'}")
print()

if not S3_BUCKET:
    print("❌ ERROR: S3_BUCKET not configured")
    exit(1)

if not S3_REGION:
    print("❌ ERROR: S3_REGION not configured")
    exit(1)

if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
    print("❌ ERROR: AWS credentials not configured")
    exit(1)

# Test connection
try:
    print("Testing S3 connection...")
    s3_client = boto3.client('s3', region_name=S3_REGION)
    
    # Test bucket access
    print(f"Checking bucket '{S3_BUCKET}'...")
    s3_client.head_bucket(Bucket=S3_BUCKET)
    print(f"✅ Bucket '{S3_BUCKET}' exists and is accessible")
    
    # Test write permission with a small test file
    test_key = 'test-upload.txt'
    test_content = b'Test upload from HP_Home'
    
    print(f"Testing write permission...")
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=test_key,
        Body=test_content,
        ContentType='text/plain'
    )
    print(f"✅ Successfully uploaded test file: {test_key}")
    
    # Test read permission
    print(f"Testing read permission...")
    obj = s3_client.get_object(Bucket=S3_BUCKET, Key=test_key)
    content = obj['Body'].read()
    if content == test_content:
        print(f"✅ Successfully read test file")
    else:
        print(f"❌ Content mismatch when reading test file")
    
    # Clean up test file
    print(f"Cleaning up test file...")
    s3_client.delete_object(Bucket=S3_BUCKET, Key=test_key)
    print(f"✅ Test file deleted")
    
    # List existing rooms
    print(f"\nListing existing rooms in bucket...")
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix='rooms/', MaxKeys=10)
        if 'Contents' in response:
            print(f"Found {len(response['Contents'])} objects under 'rooms/' prefix:")
            for obj in response['Contents'][:10]:
                print(f"  - {obj['Key']} ({obj['Size']} bytes)")
        else:
            print("No objects found under 'rooms/' prefix")
    except Exception as e:
        print(f"Could not list objects: {e}")
    
    # Check data/rooms.json
    print(f"\nChecking data/rooms.json...")
    try:
        obj = s3_client.get_object(Bucket=S3_BUCKET, Key='data/rooms.json')
        content = obj['Body'].read().decode('utf-8')
        import json
        rooms = json.loads(content)
        print(f"✅ Found data/rooms.json with {len(rooms)} rooms")
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            print(f"⚠️  data/rooms.json does not exist in S3 yet")
        else:
            print(f"❌ Error accessing data/rooms.json: {e}")
    
    print("\n" + "=" * 60)
    print("✅ All S3 tests passed successfully!")
    print("=" * 60)

except ClientError as e:
    error_code = e.response['Error']['Code']
    error_msg = e.response['Error']['Message']
    print(f"\n❌ AWS ClientError: {error_code} - {error_msg}")
    
    if error_code == 'NoSuchBucket':
        print(f"   Bucket '{S3_BUCKET}' does not exist")
    elif error_code == 'AccessDenied' or error_code == 'Forbidden':
        print(f"   Access denied. Check your IAM permissions.")
    else:
        print(f"   Error: {e}")
    exit(1)

except BotoCoreError as e:
    print(f"\n❌ BotoCoreError: {e}")
    exit(1)

except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
