# Hotel Management Admin Dashboard

A modern, full-featured admin dashboard for managing hotel data, built with Next.js and Supabase. Features complete CRUD operations, relational data management, and optimized form handling.

## 🚀 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **UI Components**: [Material-UI](https://mui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **State Management**: React Hooks
- **Language**: JavaScript

## ✨ Key Features

### Hotel Management
- **Full CRUD Operations**: Create, read, update, and delete hotels with complete data persistence
- **Multi-language Support**: Bilingual content (English/Arabic) for all hotel data
- **Image Management**: Thumbnail and gallery image URL support
- **Dynamic Routing**: Clean URLs for view (`/hotels/[id]`) and edit (`/hotels/[id]/edit`) pages

### Master Data Management
- Property Types (Hotel, Apartment, Resort, etc.)
- Hotel Chains (Marriott, Hilton, etc.)
- Areas/Districts (Downtown, Marina, etc.)
- Amenities (WiFi, Pool, Gym, etc.)
- Status-based filtering (inactive records automatically hidden)

### Rooms & Pricing
- Multiple room types per hotel
- Per-night pricing with currency support
- Valid date ranges for seasonal pricing
- Room capacity management

### Data Relations
- **One-to-Many**: Hotels → Rooms/Prices
- **Many-to-Many**: Hotels ↔ Amenities
- **Foreign Keys**: Property types, chains, areas
- Optimized relational queries with parallel fetching

### Form Features
- Multi-step form with validation
- Dynamic sections (amenities, rooms, images)
- Real-time validation
- Loading states and error handling
- Thumbnail preview

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── dashboard/
│   │   ├── hotels/
│   │   │   ├── [id]/
│   │   │   │   ├── page.js          # View hotel details
│   │   │   │   └── edit/
│   │   │   │       └── page.js      # Edit hotel
│   │   │   ├── add/
│   │   │   │   └── page.js          # Create new hotel
│   │   │   └── page.js              # Hotel list
│   │   ├── master-data/
│   │   │   └── page.js              # Manage master data
│   │   └── layout.js                # Dashboard layout
│   └── layout.js                    # Root layout
├── components/
│   └── hotels/
│       ├── AmenitiesSection.jsx     # Amenity selector
│       ├── RoomsSection.jsx         # Rooms & pricing
│       ├── ImageUrlInput.jsx        # Image URL manager
│       └── FAQSection.jsx           # FAQ manager
├── lib/
│   ├── services/
│   │   ├── hotels.service.js        # Hotel CRUD operations
│   │   └── masterData.service.js    # Master data operations
│   └── supabase/
│       └── client.js                # Supabase client setup
└── public/
```

## 🗄️ Database Schema

### Core Tables

**hotels**
```sql
- id (SERIAL PRIMARY KEY)
- name_en, name_ar
- description_en, description_ar
- address_en, address_ar
- type_id → property_types(id)
- chain_id → chains(id)
- area_id → areas(id)
- star_rating (1-5)
- rank, status
- thumbnail_url, image_url
- images (JSONB)
```

**hotel_amenities** (Junction Table)
```sql
- hotel_id → hotels(id)
- amenity_id → amenities(id)
- PRIMARY KEY (hotel_id, amenity_id)
```

**hotel_prices**
```sql
- id (SERIAL PRIMARY KEY)
- hotel_id → hotels(id)
- room_type
- price_per_night, currency
- valid_from, valid_to
```

### Master Data Tables
- `property_types` (Hotel, Apartment, Resort)
- `chains` (Marriott, Hilton, Hyatt)
- `areas` (Downtown, Marina, etc.)
- `amenities` (WiFi, Pool, Gym, Spa)

All master data tables include:
- `id`, `name_en`, `name_ar`
- `status` (active/inactive)
- `created_at`, `updated_at`

### Relationships
```
hotels
  ├── property_types (many-to-one)
  ├── chains (many-to-one)
  ├── areas (many-to-one)
  ├── hotel_amenities → amenities (many-to-many)
  └── hotel_prices (one-to-many)
