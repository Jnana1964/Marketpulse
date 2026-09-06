import { stockColors, stockInitials } from '../../utils/stockAvatar';

export function StockAvatar({ symbol, size = 36 }) {
  const { bg, text } = stockColors(symbol);
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full text-xs font-bold"
      style={{ width: size, height: size, backgroundColor: bg, color: text }}
    >
      {stockInitials(symbol)}
    </span>
  );
}
