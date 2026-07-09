import sharp from "sharp";
import { fetchBrokers } from "@/lib/api/criptoya";
import { satToArs } from "@/lib/calc/satArs";
import { median } from "@/lib/calc/stats";
import { fmtArs, fmtSatArs } from "@/lib/format";

export const SOCIAL_IMAGE_REVALIDATE = 1800;
export const socialImageAlt =
  "Blocks.AR — precio de 1 satoshi en pesos argentinos";
export const socialImageSize = { width: 1200, height: 630 };
export const socialImageContentType = "image/png";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function splitSatValue(value?: number) {
  const formatted = fmtSatArs(value);
  if (formatted === "—") {
    return { extra: "", main: formatted };
  }

  const [whole, fractional = ""] = formatted.split(",");
  if (fractional.length <= 2) {
    return { extra: "", main: formatted };
  }

  return {
    extra: fractional.slice(2),
    main: `${whole},${fractional.slice(0, 2)}`,
  };
}

async function getSnapshot() {
  try {
    const brokers = await fetchBrokers(0.1, undefined, {
      next: { revalidate: SOCIAL_IMAGE_REVALIDATE },
    });
    const mids = brokers
      .filter((b) => b.totalAsk > 0 && b.totalBid > 0)
      .map((b) => (b.totalAsk + b.totalBid) / 2);
    const asks = brokers.map((b) => b.totalAsk).filter((v) => v > 0);
    const btcArs = median(mids);
    const bestAsk = asks.length ? Math.min(...asks) : undefined;

    return {
      bestAsk,
      btcArs,
      satArs: btcArs !== undefined ? satToArs(btcArs) : undefined,
    };
  } catch {
    return {
      bestAsk: undefined,
      btcArs: undefined,
      satArs: undefined,
    };
  }
}

