import { useLayoutEffect, useRef, type UIEvent } from "react";

const FOLLOW_THRESHOLD_PX = 96;

export function distanceFromBottom(el: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

/** Stay pinned to the latest token unless they scrolled up to read. */
export function shouldFollowChat(
  el: {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
  },
  thresholdPx = FOLLOW_THRESHOLD_PX,
): boolean {
  return distanceFromBottom(el) <= thresholdPx;
}

export function followChatBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight;
}

/**
 * Follow the live answer in a chat scroller. A new send (`pinNonce`)
 * forces follow; scrolling more than a line above the bottom releases it.
 */
export function useChatFollow(tick: string, pinNonce: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);

  useLayoutEffect(() => {
    followRef.current = true;
  }, [pinNonce]);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    followRef.current = shouldFollowChat(event.currentTarget);
  }

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !followRef.current) return;
    followChatBottom(el);
  }, [tick, pinNonce]);

  return { scrollerRef, onScroll };
}
