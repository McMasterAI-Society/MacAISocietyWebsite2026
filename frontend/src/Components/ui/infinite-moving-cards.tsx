"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    src: string;
    alt: string;
    title?: string;
    event?: string;
    link?: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller) return;

    // Duplicate items for seamless looping
    const scrollerContent = Array.from(scroller.children);
    scrollerContent.forEach((item) => {
      scroller.appendChild(item.cloneNode(true));
    });

    // Set direction
    container.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );

    // Set speed
    const duration =
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
    container.style.setProperty("--animation-duration", duration);

    // Start the animation directly via the DOM
    scroller.classList.add("animate-scroll");
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_60%,white_80%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items.map((item, idx) => {
          const isPriority = idx < 2; // First 2 images load immediately
          return (
            <li
              key={idx}
              className="group relative h-[200px] w-[320px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-transparent flex items-center justify-center md:w-[420px] cursor-pointer"
            >
              <a
                href={item.link}
                target={item.link ? "_blank" : undefined}
                rel={item.link ? "noopener noreferrer" : undefined}
                className="relative block h-full w-full"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="h-full w-full object-cover transition duration-300 group-hover:grayscale group-hover:brightness-75"
                  loading={isPriority ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={isPriority ? "high" : undefined}
                />
                {(item.title || item.event) && (
                  <div className="pointer-events-none absolute inset-0">
                    {item.title && (
                      <div className="absolute top-2 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                        {item.title}
                      </div>
                    )}
                    {item.event && (
                      <div className="absolute top-2 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                        {item.event}
                      </div>
                    )}
                  </div>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
