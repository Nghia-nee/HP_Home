# HP Home - Room Image Gallery

A lightweight web application for browsing rental rooms with tag-based search, built within AWS Free Tier constraints.

## Features

- Browse rooms by ward (phường)
- View 3-5 images per room
- Search and filter using multiple tags (balcony, duplex, etc.)
- 100% within AWS Free Tier limits

## Architecture

- **Frontend**: HTML/CSS/JavaScript
- **Backend**: Python Flask API
- **Storage**: Amazon S3 for images
- **Data**: JSON files for room metadata and tag definitions

## Local Development

1. Install Python dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python app.py
   ```

3. Open http://localhost:5000 in your browser

## Deployment

Deploy the backend to AWS EC2 (t2.micro), and upload images to S3. Update the S3 URLs in rooms.json accordingly.

## Project Structure

```
HP_Home/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── app.py
│   └── requirements.txt
├── data/
│   ├── rooms.json
│   └── tag-definitions.json
└── README.md
```