"use client";

import React from "react";

const ignoredMotionProps = new Set([
  "animate",
  "exit",
  "initial",
  "layout",
  "layoutId",
  "transition",
  "variants",
  "viewport",
  "whileFocus",
  "whileHover",
  "whileInView",
  "whileTap",
]);

const componentCache = new Map<string, React.ComponentType<Record<string, unknown>>>();

function omitMotionProps(props: Record<string, unknown>) {
  const nextProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (!ignoredMotionProps.has(key)) {
      nextProps[key] = value;
    }
  }

  return nextProps;
}

function getStaticMotionComponent(tag: string) {
  const cached = componentCache.get(tag);
  if (cached) {
    return cached;
  }

  const Component = React.forwardRef<HTMLElement, Record<string, unknown>>(function StaticMotionComponent(
    props,
    ref,
  ) {
    const { children, ...rest } = props;
    return React.createElement(tag, { ...omitMotionProps(rest), ref }, children as React.ReactNode);
  });

  componentCache.set(tag, Component);
  return Component;
}

export const motion = new Proxy(
  {},
  {
    get(_target, key) {
      return getStaticMotionComponent(String(key));
    },
  },
) as Record<string, React.ComponentType<Record<string, unknown>>>;
