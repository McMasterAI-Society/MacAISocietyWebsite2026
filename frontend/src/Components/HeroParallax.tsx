"use client";
/**
 * A parallax hero section that displays past MacHacks cards
 * in three rows with scroll-driven animations. Cards move in alternating
 * directions as the user scrolls, creating a depth effect.
 */
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MACHACKS_THEME as theme,
  type ParallaxProduct,
} from "@/data/machacks-config";

const ROW_COUNT = 3;
const CARDS_PER_ROW = 5;
const ROWS_DROP = 500; // How far (px) the rows slide down as the section scrolls into place.
const BOTTOM_GAP = 80; // Space (px) kept below the last row once it has slid into place.
const CARD_RATIO = 3 / 2; // Every card is a 3:2 frame (w-72 × h-48, sm:w-96 × h-64).
const COVER_TOLERANCE = 0.12; // Images within 12% of 3:2 fill the card edge to edge.

// Shuffle array randomly
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ensures the featured card is always in the middle of the row
const MIDDLE = (CARDS_PER_ROW - 1) / 2;
const SLOT_PRIORITY = Array.from({ length: CARDS_PER_ROW }, (_, i) => i).sort(
  (a, b) => Math.abs(a - MIDDLE) - Math.abs(b - MIDDLE) || a - b
);

// Builds the rows of cards
function buildRows(products: ParallaxProduct[]): ParallaxProduct[][] {
  const featured = shuffle(products.filter((p) => p.featured));
  const others = shuffle(products.filter((p) => !p.featured));
  const picked = [...featured, ...others].slice(0, ROW_COUNT * CARDS_PER_ROW);

  // Split the projects as evenly as possible (5 / 5 / 5 when there are enough projects)
  const rows: ParallaxProduct[][] = Array.from({ length: ROW_COUNT }, (_, r) =>
    new Array(Math.ceil((picked.length - r) / ROW_COUNT))
  );

  // Distribute spots best-first: every row's best spot, then every row's
  // next-best spot, and so on, so featured projects spread across all rows.
  let next = 0;
  for (const position of SLOT_PRIORITY) {
    for (const row of rows) {
      if (position < row.length) row[position] = picked[next++];
    }
  }
  return rows;
}

export const HeroParallax = ({
  products,
}: {
  products: ParallaxProduct[];
}) => {
  // 3 rows of up to 5 cards. Selected once per page load, so every refresh
  // shows the featured projects plus a different mix of the rest.
  const [[firstRow, secondRow, thirdRow]] = React.useState(() =>
    buildRows(products)
  );

  const ref = React.useRef(null);
  // Track scroll progress from top to bottom of this section
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Spring config for smooth, bouncy parallax motion
  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  // Horizontal movement: rows 1 & 3 move right, row 2 moves left
  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );

  // 3D perspective transforms (active during first 20% of scroll)
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-300, ROWS_DROP]),
    springConfig
  );
  return (
    <div
      ref={ref}
      // The slide-down is a transform, so it takes no room in the layout.
      // Bottom padding reserves that room; with min-h (not a fixed h) the
      // section grows on short windows instead of clipping the last row.
      style={{ paddingBottom: ROWS_DROP + BOTTOM_GAP }}
      className="min-h-[210vh] sm:min-h-[230vh] pt-10 sm:pt-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      {/* Fixed header - stays visible above parallax content */}
      <div className="opacity-100 relative z-10">
        <Header />
      </div>

      {/* Parallax card container - applies 3D rotation & fade based on scroll */}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="relative z-0"
      >
        {/* Row 1: moves right on scroll */}
        <motion.div className="flex flex-row-reverse gap-8 sm:gap-20 mb-8 sm:mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        {/* Row 2: moves left on scroll */}
        <motion.div className="flex flex-row gap-8 sm:gap-20 mb-8 sm:mb-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        {/* Row 3: moves right on scroll */}
        <motion.div className="flex flex-row-reverse gap-8 sm:gap-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

/** Header section with title and description for the Past MacHacks parallax hero */
export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto pt-0 pb-6 sm:pb-8 px-4 w-full left-0 top-0">
      <h1 className="font-heading text-2xl sm:text-7xl font-bold text-[#F0F4F4]">
        Past MacHacks
      </h1>
      <p className="max-w-2xl text-base sm:text-xl mt-8 text-[#A7C2C3]">
        Years of innovation, collaboration, and community. Browse our past hackathons.
      </p>
    </div>
  );
};

