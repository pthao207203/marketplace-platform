import { useEffect, useState } from "react";

export default function useCountUp(end: number, duration: number = 1000) {
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * end);
      setValue(current);

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, [end, duration]);

  return value;
}