```

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

4. **Set up the database**

Run the SQL migrations in your Supabase SQL Editor:
```bash
# Execute these in order:
1. COMPLETE_HOTEL_SCHEMA_WITH_NAMED_FK.sql
2. ADD_THUMBNAIL_URL_COLUMN.sql (if needed)
```

Or create tables manually using the schema in `SUPABASE_QUERY_PATTERNS.md`.

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**
```
http://localhost:3000/dashboard/hotels
```

## 🛠️ Development Workflow

### Adding a New Hotel
1. Navigate to `/dashboard/hotels`
2. Click "Add Hotel"
3. Fill in multi-step form:
   - Basic Info (name, type, chain, area)
   - Images (thumbnail + gallery URLs)
   - Amenities (select from available)
   - FAQ (optional)
   - Rooms & Pricing

### Editing a Hotel
1. Click "Edit" on any hotel in the list
2. All existing data is pre-loaded
3. Modify any section
4. Submit to update all related tables

### Managing Master Data
1. Navigate to `/dashboard/master-data`
2. Select a category (Types, Chains, Areas, Amenities)
3. Add, edit, or deactivate records
4. Inactive records are automatically hidden from hotel forms

### Service Layer Usage

**Fetch complete hotel data:**
```javascript
import { getHotelComplete } from '@/lib/services/hotels.service';

const { data: hotel, error } = await getHotelComplete(hotelId);
// Returns: hotel + amenities + rooms + master data
```

**Update hotel with all relations:**
```javascript
import { updateHotelComplete } from '@/lib/services/hotels.service';

const { data, error } = await updateHotelComplete(
  hotelId,
  hotelData,
  { amenities, rooms, imageUrls }
);
```

## 🏗️ Architecture

### Service Layer Pattern
All database operations are abstracted into service functions:
- `hotels.service.js` - Hotel CRUD + related data
- `masterData.service.js` - Master data operations

Benefits:
- Centralized data logic
- Reusable functions
- Easy testing and debugging
- Clean separation of concerns

### Data Fetching Strategy
Uses **parallel fetching** with `Promise.all` for optimal performance:

```javascript
const [hotel, amenities, rooms] = await Promise.all([
  supabase.from('hotels').select('*'),
  supabase.from('hotel_amenities').select('*'),
  supabase.from('hotel_prices').select('*'),
]);
```

### Update Strategy
Uses **delete + reinsert** for related tables to ensure consistency:

```javascript
// Amenities update
await supabase.from('hotel_amenities').delete().eq('hotel_id', id);
await supabase.from('hotel_amenities').insert(newAmenities);
```

### Component Structure
- **Pages**: Handle routing and data loading
- **Components**: Reusable UI sections (Amenities, Rooms, etc.)
- **Services**: Database operations and business logic

## 🚦 Key Implementation Details

### Foreign Key Constraints
All FK relationships use explicit named constraints:
```sql
CONSTRAINT fk_hotels_type_id 
  FOREIGN KEY (type_id) 
  REFERENCES property_types(id) 
  ON DELETE SET NULL
```

### Performance Optimizations
- Indexed foreign key columns
- Parallel data fetching
- Lazy-loaded components
- Status-based filtering at query level

### Error Handling
- Supabase client validation
- Form validation with React Hook Form
- User-friendly error messages
- Console logging for debugging

## 🔮 Future Enhancements

### Planned Features
- [ ] Image upload to Supabase Storage (currently URL-based)
- [ ] FAQ section with CRUD operations
- [ ] Review management and aggregation display
- [ ] Advanced search and filtering
- [ ] Bulk operations (import/export)
- [ ] Room availability calendar
- [ ] Booking management integration
- [ ] Analytics dashboard
- [ ] Role-based access control (RBAC)
- [ ] Audit logs

### Technical Improvements
- [ ] State management with MobX or Zustand
- [ ] TypeScript migration
- [ ] Unit and integration tests
- [ ] API rate limiting
- [ ] Caching layer (React Query)
- [ ] Internationalization (i18n)
- [ ] Dark mode support

## 📚 Documentation

Additional documentation available in the repository:

- `COMPLETE_HOTEL_CRUD_UPGRADE.md` - Full implementation guide
- `QUICK_REFERENCE_HOTEL_SERVICE.md` - Service functions reference
- `SUPABASE_QUERY_PATTERNS.md` - Database query best practices
- `BUG_FIXES_SUMMARY.md` - Recent fixes and improvements

## 🤝 Contributing

This is a portfolio project. For inquiries or collaboration:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## 📝 License

This project is available for portfolio and educational purposes.

---

**Built with using Next.js and Supabase**
