app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow any vercel.app subdomain + localhost
    if (
      origin === "http://localhost:5173" ||
      origin.endsWith(".vercel.app")       // ✅ covers ALL your Vercel URLs
    ) {
      return callback(null, true);
    }
    
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));