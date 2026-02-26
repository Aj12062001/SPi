# 🚀 Setup & Installation Guide

## Project Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Python 3.8+ (for ML model scripts)
- Modern web browser

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd f:\main project\SPi-main
   npm install
   ```

2. **Install Additional Packages for Enhanced Features**
   ```bash
   npm install recharts@3.6.0  # For advanced charting
   npm install -D @types/recharts
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   This will start the Vite development server at `http://localhost:5173`

4. **Build for Production**
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory

### Project Structure

```
SPi-main/
├── components/
│   ├── ActivityInsights.tsx       ✨ NEW - Activity statistics dashboard
│   ├── ActivityTimeline.tsx       ✨ NEW - Activity log timeline
│   ├── Analytics.tsx
│   ├── Dashboard.tsx
│   ├── DataInput.tsx
│   ├── Header.tsx
│   ├── Introduction.tsx
│   ├── Login.tsx
│   └── Results.tsx               🔄 ENHANCED - Upgraded with new features
├── utils/
│   ├── activityTracker.ts         ✨ NEW - Activity logging system
│   ├── riskAnalysis.ts            ✨ NEW - Risk calculation engine
├── styles/
│   ├── ActivityTimeline.css       ✨ NEW - Timeline component styles
│   ├── ActivityInsights.css       ✨ NEW - Insights component styles
├── model/
│   ├── model-of-spi.ipynb         Updated model training notebook
│   ├── spi_isolation_forest_model.pkl  ML model file
│   └── __notebook_source__.ipynb
├── data/
│   ├── all risk 10K.csv
│   ├── all risk 6.csv
│   └── high risk.csv
├── public/
│   └── spi_features_with_anomalies.csv  ✨ NEW - Enhanced CSV file
├── App.tsx
├── DataContext.tsx               🔄 ENHANCED - New features added
├── types.ts                      🔄 ENHANCED - Extended type definitions
├── index.tsx
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── FEATURES.md                   ✨ NEW - Feature documentation
└── SETUP.md                      ✨ NEW - This file

✨ = New
🔄 = Enhanced/Modified
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file (optional):
```env
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

### TypeScript Configuration
Already configured in `tsconfig.json`:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX support for React

### Vite Configuration
Already configured in `vite.config.ts`:
- React plugin enabled
- Hot module replacement (HMR)
- Optimized build settings

## 🗄️ Data Management

### CSV File Format
The enhanced `spi_features_with_anomalies.csv` includes:
```
user, date, logon_count, logoff_count, unique_pcs, file_events, 
unique_files, avg_filename_length, emails_sent, avg_email_size, 
attachments, external_mails, usb_connect, usb_disconnect, 
http_requests, unique_urls, employee_name, O, C, E, A, N, anomaly, risk_score
```

### Data Import
1. Go to the Data Ingestion tab
2. Upload the CSV file
3. Data automatically processes and populates the database
4. Risk assessments generate in real-time

### Data Storage
- **Browser Storage**: LocalStorage
- **Capacity**: ~5-10MB depending on browser
- **Persistence**: Across browser sessions
- **Clear**: Use browser dev tools or in-app options

## 🎯 Quick Start Workflow

1. **Login**
   - Username: `admin` or `analyst`
   - Password: `password123` or `spy-detector-2025`

2. **View Dashboard**
   - See overview statistics
   - Monitor at-risk employees
   - Check activity trends

3. **Import Data**
   - Upload CSV file from data folder
   - Verify data loading
   - Check for anomalies

4. **Analyze Results**
   - Review risk assessments
   - Investigate high-risk users
   - Track activity logs
   - Generate recommendations

5. **Monitor Activities**
   - Log new activities for testing
   - View real-time activity timeline
   - Generate activity insights
   - Export reports

## 🧪 Testing the Enhanced Features

### Test Activity Logging
```typescript
// In browser console
const { logUserActivity } = window.__DATA_CONTEXT__;

logUserActivity({
  userId: 'AAE0190',
  activityType: 'file_deleted',
  severity: 'high',
  isAnomalous: true,
  details: { fileName: 'important.doc', fileSize: 1024 },
  duration: 30
});
```

### Test Risk Assessment
- Navigate to Results tab
- Select a user from the dropdown
- View comprehensive risk breakdown
- Check activity timeline
- Review recommendations

### Test Activity Timeline
- Go to Activity Log tab
- Filter by activity type
- Filter by anomaly status
- Expand activity details
- Export activity logs

## 📦 Build Artifacts

### Development Build
```bash
npm run dev
```
- Source maps included
- Hot reload enabled
- Faster rebuild times

### Production Build
```bash
npm run build
```
- Minified and optimized
- Source maps (optional)
- Ready for deployment
- All assets bundled

### Preview Production Build
```bash
npm run preview
```

## 🔗 Dependencies

### Core Dependencies
- **react**: ^19.2.3 - UI framework
- **react-dom**: ^19.2.3 - DOM rendering
- **recharts**: ^3.6.0 - Charting library

### Dev Dependencies
- **typescript**: ~5.8.2 - Type safety
- **vite**: ^6.2.0 - Build tool
- **@vitejs/plugin-react**: ^5.0.0 - React plugin
- **@types/node**: ^22.14.0 - Node types

## 🚀 Deployment

### Local Deployment
1. Build: `npm run build`
2. Serve: Use any static server on `dist/` folder
3. Access: Open browser to server URL

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔍 Troubleshooting

### Issue: Module not found errors
**Solution**: Run `npm install` again and clear node_modules

### Issue: Port 5173 already in use
**Solution**: `npm run dev -- --port 3000`

### Issue: CSS not loading
**Solution**: Check `styles/` directory exists and imports are correct

### Issue: Data not persisting
**Solution**: Check browser storage settings - LocalStorage may be disabled

### Issue: Charts not rendering
**Solution**: Ensure recharts is installed: `npm install recharts`

## 📚 Documentation

- **FEATURES.md**: Comprehensive feature documentation
- **README.md**: Project overview
- **SETUP.md**: This setup guide
- **Inline Comments**: Code documentation in source files
- **Type Definitions**: Self-documenting TypeScript interfaces

## ✅ Verification Checklist

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Can login to application
- [ ] Can upload CSV data
- [ ] Dashboard loads with data
- [ ] Can view risk assessments
- [ ] Activity timeline works
- [ ] Can filter activities
- [ ] Can export data
- [ ] Production build works (`npm run build`)

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [Recharts Documentation](https://recharts.org)
- [Project Documentation](./FEATURES.md)

## 📞 Support & Help

For issues or questions:
1. Check the FEATURES.md documentation
2. Review inline code comments
3. Check browser console for errors
4. Verify all dependencies are installed
5. Clear browser cache and LocalStorage

---

**Setup Version**: 1.0
**Last Updated**: January 23, 2026
**Status**: Ready for Production ✅
