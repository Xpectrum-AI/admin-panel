const API_KEY = process.env.API_KEY || 'xpectrum-ai@123';

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'X-API-Key header is required' 
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      error: 'Invalid API key' 
    });
  }
  
  next();
};

module.exports = authenticateApiKey; 