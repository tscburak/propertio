# Propertio - Real Estate Management Platform

A comprehensive real estate management platform built with Next.js, MongoDB, and Shopify Polaris.

## Features

- **Property Management**: Create, view, and manage real estate properties
- **Image Upload**: Upload multiple images for each property
- **Property Types**: Categorized properties by type (House, Apartment, Office, etc.)
- **Responsive Design**: Modern UI built with Shopify Polaris components
- **Pagination**: Efficient property listing with pagination
- **Search & Filter**: Advanced search and filtering capabilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd propertio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/propertio
NEXT_PUBLIC_API_URL=/api
```

4. Start the development server:
```bash
npm run dev
```

5. Seed the database with property types:
```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit `http://localhost:3000/api/seed` in your browser.

### Usage

#### Posting a New Property

1. Navigate to the "Post New Property" page
2. Fill in the property details:
   - **Title**: A descriptive title for the property
   - **Property Type**: Select from available types (House, Apartment, Office, etc.)
   - **Price**: Enter the property price in USD
   - **Description**: Provide a detailed description
3. Upload images (optional):
   - Drag and drop or click to browse
   - Supports JPG, PNG, WebP up to 10MB each
   - Multiple images can be uploaded at once
4. Click "Save Property" to create the listing

#### Viewing Properties

- The home page displays recent properties with pagination
- Properties are shown with images, price, type, and description
- Use the pagination controls to browse through all properties

## API Endpoints

### Properties
- `GET /api/properties` - List properties with pagination and filters
- `POST /api/properties` - Create a new property
- `GET /api/properties/[id]` - Get a specific property
- `PUT /api/properties/[id]` - Update a property
- `DELETE /api/properties/[id]` - Delete a property

### Property Types
- `GET /api/property-types` - List all property types

### Images
- `POST /api/properties/[id]/images` - Upload images for a property

### Database
- `POST /api/seed` - Seed the database with default property types

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── post/              # Post property page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── apiClient.ts       # API client
│   ├── db.ts             # Database connection
│   └── hooks/            # Custom hooks
├── models/               # MongoDB models
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: Shopify Polaris
- **Database**: MongoDB with Mongoose
- **File Upload**: Native File API with server-side storage
- **Styling**: CSS Modules with Tailwind CSS

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
