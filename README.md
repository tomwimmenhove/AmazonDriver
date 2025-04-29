# AmazonDriver

A system for tracking Amazon delivery drivers in real-time using Amazon's internal tracking API.

## Overview

AmazonDriver is a Node.js application that allows you to track Amazon delivery drivers in real-time by leveraging Amazon's internal tracking API. The system authenticates with Amazon's services, retrieves tracking information for packages, and stores the geolocation data in a database for visualization and analysis.

## Features

- **Amazon Authentication**: Securely authenticate with Amazon's services
- **Real-time Tracking**: Monitor delivery driver locations in real-time
- **Geolocation History**: Store and retrieve historical location data
- **API Server**: Access tracking data through a RESTful API
- **Database Storage**: Persist tracking information in a MariaDB/MySQL database
- **Automatic Session Management**: Handle authentication token refresh

## System Architecture

The application consists of several components:

- **amazon.js**: Handles authentication with Amazon's services using Puppeteer
- **trackDriver.js**: Communicates with Amazon's tracking API to get driver location
- **aquire.js**: Main data acquisition script that polls for updates
- **apiserver.js**: RESTful API server for accessing tracking data
- **trackingDB.js**: Database interface for storing and retrieving tracking data
- **db.js**: Database connection management

## Database Schema

The system uses a MariaDB/MySQL database with the following main tables:

- **Users**: Store user credentials for Amazon authentication
- **TrackingNumbers**: Mapping between internal IDs and Amazon tracking numbers
- **Packages**: Link users to their packages with delivery status
- **GeoTracking**: Store geolocation history for each package
- **DeliveryStatus**: Track package delivery status
- **Cookies**: Store authentication cookies for Amazon sessions

## Prerequisites

- Node.js (v14 or higher)
- MariaDB/MySQL database
- Environment variables for database configuration:
  - DB_HOST
  - DB_USER
  - DB_PASS
  - DB_NAME

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   mysql -u your_user -p < AmazonDriver.sql
   ```
4. Configure environment variables for database connection

## Usage

### Data Acquisition

Start the data acquisition process:

```
node aquire.js
```

This script will:
1. Authenticate with Amazon using stored credentials
2. Poll for package tracking updates
3. Store geolocation data in the database
4. Automatically refresh authentication when needed

### API Server

Start the API server:

```
node apiserver.js
```

The API server provides the following endpoints:

- **GET /api/history?trackingId={encodedTrackingId}&after={timestamp}&until={timestamp}**  
  Get location history for a specific tracking number

- **GET /api/list**  
  List all tracked packages

## Security Considerations

- The application stores Amazon credentials in the database
- Authentication cookies are stored in the database
- Use appropriate security measures to protect sensitive information
- Consider implementing proper access controls for the API server

## Development

### Adding a New User and Package

```javascript
// Example code to add a new user and package
const trackingDB = require('./trackingDB');

async function addUserAndPackage() {
  await trackingDB.addUser('username', 'password');
  await trackingDB.addPackage('username', 'TRACKING-NUMBER');
}
```

### Tracking Data Format

The tracking data returned from Amazon's API includes:

- Driver's current location (latitude, longitude)
- Package status (e.g., "OUT_FOR_DELIVERY", "DELIVERED")
- Estimated delivery time
- Additional delivery information

## License

This project is for educational purposes only. Use responsibly and in accordance with Amazon's terms of service.

## Disclaimer

This application interacts with Amazon's internal APIs which are not officially documented or supported for public use. Amazon may change these APIs at any time, which could break functionality. Use at your own risk.

## Shout-out
Thanks to Hublar Michael Joshua (Member of 2600 - The Hacker Quarterly) for writing this Readme!
