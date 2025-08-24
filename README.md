# SUI Pay - Creator Support Platform

A Patreon/Buy Me a Coffee alternative built specifically for the SUI blockchain. Creators can receive direct payments from their community with zero fees and full transparency.

## 🚀 Features

- **Direct SUI Payments**: Accept payments directly to your SUI wallet
- **Zero Fees**: 100% of donations go to creators
- **SUI Name Service Integration**: Connect your SUI NS domain
- **Analytics Dashboard**: Track payments, donors, and growth
- **Shareable Links**: Create custom links for social media
- **Plug & Play**: Easy integration with any platform

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Blockchain**: SUI Network, @mysten/dapp-kit, @mysten/sui
- **Storage**: Local Storage (development), GitHub/Cloud (production)
- **Authentication**: JWT-based with localStorage
- **UI**: Responsive design with modern components

## 📦 Installation

1. **Clone and navigate to the project**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file with the following variables:
   
   # SUI Network Configuration
   NEXT_PUBLIC_SUI_NETWORK=testnet
   NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io
   
   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=SUI Pay
   
   # Authentication
   JWT_SECRET=your-jwt-secret-here
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🏗 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── creator/    # Creator management
│   │   │   ├── payments/   # Payment processing
│   │   │   └── public/     # Public endpoints
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   │   ├── ui/            # Shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   └── providers/     # Context providers
│   └── lib/               # Utilities
│       ├── storage.ts     # Local storage system
│       ├── auth.ts        # Authentication
│       ├── sui.ts         # SUI blockchain utilities
│       └── utils.ts       # General utilities
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Creator registration
- `POST /api/auth/login` - Creator login
- `POST /api/auth/logout` - Creator logout

### Creator Management
- `GET /api/creator/profile` - Get creator profile
- `PUT /api/creator/profile` - Update creator profile
- `GET /api/creator/payments` - Get payment history
- `GET /api/creator/analytics` - Get analytics data
- `GET /api/creator/links` - Get shareable links
- `POST /api/creator/links` - Create shareable link

### Public Endpoints
- `GET /api/public/creator/[username]` - Public creator profile
- `GET /api/public/link/[slug]` - Shareable link data

### Payment Processing
- `POST /api/payments/record` - Record blockchain payment

## 💾 Data Storage

Currently uses localStorage for development. For production:

1. **GitHub Storage**: Store data in GitHub repositories
2. **Cloud Storage**: Use services like Vercel KV, Supabase, etc.
3. **IPFS**: Decentralized storage option
4. **Traditional Database**: PostgreSQL, MongoDB, etc.

## 🔐 Authentication

Simple JWT-based authentication with localStorage:
- No complex session management
- Tokens contain creator information
- Easy to extend for production use

## 🌐 SUI Blockchain Integration

- **Wallet Connection**: Using @mysten/dapp-kit
- **Transaction Verification**: Real-time blockchain verification
- **SUI Name Service**: Domain resolution and display
- **Direct Transfers**: Wallet-to-wallet payments

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔄 Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Test**: Use browser dev tools
4. **Build**: `npm run build`
5. **Deploy**: Push to your hosting platform

## 📱 Mobile Support

- Fully responsive design
- Works on all devices
- SUI mobile wallet support
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue for bugs
- Check existing issues for solutions
- Contact the development team

## 🔮 Future Enhancements

- [ ] Real-time payment notifications
- [ ] Advanced analytics and insights
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Integration with social platforms
- [ ] NFT rewards system
- [ ] Subscription payments
- [ ] Creator verification system

---

Built with ❤️ for the SUI ecosystem