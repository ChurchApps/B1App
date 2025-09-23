"use client";

import { AnimationHelper } from "@/helpers/AnimationHelper";
import { useEffect } from "react";

export function Animate() {
  useEffect(() => {
    AnimationHelper.init();
    return () => { AnimationHelper.destroy(); };
  }, []);

  return <></>
}
