/**
 * Static, general-knowledge descriptions for MarketPulse's fixed instrument
 * universe (see backend/src/config/instrumentUniverse.js). This is
 * deliberately NOT market data — no prices, no numbers that could go
 * stale — just a one-line "what is this company" blurb and a general
 * sector tag, kept entirely on the frontend so the Stock Details page
 * reads like a finished product instead of a bare price ticker.
 */
const COMPANY_INFO = {
  RELIANCE: {
    sector: 'Conglomerate',
    about: 'Reliance Industries is an Indian conglomerate with interests spanning energy, petrochemicals, retail, and telecommunications (Jio).',
    factors: 'Often reacts to crude oil prices, refining margins, retail expansion, and Jio subscriber trends.',
  },
  TCS: {
    sector: 'IT Services',
    about: 'Tata Consultancy Services is a global IT services and consulting company, part of the Tata Group.',
    factors: 'Often reacts to US/European client spending, currency moves, and quarterly deal wins.',
  },
  INFY: {
    sector: 'IT Services',
    about: 'Infosys is a multinational IT services and consulting company headquartered in Bengaluru.',
    factors: 'Often reacts to IT sector demand, hiring trends, and large-deal announcements.',
  },
  HDFCBANK: {
    sector: 'Banking',
    about: 'HDFC Bank is one of India’s largest private-sector banks, offering retail and wholesale banking services.',
    factors: 'Often reacts to interest rate moves, credit growth, and asset-quality updates.',
  },
  ICICIBANK: {
    sector: 'Banking',
    about: 'ICICI Bank is a leading private-sector bank offering retail, corporate, and investment banking services.',
    factors: 'Often reacts to interest rate policy, loan growth, and quarterly earnings.',
  },
  ITC: {
    sector: 'FMCG / Diversified',
    about: 'ITC is a diversified Indian conglomerate with businesses in FMCG, hotels, paperboards, and agri-business.',
    factors: 'Often reacts to consumer demand trends, tobacco taxation news, and FMCG margins.',
  },
  SBIN: {
    sector: 'Banking',
    about: 'State Bank of India is India’s largest public-sector bank by assets and branch network.',
    factors: 'Often reacts to interest rate policy, government banking reforms, and credit growth.',
  },
  TATAMOTORS: {
    sector: 'Automobile',
    about: 'Tata Motors is an Indian multinational automotive manufacturer, producing passenger and commercial vehicles. The company is known for brands like Tata Cars, Tata Trucks and JLR (Jaguar Land Rover).',
    factors: 'Often reacts to factors like vehicle sales, global demand (JLR), commodity prices and industry news.',
  },
  WIPRO: {
    sector: 'IT Services',
    about: 'Wipro is a multinational IT, consulting, and business process services company.',
    factors: 'Often reacts to IT sector demand, currency moves, and quarterly earnings.',
  },
  HINDUNILVR: {
    sector: 'FMCG',
    about: 'Hindustan Unilever is India’s largest fast-moving consumer goods company, part of the Unilever group.',
    factors: 'Often reacts to rural/urban demand trends, input costs, and pricing actions.',
  },
  BHARTIARTL: {
    sector: 'Telecommunications',
    about: 'Bharti Airtel is a leading Indian telecommunications company offering mobile, broadband, and DTH services.',
    factors: 'Often reacts to subscriber/ARPU trends, tariff changes, and spectrum news.',
  },
  ASIANPAINT: {
    sector: 'Paints / Consumer',
    about: 'Asian Paints is India’s largest paint company, serving decorative and industrial coatings markets.',
    factors: 'Often reacts to raw material (crude-linked) costs, housing demand, and rural sentiment.',
  },
};

export function getCompanyInfo(symbol) {
  return (
    COMPANY_INFO[symbol] || {
      sector: 'Equity',
      about: null,
      factors: null,
    }
  );
}
