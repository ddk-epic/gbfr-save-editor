import { useLayoutEffect, useRef, useState } from "react";

export function useScrollGutter<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [gutter, setGutter] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setGutter((el.offsetWidth - el.clientWidth) / 2);
  }, []);
  return [ref, gutter] as const;
}