type ThumbnailState = "loading" | "cover" | "contain" | "missing";

/** Individual card that displays a hackathon/product with thumbnail, link, and parallax translation */
export const ProductCard = ({
  product,
  translate,
}: {
  product: ParallaxProduct;
  translate: MotionValue<number>;
}) => {
  const [thumbnail, setThumbnail] = React.useState<ThumbnailState>(
    product.thumbnail ? "loading" : "missing"
  );

  // Once the image loads, decide whether it fills the 3:2 frame or is shown whole
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    const offBy = naturalHeight
      ? Math.abs(naturalWidth / naturalHeight / CARD_RATIO - 1)
      : 0;
    setThumbnail(offBy > COVER_TOLERANCE ? "contain" : "cover");
  };

  const isMissing = thumbnail === "missing";

  return (
    <motion.div
      style={{
        x: translate, // Scroll-driven horizontal parallax
      }}
      whileHover={{
        y: -20, // Lift on hover
      }}
      key={product.title}
      className="group/product h-48 sm:h-64 w-72 sm:w-96 relative shrink-0 rounded-lg overflow-hidden cursor-pointer bg-[#221A1D]"
    >
      <a
        href={product.link}
        aria-label={product.title}
        className="absolute inset-0 block group-hover/product:shadow-2xl"
      >
        {isMissing ? (
          <PlaceholderThumbnail title={product.title} />
        ) : (
          <>
            {/* Blurred fill behind images that aren't 3:2 */}
            {thumbnail === "contain" && (
              <img
                src={product.thumbnail}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover scale-125 blur-2xl opacity-60"
              />
            )}
            <img
              src={product.thumbnail}
              alt={product.title}
              onLoad={handleLoad}
              onError={() => setThumbnail("missing")}
              className={cn(
                "absolute h-full w-full inset-0 transition-opacity duration-300",
                thumbnail === "contain" ? "object-contain" : "object-cover object-center",
                thumbnail === "loading" ? "opacity-0" : "opacity-100"
              )}
            />
          </>
        )}
      </a>

      {/* Hover overlay + title (the placeholder already shows its title) */}
      {!isMissing && (
        <>
          <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
          <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white pointer-events-none">
            {product.title}
          </h2>
        </>
      )}

      {product.badge && (
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#060606]/80 text-[#C0A35B] border border-[#C0A35B]/40 backdrop-blur-sm pointer-events-none">
          <Trophy className="size-3" aria-hidden="true" />
          {product.badge}
        </span>
      )}
    </motion.div>
  );
};

/**
 * Stand-in thumbnail for projects without an image (or whose image fails to
 * load). Uses the same circuit-board pattern and colours as the sponsors section.
 */
const PlaceholderThumbnail = ({ title }: { title: string }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center rounded-lg border border-[#35494C]/60 group-hover/product:border-[#8B3D5A]/70 transition-colors duration-300">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${theme.accentMagenta} 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, ${theme.accentCyan} 2px, transparent 2px),
            linear-gradient(90deg, ${theme.accentTeal}40 1px, transparent 1px),
            linear-gradient(${theme.accentTeal}40 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 100px 100px, 25px 25px, 25px 25px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#8B3D5A]/35 via-[#221A1D]/60 to-[#4F7C80]/30" />

      <span className="relative text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#4F7C80]">
        MacHacks Project
      </span>
      <h2 className="relative font-heading text-2xl sm:text-3xl font-bold text-white leading-tight line-clamp-2">
        {title}
      </h2>
      <span className="relative text-xs sm:text-sm text-[#E1E0E0]/70 group-hover/product:text-white transition-colors duration-300">
        View on Devpost →
      </span>
    </div>
  );
};
