# Family Tree - Next.js Version

This is a Next.js conversion of the original Gatsby family tree application, built with modern technologies including shadcn/ui and Tailwind CSS.

## Features

- ⚡ **Next.js 15** - Latest version with App Router
- 🎨 **Tailwind CSS** - Utility-first CSS framework  
- 🧩 **shadcn/ui** - Modern, accessible React components
- 📱 **Responsive Design** - Works on all devices
- 🔍 **Search Functionality** - Filter through family members
- 🎯 **TypeScript** - Type-safe development

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts           # Utility functions
└── data/                  # Data files (to be added)
```

## Converting from Gatsby

This project was converted from the original Gatsby application with the following changes:

### Technology Migration
- **Gatsby → Next.js 15** with App Router
- **Ant Design → shadcn/ui** for modern, accessible components
- **GraphQL queries → Static data** (can be enhanced with API routes)
- **CSS Modules → Tailwind CSS** for consistent styling

### Key Differences
1. **Routing**: Gatsby's page-based routing → Next.js App Router
2. **Data Fetching**: GraphQL static queries → Client-side state (can be enhanced)
3. **Styling**: Ant Design components → shadcn/ui + Tailwind CSS
4. **Build System**: Gatsby's webpack → Next.js built-in bundler

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Adding Data

To add family tree data:

1. Create JSON files in `src/data/`
2. Import and use in components
3. Consider adding API routes for dynamic data

## Next Steps

- [ ] Add more pages (individual profiles, family map, statistics)
- [ ] Implement family tree visualization
- [ ] Add data management functionality
- [ ] Integrate with original GEDCOM data
- [ ] Add authentication if needed
- [ ] Deploy to Vercel/Netlify

## Contributing

This is a family project. For major changes, please discuss with the family first!

## License

Private family use only. 