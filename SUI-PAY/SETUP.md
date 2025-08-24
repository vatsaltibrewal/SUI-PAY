# SUI Pay - Setup Instructions

## Environment Setup

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in `.env`:**
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # SUI Network Configuration
   NEXT_PUBLIC_SUI_NETWORK="testnet"
   NEXT_PUBLIC_SUI_RPC_URL="https://fullnode.testnet.sui.io"

   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_NAME="SUI Pay"

   # JWT Secret for custom auth
   JWT_SECRET="your-jwt-secret-here"

   # Optional: Analytics tracking
   NEXT_PUBLIC_ANALYTICS_ID=""
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push database schema (for development with SQLite)
   npx prisma db push

   # Optional: View database with Prisma Studio
   npx prisma studio
   ```

4. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Features Implemented

### Backend API Routes
- **Authentication**
  - `POST /api/auth/register` - Creator registration
  - `POST /api/auth/login` - Creator login  
  - `POST /api/auth/logout` - Creator logout

- **Creator Management**
  - `GET /api/creator/profile` - Get creator profile
  - `PUT /api/creator/profile` - Update creator profile
  - `GET /api/creator/payments` - Get creator payments with pagination
  - `GET /api/creator/analytics` - Get analytics data
  - `GET /api/creator/links` - Get shareable links
  - `POST /api/creator/links` - Create shareable link
  - `PUT /api/creator/links/[linkId]` - Update shareable link
  - `DELETE /api/creator/links/[linkId]` - Delete shareable link

- **Public APIs**
  - `GET /api/public/creator/[username]` - Get public creator profile
  - `GET /api/public/link/[slug]` - Get shareable link data

- **Payment Processing**
  - `POST /api/payments/record` - Record blockchain payment

### Frontend Components
- **Providers**
  - SUI blockchain provider with dApp Kit
  - Authentication context provider
  - React Query integration

- **UI Components**
  - Modern landing page
  - Navigation with user authentication
  - Responsive design with Tailwind CSS
  - Shadcn/ui component library integration

### Database Schema
- **Creators** - User profiles with SUI wallet integration
- **Payments** - Transaction records with blockchain verification
- **Analytics** - Daily aggregated metrics and insights
- **ShareableLinks** - Custom links for social media integration
- **Sessions** - Authentication session management

### SUI Blockchain Integration
- Wallet connection with dApp Kit
- Transaction verification and recording
- SUI Name Service (SUI NS) support
- Direct wallet-to-wallet payments
- Real-time transaction monitoring

## Next Steps

1. **Frontend Pages** - Create dashboard, profile, and analytics pages
2. **Payment Widget** - Build embeddable payment component
3. **Real-time Updates** - Add WebSocket for live payment notifications
4. **Mobile App** - Consider React Native implementation
5. **Advanced Analytics** - Add more detailed insights and charts

## Technology Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM, SQLite (dev)
- **Blockchain:** SUI Network, @mysten/dapp-kit, @mysten/sui
- **Authentication:** Custom JWT-based auth
- **Database:** SQLite (development), PostgreSQL (production recommended)
- **UI:** Recharts for analytics, Lucide Icons, Responsive design

## Production Deployment

For production deployment:

1. **Database:** Switch to PostgreSQL
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

2. **Environment:** Update all environment variables for production
3. **Deployment:** Deploy to Vercel, Netlify, or your preferred platform
4. **Domain:** Configure custom domain and SSL
5. **Monitoring:** Add error tracking and performance monitoring