function buildSvg({
  bestAsk,
  btcArs,
  satArs,
}: {
  bestAsk?: number;
  btcArs?: number;
  satArs?: number;
}) {
  const { main, extra } = splitSatValue(satArs);
  const valueColor = satArs !== undefined && satArs >= 1 ? "#16A34A" : "#F7931A";
  const btcLabel = escapeXml(btcArs ? fmtArs(btcArs) : "—");
  const bestAskLabel = escapeXml(bestAsk ? fmtArs(bestAsk) : "—");
  const mainLabel = escapeXml(main);
  const extraLabel = escapeXml(extra);

  const eqWidth = 220;
  const mainWidth = main.length * 82;
  const extraWidth = extra ? 54 : 0;
  const arsWidth = 150;
  const gap = 28;
  const totalWidth = eqWidth + gap + mainWidth + extraWidth + arsWidth;
  const startX = Math.round((1200 - totalWidth) / 2);
  const valueX = startX + eqWidth + gap;
  const arsX = valueX + mainWidth + extraWidth + 18;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop stop-color="#EFF7FF"/>
        <stop offset="0.58" stop-color="#F8FBFF"/>
        <stop offset="1" stop-color="#FFF7EF"/>
      </linearGradient>
      <pattern id="diagonal" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
        <line x1="0" y1="0" x2="0" y2="28" stroke="#D7E8FF" stroke-width="8" opacity="0.36"/>
      </pattern>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#diagonal)"/>

    <circle cx="112" cy="102" r="126" fill="#DDEBFF" opacity="0.9"/>
    <circle cx="1090" cy="570" r="170" fill="#FFE7CC" opacity="0.9"/>

    <g transform="translate(52 42)">
      <rect width="58" height="58" rx="18" fill="white" stroke="#D8E6F5"/>
      <rect x="13" y="9" width="10" height="40" rx="3" fill="#60A5FA"/>
      <rect x="27" y="9" width="18" height="18" rx="5" fill="#C8E4FF"/>
      <rect x="27" y="31" width="18" height="18" rx="5" fill="#FF9F2D"/>
      <text x="74" y="30" font-size="36" font-weight="800" fill="#08111F" font-family="Arial, Helvetica, sans-serif">
        Blocks<tspan fill="#F7931A">.AR</tspan>
      </text>
      <text x="74" y="53" font-size="18" fill="#5F728C" font-family="Arial, Helvetica, sans-serif">
        Bitcoin en pesos argentinos
      </text>
    </g>

    <g transform="translate(52 136)">
      <rect width="1096" height="346" rx="38" fill="white" stroke="#D8E6F5"/>

      <text
        x="548"
        y="72"
        text-anchor="middle"
        font-size="22"
        font-weight="700"
        letter-spacing="2"
        fill="#5F728C"
        font-family="Arial, Helvetica, sans-serif"
      >
        1 SAT = X ARS
      </text>

      <text
        x="${startX}"
        y="220"
        font-size="80"
        font-weight="500"
        fill="#5F728C"
        font-family="Arial, Helvetica, sans-serif"
      >
        1
      </text>

      <g transform="translate(${startX + 72} 148) scale(0.1)">
        <rect x="71.89" y="196.83" width="485.35" height="67.21" transform="translate(62.07 -66.72) rotate(13.42)" fill="#08111F"/>
        <rect x="35.68" y="348.58" width="485.35" height="67.21" transform="translate(96.31 -54.17) rotate(13.42)" fill="#08111F"/>
        <rect x="295.4" y="31.26" width="117.34" height="67.21" transform="translate(499.35 -264.48) rotate(103.42)" fill="#08111F"/>
        <rect x="1.17" y="493.2" width="485.35" height="67.21" transform="translate(128.93 -42.21) rotate(13.42)" fill="#08111F"/>
        <rect x="144.85" y="662.2" width="117.34" height="67.21" transform="translate(927.56 659.33) rotate(103.42)" fill="#08111F"/>
      </g>

      <text
        x="${startX + 156}"
        y="220"
        font-size="44"
        font-weight="500"
        fill="#5F728C"
        font-family="Arial, Helvetica, sans-serif"
      >
        =
      </text>

      <text
        x="${valueX}"
        y="220"
        font-size="156"
        font-weight="800"
        letter-spacing="-5"
        fill="${valueColor}"
        font-family="Arial, Helvetica, sans-serif"
      >
        ${mainLabel}${extraLabel ? `<tspan font-size="102" dy="-22">${extraLabel}</tspan>` : ""}
      </text>

      <text
        x="${arsX}"
        y="220"
        font-size="58"
        font-weight="700"
        fill="#5F728C"
        font-family="Arial, Helvetica, sans-serif"
      >
        ARS
      </text>

      <text
        x="548"
        y="292"
        text-anchor="middle"
        font-size="28"
        fill="#5F728C"
        font-family="Arial, Helvetica, sans-serif"
      >
        1 BTC = <tspan fill="#08111F" font-weight="700">${btcLabel}</tspan> - mejor compra <tspan fill="#08111F" font-weight="700">${bestAskLabel}</tspan>
      </text>
    </g>

    <g transform="translate(846 530)">
      <rect width="302" height="58" rx="22" fill="white" stroke="#D8E6F5"/>
      <rect x="18" y="12" width="8" height="34" rx="3" fill="#60A5FA"/>
      <rect x="30" y="12" width="16" height="15" rx="5" fill="#C8E4FF"/>
      <rect x="30" y="31" width="16" height="15" rx="5" fill="#FF9F2D"/>
      <text x="58" y="29" font-size="28" font-weight="800" fill="#08111F" font-family="Arial, Helvetica, sans-serif">blocks.ar</text>
      <text x="58" y="46" font-size="16" fill="#5F728C" font-family="Arial, Helvetica, sans-serif">https://blocks.ar</text>
    </g>
  </svg>`;
}

export async function generateSocialImage() {
  const snapshot = await getSnapshot();
  const svg = buildSvg(snapshot);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Cache-Control": `public, s-maxage=${SOCIAL_IMAGE_REVALIDATE}, stale-while-revalidate=86400`,
      "Content-Type": socialImageContentType,
    },
  });
}
