"use client";
import { useId, useState } from "react";
import Image from "next/image";
export function BeforeAfter({
  before,
  after,
}: {
  before: { id: string; alt: string };
  after: { id: string; alt: string };
}) {
  const [position, setPosition] = useState(50);
  const id = useId();
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Before &amp; after</h2>
      <p id={`${id}-help`}>
        Drag the control or use the arrow keys to reveal the before photo. Both
        full photos are also available in the gallery below.
      </p>
      <div className="comparison-frame">
        <Image
          src={`/media/${after.id}`}
          alt={`After: ${after.alt}`}
          fill
          sizes="(max-width: 760px) 100vw, 72rem"
          unoptimized
        />
        <div
          className="comparison-overlay"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={`/media/${before.id}`}
            alt={`Before: ${before.alt}`}
            fill
            sizes="(max-width: 760px) 100vw, 72rem"
            unoptimized
          />
        </div>
        <span className="comparison-label comparison-before">Before</span>
        <span className="comparison-label comparison-after">After</span>
      </div>
      <label className="comparison-control" htmlFor={`${id}-range`}>
        Before photo visible: {position}%
        <input
          id={`${id}-range`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.currentTarget.value))}
          aria-describedby={`${id}-help`}
          aria-valuetext={`${position}% before photo visible`}
        />
      </label>
    </section>
  );
}
